import { useCallback, useEffect, useState } from "react";
import { fetchFinanceCenter, issueInvoice, markAlert, reconcileFinance, scanFinanceAlerts, syncInvoice, updateCustomer } from "../services/finance.js";
import Spinner from "../components/ui/Spinner.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useToast } from "../components/ui/Toast.jsx";

const money = (cents = 0) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents) / 100);
const date = (value) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const label = { approved: "Aprovado", pending: "Pendente", rejected: "Recusado", cancelled: "Cancelado", error: "Erro" };

export default function FinanceCenter() {
  const { push } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [tab, setTab] = useState("overview");

  const load = useCallback(async () => {
    try { setData(await fetchFinanceCenter()); }
    catch (error) { push(error.response?.data?.message || "Falha ao carregar o centro financeiro", "error"); }
    finally { setLoading(false); }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  async function run(action, success) {
    setWorking(action);
    try {
      if (action === "reconcile") await reconcileFinance();
      if (action === "alerts") await scanFinanceAlerts();
      push(success, "success");
      await load();
    } catch (error) { push(error.response?.data?.message || error.message, "error"); }
    finally { setWorking(""); }
  }

  async function setStage(customer, stage) {
    setWorking(customer.id);
    try { await updateCustomer(customer.id, { stage }); push("Etapa do cliente atualizada", "success"); await load(); }
    catch (error) { push(error.response?.data?.message || error.message, "error"); }
    finally { setWorking(""); }
  }

  async function fiscalAction(invoice, mode) {
    setWorking(invoice.id);
    try {
      if (mode === "issue") await issueInvoice(invoice.id); else await syncInvoice(invoice.id);
      push(mode === "issue" ? "NFS-e enviada para processamento" : "Status fiscal sincronizado", "success");
      await load();
    } catch (error) { push(error.response?.data?.message || error.message, "error"); await load(); }
    finally { setWorking(""); }
  }

  if (loading) return <div className="fc-loading"><Spinner size={32} /></div>;
  if (!data) return <EmptyState icon="📒" title="Centro financeiro indisponível" />;

  const { summary, customers = [], invoices = [], alerts = [], transactions = [], fiscal } = data;
  return (
    <div className="fc-root">
      <style>{financeCSS}</style>
      <div className="fc-heading">
        <div><div className="fc-eyebrow">BlackVision Ledger</div><h1>Centro financeiro</h1><p>Pagamentos, clientes, fiscal e operação em uma fonte única de verdade.</p></div>
        <div className="fc-actions">
          <button className="fc-btn secondary" onClick={() => run("alerts", "Alertas verificados")} disabled={!!working}>Verificar alertas</button>
          <button className="fc-btn" onClick={() => run("reconcile", "Conciliação concluída")} disabled={!!working}>{working === "reconcile" ? <Spinner size={14} color="#080808" /> : "Conciliar agora"}</button>
        </div>
      </div>

      {!fiscal.ready && <div className="fc-banner"><strong>Emissão fiscal preparada, aguardando configuração.</strong><span>Faltam: {fiscal.missing.join(", ")}. O sistema não envia nota sem dados legais completos.</span></div>}

      <div className="fc-kpis">
        <Kpi label="Receita confirmada" value={money(summary.grossApproved)} tone="green" />
        <Kpi label="A receber" value={money(summary.outstanding)} tone="amber" />
        <Kpi label="Ticket médio" value={money(summary.averageTicket)} />
        <Kpi label="Conversão" value={`${summary.approvalRate}%`} />
        <Kpi label="Clientes" value={summary.customerCount} />
        <Kpi label="Alertas" value={summary.unreadAlertCount} tone={summary.unreadAlertCount ? "red" : "green"} />
      </div>

      <div className="fc-tabs">
        {[['overview','Visão financeira'],['customers','CRM'],['invoices','Notas fiscais'],['alerts','Alertas']].map(([id,text]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{text}</button>)}
      </div>

      {tab === "overview" && <div className="fc-panel">
        <div className="fc-panel-head"><div><span>Razão BlackVision</span><h2>Últimas movimentações</h2></div><span>{transactions.length} registros</span></div>
        <div className="fc-table"><div className="fc-row head"><span>Data</span><span>Cliente</span><span>Plano</span><span>Canal</span><span>Valor</span><span>Status</span></div>
          {transactions.slice(0, 50).map(tx => <div className="fc-row" key={tx.id}><span>{date(tx.createdAt)}</span><span className="strong">{tx.customerEmail || "—"}</span><span>{tx.tier || "—"}</span><span>{tx.gateway} · {tx.method}</span><span className="strong">{money(tx.amount)}</span><span className={`fc-status ${tx.status}`}>{label[tx.status] || tx.status}</span></div>)}
        </div>
      </div>}

      {tab === "customers" && <div className="fc-panel">
        <div className="fc-panel-head"><div><span>CRM operacional</span><h2>Clientes e oportunidades</h2></div><span>{customers.length} contatos</span></div>
        <div className="fc-cards">{customers.map(customer => <article className="fc-customer" key={customer.id}><div className="fc-avatar">{(customer.name || customer.email || "B").slice(0,2).toUpperCase()}</div><div className="fc-grow"><h3>{customer.companyName || customer.name || customer.email}</h3><p>{customer.email} · {customer.phone || "sem telefone"}</p><div className="fc-customer-meta"><span>{customer.approvedOrders || 0} compras</span><span>{money(customer.lifetimeValue)}</span><span>{customer.lastPlan || "—"}</span></div></div><select value={customer.stage || "checkout_started"} onChange={e => setStage(customer, e.target.value)} disabled={working === customer.id}><option value="checkout_started">Checkout iniciado</option><option value="qualified">Qualificado</option><option value="proposal">Proposta</option><option value="customer">Cliente</option><option value="retention">Retenção</option><option value="lost">Perdido</option></select></article>)}</div>
      </div>}

      {tab === "invoices" && <div className="fc-panel">
        <div className="fc-panel-head"><div><span>Fiscal</span><h2>Fila de NFS-e</h2></div><span>{invoices.length} documentos</span></div>
        {!invoices.length ? <EmptyState icon="🧾" title="Nenhuma nota na fila" description="Uma nota será preparada automaticamente após cada pagamento aprovado." /> : <div className="fc-cards">{invoices.map(invoice => <article className="fc-invoice" key={invoice.id}><div><span className={`fc-status ${invoice.fiscalStatus}`}>{invoice.fiscalStatus}</span><h3>{invoice.customerName || invoice.customerEmail}</h3><p>{invoice.description}</p><small>{invoice.customerTaxId ? `Documento: ${invoice.customerTaxId}` : "CPF/CNPJ pendente no CRM"}</small></div><div className="fc-invoice-side"><strong>{money(invoice.amount)}</strong>{invoice.fiscalStatus === "processing" ? <button className="fc-btn secondary" onClick={() => fiscalAction(invoice, "sync")} disabled={working === invoice.id}>Sincronizar</button> : invoice.fiscalStatus !== "authorized" && <button className="fc-btn" onClick={() => fiscalAction(invoice, "issue")} disabled={working === invoice.id || !fiscal.ready || !invoice.customerTaxId}>Emitir NFS-e</button>}</div></article>)}</div>}
      </div>}

      {tab === "alerts" && <div className="fc-panel">
        <div className="fc-panel-head"><div><span>Operação</span><h2>Alertas e exceções</h2></div><span>{alerts.filter(a => !a.read).length} pendentes</span></div>
        {!alerts.length ? <EmptyState icon="✅" title="Nenhuma exceção operacional" /> : <div className="fc-cards">{alerts.map(alert => <article className={`fc-alert ${alert.severity} ${alert.read ? "read" : ""}`} key={alert.id}><div><span>{alert.type}</span><h3>{alert.title}</h3><p>{alert.message}</p><small>{date(alert.createdAt)}</small></div>{!alert.read && <button className="fc-btn secondary" onClick={async () => { await markAlert(alert.id); await load(); }}>Resolver</button>}</article>)}</div>}
      </div>}
    </div>
  );
}

function Kpi({ label, value, tone = "default" }) { return <div className={`fc-kpi ${tone}`}><span>{label}</span><strong>{value}</strong></div>; }

const financeCSS = `
.fc-root{--fc:#ff5b35;--violet:#8b5cf6;color:#f7f7f8}.fc-loading{min-height:50vh;display:grid;place-items:center}.fc-heading{display:flex;justify-content:space-between;gap:2rem;align-items:flex-end;margin-bottom:1.5rem}.fc-eyebrow,.fc-panel-head span{font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;color:#ff8a6e}.fc-heading h1{font-size:clamp(2rem,4vw,3.25rem);margin:.25rem 0;letter-spacing:-.05em}.fc-heading p{color:#9696a0;max-width:620px}.fc-actions{display:flex;gap:.65rem}.fc-btn{border:0;border-radius:999px;background:linear-gradient(135deg,#ff7a35,#ff3d57);box-shadow:0 8px 30px rgba(255,91,53,.22);color:#09090b;font-weight:800;padding:.75rem 1rem;cursor:pointer;display:inline-flex;gap:.5rem;align-items:center;justify-content:center}.fc-btn.secondary{background:#141419;color:#ddd;border:1px solid #292931;box-shadow:none}.fc-btn:disabled{opacity:.45;cursor:not-allowed}.fc-banner{display:flex;flex-direction:column;gap:.25rem;border:1px solid rgba(245,158,11,.25);background:rgba(245,158,11,.07);border-radius:16px;padding:1rem 1.15rem;margin-bottom:1rem;color:#fbbf24}.fc-banner span{font-size:.8rem;color:#aaa}.fc-kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:.75rem;margin-bottom:1.25rem}.fc-kpi{padding:1rem;background:linear-gradient(180deg,#121217,#0d0d11);border:1px solid #23232a;border-radius:16px;min-width:0}.fc-kpi span{color:#868690;font-size:.7rem;text-transform:uppercase;letter-spacing:.08em}.fc-kpi strong{display:block;font-size:1.25rem;margin-top:.45rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fc-kpi.green strong{color:#4ade80}.fc-kpi.amber strong{color:#fbbf24}.fc-kpi.red strong{color:#fb7185}.fc-tabs{display:flex;gap:.35rem;margin-bottom:1rem;overflow:auto}.fc-tabs button{background:transparent;border:1px solid transparent;color:#888;padding:.65rem .9rem;border-radius:999px;cursor:pointer;white-space:nowrap}.fc-tabs button.active{color:#fff;background:#18181d;border-color:#303038}.fc-panel{background:#0e0e12;border:1px solid #23232a;border-radius:20px;overflow:hidden}.fc-panel-head{display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.4rem;border-bottom:1px solid #23232a}.fc-panel-head h2{font-size:1.15rem;margin:.2rem 0 0}.fc-table{overflow:auto}.fc-row{display:grid;grid-template-columns:125px minmax(180px,1.4fr) 80px 150px 110px 100px;gap:1rem;align-items:center;padding:.85rem 1.4rem;border-bottom:1px solid #19191f;color:#92929d;font-size:.78rem;min-width:850px}.fc-row.head{text-transform:uppercase;letter-spacing:.08em;font-size:.65rem;color:#62626d}.fc-row .strong{color:#e7e7eb;font-weight:650}.fc-status{display:inline-flex;width:max-content;padding:.25rem .55rem;border-radius:999px;background:#222;color:#aaa;font-size:.66rem;text-transform:uppercase;letter-spacing:.05em}.fc-status.approved,.fc-status.authorized{background:rgba(34,197,94,.12);color:#4ade80}.fc-status.pending,.fc-status.processing{background:rgba(245,158,11,.12);color:#fbbf24}.fc-status.rejected,.fc-status.error,.fc-status.cancelled{background:rgba(244,63,94,.12);color:#fb7185}.fc-cards{display:grid;gap:.65rem;padding:1rem}.fc-customer,.fc-invoice,.fc-alert{display:flex;align-items:center;gap:1rem;padding:1rem;background:#141419;border:1px solid #23232a;border-radius:14px}.fc-avatar{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(139,92,246,.25),rgba(255,91,53,.25));color:#fff;font-weight:800}.fc-grow{flex:1;min-width:0}.fc-customer h3,.fc-invoice h3,.fc-alert h3{margin:0 0 .2rem;font-size:.9rem}.fc-customer p,.fc-invoice p,.fc-alert p{margin:0;color:#85858f;font-size:.76rem}.fc-customer-meta{display:flex;gap:.5rem;margin-top:.55rem}.fc-customer-meta span{background:#1d1d23;border-radius:999px;padding:.2rem .45rem;font-size:.63rem;color:#aaa}.fc-customer select{background:#0e0e12;color:#ddd;border:1px solid #303038;border-radius:10px;padding:.55rem}.fc-invoice{justify-content:space-between}.fc-invoice small,.fc-alert small{display:block;color:#696974;margin-top:.45rem}.fc-invoice-side{display:flex;flex-direction:column;align-items:flex-end;gap:.65rem}.fc-invoice-side strong{font-size:1.15rem}.fc-alert{justify-content:space-between;border-left:3px solid #f59e0b}.fc-alert.critical{border-left-color:#f43f5e}.fc-alert.read{opacity:.55}@media(max-width:1100px){.fc-kpis{grid-template-columns:repeat(3,1fr)}}@media(max-width:720px){.fc-heading{align-items:flex-start;flex-direction:column}.fc-actions{width:100%}.fc-actions .fc-btn{flex:1}.fc-kpis{grid-template-columns:repeat(2,1fr)}.fc-customer,.fc-invoice,.fc-alert{align-items:flex-start;flex-wrap:wrap}.fc-customer select{width:100%}.fc-invoice-side{width:100%;align-items:flex-start}}
`;
