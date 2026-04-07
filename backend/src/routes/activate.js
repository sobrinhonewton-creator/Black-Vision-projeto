/**
 * routes/activate.js
 * GET /api/activate   — cria preferência MP de R$1 para ativar conta de produção
 * Deletar esta rota após o primeiro pagamento real ser confirmado.
 */

import { Router } from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
      options: { timeout: 10000 },
    });

    const preference = new Preference(client);
    const baseUrl    = process.env.FRONTEND_URL || "https://blackvision.com.br";

    const result = await preference.create({
      body: {
        items: [{
          id:          "ativacao",
          title:       "Black Vision — Ativação de Conta",
          quantity:    1,
          unit_price:  1.00,   // R$1,00
          currency_id: "BRL",
        }],
        payer: { email: "ativacao@blackvision.com.br" },
        back_urls: {
          success: `${baseUrl}/checkout/success?plan=basic`,
          failure: `${baseUrl}/checkout/failure?plan=basic`,
          pending: `${baseUrl}/checkout/success?plan=basic&status=pending`,
        },
        auto_return:          "approved",
        statement_descriptor: "BLACK VISION",
        external_reference:   `ativacao_${Date.now()}`,
      },
    });

    // Redireciona direto para o checkout
    res.redirect(result.init_point);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
