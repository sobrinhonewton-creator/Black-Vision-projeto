/**
 * payment.js — Black Vision Payment Service Layer
 * Gateway-agnóstico: stripe | mercadopago via VITE_PAYMENT_GATEWAY
 */

import api from "./api.js";

export const GATEWAY = import.meta.env.VITE_PAYMENT_GATEWAY || "mercadopago";

/** @typedef {'basic'|'advanced'|'pro'} PlanTier */

/* ─── Plan definitions (single source of truth) ─── */
export const PLANS = {
  basic: {
    label:       "Basic",
    priceLabel:  "R$ 497 – R$ 997",
    description: "Landing page profissional para começar rápido",
    amountMin:   49700,
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
    amountMin:   null,
    currency:    "BRL",
    type:        "subscription",
  },
};

/**
 * Cria uma sessão de checkout no backend
 * @param {{ tier: PlanTier, customerEmail: string, customerName?: string, customerPhone?: string }} payload
 */
export async function createCheckout(payload) {
  try {
    const { data } = await api.post("/api/payments/checkout", {
      ...payload,
      gateway: GATEWAY,
    });
    return { success: true, ...data };
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    console.error("[Payment] createCheckout error:", message);
    return { success: false, error: message };
  }
}

/**
 * Cria pagamento PIX ou Boleto direto (QR/código no site, sem redirect MP)
 * @param {{ tier: PlanTier, method: 'pix'|'boleto', customerEmail: string, customerName?: string, customerPhone?: string, customerCpf: string }} payload
 */
export async function createDirectPayment(payload) {
  try {
    const { data } = await api.post("/api/payments/create", payload);
    return { success: true, ...data };
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    return { success: false, error: message };
  }
}

/**
 * Verifica o status de um pagamento
 * @param {string} paymentId
 */
export async function getPaymentStatus(paymentId) {
  try {
    const { data } = await api.get(`/api/payments/status/${paymentId}`);
    return data;
  } catch (err) {
    return { status: "unknown", detail: { error: err.message } };
  }
}
