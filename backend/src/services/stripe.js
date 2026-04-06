/**
 * services/stripe.js
 * Integração com Stripe SDK
 *
 * CORREÇÃO: getStripe() era sync mas usava await — convertida para async.
 */

import Stripe from "stripe";

async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith("sk_live_xxx")) throw new Error("STRIPE_SECRET_KEY não configurado");
  return new Stripe(key, { apiVersion: "2024-04-10" });
}

/**
 * Cria Checkout Session (hosted page)
 */
export async function createStripeCheckout({ plan, tier, customer, successUrl, failureUrl }) {
  const stripe = await getStripe();

  const session = await stripe.checkout.sessions.create({
    mode:               plan.type === "subscription" ? "subscription" : "payment",
    customer_email:     customer.email,
    success_url:        successUrl + "&session_id={CHECKOUT_SESSION_ID}",
    cancel_url:         failureUrl,
    metadata:           { tier, customerName: customer.name || "", customerPhone: customer.phone || "" },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency:     "brl",
          unit_amount:  plan.amount || 100, // centavos
          product_data: {
            name:        plan.label,
            description: `Plano ${tier} — Black Vision`,
          },
          ...(plan.type === "subscription"
            ? { recurring: { interval: "month" } }
            : {}),
        },
      },
    ],
    payment_method_types: ["card"],
    locale:               "pt-BR",
  });

  return {
    sessionId:   session.id,
    checkoutUrl: session.url,
  };
}

/**
 * Busca status de uma session ou payment_intent
 */
export async function getStripeStatus(id) {
  const stripe = await getStripe();

  try {
    let status = "unknown";
    let detail = {};

    if (id.startsWith("cs_")) {
      const session = await stripe.checkout.sessions.retrieve(id);
      const statusMap = { complete: "approved", expired: "cancelled", open: "pending" };
      status = statusMap[session.status] || session.status;
      detail = {
        id:            session.id,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_email,
        amount:        session.amount_total,
        currency:      session.currency,
      };
    } else if (id.startsWith("pi_")) {
      const pi = await stripe.paymentIntents.retrieve(id);
      const statusMap = { succeeded: "approved", canceled: "cancelled" };
      status = statusMap[pi.status] || pi.status;
      detail = { id: pi.id, amount: pi.amount, currency: pi.currency };
    }

    return { status, detail };
  } catch (err) {
    return { status: "unknown", detail: { error: err.message } };
  }
}

/**
 * Cancela assinatura Stripe
 */
export async function cancelStripeSubscription(subscriptionId) {
  const stripe = await getStripe();
  const sub    = await stripe.subscriptions.cancel(subscriptionId);
  return { cancelled: true, status: sub.status, id: sub.id };
}

/**
 * Verifica e processa webhook Stripe
 */
export async function processStripeWebhook(rawBody, signature) {
  const stripe  = await getStripe();
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET não configurado");

  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  return event;
}
