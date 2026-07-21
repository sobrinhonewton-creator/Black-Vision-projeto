# Black Vision Frontend

Repositório Frontend da Black Vision reconstruído em React + Vite.

## Arquitetura e Stack
- **Vite + React 18**
- **React Router v7** para roteamento
- **Zustand** para state management e sync de conteúdo via API
- **Axios** para requisições HTTP e interceptors
- **Estilos:** CSS Modules / Vanilla CSS (design premium com glassmorphism e animações 60fps)

## Funcionalidades Principais
1. **Painel Admin:** Totalmente integrado com API do backend (Transactions, Analytics, Site Content)
2. **Checkout Agnostic:** Fluxo de pagamento com fallback para Stripe ou MercadoPago
3. **Métricas Customizadas:** Eventos de `pageView`, `cardClick`, `planView` sem depender do Firebase SDK no front (Tudo via proxy API).

## Instalação e Execução Local

### Pré-requisitos
- Node.js 18+

### Setup

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as Variáveis de Ambiente:**
   Copie os arquivos de exemplo para `.env` e ajuste:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```
   *Certifique-se de definir a `VITE_API_URL` com a URL do seu backend local (Ex: http://localhost:3333).*

3. **Inicie o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Inicie o backend local em outro terminal:**
   ```bash
   npm run backend:dev
   ```

5. **Execute os testes do backend:**
   ```bash
   npm test
   ```

## Deploy

Para gerar o bundle de produção:
```bash
npm run build
```

O código compilado estará na pasta `dist/`. O deploy padrão pode ser feito via **Firebase Hosting**, **Vercel** ou **Netlify**.

---

*Desenvolvido para Black Vision.*
