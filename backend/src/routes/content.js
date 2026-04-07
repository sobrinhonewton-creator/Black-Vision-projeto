/**
 * routes/content.js
 * GET /api/content   — público
 * PUT /api/content   — admin only
 * ADICIONADO: campo "plans" para edição dos planos de preço
 */

import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { getFirestore } from "../services/firebase.js";

const router  = Router();
const DOC_REF = () => getFirestore().collection("site").doc("content");

const DEFAULT_CONTENT = {
  heroTitle:    "Transforme seu negócio com tecnologia que gera resultado.",
  heroSubtitle: "Construímos sistemas web de alta performance, automatizamos processos operacionais e implementamos IA para empresas que querem crescer de forma consistente e mensurável.",
  heroBadge:    "Sistemas · Automação · Inteligência Artificial",
  waNumber:     "557381068594",
  waMsg:        "Olá! Quero saber mais sobre os serviços da Black Vision.",
  instagram:    "https://www.instagram.com/blackvision.br/",
  cards: [
    { icon: "💻", tag: "Sistemas Web", active: true, title: "Sistemas Web de Alta Performance", desc: "Landing pages, e-commerces e sistemas web construídos para converter.", features: ["Carregamento < 2s","SEO Técnico Avançado","Conversão Otimizada","Dashboard Admin"] },
    { icon: "⚙️", tag: "Automação",   active: true, title: "Automação de Processos Operacionais", desc: "Elimine tarefas repetitivas e crie fluxos automáticos.", features: ["Make / n8n / Zapier","Integração de ERPs","WhatsApp Automático","Relatórios em Tempo Real"] },
    { icon: "🤖", tag: "IA Aplicada", active: true, title: "Soluções com Inteligência Artificial", desc: "Chatbots inteligentes e automação cognitiva.", features: ["Chatbot com IA","Análise de Dados","Geração de Conteúdo","Personalização em Escala"] },
  ],
  plans: [
    { tier: "basic",    name: "Basic",    price: "R$ 497 – R$ 997",     priceSub: "por projeto",         tagline: "Ideal para começar rápido e profissional",      badge: null,            highlighted: false, ctaLabel: "Quero começar",         audience: "Autônomos e pequenos negócios",        features: ["Landing page profissional","Botão WhatsApp integrado","Copy otimizada para conversão","Mobile-first & responsivo","Entrega em até 7 dias"] },
    { tier: "advanced", name: "Advanced", price: "R$ 1.500 – R$ 3.000", priceSub: "por projeto",         tagline: "Plano mais escolhido — solução completa",        badge: "MAIS ESCOLHIDO", highlighted: true,  ctaLabel: "Quero crescer",         audience: "Empresas locais, lojas e prestadores", features: ["Site completo multi-página","Automação de WhatsApp","Funil de vendas básico","SEO técnico inicial","Painel administrativo","Suporte prioritário 30 dias"] },
    { tier: "pro",      name: "Pro",      price: "Sob consulta",         priceSub: "solução personalizada",tagline: "Solução completa para escalar de verdade",        badge: null,            highlighted: false, ctaLabel: "Falar com especialista", audience: "Empresas estruturadas e em escala",    features: ["Sistema web personalizado","Automação de processos completa","Chatbot com IA","Dashboard analytics","Integrações ERP e CRM","Equipe dedicada","SLA e suporte contínuo"] },
  ],
  sections: { hero: true, solutions: true, process: true, pricing: true, testimonials: true, contact: true },
  updatedAt: new Date().toISOString(),
};

/* GET /api/content */
router.get("/", async (req, res) => {
  try {
    const snap = await DOC_REF().get();
    res.json(snap.exists ? snap.data() : DEFAULT_CONTENT);
  } catch (err) {
    console.error("[Content GET]", err.message);
    res.json(DEFAULT_CONTENT);
  }
});

/* PUT /api/content */
router.put("/", requireAdmin, async (req, res) => {
  const allowed = ["heroTitle","heroSubtitle","heroBadge","waNumber","waMsg","instagram","cards","plans","sections"];
  const update  = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: "Nenhum campo válido para atualizar" });
  }

  update.updatedAt = new Date().toISOString();

  try {
    await DOC_REF().set(update, { merge: true });
    res.json({ ok: true, updated: Object.keys(update) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
