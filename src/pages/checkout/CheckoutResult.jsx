/**
 * CheckoutResult.jsx
 * Páginas de retorno pós-pagamento: /checkout/success e /checkout/failure
 * O gateway redireciona para cá com query params de status.
 */

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getPaymentStatus, logTransaction } from "../../services/payment.js";

/* ── Shared shell ── */
function ResultShell({ children }) {
  return (
    <>
      <style>{resultCSS}</style>
      <div className="cr-root">
        <div className="cr-grid" aria-hidden="true" />
        <div className="cr-glow"  aria-hidden="true" />
        <div className="cr-card">{children}</div>
      </div>
    </>
  );
}

/* ── Success ── */
export function CheckoutSuccess() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const paymentId = params.get("payment_id") || params.get("session_id") || "";
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!paymentId) { setStatus("approved"); return; }

    getPaymentStatus(paymentId).then(res => {
      const s = res.status === "approved" ? "approved" : res.status || "approved";
      setStatus(s);
      logTransaction({ id: paymentId, status: s, tier: params.get("plan") || "unknown" });
    }).catch(() => setStatus("approved")); // optimistic on error
  }, [paymentId, params]);

  return (
    <ResultShell>
      {status === "loading" ? (
        <div className="cr-spinner-wrap"><div className="cr-spinner" /></div>
      ) : (
        <>
          <div className="cr-icon cr-icon--success">
            <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="cr-title">Pagamento aprovado! 🎉</h1>
          <p className="cr-sub">
            Obrigado pela sua confiança. Nossa equipe já recebeu sua solicitação
            e entrará em contato em até <strong>2 horas úteis</strong>.
          </p>
          {paymentId && (
            <div className="cr-id">ID do pagamento: <code>{paymentId}</code></div>
          )}
          <div className="cr-actions">
            <a
              href="https://wa.me/557381068594?text=Acabei%20de%20realizar%20o%20pagamento!"
              target="_blank" rel="noopener noreferrer"
              className="cr-btn cr-btn-primary"
            >
              Falar com a equipe
            </a>
            <button className="cr-btn cr-btn-ghost" onClick={() => navigate("/")}>
              Voltar ao site
            </button>
          </div>
        </>
      )}
    </ResultShell>
  );
}

/* ── Failure ── */
export function CheckoutFailure() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const planId    = params.get("plan") || "advanced";

  useEffect(() => {
    logTransaction({ tier: planId, status: "rejected", meta: { reason: params.get("reason") } });
  }, [planId, params]);

  return (
    <ResultShell>
      <div className="cr-icon cr-icon--error">
        <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </div>
      <h1 className="cr-title">Pagamento não concluído</h1>
      <p className="cr-sub">
        Algo deu errado com o seu pagamento. Não se preocupe — nenhum valor
        foi cobrado. Você pode tentar novamente ou falar com nossa equipe.
      </p>
      <div className="cr-actions">
        <button className="cr-btn cr-btn-primary" onClick={() => navigate(`/checkout?plan=${planId}`)}>
          Tentar novamente
        </button>
        <a
          href="https://wa.me/557381068594?text=Tive%20problema%20no%20pagamento"
          target="_blank" rel="noopener noreferrer"
          className="cr-btn cr-btn-ghost"
        >
          Falar com suporte
        </a>
      </div>
    </ResultShell>
  );
}

/* ── CSS ── */
const resultCSS = `
  .cr-root {
    min-height: 100svh; display: flex; align-items: center; justify-content: center;
    background: var(--bg); padding: 1rem; position: relative; overflow: hidden;
  }
  .cr-grid {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: linear-gradient(rgba(201,168,76,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,.025) 1px,transparent 1px);
    background-size: 70px 70px;
    mask-image: radial-gradient(ellipse 80% 70% at 50% 0%,black 40%,transparent 100%);
    -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 0%,black 40%,transparent 100%);
  }
  .cr-glow {
    position: fixed; top: -20%; left: 50%; transform: translateX(-50%);
    width: min(700px,110vw); height: min(400px,60vh); border-radius: 50%;
    background: radial-gradient(ellipse,rgba(201,168,76,.08) 0%,transparent 65%);
    pointer-events: none; z-index: 0;
  }
  .cr-card {
    position: relative; z-index: 10; width: 100%; max-width: 480px;
    background: rgba(10,10,10,.88); backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    border: 1px solid var(--glass-border); border-radius: var(--radius-xl);
    padding: 3rem 2.5rem; text-align: center;
    animation: cr-in .5s cubic-bezier(.4,0,.2,1);
  }
  @keyframes cr-in { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:none} }
  .cr-icon {
    width: 72px; height: 72px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.5rem;
  }
  .cr-icon--success { background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.25); color: #22c55e; }
  .cr-icon--error   { background: rgba(239,68,68,.1);  border: 1px solid rgba(239,68,68,.2);  color: #f87171; }
  .cr-title { font-family: var(--font-title); font-size: 1.8rem; font-weight: 800; letter-spacing: -.04em; margin-bottom: .75rem; }
  .cr-sub { font-size: .9rem; color: var(--text-muted); font-weight: 300; line-height: 1.7; margin-bottom: 1.5rem; }
  .cr-sub strong { color: var(--gold-3); font-weight: 600; }
  .cr-id { font-size: .75rem; color: var(--text-muted); margin-bottom: 1.5rem; }
  .cr-id code { color: var(--gold-2); background: rgba(201,168,76,.08); padding: .15rem .5rem; border-radius: 6px; font-size: .8rem; }
  .cr-actions { display: flex; flex-direction: column; gap: .75rem; }
  .cr-btn { display: flex; align-items: center; justify-content: center; gap: .5rem; padding: .875rem 1.5rem; border-radius: var(--radius); font-family: var(--font-body); font-size: .9rem; font-weight: 600; text-decoration: none; cursor: pointer; transition: transform var(--transition), box-shadow var(--transition); border: none; }
  .cr-btn-primary { background: var(--accent-gradient); color: #080808; box-shadow: 0 4px 20px rgba(201,168,76,.25); }
  .cr-btn-primary:hover { transform: translateY(-2px); box-shadow: var(--accent-glow-strong); }
  .cr-btn-ghost { background: rgba(255,255,255,.04); color: var(--text-muted); border: 1px solid var(--border); }
  .cr-btn-ghost:hover { background: rgba(255,255,255,.07); color: var(--text); }
  .cr-spinner-wrap { display: flex; justify-content: center; padding: 2rem; }
  .cr-spinner { width: 36px; height: 36px; border: 3px solid rgba(201,168,76,.2); border-top-color: var(--gold-2); border-radius: 50%; animation: cr-spin .8s linear infinite; }
  @keyframes cr-spin { to{transform:rotate(360deg)} }
`;
