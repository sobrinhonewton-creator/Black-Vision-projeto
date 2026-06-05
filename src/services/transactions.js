/**
 * transactions.js — Serviço de transações (admin)
 */

import api from "./api.js";

/**
 * Retorna lista de transações — requer admin token
 * @param {number} limit
 */
export async function fetchTransactions(limit = 100) {
  const { data } = await api.get("/api/payments/transactions", {
    params: { limit },
  });
  return data;
}

/**
 * Cancela uma assinatura Stripe — requer admin token
 * @param {string} subscriptionId
 */
export async function cancelSubscription(subscriptionId) {
  const { data } = await api.post("/api/payments/cancel", { subscriptionId });
  return data;
}

/**
 * Verifica status de um pagamento
 * @param {string} paymentId
 */
export async function getPaymentStatus(paymentId) {
  const { data } = await api.get(`/api/payments/status/${paymentId}`);
  return data;
}

/**
 * Health check do backend
 */
export async function healthCheck() {
  const { data } = await api.get("/health");
  return data;
}
