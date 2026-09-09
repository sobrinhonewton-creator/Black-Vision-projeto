/**
 * api.js — Instância Axios centralizada com interceptors
 * Todos os serviços devem importar daqui.
 */

import axios from "axios";

export const PRODUCTION_API = "https://blackvision-backend-equipe-blackvision.vercel.app";

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? PRODUCTION_API : "http://localhost:3333");

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ── Request interceptor: injeta Bearer token ── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("bv_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response interceptor: trata 401/403 ── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido — limpa sessão
      localStorage.removeItem("bv_token");
      localStorage.removeItem("bv_user");
      // Só redireciona para /admin se estiver em rota protegida
      if (window.location.pathname.startsWith("/admin/")) {
        window.location.href = "/admin";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
