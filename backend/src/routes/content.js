/**
 * routes/content.js
 * GET /api/content        — público
 * PUT /api/content        — admin only
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
    {
      icon: "💻", tag: "Sistemas Web", active: true,
      title: "Sistemas Web de Alta Performance",
      desc:  "Landing pages, e-commerces e sistemas web construídos para converter.",
      features: ["Carregamento < 2s", "SEO Técnico Avançado", "Conversão Otimizada", "Dashboard Admin"],
    },
    {
      icon: "⚙️", tag: "Automação", active: true,
      title: "Automação de Processos Operacionais",
      desc:  "Elimine tarefas repetitivas e crie fluxos automáticos.",
      features: ["Make / n8n / Zapier", "Integração de ERPs", "WhatsApp Automático", "Relatórios em Tempo Real"],
    },
    {
      icon: "🤖", tag: "IA Aplicada", active: true,
      title: "Soluções com Inteligência Artificial",
      desc:  "Chatbots inteligentes e automação cognitiva.",
      features: ["Chatbot com IA", "Análise de Dados", "Geração de Conteúdo", "Personalização em Escala"],
    },
  ],
  sections: {
    hero:         true,
    solutions:    true,
    process:      true,
    pricing:      true,
    testimonials: true,
    contact:      true,
  },
  updatedAt: new Date().toISOString(),
};

/* GET /api/content */
router.get("/", async (req, res) => {
  try {
    const snap = await DOC_REF().get();
    res.json(snap.exists ? snap.data() : DEFAULT_CONTENT);
  } catch (err) {
    // Fallback gracioso — retorna default sem quebrar o site
    console.error("[Content GET]", err.message);
    res.json(DEFAULT_CONTENT);
  }
});

/* PUT /api/content */
router.put("/", requireAdmin, async (req, res) => {
  const allowed = ["heroTitle","heroSubtitle","heroBadge","waNumber","waMsg","instagram","cards","sections"];
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
