/**
 * services/transactionLog.js
 * Log de transações — Firestore com fallback em memória (dev)
 */

import { getFirestore } from "./firebase.js";

const memoryLog = []; // fallback desenvolvimento

/**
 * @param {object} tx
 * @param {string} tx.tier
 * @param {string} tx.gateway
 * @param {string} tx.status        — pending | approved | rejected | error
 * @param {number} [tx.amount]      — centavos
 * @param {string} [tx.currency]
 * @param {string} [tx.customerEmail]
 * @param {string} [tx.sessionId]
 * @param {string} [tx.error]
 */
export async function logTransaction(tx) {
  const entry = {
    ...tx,
    id:        `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  // Sempre guarda em memória (dev/fallback)
  memoryLog.unshift(entry);
  if (memoryLog.length > 500) memoryLog.length = 500;

  // Tenta gravar no Firestore
  try {
    const db = getFirestore();
    await db.collection("transactions").doc(entry.id).set(entry);
  } catch (err) {
    // Silencioso — memória já tem
    if (process.env.NODE_ENV === "development") {
      console.warn("[TransactionLog] Firestore write failed, using memory:", err.message);
    }
  }

  return entry;
}

/**
 * Retorna lista de transações (Firestore ou memória)
 * @param {number} limit
 */
export async function getTransactions(limit = 100) {
  try {
    const db   = getFirestore();
    const snap = await db.collection("transactions")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snap.docs.map(d => d.data());
  } catch {
    return memoryLog.slice(0, limit);
  }
}

/**
 * Atualiza status de uma transação (webhook triggered)
 */
export async function updateTransactionStatus(sessionId, status, meta = {}) {
  try {
    const db   = getFirestore();
    const snap = await db.collection("transactions")
      .where("sessionId", "==", sessionId)
      .limit(1)
      .get();

    if (!snap.empty) {
      await snap.docs[0].ref.update({
        status,
        updatedAt: new Date().toISOString(),
        webhookMeta: meta,
      });
    }

    // Atualiza memória também
    const idx = memoryLog.findIndex(t => t.sessionId === sessionId);
    if (idx !== -1) memoryLog[idx] = { ...memoryLog[idx], status };

    return { updated: true };
  } catch (err) {
    console.error("[TransactionLog] updateStatus error:", err.message);
    return { updated: false, error: err.message };
  }
}
