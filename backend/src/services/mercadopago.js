/**
 * services/mercadopago.js
 * Mercado Pago SDK v2 — produção
 *
 * CORREÇÕES:
 *  1. Import correto: MercadoPagoConfig (não MercadoPago default)
 *  2. back_urls.success sem {{payment.id}} — MP rejeita handlebars e invalida auto_return
 *  3. checkoutUrl sempre usa init_point (produção) — não depende de NODE_ENV
 *  4. notification_url usa BACKEND_URL do .env
 */

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

function getClient() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN não configurado no .env");
  return new MercadoPagoConfig({ accessToken: token, options: { timeout: 10000 } });
}

export async function createMPCheckout({ plan, tier, customer, successUrl, failureUrl }) {
  const client     = getClient();
  const preference = new Preference(client);

  // O MP injeta automaticamente no redirect:
  // ?collection_id=X&payment_id=X&status=approved&external_reference=X
  // NÃO adicione {{payment.id}} — o MP rejeita e invalida o auto_return
  const body = {
    items: [{
      id:          tier,
      title:       plan.label,
      quantity:    1,
      unit_price:  plan.amount ? plan.amount / 100 : 1,
      currency_id: "BRL",
    }],
    payer: {
      email: customer.email,
      ...(customer.name  ? { name: customer.name }  : {}),
      ...(customer.phone ? { phone: { number: customer.phone.replace(/\D/g, "") } } : {}),
    },
    back_urls: {
      success: successUrl,                     // ← URL limpa, sem template
      failure: failureUrl,
      pending: successUrl + "&status=pending",
    },
    auto_return:          "approved",
    statement_descriptor: "BLACK VISION",
    external_reference:   `bv_${tier}_${Date.now()}`,
    notification_url:     `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
    expires:              true,
    expiration_date_from: new Date().toISOString(),
    expiration_date_to:   new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const result = await preference.create({ body });

  const isTestToken = process.env.MP_ACCESS_TOKEN?.startsWith("TEST-");
  const urlToUse = isTestToken ? result.sandbox_init_point : result.init_point;

  return {
    preferenceId: result.id,
    initPoint:    result.init_point,
    sandboxUrl:   result.sandbox_init_point,
    checkoutUrl:  urlToUse,
  };
}

export async function getMPStatus(paymentId) {
  const client  = getClient();
  const payment = new Payment(client);
  try {
    const result = await payment.get({ id: paymentId });
    const statusMap = {
      approved: "approved", pending: "pending", rejected: "rejected",
      refunded: "refunded", cancelled: "cancelled", in_process: "pending",
    };
    return {
      status: statusMap[result.status] || result.status,
      detail: {
        id: result.id, status: result.status, statusDetail: result.status_detail,
        paymentMethod: result.payment_method_id, amount: result.transaction_amount,
        payer: result.payer?.email, externalRef: result.external_reference,
        approvedAt: result.date_approved,
      },
    };
  } catch (err) {
    return { status: "unknown", detail: { error: err.message } };
  }
}

export async function processMPWebhook(body, signature) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (secret && signature) {
    const { default: crypto } = await import("crypto");
    const parts = Object.fromEntries(signature.split(",").map(p => p.split("=")));
    if (parts.ts && parts.v1) {
      const msg      = `id:${body.data?.id};request-id:${body.action};ts:${parts.ts};`;
      const expected = crypto.createHmac("sha256", secret).update(msg).digest("hex");
      if (expected !== parts.v1) throw new Error("Webhook signature inválida");
    }
  }
  return { type: body.type, action: body.action, id: body.data?.id };
}
