/**
 * payment.js — Black Vision Payment Service Layer
 * ─────────────────────────────────────────────────
 * Gateway-agnóstico: troque VITE_PAYMENT_GATEWAY no .env
 * entre "stripe" e "mercadopago" sem mudar nada no front.
 *
 * Fluxo:
 *  1. Front chama createCheckout(plan)
 *  2. Service chama o backend /api/payments/checkout
 *  3. Backend cria sessão no gateway escolhido
 *  4. Front redireciona ou embute o checkout
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3333";
const GATEWAY  = import.meta.env.VITE_PAYMENT_GATEWAY || "mercadopago"; // "stripe" | "mercadopago"

/* ─── Types (JSDoc) ──────────────────────────────────────── */
/**
 * @typedef {'basic'|'advanced'|'pro'} PlanTier
 * @typedef {'subscription'|'one_time'} PaymentType
 * @typedef {'pending'|'approved'|'rejected'|'cancelled'|'refunded'} PaymentStatus
 *
 * @typedef {Object} CheckoutPayload
 * @property {PlanTier}    tier
 * @property {PaymentType} type
 * @property {string}      customerEmail
 * @property {string}      [customerName]
 * @property {string}      [customerPhone]
 *
 * @typedef {Object} CheckoutResult
 * @property {boolean} success
 * @property {string}  [checkoutUrl]   — redirect URL (Stripe hosted / MP redirect)
 * @property {string}  [initPoint]     — MP preference init_point
 * @property {string}  [clientSecret]  — Stripe payment_intent client_secret (embedded)
 * @property {string}  [preferenceId]  — MP preference_id (embedded SDK)
 * @property {string}  [sessionId]     — Stripe Checkout session_id
 * @property {string}  [error]
 */

/* ─── Helpers ────────────────────────────────────────────── */
async function apiFetch(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }

  return data;
}

/* ─── Transaction log (localStorage — dev/fallback) ─────── */
const TX_KEY = "bv_transactions";

export function logTransaction(tx) {
  const existing = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
  existing.unshift({
    id:        tx.id || `tx_${Date.now()}`,
    tier:      tx.tier,
    gateway:   GATEWAY,
    status:    tx.status || "pending",
    amount:    tx.amount,
    currency:  tx.currency || "BRL",
    createdAt: new Date().toISOString(),
    meta:      tx.meta || {},
  });
  // Keep last 100
  localStorage.setItem(TX_KEY, JSON.stringify(existing.slice(0, 100)));
}

export function getTransactions() {
  return JSON.parse(localStorage.getItem(TX_KEY) || "[]");
}

/* ─── Main: createCheckout ───────────────────────────────── */
/**
 * Cria uma sessão de checkout no backend.
 * @param {CheckoutPayload} payload
 * @returns {Promise<CheckoutResult>}
 */
export async function createCheckout(payload) {
  try {
    const result = await apiFetch("/api/payments/checkout", {
      ...payload,
      gateway: GATEWAY,
    });

    // Log the initiated transaction
    logTransaction({
      tier:   payload.tier,
      status: "pending",
      meta:   { sessionId: result.sessionId || result.preferenceId },
    });

    return { success: true, ...result };

  } catch (err) {
    console.error("[Payment] createCheckout error:", err);
    logTransaction({ tier: payload.tier, status: "error", meta: { error: err.message } });
    return { success: false, error: err.message };
  }
}

/* ─── Get payment status ─────────────────────────────────── */
/**
 * @param {string} paymentId
 * @returns {Promise<{status: PaymentStatus, detail: object}>}
 */
export async function getPaymentStatus(paymentId) {
  try {
    const res = await fetch(`${API_BASE}/api/payments/status/${paymentId}`);
    return await res.json();
  } catch (err) {
    return { status: "unknown", detail: { error: err.message } };
  }
}

/* ─── Cancel / refund ────────────────────────────────────── */
export async function cancelSubscription(subscriptionId) {
  return apiFetch("/api/payments/cancel", { subscriptionId, gateway: GATEWAY });
}

/* ─── Plan definitions (single source of truth) ─────────── */
export const PLANS = {
  basic: {
    label:       "Basic",
    priceLabel:  "R$ 497 – R$ 997",
    description: "Landing page profissional para começar rápido",
    // Used by backend to create real price objects
    amountMin:   49700,  // centavos
    amountMax:   99700,
    currency:    "BRL",
    type:        "one_time",
  },
  advanced: {
    label:       "Advanced",
    priceLabel:  "R$ 1.500 – R$ 3.000",
    description: "Site completo com automação e painel administrativo",
    amountMin:   150000,
    amountMax:   300000,
    currency:    "BRL",
    type:        "one_time",
  },
  pro: {
    label:       "Pro",
    priceLabel:  "Sob consulta",
    description: "Sistema personalizado, IA e suporte dedicado",
    amountMin:   null,  // consulta
    currency:    "BRL",
    type:        "subscription",
  },
};

export { GATEWAY };
