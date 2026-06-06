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

import { randomUUID } from "crypto";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

function getClient() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN não configurado no .env");
  return new MercadoPagoConfig({ accessToken: token, options: { timeout: 10000 } });
}

function parseBRPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  const local = digits.length === 13 && digits.startsWith("55")
    ? digits.slice(2)
    : digits.length === 12 && digits.startsWith("55")
      ? digits.slice(2)
      : digits;
  if (local.length < 10) return null;
  return {
    area_code: local.slice(0, 2),
    number:    local.slice(2),
  };
}

export async function createMPCheckout({ plan, tier, customer, successUrl, failureUrl, pendingUrl }) {
  const client     = getClient();
  const preference = new Preference(client);
  const phone      = parseBRPhone(customer.phone);

  // O MP injeta automaticamente no redirect:
  // ?collection_id=X&payment_id=X&status=approved&external_reference=X
  // NÃO adicione {{payment.id}} — o MP rejeita e invalida o auto_return
  const body = {
    items: [{
      id:          tier,
      title:       plan.label,
      description: plan.label,
      category_id: "services",
      quantity:    1,
      unit_price:  plan.amount ? plan.amount / 100 : 1,
      currency_id: "BRL",
    }],
    payer: {
      email: customer.email,
      ...(customer.name ? { name: customer.name.split(" ")[0], surname: customer.name.split(" ").slice(1).join(" ") || customer.name } : {}),
      ...(phone ? { phone } : {}),
    },
    payment_methods: {
      excluded_payment_methods: [],
      excluded_payment_types:     [],
      installments:               12,
    },
    back_urls: {
      success: successUrl,
      failure: failureUrl,
      pending: pendingUrl || successUrl,
    },
    auto_return:          "approved",
    statement_descriptor: "BLACK VISION",
    external_reference:   `bv_${tier}_${Date.now()}`,
    notification_url:     `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
    expires:              false,
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

const MP_METHODS = {
  pix:    "pix",
  boleto: "bolbradesco",
};

function mpErrorMessage(err) {
  const cause = err?.cause?.[0];
  return cause?.description || cause?.message || err?.message || "Erro no Mercado Pago";
}

function buildPayer(customer, cpf) {
  const phone = parseBRPhone(customer.phone);
  const parts = String(customer.name || "").trim().split(/\s+/);
  const doc   = String(cpf || "").replace(/\D/g, "");

  return {
    email:      customer.email,
    first_name: parts[0] || "Cliente",
    last_name:  parts.slice(1).join(" ") || parts[0] || "Black Vision",
    ...(phone ? { phone } : {}),
    ...(doc.length === 11 ? { identification: { type: "CPF", number: doc } } : {}),
  };
}

/**
 * PIX ou Boleto via Payments API — QR/código gerado no nosso site (sem redirect MP).
 * @param {'pix'|'boleto'} method
 */
export async function createMPDirectPayment({ plan, tier, customer, method, cpf }) {
  const paymentMethodId = MP_METHODS[method];
  if (!paymentMethodId) throw new Error(`Método inválido: ${method}`);
  if (!plan?.amount) throw new Error("Plano sem valor definido");

  const client  = getClient();
  const payment = new Payment(client);
  const payer   = buildPayer(customer, cpf);

  if (!payer.identification) {
    throw new Error("CPF é obrigatório para PIX e Boleto");
  }

  const body = {
    transaction_amount: plan.amount / 100,
    description:        plan.label,
    payment_method_id:  paymentMethodId,
    payer,
    external_reference: `bv_${tier}_${Date.now()}`,
    notification_url:   `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
  };

  try {
    const result = await payment.create({
      body,
      requestOptions: { idempotencyKey: randomUUID() },
    });

    const tx = result.point_of_interaction?.transaction_data || {};

    return {
      paymentId:    result.id,
      status:       result.status,
      method,
      amount:       result.transaction_amount,
      qrCode:       tx.qr_code || null,
      qrCodeBase64: tx.qr_code_base64 || null,
      ticketUrl:    tx.ticket_url || result.transaction_details?.external_resource_url || null,
      expiresAt:    result.date_of_expiration || null,
    };
  } catch (err) {
    throw new Error(mpErrorMessage(err));
  }
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
