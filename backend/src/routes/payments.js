/**
 * Pagamentos híbridos:
 * - Stripe Checkout: cartão e boleto
 * - Mercado Pago: apenas PIX
 */

import { randomUUID } from "node:crypto";
import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { createMPDirectPayment, getMPStatus } from "../services/mercadopago.js";
import { createStripeCheckout, getStripeStatus, cancelStripeSubscription } from "../services/stripe.js";
import { logTransaction, getTransactions } from "../services/transactionLog.js";

const router = Router();

export const PLANS = {
  basic: { label: "Black Vision Basic", amount: 49_700, currency: "BRL", type: "one_time" },
  advanced: { label: "Black Vision Advanced", amount: 150_000, currency: "BRL", type: "one_time" },
  pro: { label: "Black Vision Pro", amount: null, currency: "BRL", type: "custom" },
};

function checkoutContext(body) {
  const { tier, method, customerEmail, customerName, customerPhone, checkoutRequestId } = body || {};
  const plan = PLANS[tier];
  if (!plan) return { error: `Plano inválido: ${tier}`, status: 400 };
  if (!plan.amount) return { error: "Este plano exige proposta personalizada", status: 422 };
  if (!["card", "boleto"].includes(method)) {
    return { error: "method deve ser card ou boleto para Stripe", status: 400 };
  }
  if (!String(customerEmail || "").trim()) return { error: "customerEmail é obrigatório", status: 400 };

  const baseUrl = process.env.FRONTEND_URL || "https://blackvision.com.br";
  return {
    tier,
    method,
    plan,
    customerEmail: String(customerEmail).trim().toLowerCase(),
    payload: {
      plan,
      tier,
      method,
      checkoutRequestId: String(checkoutRequestId || randomUUID()),
      customer: {
        email: String(customerEmail).trim().toLowerCase(),
        name: String(customerName || "").trim(),
        phone: String(customerPhone || "").trim(),
      },
      successUrl: `${baseUrl}/checkout/success?plan=${encodeURIComponent(tier)}`,
      failureUrl: `${baseUrl}/checkout/failure?plan=${encodeURIComponent(tier)}`,
    },
  };
}

async function startStripeCheckout(context) {
  const result = await createStripeCheckout(context.payload);
  await logTransaction({
    tier: context.tier,
    gateway: "stripe",
    method: context.method,
    status: "pending",
    amount: context.plan.amount,
    currency: context.plan.currency,
    customerEmail: context.customerEmail,
    sessionId: result.sessionId,
  });
  return result;
}

router.post("/create", async (req, res) => {
  const { tier, customerEmail, customerName, customerPhone, customerCpf, method } = req.body || {};
  const plan = PLANS[tier];
  if (!plan) return res.status(400).json({ message: `Plano inválido: ${tier}` });
  if (!plan.amount) return res.status(422).json({ message: "Este plano exige proposta personalizada" });
  if (!customerEmail) return res.status(400).json({ message: "customerEmail é obrigatório" });
  if (method !== "pix") {
    return res.status(400).json({ message: "Mercado Pago é utilizado somente para PIX" });
  }

  try {
    const result = await createMPDirectPayment({
      plan,
      tier,
      method: "pix",
      cpf: customerCpf,
      customer: {
        email: String(customerEmail).trim().toLowerCase(),
        name: String(customerName || "").trim(),
        phone: String(customerPhone || "").trim(),
      },
    });
    await logTransaction({
      tier,
      gateway: "mercadopago",
      method: "pix",
      status: "pending",
      amount: plan.amount,
      currency: plan.currency,
      customerEmail: String(customerEmail).trim().toLowerCase(),
      sessionId: String(result.paymentId),
    });
    return res.json({ ...result, provider: "mercadopago" });
  } catch (error) {
    console.error("[PIX create]", error.message);
    await logTransaction({
      tier,
      gateway: "mercadopago",
      method: "pix",
      status: "error",
      customerEmail: String(customerEmail).trim().toLowerCase(),
      error: error.message,
    });
    return res.status(500).json({ message: error.message });
  }
});

router.post("/checkout", async (req, res) => {
  const context = checkoutContext(req.body);
  if (context.error) return res.status(context.status).json({ message: context.error });
  try {
    return res.json(await startStripeCheckout(context));
  } catch (error) {
    console.error("[Stripe checkout]", { type: error?.type, code: error?.code, message: error?.message });
    await logTransaction({
      tier: context.tier,
      gateway: "stripe",
      method: context.method,
      status: "error",
      customerEmail: context.customerEmail,
      error: error.message,
    });
    const status = error?.statusCode && error.statusCode < 500 ? 422 : 500;
    return res.status(status).json({ message: "Não foi possível abrir o checkout da Stripe" });
  }
});

router.post("/checkout/redirect", async (req, res) => {
  const context = checkoutContext(req.body);
  const baseUrl = process.env.FRONTEND_URL || "https://blackvision.com.br";
  if (context.error) {
    return res.redirect(303, `${baseUrl}/checkout/failure?plan=${encodeURIComponent(req.body?.tier || "basic")}`);
  }
  try {
    const result = await startStripeCheckout(context);
    return res.redirect(303, result.checkoutUrl);
  } catch (error) {
    console.error("[Stripe redirect]", error.message);
    return res.redirect(303, `${baseUrl}/checkout/failure?plan=${encodeURIComponent(context.tier)}`);
  }
});

router.get("/status/:id", async (req, res) => {
  const id = String(req.params.id || "");
  try {
    const result = id.startsWith("cs_") || id.startsWith("pi_")
      ? await getStripeStatus(id)
      : /^\d+$/.test(id)
        ? await getMPStatus(id)
        : null;
    if (!result) return res.status(400).json({ status: "unknown", message: "Identificador inválido" });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ status: "unknown", message: error.message });
  }
});

router.post("/cancel", requireAdmin, async (req, res) => {
  const { subscriptionId } = req.body || {};
  if (!subscriptionId) return res.status(400).json({ message: "subscriptionId obrigatório" });
  try {
    return res.json(await cancelStripeSubscription(subscriptionId));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/transactions", requireAdmin, async (req, res) => {
  return res.json(await getTransactions(Number(req.query.limit) || 100));
});

export default router;
