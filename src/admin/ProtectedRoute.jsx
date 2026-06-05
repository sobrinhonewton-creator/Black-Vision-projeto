/**
 * ProtectedRoute.jsx — Guarda de rota admin com JWT real
 */

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore.js";
import Spinner from "../components/ui/Spinner.jsx";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, verify } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed]   = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setChecking(false);
      setAllowed(false);
      return;
    }
    // Verifica sessão no servidor uma vez ao montar
    verify().then(valid => {
      setAllowed(valid);
      setChecking(false);
    });
  }, []); // eslint-disable-line

  if (checking) {
    return (
      <div style={{
        minHeight: "100svh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#080808",
      }}>
        <Spinner size={32} />
      </div>
    );
  }

  return allowed ? children : <Navigate to="/admin" replace />;
}