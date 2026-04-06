/**
 * server.js — Black Vision API (produção)
 */

import "dotenv/config";
import express from "express";
import cors    from "cors";

import authRoutes     from "./routes/auth.js";
import trackingRoutes from "./routes/tracking.js";
import contentRoutes  from "./routes/content.js";
import paymentRoutes  from "./routes/payments.js";
import webhookRoutes  from "./routes/webhooks.js";

const app  = express();
const PORT = process.env.PORT || 3333;

/* ── CORS ── */
const allowed = new Set([
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:4173",
].filter(Boolean));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.has(origin)) return cb(null, true);
    cb(new Error(`CORS bloqueado: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

/* ── Body parsers — webhooks precisam do raw body ── */
app.use("/api/webhooks", express.raw({ type: "application/json" }));
app.use(express.json());

/* ── Health ── */
app.get("/health", (_, res) => res.json({
  ok: true, ts: Date.now(),
  gateway: process.env.PAYMENT_GATEWAY || "mercadopago",
  env: process.env.NODE_ENV,
}));

/* ── Routes ── */
app.use("/api/auth",     authRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/content",  contentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);

/* ── 404 ── */
app.use((_, res) => res.status(404).json({ message: "Route not found" }));

/* ── Error handler ── */
app.use((err, req, res, _next) => {
  console.error("[Error]", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Black Vision API rodando na porta ${PORT}`);
  console.log(`   Frontend: ${process.env.FRONTEND_URL}`);
  console.log(`   Backend:  ${process.env.BACKEND_URL}`);
  console.log(`   Gateway:  ${process.env.PAYMENT_GATEWAY}\n`);
});
