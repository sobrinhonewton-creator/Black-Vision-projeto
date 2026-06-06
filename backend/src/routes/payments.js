/**
 * routes/payments.js
 * POST /api/payments/checkout
 * GET  /api/payments/status/:id
 * POST /api/payments/cancel
 */

import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { createMPCheckout, createMPDirectPayment, getMPStatus } from "../services/mercadopago.js";
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

function buildCheckoutPayload(body) {
  const { tier, customerEmail, customerName, customerPhone, gateway: reqGateway } = body || {};
  const gw   = reqGateway || GATEWAY;
  const plan = PLANS[tier];

  if (!plan) return { error: `Plano inválido: ${tier}`, status: 400 };
  if (!customerEmail) return { error: "customerEmail é obrigatório", status: 400 };

  const baseUrl    = process.env.FRONTEND_URL || "https://blackvision.com.br";
  const successUrl = `${baseUrl}/checkout/success?plan=${tier}`;
  const failureUrl = `${baseUrl}/checkout/failure?plan=${tier}`;
  const pendingUrl = `${baseUrl}/checkout/success?plan=${tier}&status=pending`;

  return {
    gw,
    plan,
    tier,
    customerEmail,
    payload: {
      plan,
      tier,
      customer: { email: customerEmail, name: customerName, phone: customerPhone },
      successUrl,
      failureUrl,
      pendingUrl,
    },
  };
}

async function runCheckout({ gw, plan, tier, customerEmail, payload }) {
  let result;

  if (gw === "stripe") {
    result = await createStripeCheckout(payload);
  } else {
    result = await createMPCheckout(payload);
  }

  await logTransaction({
    tier, gateway: gw, status: "pending",
    amount: plan.amount, currency: plan.currency,
    customerEmail,
    sessionId: result.sessionId || result.preferenceId,
  });

  return result;
}

function normalizeAddress(address) {
  const raw = address || {};
  return {
    zip_code: String(raw.zip_code || raw.zip || raw.cep || "").replace(/\D/g, "").trim(),
    street_name: String(raw.street_name || raw.street || raw.logradouro || "").trim(),
    street_number: String(raw.street_number || raw.number || raw.numero || "").trim(),
    neighborhood: String(raw.neighborhood || raw.district || raw.bairro || "").trim(),
    city: String(raw.city || raw.locality || raw.cidade || "").trim(),
    federal_unit: String(raw.federal_unit || raw.state || raw.uf || "").trim().toUpperCase(),
  };
}

function getMissingAddressFields(address) {
  const required = ["zip_code", "street_name", "street_number", "neighborhood", "city", "federal_unit"];
  return required.filter((key) => !String(address[key] || "").trim());
}

/* POST /api/payments/create — PIX / Boleto nativo (sem redirect MP) */
router.post("/create", async (req, res) => {
  const {
    tier,
    customerEmail,
    customerName,
    customerPhone,
    customerCpf,
    method,
    customerAddress,
    address,
    customer_address,
  } = req.body || {};

  const plan = PLANS[tier];
  if (!plan) return res.status(400).json({ message: `Plano inválido: ${tier}` });
  if (!customerEmail) return res.status(400).json({ message: "customerEmail é obrigatório" });
  if (!["pix", "boleto"].includes(method)) {
    return res.status(400).json({ message: "method deve ser pix ou boleto" });
  }

  const normalizedAddress = normalizeAddress(customerAddress || address || customer_address || {});

  if (method === "boleto") {
    const missing = getMissingAddressFields(normalizedAddress);
    if (missing.length) {
      return res.status(400).json({
        message: `Boleto registrado exige endereço completo: ${missing.join(", ")}`,
        missing,
      });
    }
  }

  const customer = {
    email: customerEmail,
    name: customerName,
    phone: customerPhone,
    address: normalizedAddress,
  };

  try {
    const result = await createMPDirectPayment({ plan, tier, customer, method, cpf: customerCpf });

    await logTransaction({
      tier, gateway: "mercadopago", status: "pending",
      amount: plan.amount, currency: plan.currency,
      customerEmail,
      sessionId: String(result.paymentId),
    });

    res.json(result);
  } catch (err) {
    console.error("[Payment create]", err.message);

    await logTransaction({
      tier, gateway: "mercadopago", status: "error",
      customerEmail, error: err.message,
    });

    res.status(500).json({ message: err.message });
  }
});

/* POST /api/payments/checkout */
router.post("/checkout", async (req, res) => {
  const built = buildCheckoutPayload(req.body);
  if (built.error) return res.status(built.status).json({ message: built.error });

  const { gw, plan, tier, customerEmail, payload } = built;

  try {
    const result = await runCheckout({ gw, plan, tier, customerEmail, payload });
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

/* POST /api/payments/checkout/redirect — redirect HTTP 303 direto ao MP (sem JS no front) */
router.post("/checkout/redirect", async (req, res) => {
  const built = buildCheckoutPayload(req.body);
  if (built.error) {
    const base = process.env.FRONTEND_URL || "https://blackvision.com.br";
    return res.redirect(303, `${base}/checkout/failure?plan=${req.body?.tier || "basic"}&error=${encodeURIComponent(built.error)}`);
  }

  const { gw, plan, tier, customerEmail, payload } = built;

  try {
    const result = await runCheckout({ gw, plan, tier, customerEmail, payload });
    const mpUrl    = result.checkoutUrl || result.initPoint || result.sessionId;
    if (!mpUrl) throw new Error("URL de checkout não retornada pelo gateway");
    return res.redirect(303, mpUrl);
  } catch (err) {
    console.error("[Payment checkout/redirect]", err.message);

    await logTransaction({
      tier, gateway: gw, status: "error",
      customerEmail, error: err.message,
    });

    const base = process.env.FRONTEND_URL || "https://blackvision.com.br";
    return res.redirect(303, `${base}/checkout/failure?plan=${tier}&error=${encodeURIComponent(err.message)}`);
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
