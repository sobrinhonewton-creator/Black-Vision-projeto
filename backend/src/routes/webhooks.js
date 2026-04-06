/**
 * routes/webhooks.js
 */

import { Router } from "express";
import { processStripeWebhook }    from "../services/stripe.js";
import { processMPWebhook }        from "../services/mercadopago.js";
import { updateTransactionStatus } from "../services/transactionLog.js";

const router = Router();

/* ─── Stripe ─────────────────────────────────────────────── */
router.post("/stripe", async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature) return res.status(400).json({ message: "stripe-signature ausente" });

  let event;
  try {
    event = await processStripeWebhook(req.body, signature);
  } catch (err) {
    console.error("[Webhook Stripe] Verificação falhou:", err.message);
    return res.status(400).json({ message: err.message });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        await updateTransactionStatus(s.id, "approved", {
          paymentIntent: s.payment_intent,
          customerEmail: s.customer_email,
          amount: s.amount_total,
        });
        break;
      }
      case "checkout.session.expired":
        await updateTransactionStatus(event.data.object.id, "cancelled");
        break;
      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        await updateTransactionStatus(pi.id, "rejected", {
          failureMessage: pi.last_payment_error?.message,
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await updateTransactionStatus(sub.id, "cancelled", {
          reason: sub.cancellation_details?.reason,
        });
        break;
      }
    }
  } catch (err) {
    console.error("[Webhook Stripe] Handler error:", err.message);
  }

  res.json({ received: true });
});

/* ─── Mercado Pago — GET (validação do painel) ───────────── */
router.get("/mercadopago", (req, res) => {
  console.log("[Webhook MP] GET validação:", req.query);
  res.status(200).json({ received: true });
});

/* ─── Mercado Pago — POST (notificações reais) ───────────── */
router.post("/mercadopago", async (req, res) => {
  // Responde 200 IMEDIATAMENTE — o MP considera falha se demorar > 5s
  // e reenvia até 3x se receber != 200
  res.status(200).json({ received: true });

  // Processa de forma assíncrona após responder
  try {
    const signature = req.headers["x-signature"];

    // Body pode chegar como Buffer (raw) ou já parseado (json)
    let body;
    if (Buffer.isBuffer(req.body)) {
      const raw = req.body.toString("utf8");
      if (!raw || raw.trim() === "") {
        console.log("[Webhook MP] Body vazio — provavelmente teste do painel");
        return;
      }
      body = JSON.parse(raw);
    } else if (req.body && typeof req.body === "object") {
      body = req.body;
    } else {
      console.log("[Webhook MP] Body inválido:", req.body);
      return;
    }

    console.log("[Webhook MP] Recebido:", JSON.stringify(body));

    const event = await processMPWebhook(body, signature);
    console.log(`[Webhook MP] type=${event.type} action=${event.action} id=${event.id}`);

    if (event.type === "payment" || event.action === "payment.updated") {
      const { getMPStatus } = await import("../services/mercadopago.js");
      const statusResult = await getMPStatus(event.id);
      await updateTransactionStatus(String(event.id), statusResult.status, statusResult.detail);
      console.log(`[Webhook MP] Transação ${event.id} → ${statusResult.status}`);
    }

    if (event.type === "subscription_authorized_payment") {
      console.log(`[MP] Cobrança de assinatura: ${event.id}`);
    }

  } catch (err) {
    console.error("[Webhook MP] Erro interno:", err.message);
    // Não afeta o 200 já enviado
  }
});

export default router;
