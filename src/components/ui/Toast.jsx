/**
 * Toast.jsx — Sistema global de notificações
 * Uso: import { useToast, ToastContainer } from "./Toast"
 */

import { useState, useCallback, createContext, useContext, useRef } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const push = useCallback((msg, type = "success", duration = 3500) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    setToasts(prev => [...prev, { id, msg, type }]);
    timers.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete timers.current[id];
    }, duration);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const ICONS = {
  success: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  error: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  warning: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  info: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <>
      <style>{TOAST_CSS}</style>
      <div className="toast-container" role="region" aria-label="Notificações">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} role="alert">
            <span className={`toast-icon toast-icon-${t.type}`}>{ICONS[t.type] || ICONS.info}</span>
            <span className="toast-msg">{t.msg}</span>
            <button className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Fechar">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

const TOAST_CSS = `
  .toast-container {
    position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
    display: flex; flex-direction: column; gap: .625rem;
    pointer-events: none;
  }
  .toast {
    display: flex; align-items: center; gap: .75rem;
    padding: .875rem 1.25rem; border-radius: 12px;
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid; font-size: .875rem; font-weight: 500;
    max-width: 380px; pointer-events: all;
    animation: toast-in .35s cubic-bezier(.34,1.56,.64,1);
    box-shadow: 0 8px 32px rgba(0,0,0,.4);
  }
  @keyframes toast-in { from{opacity:0;transform:translateX(20px) scale(.95)} to{opacity:1;transform:none} }
  .toast-success { background: rgba(10,10,10,.92); border-color: rgba(34,197,94,.25); color: #e7fdf0; }
  .toast-error   { background: rgba(10,10,10,.92); border-color: rgba(239,68,68,.25);  color: #fde7e7; }
  .toast-warning { background: rgba(10,10,10,.92); border-color: rgba(234,179,8,.25);  color: #fef9e7; }
  .toast-info    { background: rgba(10,10,10,.92); border-color: rgba(59,130,246,.25); color: #e7f0fd; }
  .toast-icon { flex-shrink: 0; display: flex; align-items: center; }
  .toast-icon-success { color: #22c55e; }
  .toast-icon-error   { color: #ef4444; }
  .toast-icon-warning { color: #eab308; }
  .toast-icon-info    { color: #3b82f6; }
  .toast-msg { flex: 1; line-height: 1.4; }
  .toast-close {
    background: none; border: none; cursor: pointer; padding: .2rem;
    color: rgba(255,255,255,.4); border-radius: 6px; flex-shrink: 0;
    display: flex; align-items: center; transition: color .2s;
  }
  .toast-close:hover { color: rgba(255,255,255,.8); }
  @media(max-width:480px) {
    .toast-container { left: 1rem; right: 1rem; }
    .toast { max-width: 100%; }
  }
`;
