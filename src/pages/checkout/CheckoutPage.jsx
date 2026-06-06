/**
 * CheckoutPage.jsx — Checkout nativo Black Vision
 * PIX/Boleto: Payments API (QR no site, sem redirect MP — evita CSP do checkout MP)
 * Cartão: Checkout Pro em nova aba
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  createCheckout,
  createDirectPayment,
  getPaymentStatus,
  PLANS,
} from "../../services/payment.js";

const METHODS = [
  { id: "pix",    label: "PIX",    desc: "Aprovação em segundos" },
  { id: "boleto", label: "Boleto", desc: "Vence em 3 dias úteis" },
  { id: "card",   label: "Cartão", desc: "Crédito ou débito" },
];

function qrImageSrc(qrCodeBase64, qrCode) {
  if (qrCodeBase64) return `data:image/png;base64,${qrCodeBase64}`;
  if (qrCode) return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrCode)}`;
  return null;
}

export default function CheckoutPage() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const planId     = params.get("plan") || "advanced";
  const plan       = PLANS[planId] || PLANS.advanced;
  const pollRef    = useRef(null);

  const [form, setForm]         = useState({ name: "", email: "", phone: "", cpf: "" });
  const [method, setMethod]     = useState("pix");
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [payment, setPayment]   = useState(null);
  const [cardUrl, setCardUrl]   = useState(null);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    if (planId === "pro") {
      window.location.replace(
        "https://wa.me/5573981068594?text=Quero%20o%20plano%20Pro"
      );
    }
  }, [planId]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    if (!payment?.paymentId) return;

    pollRef.current = setInterval(async () => {
      const result = await getPaymentStatus(payment.paymentId);
      if (result.status === "approved") {
        stopPolling();
        navigate(`/checkout/success?plan=${planId}&payment_id=${payment.paymentId}`);
      } else if (result.status === "rejected" || result.status === "cancelled") {
        stopPolling();
        setErrorMsg("Pagamento recusado ou cancelado.");
        setPayment(null);
      }
    }, 4000);

    return stopPolling;
  }, [payment?.paymentId, planId, navigate, stopPolling]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Nome e obrigatorio";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "E-mail invalido";
    if (!form.phone.replace(/\D/g, "").match(/^\d{10,11}$/)) e.phone = "Telefone invalido";
    if (method !== "card") {
      const cpf = form.cpf.replace(/\D/g, "");
      if (!/^\d{11}$/.test(cpf)) e.cpf = "CPF invalido (11 digitos)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrorMsg("");
    setCardUrl(null);

    if (method === "card") {
      const result = await createCheckout({
        tier:          planId,
        customerName:  form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
      });

      setLoading(false);

      if (!result.success) {
        setErrorMsg(result.error || "Erro ao abrir checkout");
        return;
      }

      const mpUrl = result.checkoutUrl || result.initPoint;
      if (!mpUrl) {
        setErrorMsg("URL de checkout nao retornada");
        return;
      }

      const opened = window.open(mpUrl, "_blank", "noopener,noreferrer");
      if (!opened) setCardUrl(mpUrl);
      return;
    }

    const result = await createDirectPayment({
      tier:          planId,
      method,
      customerName:  form.name,
      customerEmail: form.email,
      customerPhone: form.phone,
      customerCpf:   form.cpf,
    });

    setLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || "Erro ao gerar pagamento");
      return;
    }

    setPayment(result);
  }

  function copyPixCode() {
    if (!payment?.qrCode) return;
    navigator.clipboard.writeText(payment.qrCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const set = (k) => (ev) => {
    setForm(f  => ({ ...f,  [k]: ev.target.value }));
    setErrors(er => ({ ...er, [k]: "" }));
  };

  const imgSrc = payment ? qrImageSrc(payment.qrCodeBase64, payment.qrCode) : null;

  return (
    <>
      <style>{checkoutCSS}</style>
      <div className="co-root">
        <div className="co-grid" aria-hidden="true" />
        <div className="co-glow" aria-hidden="true" />
        <div className="co-wrapper">
          <div className="co-summary">
            <a href="/" className="co-back">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Voltar
            </a>
            <div className="co-logo">Black Vision</div>
            <div className="co-plan-badge">
              <span className="co-plan-badge-dot" />
              Plano {plan.label}
            </div>
            <div className="co-plan-price">{plan.priceLabel}</div>
            <div className="co-plan-desc">{plan.description}</div>
            <div className="co-divider" />
            <div className="co-secure-badges">
              <div className="co-badge-item">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Pagamento 100% seguro
              </div>
              <div className="co-badge-item">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Mercado Pago
              </div>
            </div>
          </div>

          <div className="co-form-side">
            {payment ? (
              <div className="co-payment-result">
                <h2 className="co-form-title">
                  {payment.method === "pix" ? "Pague com PIX" : "Boleto gerado"}
                </h2>
                <p className="co-form-sub">
                  {payment.method === "pix"
                    ? "Escaneie o QR Code ou copie o codigo abaixo"
                    : "Pague o boleto pelo app do banco ou internet banking"}
                </p>

                {payment.method === "pix" && imgSrc && (
                  <div className="co-qr-wrap">
                    <img src={imgSrc} alt="QR Code PIX" className="co-qr-img" />
                  </div>
                )}

                {payment.method === "pix" && payment.qrCode && (
                  <div className="co-pix-code">
                    <code>{payment.qrCode}</code>
                    <button type="button" className="co-copy-btn" onClick={copyPixCode}>
                      {copied ? "Copiado!" : "Copiar codigo"}
                    </button>
                  </div>
                )}

                {payment.method === "boleto" && payment.ticketUrl && (
                  <a
                    href={payment.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="co-submit co-submit-link"
                  >
                    Abrir boleto para pagamento
                  </a>
                )}

                <div className="co-waiting">
                  <span className="co-spinner co-spinner-gold" />
                  Aguardando confirmacao do pagamento...
                </div>

                <button
                  type="button"
                  className="co-back-btn"
                  onClick={() => { stopPolling(); setPayment(null); }}
                >
                  Escolher outro metodo
                </button>
              </div>
            ) : (
              <>
                <h2 className="co-form-title">Finalizar pedido</h2>
                <p className="co-form-sub">Escolha como deseja pagar</p>

                <div className="co-methods">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`co-method ${method === m.id ? "co-method--active" : ""}`}
                      onClick={() => setMethod(m.id)}
                    >
                      <span className="co-method-label">{m.label}</span>
                      <span className="co-method-desc">{m.desc}</span>
                    </button>
                  ))}
                </div>

                <form className="co-form" onSubmit={handleSubmit} noValidate>
                  <div className="co-field">
                    <label htmlFor="co-name">Nome completo</label>
                    <input
                      id="co-name" type="text" placeholder="Joao Silva"
                      value={form.name} onChange={set("name")}
                      className={errors.name ? "error" : ""}
                    />
                    {errors.name && <span className="co-field-error">{errors.name}</span>}
                  </div>
                  <div className="co-field">
                    <label htmlFor="co-email">E-mail</label>
                    <input
                      id="co-email" type="email" placeholder="joao@empresa.com"
                      value={form.email} onChange={set("email")}
                      className={errors.email ? "error" : ""}
                    />
                    {errors.email && <span className="co-field-error">{errors.email}</span>}
                  </div>
                  <div className="co-field">
                    <label htmlFor="co-phone">WhatsApp / Telefone</label>
                    <input
                      id="co-phone" type="tel" placeholder="(73) 9 8106-8594"
                      value={form.phone} onChange={set("phone")}
                      className={errors.phone ? "error" : ""}
                    />
                    {errors.phone && <span className="co-field-error">{errors.phone}</span>}
                  </div>
                  {method !== "card" && (
                    <div className="co-field">
                      <label htmlFor="co-cpf">CPF</label>
                      <input
                        id="co-cpf" type="text" placeholder="000.000.000-00"
                        value={form.cpf} onChange={set("cpf")}
                        className={errors.cpf ? "error" : ""}
                      />
                      {errors.cpf && <span className="co-field-error">{errors.cpf}</span>}
                    </div>
                  )}

                  {errorMsg && (
                    <div className="co-status-msg" style={{ color: "#ef4444" }}>
                      {errorMsg}
                    </div>
                  )}

                  {cardUrl && (
                    <a
                      href={cardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="co-submit co-submit-link"
                    >
                      Abrir pagamento com cartao
                    </a>
                  )}

                  <button type="submit" className="co-submit" disabled={loading}>
                    {loading
                      ? <span className="co-spinner" />
                      : method === "card"
                        ? "Pagar com cartao (nova aba)"
                        : method === "pix"
                          ? "Gerar QR Code PIX"
                          : "Gerar Boleto"
                    }
                  </button>

                  <p className="co-terms">
                    Pagamento processado pelo Mercado Pago.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const checkoutCSS = `
  .co-root { min-height:100svh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:1rem;position:relative;overflow:hidden; }
  .co-grid { position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(201,168,76,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,.025) 1px,transparent 1px);background-size:70px 70px;mask-image:radial-gradient(ellipse 80% 70% at 50% 0%,black 40%,transparent 100%); }
  .co-glow { position:fixed;top:-20%;left:50%;transform:translateX(-50%);width:min(800px,120vw);height:min(500px,70vh);border-radius:50%;background:radial-gradient(ellipse,rgba(201,168,76,.08) 0%,transparent 65%);pointer-events:none;z-index:0; }
  .co-wrapper { position:relative;z-index:10;display:grid;grid-template-columns:1fr;width:100%;max-width:900px;background:rgba(10,10,10,.9);backdrop-filter:blur(24px);border:1px solid var(--glass-border);border-radius:var(--radius-xl);overflow:hidden; }
  @media(min-width:768px){ .co-wrapper{ grid-template-columns:380px 1fr; } }
  .co-summary { padding:2.5rem;background:rgba(201,168,76,.04);border-bottom:1px solid var(--border); }
  @media(min-width:768px){ .co-summary{ border-bottom:none;border-right:1px solid var(--border); } }
  .co-back { display:inline-flex;align-items:center;gap:.4rem;font-size:.78rem;color:var(--text-muted);text-decoration:none;margin-bottom:1.75rem; }
  .co-logo { font-family:var(--font-title);font-size:1.5rem;font-weight:800;margin-bottom:1.5rem;color:var(--gold-2); }
  .co-plan-badge { display:inline-flex;align-items:center;gap:.4rem;padding:.3rem .875rem;background:rgba(201,168,76,.1);border:1px solid var(--border);border-radius:100px;font-size:.72rem;font-weight:600;color:var(--gold-3);margin-bottom:1rem; }
  .co-plan-badge-dot { width:6px;height:6px;border-radius:50%;background:var(--gold-2); }
  .co-plan-price { font-family:var(--font-title);font-size:1.8rem;font-weight:800;margin-bottom:.4rem;color:var(--gold-2); }
  .co-plan-desc { font-size:.85rem;color:var(--text-muted);line-height:1.6; }
  .co-divider { height:1px;background:var(--border);margin:1.5rem 0; }
  .co-secure-badges { display:flex;flex-direction:column;gap:.75rem; }
  .co-badge-item { display:flex;align-items:center;gap:.625rem;font-size:.8rem;color:var(--text-muted); }
  .co-form-side { padding:2.5rem; }
  .co-form-title { font-family:var(--font-title);font-size:1.4rem;font-weight:800;margin-bottom:.3rem; }
  .co-form-sub { font-size:.82rem;color:var(--text-muted);margin-bottom:1.25rem; }
  .co-methods { display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-bottom:1.25rem; }
  .co-method { display:flex;flex-direction:column;gap:.2rem;padding:.75rem .5rem;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;text-align:center;transition:border-color .2s,background .2s; }
  .co-method--active { border-color:rgba(201,168,76,.6);background:rgba(201,168,76,.08); }
  .co-method-label { font-size:.85rem;font-weight:700;color:var(--text); }
  .co-method-desc { font-size:.65rem;color:var(--text-muted); }
  .co-form { display:flex;flex-direction:column;gap:1rem; }
  .co-field { display:flex;flex-direction:column;gap:.375rem; }
  .co-field label { font-size:.72rem;font-weight:600;text-transform:uppercase;color:var(--text-muted); }
  .co-field input { background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--radius);padding:.8rem 1rem;font-size:.9rem;color:var(--text);outline:none;width:100%; }
  .co-field input:focus { border-color:rgba(201,168,76,.5); }
  .co-field input.error { border-color:rgba(239,68,68,.4); }
  .co-field-error { font-size:.72rem;color:#f87171; }
  .co-status-msg { font-size:.85rem;padding:.75rem 1rem;background:rgba(255,255,255,.04);border-radius:var(--radius);border:1px solid var(--border); }
  .co-submit { display:flex;align-items:center;justify-content:center;gap:.625rem;width:100%;padding:1rem;background:var(--accent-gradient);border:none;border-radius:var(--radius);font-size:.95rem;font-weight:700;color:#080808;cursor:pointer; }
  .co-submit:disabled { opacity:.6;cursor:not-allowed; }
  .co-submit-link { text-decoration:none;text-align:center; }
  .co-spinner { width:18px;height:18px;border:2px solid rgba(8,8,8,.3);border-top-color:#080808;border-radius:50%;animation:co-spin .7s linear infinite; }
  .co-spinner-gold { border-color:rgba(201,168,76,.2);border-top-color:#c9a84c; }
  @keyframes co-spin { to{transform:rotate(360deg)} }
  .co-terms { font-size:.72rem;color:var(--text-muted);text-align:center; }
  .co-payment-result { display:flex;flex-direction:column;gap:1rem; }
  .co-qr-wrap { display:flex;justify-content:center;padding:1rem;background:#fff;border-radius:var(--radius); }
  .co-qr-img { width:240px;height:240px; }
  .co-pix-code { display:flex;flex-direction:column;gap:.5rem; }
  .co-pix-code code { font-size:.7rem;word-break:break-all;padding:.75rem;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-muted); }
  .co-copy-btn { padding:.6rem;background:rgba(201,168,76,.15);border:1px solid var(--border);border-radius:var(--radius);color:var(--gold-2);font-weight:600;cursor:pointer; }
  .co-waiting { display:flex;align-items:center;gap:.75rem;font-size:.85rem;color:var(--text-muted); }
  .co-back-btn { background:none;border:none;color:var(--text-muted);font-size:.8rem;cursor:pointer;text-decoration:underline; }
  @media(max-width:480px){ .co-summary,.co-form-side{ padding:1.75rem 1.5rem; } .co-methods{ grid-template-columns:1fr; } }
`;
