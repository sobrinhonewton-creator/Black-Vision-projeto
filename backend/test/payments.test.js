import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { buildStripeCheckoutParams } from "../src/services/stripe.js";
import { processMPWebhook } from "../src/services/mercadopago.js";

const baseInput = {
  plan: { label: "Black Vision Basic", amount: 49_700 },
  tier: "basic",
  customer: { email: "cliente@example.com", name: "Cliente Teste", phone: "73999999999" },
  successUrl: "https://blackvision.com.br/checkout/success?plan=basic",
  failureUrl: "https://blackvision.com.br/checkout/failure?plan=basic",
};

test("Stripe Checkout separa cartao e boleto em BRL", () => {
  const card = buildStripeCheckoutParams({ ...baseInput, method: "card" });
  assert.deepEqual(card.payment_method_types, ["card"]);
  assert.equal(card.line_items[0].price_data.currency, "brl");
  assert.equal(card.line_items[0].price_data.unit_amount, 49_700);
  assert.equal(card.payment_method_options, undefined);

  const boleto = buildStripeCheckoutParams({ ...baseInput, method: "boleto" });
  assert.deepEqual(boleto.payment_method_types, ["boleto"]);
  assert.equal(boleto.billing_address_collection, "required");
  assert.equal(boleto.tax_id_collection.enabled, true);
  assert.equal(boleto.payment_method_options.boleto.expires_after_days, 3);
  assert.match(boleto.success_url, /\{CHECKOUT_SESSION_ID\}/);
});

test("webhook Mercado Pago valida assinatura oficial", () => {
  const previousSecret = process.env.MP_WEBHOOK_SECRET;
  const secret = "webhook-test-secret";
  const dataId = "123456789";
  const xRequestId = "request-test-id";
  const ts = String(Date.now());
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const signature = createHmac("sha256", secret).update(manifest).digest("hex");
  process.env.MP_WEBHOOK_SECRET = secret;

  try {
    const event = processMPWebhook({
      body: { type: "payment", action: "payment.updated", data: { id: dataId } },
      dataId,
      xRequestId,
      xSignature: `ts=${ts},v1=${signature}`,
    });
    assert.equal(event.id, dataId);
    assert.throws(() => processMPWebhook({
      body: { type: "payment", action: "payment.updated", data: { id: dataId } },
      dataId,
      xRequestId,
      xSignature: `ts=${ts},v1=invalid`,
    }));
  } finally {
    if (previousSecret === undefined) delete process.env.MP_WEBHOOK_SECRET;
    else process.env.MP_WEBHOOK_SECRET = previousSecret;
  }
});
