/**
 * Webhooks Stripe e Mercado Pago com validação de assinatura.
 */

import { Router } from "express";
import { processStripeWebhook } from "../services/stripe.js";
import { getMPStatus, processMPWebhook } from "../services/mercadopago.js";
import { updateTransactionStatus } from "../services/transactionLog.js";

const router = Router();

function parseRawJson(body) {
  if (Buffer.isBuffer(body)) return JSON.parse(body.toString("utf8"));
  if (body && typeof body === "object") return body;
  throw new Error("Payload JSON inválido");
}

router.post("/stripe", async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature) return res.status(400).json({ message: "stripe-signature ausente" });

  let event;
  try {
    event = processStripeWebhook(req.body, signature);
  } catch (error) {
    console.warn("[Stripe webhook] assinatura inválida", { message: error.message });
    return res.status(400).json({ message: "Assinatura Stripe inválida" });
  }

  try {
    const session = event.data.object;
    if (event.type === "checkout.session.completed") {
      await updateTransactionStatus(
        session.id,
        session.payment_status === "paid" ? "approved" : "pending",
        { eventId: event.id, paymentIntent: session.payment_intent, paymentStatus: session.payment_status }
      );
    } else if (event.type === "checkout.session.async_payment_succeeded") {
      await updateTransactionStatus(session.id, "approved", {
        eventId: event.id,
        paymentIntent: session.payment_intent,
      });
    } else if (event.type === "checkout.session.async_payment_failed") {
      await updateTransactionStatus(session.id, "rejected", { eventId: event.id });
    } else if (event.type === "checkout.session.expired") {
      await updateTransactionStatus(session.id, "cancelled", { eventId: event.id });
    }
    return res.json({ received: true });
  } catch (error) {
    console.error("[Stripe webhook] processamento falhou", { eventId: event.id, message: error.message });
    return res.status(500).json({ message: "Falha ao processar evento Stripe" });
  }
});

router.get("/mercadopago", (_req, res) => {
  return res.json({ received: true, provider: "mercadopago", method: "pix" });
});

router.post("/mercadopago", (req, res) => {
  let body;
  let event;
  try {
    body = parseRawJson(req.body);
    const dataId = req.query["data.id"] || body.data?.id;
    event = processMPWebhook({
      body,
      dataId,
      xSignature: req.headers["x-signature"],
      xRequestId: req.headers["x-request-id"],
    });
  } catch (error) {
    console.warn("[Mercado Pago webhook] assinatura inválida", { message: error.message });
    return res.status(401).json({ message: "Assinatura Mercado Pago inválida" });
  }

  res.status(200).json({ received: true });

  queueMicrotask(async () => {
    try {
      if (event.type !== "payment" && event.action !== "payment.updated") return;
      const result = await getMPStatus(event.id);
      await updateTransactionStatus(String(event.id), result.status, {
        provider: "mercadopago",
        method: "pix",
        ...result.detail,
      });
    } catch (error) {
      console.error("[Mercado Pago webhook] processamento falhou", { id: event.id, message: error.message });
    }
  });
});

export default router;
