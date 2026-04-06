# Black Vision — Estrutura Completa

## 📁 O que foi adicionado

```
src/
├── App.jsx                          ← ATUALIZADO (rotas de checkout)
├── services/
│   └── payment.js                  ← NOVO — camada de pagamento (gateway-agnóstico)
├── hooks/
│   └── useCheckout.js              ← NOVO — hook para disparar checkout
├── pages/
│   └── checkout/
│       ├── CheckoutPage.jsx        ← NOVO — formulário de checkout
│       └── CheckoutResult.jsx      ← NOVO — páginas de sucesso/falha
├── components/
│   └── PricingCard.jsx             ← ATUALIZADO (botões conectados ao checkout)
└── .env.example                    ← NOVO — variáveis do front

backend/
├── package.json
├── .env.example
└── src/
    ├── server.js                   ← Express principal
    ├── middleware/
    │   └── auth.js                 ← JWT sign/verify + middlewares
    ├── routes/
    │   ├── auth.js                 ← POST /api/auth/login, GET /api/auth/me
    │   ├── tracking.js             ← POST /api/tracking/event, GET /api/tracking/stats
    │   ├── content.js              ← GET/PUT /api/content
    │   ├── payments.js             ← POST /api/payments/checkout, GET /status, POST /cancel
    │   └── webhooks.js             ← POST /api/webhooks/stripe|mercadopago
    └── services/
        ├── firebase.js             ← Firebase Admin (singleton)
        ├── mercadopago.js          ← Integração Mercado Pago SDK v2
        ├── stripe.js               ← Integração Stripe SDK
        └── transactionLog.js       ← Log Firestore + fallback memória
```

---

## 🚀 Setup do Backend

### 1. Instalar dependências
```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Edite o .env com suas chaves
```

### 3. Configurar Firebase Admin
No console do Firebase → **Configurações do Projeto → Contas de Serviço → Gerar nova chave privada**

Coloque os valores no `.env`:
```env
FIREBASE_PROJECT_ID=blackvision-27f1c
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@blackvision-27f1c.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### 4. Rodar em desenvolvimento
```bash
npm run dev
# API rodando em http://localhost:3333
```

---

## 💳 Setup do Pagamento

### Mercado Pago (padrão)

1. Acesse [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers/pt/docs)
2. Crie um aplicativo e copie o **Access Token de produção**
3. Configure no `backend/.env`:
```env
PAYMENT_GATEWAY=mercadopago
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxx
```

4. Configure webhook no painel MP:
   - URL: `https://seudominio.com/api/webhooks/mercadopago`
   - Eventos: `payment`, `subscription_authorized_payment`

### Stripe (alternativa)

1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Copie a **Secret Key** e a **Publishable Key**
3. Configure no `backend/.env`:
```env
PAYMENT_GATEWAY=stripe
STRIPE_SECRET_KEY=sk_live_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
```

4. Configure webhook no Stripe Dashboard:
   - URL: `https://seudominio.com/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `checkout.session.expired`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`

---

## 🌐 Setup do Frontend

```bash
# Na raiz do projeto (src/)
cp src/.env.example .env

# Configure:
VITE_API_URL=https://seudominio.com  # URL do backend em produção
VITE_PAYMENT_GATEWAY=mercadopago     # "mercadopago" ou "stripe"
```

---

## 🔄 Fluxo de Pagamento

```
Usuário clica "Quero crescer" no card
    ↓
/checkout?plan=advanced  (CheckoutPage.jsx)
    ↓
Preenche nome, email, telefone
    ↓
POST /api/payments/checkout (backend)
    ↓
Backend cria preferência no gateway
    ↓
Redireciona para checkout do gateway
    ↓
Gateway processa pagamento
    ↓
Webhook notifica backend (status real-time)
    ↓
Usuário retorna para /checkout/success
```

---

## 🛡️ Segurança

- **JWT** sem dependência extra (HMAC-SHA256 nativo do Node)
- **Webhook signatures** verificadas (Stripe e Mercado Pago)
- **CORS** configurado para aceitar apenas o domínio do front
- **Body raw** para webhooks (antes do JSON parser)
- Logs de transação com **fallback em memória** (nunca quebra o site)

---

## 🔌 Trocar de Gateway

Para trocar de Mercado Pago para Stripe:

1. No `backend/.env`: `PAYMENT_GATEWAY=stripe`
2. No `src/.env`: `VITE_PAYMENT_GATEWAY=stripe`
3. Reiniciar backend

**Nenhuma linha de código precisa mudar.**

---

## 📡 Rotas da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/login` | — | Login admin |
| GET | `/api/auth/me` | JWT | Dados do usuário |
| POST | `/api/tracking/event` | — | Registrar evento |
| GET | `/api/tracking/stats` | Admin | Estatísticas |
| GET | `/api/content` | — | Conteúdo do site |
| PUT | `/api/content` | Admin | Atualizar conteúdo |
| POST | `/api/payments/checkout` | — | Criar checkout |
| GET | `/api/payments/status/:id` | — | Status pagamento |
| POST | `/api/payments/cancel` | Admin | Cancelar assinatura |
| GET | `/api/payments/transactions` | Admin | Log de transações |
| POST | `/api/webhooks/stripe` | — | Webhook Stripe |
| POST | `/api/webhooks/mercadopago` | — | Webhook Mercado Pago |
