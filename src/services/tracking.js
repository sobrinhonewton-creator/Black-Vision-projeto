/**
 * tracking.js — Serviço de tracking via backend API
 * Remove dependência do Firebase SDK no frontend.
 */

import api from "./api.js";

const VALID_EVENTS = [
  "pageView",
  "cardClick",
  "whatsappClick",
  "checkoutStart",
  "checkoutSuccess",
  "planView",
  "planClick",
];

/**
 * Envia evento de tracking (fire-and-forget)
 * O backend responde imediatamente — nunca trava o front
 */
export async function trackEvent(event, meta = {}) {
  if (!VALID_EVENTS.includes(event)) return;
  try {
    await api.post("/api/tracking/event", { event, meta });
  } catch {
    // Tracking nunca deve gerar erro visível ao usuário
  }
}

export const trackPageView      = ()       => trackEvent("pageView");
export const trackCardClick     = ()       => trackEvent("cardClick");
export const trackWhatsAppClick = ()       => trackEvent("whatsappClick");
export const trackCheckoutStart = (tier)   => trackEvent("checkoutStart", { tier });
export const trackCheckoutSuccess = (tier) => trackEvent("checkoutSuccess", { tier });
export const trackPlanView      = (tier)   => trackEvent("planView",  { tier });
export const trackPlanClick     = (tier)   => trackEvent("planClick", { tier });

/**
 * Retorna estatísticas — requer admin token
 */
export async function getStats() {
  const { data } = await api.get("/api/tracking/stats");
  return data;
}
