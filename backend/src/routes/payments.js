/**
 * routes/payments.js
 * POST /api/payments/checkout
 * GET  /api/payments/status/:id
 * POST /api/payments/cancel
 */

import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { createMPCheckout, getMPStatus } from "../services/mercadopago.js";
import { createStripeCheckout, getStripeStatus, cancelStripeSubscription } from "../services/stripe.js";
import { logTransaction, getTransactions } from "../services/transactionLog.js";

const router  = Router();
const GATEWAY = process.env.PAYMENT_GATEWAY || "mercadopago";

/* ── Plan definitions (espelho do front) ── */
const PLANS = {
  basic:    { label: "Black Vision Basic",    amount: 49700,  currency: "BRL", type: "one_time" },
  advanced: { label: "Black Vision Advanced", amount: 150000, currency: "BRL", type: "one_time" },
  pro:      { label: "Black Vision Pro",      amount: null,   currency: "BRL", type: "subscription" },
};

/* POST /api/payments/checkout */
router.post("/checkout", async (req, res) => {
  const { tier, customerEmail, customerName, customerPhone, gateway: reqGateway } = req.body || {};
  const gw = reqGateway || GATEWAY;

  const plan = PLANS[tier];
  if (!plan) return res.status(400).json({ message: `Plano inválido: ${tier}` });
  if (!customerEmail) return res.status(400).json({ message: "customerEmail é obrigatório" });

  const baseUrl   = process.env.FRONTEND_URL || "http://localhost:5173";
  const successUrl = `${baseUrl}/checkout/success?plan=${tier}`;
  const failureUrl = `${baseUrl}/checkout/failure?plan=${tier}`;

  const payload = {
    plan,
    tier,
    customer: { email: customerEmail, name: customerName, phone: customerPhone },
    successUrl,
    failureUrl,
  };

  try {
    let result;

    if (gw === "stripe") {
      result = await createStripeCheckout(payload);
    } else {
      result = await createMPCheckout(payload);
    }

    // Log da transação
    await logTransaction({
      tier, gateway: gw, status: "pending",
      amount: plan.amount, currency: plan.currency,
      customerEmail,
      sessionId: result.sessionId || result.preferenceId,
    });

    res.json(result);

  } catch (err) {
    console.error("[Payment checkout]", err.message);

    await logTransaction({
      tier, gateway: gw, status: "error",
      customerEmail, error: err.message,
    });

    res.status(500).json({ message: "Erro ao criar checkout: " + err.message });
  }
});

/* GET /api/payments/status/:id */
router.get("/status/:id", async (req, res) => {
  const { id } = req.params;

  try {
    let result;
    if (GATEWAY === "stripe") {
      result = await getStripeStatus(id);
    } else {
      result = await getMPStatus(id);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: "unknown", message: err.message });
  }
});

/* POST /api/payments/cancel */
router.post("/cancel", requireAdmin, async (req, res) => {
  const { subscriptionId } = req.body || {};
  if (!subscriptionId) return res.status(400).json({ message: "subscriptionId obrigatório" });

  try {
    const result = await cancelStripeSubscription(subscriptionId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/payments/transactions — admin */
router.get("/transactions", requireAdmin, async (req, res) => {
  const txs = await getTransactions();
  res.json(txs);
});

export default router;
