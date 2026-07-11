/**
 * Centro Financeiro BlackVision
 * Razão independente por metadados/coleções próprias, CRM, conciliação,
 * alertas operacionais e preparação de NFS-e via Focus NFe.
 */

import { createHash } from "node:crypto";
import { getFirestore } from "./firebase.js";
import { getStripeStatus } from "./stripe.js";
import { getMPStatus } from "./mercadopago.js";

const memory = { customers: new Map(), invoices: new Map(), alerts: new Map(), runs: [] };
const now = () => new Date().toISOString();
const hashId = (value) => createHash("sha256").update(String(value)).digest("hex").slice(0, 32);
const cleanEmail = (value) => String(value || "").trim().toLowerCase();
const digits = (value) => String(value || "").replace(/\D/g, "");

async function readCollection(name, limit = 250) {
  try {
    const snap = await getFirestore().collection(name).orderBy("updatedAt", "desc").limit(limit).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch {
    if (name === "finance_customers") return [...memory.customers.values()];
    if (name === "finance_invoices") return [...memory.invoices.values()];
    if (name === "finance_alerts") return [...memory.alerts.values()];
    return [];
  }
}

async function readTransactions(limit = 500) {
  try {
    const snap = await getFirestore().collection("transactions").orderBy("createdAt", "desc").limit(limit).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch {
    return [];
  }
}

async function writeDoc(collection, id, data, merge = true) {
  const sanitized = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
  const entry = { ...sanitized, id, updatedAt: now() };
  try {
    await getFirestore().collection(collection).doc(id).set(entry, { merge });
  } catch {
    const target = collection === "finance_customers" ? memory.customers
      : collection === "finance_invoices" ? memory.invoices : memory.alerts;
    target.set(id, { ...(target.get(id) || {}), ...entry });
  }
  return entry;
}

export async function createFinanceAlert({ type, severity = "warning", title, message, transactionId, sessionId }) {
  const dedupe = `${type}:${transactionId || sessionId || message}`;
  const id = `alert_${hashId(dedupe)}`;
  return writeDoc("finance_alerts", id, {
    type, severity, title, message, transactionId: transactionId || null,
    sessionId: sessionId || null, read: false, source: "blackvision", createdAt: now(),
  });
}

async function rebuildCustomerTotals(email) {
  if (!email) return { approvedOrders: 0, lifetimeValue: 0 };
  const transactions = await readTransactions(500);
  const approved = transactions.filter((tx) => cleanEmail(tx.customerEmail) === email && tx.status === "approved");
  return {
    approvedOrders: approved.length,
    lifetimeValue: approved.reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
  };
}

export async function onTransactionCreated(tx) {
  const email = cleanEmail(tx.customerEmail);
  if (!email) return;
  const id = `customer_${hashId(email)}`;
  let existing = memory.customers.get(id) || {};
  try {
    const snap = await getFirestore().collection("finance_customers").doc(id).get();
    if (snap.exists) existing = snap.data();
  } catch { /* fallback em memória */ }
  await writeDoc("finance_customers", id, {
    email,
    name: tx.customerName || existing.name || "",
    phone: tx.customerPhone || existing.phone || "",
    taxId: tx.customerCpf || existing.taxId || "",
    stage: existing.stage || "checkout_started",
    firstSeenAt: existing.firstSeenAt || tx.createdAt || now(),
    lastSeenAt: tx.createdAt || now(),
    lastPlan: tx.tier || null,
    lastGateway: tx.gateway || null,
    lastPaymentStatus: tx.status || "pending",
    source: "blackvision_checkout",
    createdAt: existing.createdAt || now(),
  });
}

async function ensureInvoice(tx) {
  if (!tx?.id || tx.status !== "approved") return null;
  const id = `invoice_${hashId(tx.id)}`;
  const email = cleanEmail(tx.customerEmail);
  const customers = await readCollection("finance_customers");
  const customer = customers.find((item) => item.email === email);
  return writeDoc("finance_invoices", id, {
    transactionId: tx.id,
    sessionId: tx.sessionId || null,
    customerId: customer?.id || null,
    customerEmail: email,
    customerName: customer?.companyName || customer?.name || tx.customerName || "",
    customerTaxId: customer?.taxId || tx.customerCpf || "",
    amount: Number(tx.amount || 0),
    currency: tx.currency || "BRL",
    description: `Serviços de tecnologia — Plano ${tx.tier || "BlackVision"}`,
    status: customer?.taxId ? "ready" : "awaiting_customer_data",
    provider: "focusnfe",
    fiscalStatus: "not_issued",
    createdAt: tx.updatedAt || now(),
  });
}

export async function onTransactionStatusChanged(tx) {
  if (!tx) return;
  const email = cleanEmail(tx.customerEmail);
  if (email) {
    const id = `customer_${hashId(email)}`;
    const totals = await rebuildCustomerTotals(email);
    await writeDoc("finance_customers", id, {
      lastPaymentStatus: tx.status,
      lastSeenAt: tx.updatedAt || now(),
      stage: tx.status === "approved" ? "customer" : undefined,
      ...totals,
    });
  }

  if (tx.status === "approved") await ensureInvoice(tx);
  if (["rejected", "error", "cancelled"].includes(tx.status)) {
    await createFinanceAlert({
      type: "payment_failure",
      severity: tx.status === "error" ? "critical" : "warning",
      title: `Pagamento ${tx.status === "cancelled" ? "cancelado" : "não concluído"}`,
      message: `${tx.customerEmail || "Cliente"} · ${tx.tier || "plano"} · ${tx.gateway || "gateway"}`,
      transactionId: tx.id,
      sessionId: tx.sessionId,
    });
  }
}

export async function updateFinanceCustomer(id, patch) {
  const allowed = ["name", "companyName", "phone", "taxId", "stage", "notes", "address"];
  const safe = {};
  for (const key of allowed) if (patch[key] !== undefined) safe[key] = patch[key];
  if (safe.taxId !== undefined) safe.taxId = digits(safe.taxId);
  if (!Object.keys(safe).length) throw new Error("Nenhum campo de CRM válido");
  return writeDoc("finance_customers", id, safe);
}

export async function markFinanceAlert(id, read = true) {
  return writeDoc("finance_alerts", id, { read: Boolean(read), readAt: read ? now() : null });
}

export async function scanOperationalAlerts() {
  const transactions = await readTransactions(300);
  const current = Date.now();
  let created = 0;
  for (const tx of transactions.filter((item) => item.status === "pending")) {
    const createdAt = new Date(tx.createdAt || 0).getTime();
    const limit = tx.method === "pix" ? 60 * 60 * 1000
      : tx.method === "boleto" ? 3 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    if (createdAt && current - createdAt > limit) {
      await createFinanceAlert({
        type: tx.method === "boleto" ? "boleto_overdue" : "payment_pending",
        severity: "warning",
        title: tx.method === "boleto" ? "Boleto vencido ou sem baixa" : "Pagamento pendente acima do prazo",
        message: `${tx.customerEmail || "Cliente"} · ${tx.tier || "plano"}`,
        transactionId: tx.id,
        sessionId: tx.sessionId,
      });
      created += 1;
    }
  }
  return { scanned: transactions.length, alertsCreated: created };
}

export async function reconcileFinance() {
  const startedAt = now();
  const transactions = await readTransactions(200);
  const candidates = transactions.filter((tx) => tx.sessionId && ["pending", "error"].includes(tx.status));
  const changes = [];
  const failures = [];
  const { updateTransactionStatus } = await import("./transactionLog.js");

  for (const tx of candidates) {
    try {
      const remote = tx.gateway === "stripe"
        ? await getStripeStatus(String(tx.sessionId))
        : tx.gateway === "mercadopago"
          ? await getMPStatus(String(tx.sessionId)) : null;
      if (remote?.status && remote.status !== tx.status) {
        await updateTransactionStatus(String(tx.sessionId), remote.status, { reconciliation: true, detail: remote.detail });
        changes.push({ transactionId: tx.id, from: tx.status, to: remote.status });
      }
    } catch (error) {
      failures.push({ transactionId: tx.id, message: error.message });
    }
  }

  await scanOperationalAlerts();
  const run = {
    id: `recon_${Date.now()}`, source: "blackvision", startedAt, finishedAt: now(),
    scanned: candidates.length, changed: changes.length, failed: failures.length, changes, failures,
  };
  try {
    await getFirestore().collection("finance_reconciliation_runs").doc(run.id).set(run);
  } catch { memory.runs.unshift(run); }
  return run;
}

function summarize(transactions, customers, invoices, alerts) {
  const approved = transactions.filter((tx) => tx.status === "approved");
  const pending = transactions.filter((tx) => tx.status === "pending");
  const failed = transactions.filter((tx) => ["rejected", "error", "cancelled"].includes(tx.status));
  const grossApproved = approved.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const outstanding = pending.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  return {
    grossApproved,
    outstanding,
    averageTicket: approved.length ? Math.round(grossApproved / approved.length) : 0,
    approvalRate: transactions.length ? Math.round((approved.length / transactions.length) * 1000) / 10 : 0,
    approvedCount: approved.length,
    pendingCount: pending.length,
    failedCount: failed.length,
    customerCount: customers.length,
    invoiceReadyCount: invoices.filter((item) => ["ready", "awaiting_customer_data"].includes(item.status)).length,
    invoiceIssuedCount: invoices.filter((item) => item.fiscalStatus === "authorized").length,
    unreadAlertCount: alerts.filter((item) => !item.read).length,
    byGateway: ["stripe", "mercadopago"].map((gateway) => ({
      gateway,
      amount: approved.filter((tx) => tx.gateway === gateway).reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
      count: approved.filter((tx) => tx.gateway === gateway).length,
    })),
  };
}

export function fiscalConfiguration() {
  const required = ["FOCUS_NFE_TOKEN", "BLACKVISION_CNPJ", "BLACKVISION_MUNICIPAL_REGISTRATION", "BLACKVISION_CITY_CODE", "FISCAL_SERVICE_LIST_CODE", "FISCAL_MUNICIPAL_TAX_CODE"];
  const missing = required.filter((key) => !String(process.env[key] || "").trim());
  return { provider: "focusnfe", ready: missing.length === 0, missing, environment: process.env.FOCUS_NFE_ENV || "homologation" };
}

export async function getFinanceCenterData() {
  const [transactions, initialCustomers, initialInvoices, initialAlerts] = await Promise.all([
    readTransactions(500), readCollection("finance_customers"), readCollection("finance_invoices"), readCollection("finance_alerts"),
  ]);
  if (!initialCustomers.length && transactions.length) {
    for (const tx of transactions) {
      await onTransactionCreated(tx);
      if (tx.status === "approved") await ensureInvoice(tx);
    }
  }
  const [customers, invoices, alerts] = (!initialCustomers.length && transactions.length)
    ? await Promise.all([readCollection("finance_customers"), readCollection("finance_invoices"), readCollection("finance_alerts")])
    : [initialCustomers, initialInvoices, initialAlerts];
  return {
    source: "blackvision",
    summary: summarize(transactions, customers, invoices, alerts),
    transactions,
    customers,
    invoices,
    alerts,
    fiscal: fiscalConfiguration(),
    generatedAt: now(),
  };
}

export async function prepareInvoice(transactionId) {
  const transactions = await readTransactions(500);
  const tx = transactions.find((item) => item.id === transactionId);
  if (!tx) throw new Error("Transação não encontrada");
  if (tx.status !== "approved") throw new Error("A NFS-e só pode ser preparada após pagamento aprovado");
  return ensureInvoice(tx);
}

export async function issueInvoice(invoiceId) {
  const invoices = await readCollection("finance_invoices");
  const invoice = invoices.find((item) => item.id === invoiceId);
  if (!invoice) throw new Error("Documento fiscal não encontrado");
  const config = fiscalConfiguration();
  if (!config.ready) {
    await writeDoc("finance_invoices", invoiceId, { status: "configuration_required", fiscalStatus: "not_issued", missingConfiguration: config.missing });
    const error = new Error(`Configuração fiscal pendente: ${config.missing.join(", ")}`);
    error.status = 422;
    throw error;
  }
  if (!digits(invoice.customerTaxId)) {
    const error = new Error("CPF/CNPJ do cliente é obrigatório para emissão");
    error.status = 422;
    throw error;
  }

  const reference = `blackvision-${hashId(invoice.transactionId)}`;
  const base = config.environment === "production" ? "https://api.focusnfe.com.br" : "https://homologacao.focusnfe.com.br";
  const taxId = digits(invoice.customerTaxId);
  const payload = {
    data_emissao: now(), natureza_operacao: "1",
    optante_simples_nacional: String(process.env.BLACKVISION_SIMPLE_NATIONAL || "true") === "true",
    prestador: {
      cnpj: digits(process.env.BLACKVISION_CNPJ),
      inscricao_municipal: digits(process.env.BLACKVISION_MUNICIPAL_REGISTRATION),
      codigo_municipio: digits(process.env.BLACKVISION_CITY_CODE),
    },
    tomador: {
      ...(taxId.length === 11 ? { cpf: taxId } : { cnpj: taxId }),
      razao_social: invoice.customerName || invoice.customerEmail,
      email: invoice.customerEmail,
    },
    servico: {
      aliquota: Number(process.env.FISCAL_ISS_RATE || 0),
      discriminacao: invoice.description,
      iss_retido: false,
      item_lista_servico: process.env.FISCAL_SERVICE_LIST_CODE,
      codigo_tributario_municipio: process.env.FISCAL_MUNICIPAL_TAX_CODE,
      valor_servicos: Number(invoice.amount || 0) / 100,
    },
  };
  const auth = Buffer.from(`${process.env.FOCUS_NFE_TOKEN}:`).toString("base64");
  const response = await fetch(`${base}/v2/nfse?ref=${encodeURIComponent(reference)}`, {
    method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    await writeDoc("finance_invoices", invoiceId, { status: "provider_error", fiscalStatus: "error", providerResponse: body });
    const error = new Error(body.mensagem || body.message || "Focus NFe recusou a emissão");
    error.status = response.status;
    throw error;
  }
  return writeDoc("finance_invoices", invoiceId, {
    status: "processing", fiscalStatus: "processing", fiscalReference: reference,
    providerResponse: body, issuedAt: now(),
  });
}

export async function syncInvoice(invoiceId) {
  const invoices = await readCollection("finance_invoices");
  const invoice = invoices.find((item) => item.id === invoiceId);
  if (!invoice?.fiscalReference) throw new Error("Documento ainda não enviado ao provedor fiscal");
  const config = fiscalConfiguration();
  if (!config.ready) throw new Error("Configuração fiscal incompleta");
  const base = config.environment === "production" ? "https://api.focusnfe.com.br" : "https://homologacao.focusnfe.com.br";
  const auth = Buffer.from(`${process.env.FOCUS_NFE_TOKEN}:`).toString("base64");
  const response = await fetch(`${base}/v2/nfse/${encodeURIComponent(invoice.fiscalReference)}`, { headers: { Authorization: `Basic ${auth}`, Accept: "application/json" } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.mensagem || "Não foi possível consultar a NFS-e");
  const remote = String(body.status || "processing").toLowerCase();
  const fiscalStatus = /autoriz/.test(remote) ? "authorized" : /erro|cancel/.test(remote) ? "error" : "processing";
  return writeDoc("finance_invoices", invoiceId, { status: fiscalStatus === "authorized" ? "issued" : remote, fiscalStatus, providerResponse: body });
}
