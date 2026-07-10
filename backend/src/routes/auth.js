/**
 * routes/auth.js
 * POST /api/auth/login
 * GET  /api/auth/me
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL?.trim() || "getblackvision.br@gmail.com");
const ADMIN_BCRYPT_HASH = process.env.ADMIN_PASSWORD_BCRYPT_HASH?.trim() || "";

/* POST /api/auth/login */
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha são obrigatórios" });
  }

  const emailMatch = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const passMatch = ADMIN_BCRYPT_HASH
    ? await bcrypt.compare(String(password), ADMIN_BCRYPT_HASH)
    : false;

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
