/**
 * middleware/auth.js — JWT verification middleware
 */

import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_prod";

/* ── Tiny JWT (sem dependência extra) ── */
function base64url(str) {
  return Buffer.from(str).toString("base64url");
}

export function signToken(payload, expiresInSec = 7 * 24 * 3600) {
  const header  = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body    = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + expiresInSec }));
  const sig     = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token) {
  try {
    const [header, body, sig] = token.split(".");
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (sig !== expected) throw new Error("Invalid signature");
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Token expired");
    return payload;
  } catch {
    return null;
  }
}

/* ── Express middleware ── */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token      = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }

  req.user = payload;
  next();
}

/* ── Admin-only middleware ── */
export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado" });
    }
    next();
  });
}
