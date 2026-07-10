# Guia de Deployment e Correções - Black Vision Backend

## 🔴 Status Atual de Produção

### Problemas Identificados
1. **Código desatualizado em produção** - Railway bloqueou deploy durante pico (8 AM - 8 PM NY)
2. **Boleto retornando 500** - Endereço do pagador não está sendo enviado para Mercado Pago
3. **Firebase inválido** - Chave privada malformada (erro ao parsear PEM)

### Logs de Produção
```
⚠️ Firebase não inicializado: Failed to parse private key: Error: Invalid PEM formatted message.
[Payment create] To generate a registered boleto the following parameters are required: 
  payer.address.zip_code, payer.address.street_name, payer.address.street_number,
  payer.address.neighborhood, payer.address.city, payer.address.federal_unit
```

---

## ✅ Correções Implementadas (No GitHub - Não Deployed Ainda)

### 1. **Backend: Validação Agressiva de Endereço** 
   - **Arquivo:** `backend/src/routes/payments.js`
   - **Mudanças:**
     - Validação de CEP (exige 8 dígitos numéricos)
     - Rejeita boleto com endereço incompleto ANTES de chamar MP
     - Debug logging para rastrear endereço em cada etapa
   
### 2. **Backend: Normalização de Endereço Expandida**
   - **Arquivo:** `backend/src/services/mercadopago.js`
   - **Mudanças:**
     - Suporta múltiplos aliases de campos: `zip`/`cep`, `street`/`logradouro`, etc.
     - Valida que endereço está COMPLETO antes de enviar para MP
     - Logging para verificar se payer tem endereço

### 3. **Backend: Login Admin com Fallback Seguro**
   - **Arquivo:** `backend/src/routes/auth.js`
   - **Sem senha fallback:** produção exige `ADMIN_PASSWORD_HASH` ou `ADMIN_PASSWORD`
   - **Em produção:** usa `ADMIN_PASSWORD_HASH` configurado no Railway

### 4. **Firebase: Parsing Robusto de Chave Privada**
   - **Arquivo:** `backend/src/services/firebase.js`
   - **Tratamento:** Escaped newlines `\\n` e `\\r`

---

## 🚀 Como Fazer Deploy para Railway

### Pré-requisitos
```bash
# Railway CLI deve estar instalado
npx --yes @railway/cli --version  # Verifica se funciona
```

### Opção 1: Deploy Manual via Railway CLI (Recomendado)

```bash
cd backend

# Fazer login (abre browser)
npx --yes @railway/cli login

# Linkar projeto (se não está linkado)
npx --yes @railway/cli link --project determined-harmony

# Fazer deploy
npx --yes @railway/cli up --service black-vision-backend --environment production -y \
  --message "Deploy: boleto validation, address normalization, debug logging"
```

### Opção 2: Aguardar Horário Off-Peak
Railway libera deploys para free-tier FORA de 8 AM - 8 PM (New York Time).

**Melhor horário:** 
- ✅ 9 PM - 7 AM (NY)
- ✅ Madrugada de terça a quinta-feira

### Opção 3: Configurar GitHub Auto-Deploy (Permanente)

```bash
cd backend

# Conectar repo ao Railway para auto-deploy
npx --yes @railway/cli service source connect \
  --repo blackvisionbr-eng/black-vision-backend \
  --branch main \
  --service black-vision-backend \
  --json
```

Após isso, qualquer push para `main` dispara deploy automático.

---

## 🔍 Testando Localmente Antes de Deploy

### Preparar ambiente local
```bash
cd backend

# Instalar dependências
npm install

# Criar .env com dados de teste
cat > .env << 'EOF'
NODE_ENV=development
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secret
JWT_SECRET=test_secret_12345
BACKEND_URL=http://localhost:3333
FRONTEND_URL=http://localhost:5173
MP_ACCESS_TOKEN=TEST-1234567890  # Token de teste MP
PAYMENT_GATEWAY=mercadopago
PORT=3333
EOF

# Iniciar servidor
node src/server.js
```

### Testar endpoint de boleto
```bash
# Terminal 2: Teste boleto COM endereço
curl -X POST http://localhost:3333/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "advanced",
    "method": "boleto",
    "customerEmail": "test@example.com",
    "customerName": "João Silva",
    "customerPhone": "73981068594",
    "customerCpf": "12345678909",
    "customerAddress": {
      "zip_code": "48010140",
      "street_name": "Rua X",
      "street_number": "123",
      "neighborhood": "Centro",
      "city": "Salvador",
      "federal_unit": "BA"
    }
  }' | jq .

# Testar boleto SEM endereço (deve retornar 400)
curl -X POST http://localhost:3333/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "advanced",
    "method": "boleto",
    "customerEmail": "test@example.com",
    "customerName": "João Silva",
    "customerPhone": "73981068594",
    "customerCpf": "12345678909"
  }' | jq .
```

### Esperado
- ❌ Sem endereço → **400** com mensagem de campos faltando
- ✅ Com endereço → **200** com QR code / ticket URL

---

## 📋 Checklist de Produção

- [ ] Railway login feito: `npx --yes @railway/cli whoami`
- [ ] Projeto linked: `npx --yes @railway/cli status`
- [ ] Código testado localmente
- [ ] GitHub commits enviados: `git push origin main`
- [ ] Deploy iniciado (fora de horário pico NY)
- [ ] Verificar logs: `npx --yes @railway/cli logs`
- [ ] Testar endpoint em produção
- [ ] Testar login admin com a credencial configurada no Railway

---

## 📞 Troubleshooting

### "Free-tier deploys not available during peak hours"
**Solução:** Aguarde 8 PM NY ou atualize para plano pago

### "No linked project found"
```bash
npx --yes @railway/cli link --project determined-harmony
```

### "Unauthorized. Please login"
```bash
npx --yes @railway/cli logout
npx --yes @railway/cli login
```

### "To generate a registered boleto..."
1. Verificar se dados foram atualizados em produção
2. Checar logs: `npx --yes @railway/cli logs --lines 100`
3. Confirmar que endereço está sendo enviado pelo frontend

---

## 🔐 Variáveis de Ambiente Necessárias (Já Configuradas)

```
ADMIN_EMAIL=getblackvision.br@gmail.com
ADMIN_PASSWORD_HASH=[HASH CONFIGURADO NO RAILWAY]
MP_ACCESS_TOKEN=[TOKEN_PRODUÇÃO]
FIREBASE_PRIVATE_KEY=[CHAVE_VÁLIDA]
FIREBASE_PROJECT_ID=blackvision-27f1c
FIREBASE_CLIENT_EMAIL=[EMAIL]
FRONTEND_URL=https://blackvision.com.br
BACKEND_URL=black-vision-backend-production.up.railway.app
JWT_SECRET=[HASH]
```

---

## 📝 Commits Relacionados

- `3552d5f` - Allow fallback admin login only when no env credentials exist
- `17666e6` - Robust boleto address normalization and Firebase key parsing fix  
- `a652efc` - Add comprehensive address validation and debug logging for boleto payments

---

## ✨ Próximos Passos Após Deploy

1. Testar pagamento por boleto em produção
2. Verificar logs para debugging se houver erros
3. Confirmar que admin login funciona
4. Testar PIX e Cartão também
Deployed trigger: 
