/**
 * auth.js — Serviço de autenticação real via backend
 * Substitui a versão com credenciais hardcoded.
 */

import api from "./api.js";

const TOKEN_KEY = "bv_token";
const USER_KEY  = "bv_user";

/**
 * Faz login via POST /api/auth/login
 * @returns {{ success: boolean, user?: object, error?: string }}
 */
export async function login(email, password) {
  try {
    const { data } = await api.post("/api/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return { success: true, user: data.user };
  } catch (err) {
    const message = err.response?.data?.message || "Credenciais inválidas";
    return { success: false, error: message };
  }
}

/**
 * Remove token e dados do usuário
 */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Retorna o token atual ou null
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Retorna o usuário atual (do localStorage)
 */
export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

/**
 * Verifica se o token é válido e não expirou
 * Decodifica o payload do JWT sem verificar assinatura (lado cliente)
 */
export function isTokenValid() {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

/**
 * Retorna true se autenticado com token válido
 */
export function isAuthenticated() {
  return isTokenValid();
}

/**
 * Valida token no servidor via GET /api/auth/me
 * @returns {{ valid: boolean, user?: object }}
 */
export async function verifySession() {
  try {
    const { data } = await api.get("/api/auth/me");
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return { valid: true, user: data.user };
  } catch {
    logout();
    return { valid: false };
  }
}
