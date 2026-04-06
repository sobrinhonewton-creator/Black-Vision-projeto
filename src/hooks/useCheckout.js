/**
 * useCheckout.js — Hook para gerenciar fluxo de checkout
 * Usado em PricingCard ou qualquer botão de CTA de plano.
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * @param {string} planId - 'basic' | 'advanced' | 'pro'
 */
export function useCheckout(planId) {
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(false);

  const startCheckout = useCallback(async () => {
    if (loading) return;

    // Plano Pro → WhatsApp direto
    if (planId === "pro") {
      window.open(
        "https://wa.me/557381068594?text=Ol%C3%A1!%20Tenho%20interesse%20no%20plano%20Pro",
        "_blank"
      );
      return;
    }

    setLoading(true);
    // Navega para a página de checkout com o plano selecionado
    navigate(`/checkout?plan=${planId}`);
    // loading será resetado quando o componente desmontar
  }, [planId, loading, navigate]);

  return { startCheckout, loading };
}
