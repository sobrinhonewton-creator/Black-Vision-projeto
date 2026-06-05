/**
 * contentStore.js — Estado global de conteúdo do site com Zustand
 * Sincroniza com GET/PUT /api/content
 */

import { create } from "zustand";
import { fetchContent, saveContent as apiSaveContent } from "../services/content.js";

const DEFAULT_CONTENT = {
  heroTitle:    "Transforme seu negócio com tecnologia que gera resultado.",
  heroSubtitle: "Construímos sistemas web de alta performance, automatizamos processos operacionais e implementamos IA para empresas que querem crescer de forma consistente e mensurável.",
  heroBadge:    "Sistemas · Automação · Inteligência Artificial",
  waNumber:     "557381068594",
  waMsg:        "Olá! Quero saber mais sobre os serviços da Black Vision.",
  instagram:    "https://www.instagram.com/blackvision.br/",
  cards: [
    { icon: "💻", tag: "Sistemas Web", active: true, title: "Sistemas Web de Alta Performance", desc: "Landing pages, e-commerces e sistemas web construídos para converter.", features: ["Carregamento < 2s", "SEO Técnico Avançado", "Conversão Otimizada", "Dashboard Admin"] },
    { icon: "⚙️", tag: "Automação",   active: true, title: "Automação de Processos Operacionais", desc: "Elimine tarefas repetitivas e crie fluxos automáticos.", features: ["Make / n8n / Zapier", "Integração de ERPs", "WhatsApp Automático", "Relatórios em Tempo Real"] },
    { icon: "🤖", tag: "IA Aplicada", active: true, title: "Soluções com Inteligência Artificial", desc: "Chatbots inteligentes e automação cognitiva.", features: ["Chatbot com IA", "Análise de Dados", "Geração de Conteúdo", "Personalização em Escala"] },
  ],
  plans: [
    { tier: "basic",    name: "Basic",    price: "R$ 497 – R$ 997",     priceSub: "por projeto",         tagline: "Ideal para começar rápido e profissional",   badge: null,           highlighted: false, ctaLabel: "Quero começar",         audience: "Autônomos e pequenos negócios",       features: ["Landing page profissional", "Botão WhatsApp integrado", "Copy otimizada para conversão", "Mobile-first & responsivo", "Entrega em até 7 dias"] },
    { tier: "advanced", name: "Advanced", price: "R$ 1.500 – R$ 3.000", priceSub: "por projeto",         tagline: "Plano mais escolhido — solução completa",     badge: "MAIS ESCOLHIDO", highlighted: true,  ctaLabel: "Quero crescer",         audience: "Empresas locais, lojas e prestadores", features: ["Site completo multi-página", "Automação de WhatsApp", "Funil de vendas básico", "SEO técnico inicial", "Painel administrativo", "Suporte prioritário 30 dias"] },
    { tier: "pro",      name: "Pro",      price: "Sob consulta",         priceSub: "solução personalizada", tagline: "Solução completa para escalar de verdade", badge: null,           highlighted: false, ctaLabel: "Falar com especialista", audience: "Empresas estruturadas e em escala",   features: ["Sistema web personalizado", "Automação de processos completa", "Chatbot com IA", "Dashboard analytics", "Integrações ERP e CRM", "Equipe dedicada", "SLA e suporte contínuo"] },
  ],
  sections: { hero: true, solutions: true, process: true, pricing: true, testimonials: true, contact: true },
  updatedAt: null,
};

const useContentStore = create((set, get) => ({
  content: DEFAULT_CONTENT,
  loading: false,
  error: null,
  initialized: false,

  /**
   * Busca conteúdo do backend (público)
   */
  fetchContent: async () => {
    if (get().initialized) return get().content;
    set({ loading: true, error: null });
    try {
      const data = await fetchContent();
      set({ content: { ...DEFAULT_CONTENT, ...data }, loading: false, initialized: true });
      return data;
    } catch (err) {
      // Em caso de falha, usa defaults — site não fica em branco
      set({ loading: false, initialized: true, error: err.message });
      return get().content;
    }
  },

  /**
   * Salva parcialmente o conteúdo (admin)
   * @param {object} patch — campos a atualizar
   */
  updateContent: async (patch) => {
    set({ loading: true, error: null });
    try {
      await apiSaveContent(patch);
      set((state) => ({
        content: { ...state.content, ...patch },
        loading: false,
      }));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  /** Atualiza state local imediatamente (otimistic update) */
  setLocalContent: (patch) => {
    set((state) => ({ content: { ...state.content, ...patch } }));
  },

  clearError: () => set({ error: null }),
}));

export default useContentStore;
