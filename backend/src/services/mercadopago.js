/**
 * Mercado Pago — exclusivamente PIX.
 */

import { randomUUID } from "node:crypto";
import { MercadoPagoConfig, Payment, WebhookSignatureValidator } from "mercadopago";

const DEFAULT_BACKEND_URL = "https://black-vision-backend-production.up.railway.app";

function getClient() {
  const token = String(process.env.MP_ACCESS_TOKEN || "").trim();
  if (!token) throw new Error("MP_ACCESS_TOKEN não configurado");
  return new MercadoPagoConfig({ accessToken: token, options: { timeout: 10_000 } });
}

function getNotificationUrl() {
  const base = String(process.env.BACKEND_URL || DEFAULT_BACKEND_URL).replace(/\/$/, "");
  return /^https?:\/\//.test(base) ? `${base}/api/webhooks/mercadopago` : null;
}

function parseBRPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length < 10 || local.length > 11) return null;
  return { area_code: local.slice(0, 2), number: local.slice(2) };
}

function mpErrorMessage(error) {
  const cause = error?.cause?.[0];
  return cause?.description || cause?.message || error?.message || "Erro no Mercado Pago";
}

function buildPayer(customer, cpf) {
  const phone = parseBRPhone(customer.phone);
  const parts = String(customer.name || "").trim().split(/\s+/);
  const document = String(cpf || "").replace(/\D/g, "");
  return {
    email: customer.email,
    first_name: parts[0] || "Cliente",
    last_name: parts.slice(1).join(" ") || parts[0] || "Black Vision",
    ...(phone ? { phone } : {}),
    ...(document.length === 11 ? { identification: { type: "CPF", number: document } } : {}),
  };
}

export async function createMPDirectPayment({ plan, tier, customer, method, cpf }) {
  if (method !== "pix") throw new Error("Mercado Pago é utilizado somente para PIX");
  if (!plan?.amount) throw new Error("Plano sem valor definido");

  const payer = buildPayer(customer, cpf);
  if (!payer.identification) throw new Error("CPF é obrigatório para PIX");

  const body = {
    transaction_amount: plan.amount / 100,
    description: plan.label,
    payment_method_id: "pix",
    payer,
    external_reference: `bv_${tier}_${Date.now()}`,
    ...(getNotificationUrl() ? { notification_url: getNotificationUrl() } : {}),
  };

  try {
    const result = await new Payment(getClient()).create({
      body,
      requestOptions: { idempotencyKey: randomUUID() },
    });
    const transaction = result.point_of_interaction?.transaction_data || {};
    return {
      paymentId: result.id,
      status: result.status,
      method: "pix",
      amount: result.transaction_amount,
      qrCode: transaction.qr_code || null,
      qrCodeBase64: transaction.qr_code_base64 || null,
      ticketUrl: transaction.ticket_url || null,
      expiresAt: result.date_of_expiration || null,
    };
  } catch (error) {
    throw new Error(mpErrorMessage(error));
  }
}

export async function getMPStatus(paymentId) {
  try {
    const result = await new Payment(getClient()).get({ id: paymentId });
    const statusMap = {
      approved: "approved",
      pending: "pending",
      rejected: "rejected",
      refunded: "refunded",
      cancelled: "cancelled",
      in_process: "pending",
    };
    return {
      status: statusMap[result.status] || result.status,
      detail: {
        id: result.id,
        status: result.status,
        statusDetail: result.status_detail,
        paymentMethod: result.payment_method_id,
        amount: result.transaction_amount,
        externalRef: result.external_reference,
        approvedAt: result.date_approved,
      },
    };
  } catch (error) {
    return { status: "unknown", detail: { error: error.message } };
  }
}

export function processMPWebhook({ body, xSignature, xRequestId, dataId }) {
  const secret = String(process.env.MP_WEBHOOK_SECRET || "").trim();
  if (!secret) throw new Error("MP_WEBHOOK_SECRET não configurado");
  if (!xSignature || !xRequestId || !dataId) {
    throw new Error("Assinatura do webhook Mercado Pago incompleta");
  }
  WebhookSignatureValidator.validate({
    xSignature,
    xRequestId,
    dataId: String(dataId),
    secret,
  });
  return { type: body.type, action: body.action, id: body.data?.id || dataId };
}
