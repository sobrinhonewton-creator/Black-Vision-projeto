# Black Vision — operação de produção

## Arquitetura de pagamentos

- Cartão: Stripe Checkout.
- Boleto: Stripe Checkout, com confirmação assíncrona por webhook.
- PIX: Mercado Pago Payments API, com QR Code exibido no site.
- O endpoint legado `/api/activate` foi removido.

O frontend não escolhe mais o gateway por variável. O método define o provedor no backend:

- `POST /api/payments/checkout` aceita `card` ou `boleto` e usa Stripe.
- `POST /api/payments/create` aceita apenas `pix` e usa Mercado Pago.
- `GET /api/payments/status/:id` identifica o provedor pelo formato do ID.

## Webhooks

### Stripe

URL:

```text
https://black-vision-backend-production.up.railway.app/api/webhooks/stripe
```

Eventos necessários:

- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

Boleto não deve liberar entrega em `checkout.session.completed` quando `payment_status` ainda for `unpaid`. A aprovação definitiva vem de `checkout.session.async_payment_succeeded`.

### Mercado Pago

URL:

```text
https://black-vision-backend-production.up.railway.app/api/webhooks/mercadopago
```

O webhook valida `x-signature`, `x-request-id` e `data.id` com o validador oficial do SDK.

## Autenticação administrativa

- Algoritmo: bcrypt, custo 12.
- Variável: `ADMIN_PASSWORD_BCRYPT_HASH`.
- Não existe senha fallback no código.
- A variável SHA-256 antiga deve permanecer removida.

## Variáveis obrigatórias no Railway

```text
ADMIN_EMAIL
ADMIN_PASSWORD_BCRYPT_HASH
JWT_SECRET
FRONTEND_URL
BACKEND_URL
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_WEBHOOK_ENDPOINT_ID
MP_ACCESS_TOKEN
MP_WEBHOOK_SECRET
```

Nunca copie valores reais para este arquivo.

## Deploy correto

O serviço Railway possui `Root Directory=/backend`. Envie o repositório a partir da raiz:

```powershell
cd black-vision-backend
npx --yes @railway/cli deployment up --service black-vision-backend --environment production --detach --json --yes
```

Não execute `railway up` de dentro de `backend`, pois isso duplica o prefixo `/backend` e causa `Failed to read app source directory`.

## Verificações

```powershell
cd backend
npm ci
npm test
npm audit --omit=optional

cd ..
npm ci
npm run build
npm audit
```

Critérios mínimos antes de encerrar um deploy:

- Railway deployment `SUCCESS`.
- `/health` retorna `200`.
- Preflights retornam `204` para `https://blackvision.com.br`.
- Login real abre `/admin/dashboard`.
- Stripe cria e expira sessões de teste operacional para cartão e boleto.
- Webhooks com assinatura inválida retornam `400`/`401`.
- Origem CORS não autorizada retorna `403`.
