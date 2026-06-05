/**
 * authStore.js — Estado global de autenticação com Zustand
 */

import { create } from "zustand";
import { login as apiLogin, logout as apiLogout, isTokenValid, getStoredUser, verifySession } from "../services/auth.js";

const useAuthStore = create((set, get) => ({
  token: localStorage.getItem("bv_token") || null,
  user:  getStoredUser(),
  isAuthenticated: isTokenValid(),
  loading: false,
  error: null,

  /**
   * Restaura sessão ao iniciar a app
   * Verifica se o token ainda é válido (client-side)
   */
  restoreSession: () => {
    const valid = isTokenValid();
    const user  = getStoredUser();
    set({
      token:           valid ? localStorage.getItem("bv_token") : null,
      user:            valid ? user : null,
      isAuthenticated: valid,
    });
    if (!valid) apiLogout();
  },

  /**
   * Realiza login via backend
   */
  login: async (email, password) => {
    set({ loading: true, error: null });
    const result = await apiLogin(email, password);
    if (result.success) {
      set({
        token:           localStorage.getItem("bv_token"),
        user:            result.user,
        isAuthenticated: true,
        loading:         false,
      });
    } else {
      set({ loading: false, error: result.error });
    }
    return result;
  },

  /**
   * Logout
   */
  logout: () => {
    apiLogout();
    set({ token: null, user: null, isAuthenticated: false, error: null });
  },

  /**
   * Verifica sessão no servidor (para ProtectedRoute)
   */
  verify: async () => {
    if (!isTokenValid()) {
      get().logout();
      return false;
    }
    const { valid, user } = await verifySession();
    if (valid) {
      set({ user, isAuthenticated: true });
    } else {
      get().logout();
    }
    return valid;
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
