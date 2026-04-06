/**
 * routes/webhooks.js
 * POST /api/webhooks/stripe
 * POST /api/webhooks/mercadopago
 *
 * IMPORTANTE: o body chega como Buffer (raw) — ver server.js
 */

import { Router } from "express";
import { processStripeWebhook }  from "../services/stripe.js";
import { processMPWebhook }      from "../services/mercadopago.js";
import { updateTransactionStatus } from "../services/transactionLog.js";

const router = Router();

/* ─── Stripe Webhook ─────────────────────────────────────── */
router.post("/stripe", async (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).json({ message: "stripe-signature ausente" });
  }

  let event;
  try {
    event = await processStripeWebhook(req.body, signature);
  } catch (err) {
    console.error("[Webhook Stripe] Verificação falhou:", err.message);
    return res.status(400).json({ message: err.message });
  }

  console.log(`[Webhook Stripe] ${event.type}`);

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object;
        await updateTransactionStatus(session.id, "approved", {
          paymentIntent: session.payment_intent,
          customerEmail: session.customer_email,
          amount:        session.amount_total,
        });
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        await updateTransactionStatus(session.id, "cancelled");
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        await updateTransactionStatus(pi.id, "rejected", {
          failureMessage: pi.last_payment_error?.message,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await updateTransactionStatus(sub.id, "cancelled", { reason: sub.cancellation_details?.reason });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        console.log(`[Stripe] Invoice pago: ${invoice.id} — R$${(invoice.amount_paid / 100).toFixed(2)}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.warn(`[Stripe] Invoice falhou: ${invoice.id}`);
        break;
      }

      default:
        // Evento não tratado — ignora silenciosamente
        break;
    }
  } catch (err) {
    console.error("[Webhook Stripe] Handler error:", err.message);
    // Retorna 200 mesmo assim para o Stripe não retentar
  }

  res.json({ received: true });
});

/* ─── Mercado Pago Webhook ───────────────────────────────── */
router.post("/mercadopago", async (req, res) => {
  const signature = req.headers["x-signature"];
  let body;

  try {
    body = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ message: "Body inválido" });
  }

  let event;
  try {
    event = await processMPWebhook(body, signature);
  } catch (err) {
    console.error("[Webhook MP] Verificação falhou:", err.message);
    return res.status(400).json({ message: err.message });
  }

  console.log(`[Webhook MP] type=${event.type} action=${event.action} id=${event.id}`);

  try {
    if (event.type === "payment") {
      // Busca status real do pagamento
      const { getMPStatus } = await import("../services/mercadopago.js");
      const statusResult = await getMPStatus(event.id);

      await updateTransactionStatus(String(event.id), statusResult.status, statusResult.detail);
    }

    if (event.type === "subscription_authorized_payment") {
      console.log(`[MP] Cobrança de assinatura: ${event.id}`);
    }

    if (event.action === "payment.updated") {
      const { getMPStatus } = await import("../services/mercadopago.js");
      const statusResult = await getMPStatus(event.id);
      await updateTransactionStatus(String(event.id), statusResult.status, statusResult.detail);
    }

  } catch (err) {
    console.error("[Webhook MP] Handler error:", err.message);
    // Retorna 200 para o MP não retentar
  }

  res.json({ received: true });
});

export default router;
