/**
 * routes/auth.js
 * POST /api/auth/login
 * GET  /api/auth/me
 */

import { Router } from "express";
import crypto     from "crypto";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "getblackvision.br@gmail.com";
// Em produção: hash bcrypt. Aqui usamos sha256 simples para zero deps.
// Gere: node -e "console.log(require('crypto').createHash('sha256').update('SuaSenha').digest('hex'))"
const ADMIN_HASH  = process.env.ADMIN_PASSWORD_HASH || "";
const ADMIN_PASS_DEV = process.env.NODE_ENV === "development" ? "Rihanna26" : null;

function hashPassword(plain) {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

/* POST /api/auth/login */
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha são obrigatórios" });
  }

  const emailMatch = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const passHash   = hashPassword(password);
  const passMatch  = (ADMIN_HASH && passHash === ADMIN_HASH) ||
                     (ADMIN_PASS_DEV && password === ADMIN_PASS_DEV);

  if (!emailMatch || !passMatch) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }

  const token = signToken({ email: ADMIN_EMAIL, role: "admin" });

  res.json({
    token,
    user: { email: ADMIN_EMAIL, role: "admin" },
  });
});

/* GET /api/auth/me */
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
