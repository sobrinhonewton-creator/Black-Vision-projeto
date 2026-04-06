/**
 * CheckoutPage.jsx — Black Vision Checkout Transparente
 * ──────────────────────────────────────────────────────
 * Rota: /checkout?plan=basic|advanced|pro
 *
 * Suporta dois modos conforme gateway:
 *  - Mercado Pago: redireciona para init_point OU usa SDK embedded
 *  - Stripe:       usa Stripe Checkout hosted session
 */

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createCheckout, PLANS } from "../../services/payment.js";

/* ── Status da transação ── */
const STATUS_CONFIG = {
  idle:       { label: "", color: "" },
  loading:    { label: "Processando pagamento...", color: "#c9a84c" },
  success:    { label: "✅ Pagamento aprovado! Redirecionando...", color: "#22c55e" },
  error:      { label: "❌ Erro no pagamento. Tente novamente.", color: "#ef4444" },
  redirecting:{ label: "⏳ Redirecionando para o checkout seguro...", color: "#c9a84c" },
};

export default function CheckoutPage() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const planId     = params.get("plan") || "advanced";
  const plan       = PLANS[planId] || PLANS.advanced;

  const [form, setForm]     = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [statusMsg, setStatusMsg] = useState("");

  // Se plano Pro, redireciona para WhatsApp direto
  useEffect(() => {
    if (planId === "pro") {
      window.open("https://wa.me/5573981068594?text=Quero%20o%20plano%20Pro", "_blank");
      navigate("/");
    }
  }, [planId, navigate]);

  /* ── Validação ── */
  function validate() {
    const e = {};
    if (!form.name.trim())                        e.name  = "Nome é obrigatório";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "E-mail inválido";
    if (!form.phone.replace(/\D/g, "").match(/^\d{10,11}$/)) e.phone = "Telefone inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Submit ── */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("loading");

    const result = await createCheckout({
      tier:          planId,
      type:          plan.type,
      customerName:  form.name,
      customerEmail: form.email,
      customerPhone: form.phone,
    });

    if (!result.success) {
      setStatus("error");
      setStatusMsg(result.error || "Erro desconhecido");
      return;
    }

    // Mercado Pago — redireciona para init_point
    if (result.initPoint || result.checkoutUrl) {
      setStatus("redirecting");
      setTimeout(() => {
        window.location.href = result.initPoint || result.checkoutUrl;
      }, 800);
      return;
    }

    // Stripe Checkout Session — redireciona
    if (result.sessionId) {
      setStatus("redirecting");
      // Se Stripe.js estiver carregado via CDN no index.html:
      // const stripe = window.Stripe(import.meta.env.VITE_STRIPE_PK);
      // stripe.redirectToCheckout({ sessionId: result.sessionId });
      // Fallback:
      if (result.checkoutUrl) {
        setTimeout(() => { window.location.href = result.checkoutUrl; }, 800);
      }
      return;
    }

    setStatus("success");
  }

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: "" }));
  };

  const st = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <>
      <style>{checkoutCSS}</style>

      <div className="co-root">
        <div className="co-grid" aria-hidden="true" />
        <div className="co-glow"  aria-hidden="true" />

        <div className="co-wrapper">
          {/* ── Left: Resumo do plano ── */}
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
                Dados criptografados
              </div>
              <div className="co-badge-item">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Aprovação em minutos
              </div>
            </div>
          </div>

          {/* ── Right: Formulário ── */}
          <div className="co-form-side">
            <h2 className="co-form-title">Seus dados</h2>
            <p className="co-form-sub">Preencha para finalizar o pedido</p>

            <form className="co-form" onSubmit={handleSubmit} noValidate>
              <div className="co-field">
                <label htmlFor="co-name">Nome completo</label>
                <input
                  id="co-name" type="text" placeholder="João Silva"
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

              {/* Status message */}
              {status !== "idle" && (
                <div className="co-status-msg" style={{ color: st.color }}>
                  {st.label}
                  {status === "error" && statusMsg && (
                    <span style={{ display: "block", fontSize: ".75rem", marginTop: ".25rem", opacity: .7 }}>
                      {statusMsg}
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="co-submit"
                disabled={status === "loading" || status === "redirecting" || status === "success"}
              >
                {status === "loading" || status === "redirecting"
                  ? <span className="co-spinner" />
                  : (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      Finalizar Pedido — {plan.priceLabel}
                    </>
                  )
                }
              </button>

              <p className="co-terms">
                Ao continuar você concorda com nossos{" "}
                <a href="/termos" target="_blank">Termos de Uso</a>
                {" "}e{" "}
                <a href="/privacidade" target="_blank">Política de Privacidade</a>.
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── CSS ── */
const checkoutCSS = `
  .co-root {
    min-height: 100svh; display: flex; align-items: center; justify-content: center;
    background: var(--bg); padding: 1rem; position: relative; overflow: hidden;
  }
  .co-grid {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(201,168,76,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,.025) 1px, transparent 1px);
    background-size: 70px 70px;
    mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black 40%, transparent 100%);
    -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black 40%, transparent 100%);
  }
  .co-glow {
    position: fixed; top: -20%; left: 50%; transform: translateX(-50%);
    width: min(800px,120vw); height: min(500px,70vh); border-radius: 50%;
    background: radial-gradient(ellipse, rgba(201,168,76,.08) 0%, transparent 65%);
    pointer-events: none; z-index: 0;
  }
  .co-wrapper {
    position: relative; z-index: 10;
    display: grid; grid-template-columns: 1fr;
    width: 100%; max-width: 900px;
    background: rgba(10,10,10,.9);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    overflow: hidden;
    animation: co-in .5s cubic-bezier(.4,0,.2,1);
  }
  @keyframes co-in { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
  @media(min-width:768px){ .co-wrapper{ grid-template-columns: 380px 1fr; } }

  /* ── Summary ── */
  .co-summary {
    padding: 2.5rem; background: rgba(201,168,76,.04);
    border-bottom: 1px solid var(--border);
    position: relative;
  }
  @media(min-width:768px){
    .co-summary { border-bottom: none; border-right: 1px solid var(--border); }
  }
  .co-back {
    display: inline-flex; align-items: center; gap: .4rem;
    font-size: .78rem; color: var(--text-muted);
    text-decoration: none; margin-bottom: 1.75rem;
    transition: color var(--transition);
  }
  .co-back:hover { color: var(--gold-2); }
  .co-logo {
    font-family: var(--font-title); font-size: 1.5rem; font-weight: 800;
    letter-spacing: -.04em;
    background: linear-gradient(90deg,#8a6d28 0%,#e2c97e 50%,#8a6d28 100%);
    background-size: 200% auto; -webkit-background-clip: text;
    -webkit-text-fill-color: transparent; background-clip: text;
    animation: co-shimmer 4s linear infinite; margin-bottom: 1.5rem;
  }
  @keyframes co-shimmer { from{background-position:-200% center} to{background-position:200% center} }
  .co-plan-badge {
    display: inline-flex; align-items: center; gap: .4rem;
    padding: .3rem .875rem; background: rgba(201,168,76,.1);
    border: 1px solid var(--border); border-radius: 100px;
    font-size: .72rem; font-weight: 600; color: var(--gold-3);
    letter-spacing: .08em; text-transform: uppercase; margin-bottom: 1rem;
  }
  .co-plan-badge-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--gold-2);
    animation: co-blink 2s ease-in-out infinite;
  }
  @keyframes co-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
  .co-plan-price {
    font-family: var(--font-title); font-size: 1.8rem; font-weight: 800;
    letter-spacing: -.04em;
    background: var(--accent-gradient); -webkit-background-clip: text;
    -webkit-text-fill-color: transparent; background-clip: text;
    margin-bottom: .4rem;
  }
  .co-plan-desc { font-size: .85rem; color: var(--text-muted); font-weight: 300; line-height: 1.6; }
  .co-divider { height: 1px; background: linear-gradient(90deg,transparent,var(--border),transparent); margin: 1.5rem 0; }
  .co-secure-badges { display: flex; flex-direction: column; gap: .75rem; }
  .co-badge-item {
    display: flex; align-items: center; gap: .625rem;
    font-size: .8rem; color: var(--text-muted); font-weight: 300;
  }
  .co-badge-item svg { color: var(--gold-2); flex-shrink: 0; }

  /* ── Form ── */
  .co-form-side { padding: 2.5rem; }
  .co-form-title { font-family: var(--font-title); font-size: 1.4rem; font-weight: 800; letter-spacing: -.04em; margin-bottom: .3rem; }
  .co-form-sub { font-size: .82rem; color: var(--text-muted); margin-bottom: 1.75rem; font-weight: 300; }
  .co-form { display: flex; flex-direction: column; gap: 1rem; }
  .co-field { display: flex; flex-direction: column; gap: .375rem; }
  .co-field label { font-size: .72rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--text-muted); }
  .co-field input {
    background: rgba(255,255,255,.03); border: 1px solid var(--border);
    border-radius: var(--radius); padding: .8rem 1rem;
    font-family: var(--font-body); font-size: .9rem; color: var(--text);
    outline: none; transition: border-color var(--transition), box-shadow var(--transition), background var(--transition);
    width: 100%;
  }
  .co-field input:focus { border-color: rgba(201,168,76,.5); background: rgba(201,168,76,.04); box-shadow: 0 0 0 3px rgba(201,168,76,.08); }
  .co-field input.error { border-color: rgba(239,68,68,.4); }
  .co-field input::placeholder { color: rgba(168,162,158,.4); }
  .co-field-error { font-size: .72rem; color: #f87171; }
  .co-status-msg { font-size: .85rem; font-weight: 500; padding: .75rem 1rem; background: rgba(255,255,255,.04); border-radius: var(--radius); border: 1px solid var(--border); }
  .co-submit {
    display: flex; align-items: center; justify-content: center; gap: .625rem;
    width: 100%; padding: 1rem; margin-top: .25rem;
    background: var(--accent-gradient); border: none; border-radius: var(--radius);
    font-family: var(--font-body); font-size: .95rem; font-weight: 700;
    color: #080808; cursor: pointer;
    box-shadow: 0 4px 20px rgba(201,168,76,.28);
    transition: transform var(--transition), box-shadow var(--transition), opacity var(--transition);
  }
  .co-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--accent-glow-strong); }
  .co-submit:disabled { opacity: .6; cursor: not-allowed; }
  .co-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(8,8,8,.3); border-top-color: #080808;
    border-radius: 50%; animation: co-spin .7s linear infinite;
  }
  @keyframes co-spin { to { transform: rotate(360deg); } }
  .co-terms { font-size: .72rem; color: var(--text-muted); text-align: center; line-height: 1.6; }
  .co-terms a { color: var(--gold-2); text-decoration: none; }
  .co-terms a:hover { color: var(--gold-3); }
  @media(max-width:480px){ .co-summary,.co-form-side{ padding: 1.75rem 1.5rem; } }
`;
