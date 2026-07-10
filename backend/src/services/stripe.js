/**
 * Stripe Checkout — cartão e boleto da Black Vision.
 */

import Stripe from "stripe";

let stripeInstance;

function getStripe() {
  const key = String(process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurado");
  if (!stripeInstance) {
    stripeInstance = new Stripe(key, { maxNetworkRetries: 2, timeout: 12_000 });
  }
  return stripeInstance;
}

export function checkoutIdempotencyKey({ checkoutRequestId }) {
  const requestId = String(checkoutRequestId || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
  if (!requestId) throw new Error("checkoutRequestId é obrigatório");
  return `blackvision-checkout-${requestId}`;
}

export function buildStripeCheckoutParams({ plan, tier, method, customer, successUrl, failureUrl }) {
  if (!plan?.amount) throw new Error("Plano sem valor definido");
  if (!["card", "boleto"].includes(method)) throw new Error("Método Stripe inválido");

  const metadata = {
    product: "Black Vision",
    tier,
    payment_method: method,
    customer_name: String(customer.name || "").slice(0, 120),
    customer_phone: String(customer.phone || "").slice(0, 40),
  };

  return {
    mode: "payment",
    customer_email: customer.email,
    client_reference_id: `blackvision:${tier}`,
    success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: failureUrl,
    locale: "pt-BR",
    payment_method_types: [method],
    billing_address_collection: method === "boleto" ? "required" : "auto",
    phone_number_collection: { enabled: true },
    tax_id_collection: { enabled: method === "boleto" },
    ...(method === "boleto"
      ? { payment_method_options: { boleto: { expires_after_days: 3 } } }
      : {}),
    metadata,
    payment_intent_data: { metadata },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "brl",
          unit_amount: plan.amount,
          product_data: {
            name: plan.label,
            description: `Plano ${tier} — Black Vision`,
            metadata: { tier },
          },
        },
      },
    ],
  };
}

export async function createStripeCheckout(input) {
  const stripe = getStripe();
  const params = buildStripeCheckoutParams(input);
  const session = await stripe.checkout.sessions.create(params, {
    idempotencyKey: checkoutIdempotencyKey(input),
  });
  return { sessionId: session.id, checkoutUrl: session.url, provider: "stripe" };
}

export async function getStripeStatus(id) {
  const stripe = getStripe();
  if (id.startsWith("cs_")) {
    const session = await stripe.checkout.sessions.retrieve(id);
    const status = session.payment_status === "paid"
      ? "approved"
      : session.status === "expired"
        ? "cancelled"
        : "pending";
    return {
      status,
      detail: {
        id: session.id,
        paymentStatus: session.payment_status,
        sessionStatus: session.status,
        customerEmail: session.customer_details?.email || session.customer_email,
        amount: session.amount_total,
        currency: session.currency,
      },
    };
  }
  if (id.startsWith("pi_")) {
    const paymentIntent = await stripe.paymentIntents.retrieve(id);
    const statusMap = { succeeded: "approved", canceled: "cancelled", processing: "pending" };
    return {
      status: statusMap[paymentIntent.status] || paymentIntent.status,
      detail: { id: paymentIntent.id, amount: paymentIntent.amount, currency: paymentIntent.currency },
    };
  }
  throw new Error("Identificador Stripe inválido");
}

export async function cancelStripeSubscription(subscriptionId) {
  const subscription = await getStripe().subscriptions.cancel(subscriptionId);
  return { cancelled: true, status: subscription.status, id: subscription.id };
}

export function processStripeWebhook(rawBody, signature) {
  const secret = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET não configurado");
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}
