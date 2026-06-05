/**
 * content.js — Serviço de conteúdo do site via backend API
 * Substitui localStorage direto por GET/PUT /api/content
 */

import api from "./api.js";

/**
 * Busca conteúdo do site (público — sem auth)
 */
export async function fetchContent() {
  const { data } = await api.get("/api/content");
  return data;
}

/**
 * Salva conteúdo (admin only — token injetado pelo interceptor)
 * @param {Partial<SiteContent>} patch
 */
export async function saveContent(patch) {
  const { data } = await api.put("/api/content", patch);
  return data;
}
