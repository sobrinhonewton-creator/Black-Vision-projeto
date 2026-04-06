import { useState } from "react";
import { login } from "../services/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email)    { setError("Por favor, insira seu e-mail."); return; }
    if (!password) { setError("Por favor, insira sua senha.");  return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate("/admin/dashboard");
    } else {
      setError("E-mail ou senha inválidos. Tente novamente.");
      setPassword("");
    }
  };

  return (
    <>
      <style>{adminLoginCSS}</style>
      <div className="al-root">
        <div className="al-grid"  aria-hidden="true" />
        <div className="al-glow"  aria-hidden="true" />
        <div className="al-orb al-orb-1" aria-hidden="true" />
        <div className="al-orb al-orb-2" aria-hidden="true" />
        <div className="al-orb al-orb-3" aria-hidden="true" />

        <div className="al-card">
          <div className="al-header">
            <div className="al-logo">Black Vision</div>
            <br />
            <span className="al-badge">Painel Administrativo</span>
            <h1 className="al-title">Bem-vindo de volta</h1>
            <p className="al-sub">Acesse o painel de gerenciamento do site</p>
          </div>

          <form className="al-form" onSubmit={handleLogin} noValidate>
            <div className="al-field">
              <label htmlFor="al-email">E-mail</label>
              <div className="al-input-wrap">
                <span className="al-icon">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,12 2,6"/>
                  </svg>
                </span>
                <input
                  id="al-email" type="email" placeholder="admin@blackvision.com"
                  autoComplete="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                />
              </div>
            </div>

            <div className="al-field">
              <label htmlFor="al-password">Senha</label>
              <div className="al-input-wrap">
                <span className="al-icon">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="al-password" type={showPass ? "text" : "password"}
                  placeholder="••••••••" autoComplete="current-password" value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                />
                <button type="button" className="al-pass-btn"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPass ? (
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="al-error" role="alert">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink:0}}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="al-btn" disabled={loading}>
              {loading ? (
                <span className="al-spinner" />
              ) : (
                <>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Entrar no Painel
                </>
              )}
            </button>
          </form>

          <div className="al-divider">
            <div className="al-divider-line" />
            <span className="al-divider-text">Bem Vindo</span>
            <div className="al-divider-line" />
          </div>

          <div className="al-hint">
            <span className="al-hint-icon">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </span>
            <span><strong>Por Favor Digite:</strong> <strong> </strong> Email e senha<strong></strong></span>
          </div>

          <div className="al-footer">
            <a href="/">← Voltar ao site</a>
          </div>
        </div>
      </div>
    </>
  );
}

const adminLoginCSS = `
  .al-root {
    min-height: 100svh; display: flex; align-items: center;
    justify-content: center; background: var(--bg);
    padding: 1rem; position: relative; overflow: hidden;
  }
  .al-grid {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(201,168,76,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,.025) 1px, transparent 1px);
    background-size: 70px 70px;
    mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black 40%, transparent 100%);
    -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black 40%, transparent 100%);
  }
  .al-glow {
    position: fixed; top: -20%; left: 50%; transform: translateX(-50%);
    width: min(800px, 120vw); height: min(500px, 70vh); border-radius: 50%;
    background: radial-gradient(ellipse, rgba(201,168,76,.1) 0%, transparent 65%);
    pointer-events: none; z-index: 0;
    animation: al-glow-pulse 4s ease-in-out infinite;
  }
  @keyframes al-glow-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
  .al-orb {
    position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(201,168,76,.06) 0%, transparent 70%);
    animation: al-orb-float linear infinite;
  }
  .al-orb-1 { width:300px;height:300px; top:10%;left:3%; animation-duration:18s; }
  .al-orb-2 { width:200px;height:200px; top:60%;right:5%; animation-duration:22s; animation-delay:-5s; }
  .al-orb-3 { width:150px;height:150px; bottom:10%;left:20%; animation-duration:15s; animation-delay:-8s; }
  @keyframes al-orb-float {
    0%,100%{transform:translateY(0) scale(1);opacity:.5}
    50%{transform:translateY(-30px) scale(1.1);opacity:1}
  }
  .al-card {
    position: relative; z-index: 10; width: 100%; max-width: 440px;
    background: rgba(10,10,10,.88);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    border: 1px solid var(--glass-border); border-radius: var(--radius-lg);
    padding: 2.5rem; overflow: hidden;
    animation: al-card-in .55s cubic-bezier(.4,0,.2,1) forwards;
  }
  @media(min-width:480px){ .al-card{padding:3rem} }
  @keyframes al-card-in {
    from{opacity:0;transform:translateY(22px) scale(.98)}
    to  {opacity:1;transform:translateY(0) scale(1)}
  }
  .al-card::before {
    content:''; position:absolute; top:0;left:0;right:0; height:2px;
    background: var(--accent-gradient);
  }
  .al-card::after {
    content:''; position:absolute; top:-80px;right:-80px;
    width:200px;height:200px; border-radius:50%;
    background: radial-gradient(circle, rgba(201,168,76,.07) 0%,transparent 70%);
    pointer-events:none;
  }
  .al-header { text-align:center; margin-bottom:2.25rem; }
  .al-logo {
    display:inline-block; font-family:var(--font-title);
    font-size:1.6rem; font-weight:800; letter-spacing:-.04em;
    background: linear-gradient(90deg,#8a6d28 0%,#e2c97e 25%,#f5e9c0 50%,#e2c97e 75%,#8a6d28 100%);
    background-size:200% auto;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    animation: al-shimmer 4s linear infinite; margin-bottom:.5rem;
  }
  @keyframes al-shimmer { from{background-position:-200% center} to{background-position:200% center} }
  .al-badge {
    display:inline-flex; align-items:center; gap:.4rem;
    padding:.3rem .875rem; background:rgba(201,168,76,.1);
    border:1px solid var(--border); border-radius:100px;
    font-size:.72rem; font-weight:500; color:var(--gold-3);
    font-family:var(--font-body); letter-spacing:.08em; text-transform:uppercase;
  }
  .al-badge::before { content:''; width:6px;height:6px;border-radius:50%;background:var(--gold-2); }
  .al-title {
    font-family:var(--font-title);
    font-size:clamp(1.4rem,4vw,1.9rem); font-weight:800;
    letter-spacing:-.04em; line-height:1;
    margin-top:1.25rem; margin-bottom:.4rem;
  }
  .al-sub { font-size:.82rem; color:var(--text-muted); font-weight:300; }
  .al-form { display:flex; flex-direction:column; gap:1.1rem; }
  .al-field { display:flex; flex-direction:column; gap:.4rem; }
  .al-field label {
    font-size:.72rem; font-weight:600; letter-spacing:.08em;
    text-transform:uppercase; color:var(--text-muted); font-family:var(--font-body);
  }
  .al-input-wrap { position:relative; }
  .al-icon {
    position:absolute; left:1rem; top:50%; transform:translateY(-50%);
    color:var(--text-muted); display:flex; pointer-events:none;
    transition:color var(--transition);
  }
  .al-field:focus-within .al-icon { color:var(--gold-2); }
  .al-field input {
    width:100%; background:rgba(255,255,255,.03);
    border:1px solid var(--border); border-radius:var(--radius);
    padding:.85rem 1rem .85rem 2.75rem;
    font-family:var(--font-body); font-size:.9rem; font-weight:400;
    color:var(--text); outline:none; -webkit-appearance:none;
    transition:border-color var(--transition),box-shadow var(--transition),background var(--transition);
  }
  .al-field input::placeholder { color:rgba(168,162,158,.45); }
  .al-field input:focus {
    border-color:rgba(201,168,76,.5); background:rgba(201,168,76,.04);
    box-shadow:0 0 0 3px rgba(201,168,76,.08),0 0 20px rgba(201,168,76,.06);
  }
  .al-field input:-webkit-autofill,
  .al-field input:-webkit-autofill:focus {
    -webkit-box-shadow:0 0 0 30px #0e0e0e inset !important;
    -webkit-text-fill-color:var(--text) !important;
  }
  .al-pass-btn {
    position:absolute;right:1rem;top:50%;transform:translateY(-50%);
    background:none;border:none;cursor:pointer;color:var(--text-muted);
    padding:.25rem;display:flex;align-items:center;
    transition:color var(--transition);
  }
  .al-pass-btn:hover { color:var(--gold-2); }
  .al-error {
    display:flex; align-items:center; gap:.5rem;
    background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.22);
    border-radius:10px; padding:.75rem 1rem;
    font-size:.82rem; color:#f87171; font-family:var(--font-body);
    animation: al-shake .35s ease;
  }
  @keyframes al-shake {
    0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)}
  }
  .al-btn {
    display:flex; align-items:center; justify-content:center; gap:.6rem;
    width:100%; padding:1rem 2rem; margin-top:.4rem;
    background:var(--accent-gradient); border:none; border-radius:var(--radius);
    font-family:var(--font-body); font-size:.95rem; font-weight:600;
    color:#080808; cursor:pointer;
    box-shadow:0 4px 20px rgba(201,168,76,.28);
    transition:transform var(--transition),box-shadow var(--transition),opacity var(--transition);
    position:relative; overflow:hidden;
  }
  .al-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:var(--accent-glow-strong); }
  .al-btn:active:not(:disabled) { transform:scale(.97); }
  .al-btn:disabled { opacity:.6; cursor:not-allowed; }
  .al-spinner {
    width:18px; height:18px;
    border:2px solid rgba(8,8,8,.3); border-top-color:#080808;
    border-radius:50%; animation: al-spin .7s linear infinite;
  }
  @keyframes al-spin { to{transform:rotate(360deg)} }
  .al-divider { display:flex; align-items:center; gap:.75rem; margin:1.25rem 0; }
  .al-divider-line { flex:1; height:1px; background:linear-gradient(90deg,transparent,var(--border),transparent); }
  .al-divider-text { font-size:.72rem; color:var(--text-muted); white-space:nowrap; font-family:var(--font-body); }
  .al-hint {
    background:rgba(201,168,76,.05); border:1px solid var(--border);
    border-radius:var(--radius); padding:.875rem 1.25rem;
    font-size:.78rem; color:var(--text-muted); font-family:var(--font-body);
    display:flex; align-items:flex-start; gap:.625rem;
  }
  .al-hint-icon { color:var(--gold-2); flex-shrink:0; margin-top:.05rem; }
  .al-hint strong { color:var(--gold-3); }
  .al-footer { text-align:center; margin-top:1.75rem; font-size:.75rem; color:var(--text-muted); }
  .al-footer a { color:var(--gold-2); text-decoration:none; transition:color var(--transition); }
  .al-footer a:hover { color:var(--gold-3); }
  @media(max-width:480px){ .al-card{padding:2rem 1.5rem;} }
`;
