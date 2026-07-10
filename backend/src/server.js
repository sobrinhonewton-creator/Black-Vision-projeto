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

const allowed = new Set([
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:4173",
  "https://blackvision-27f1c.web.app",
  "https://blackvision.com.br",
  "https://www.blackvision.com.br",
].filter(Boolean));

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowed.has(origin)) return cb(null, true);
    const error = new Error("Origem não autorizada");
    error.code = "CORS_ORIGIN_DENIED";
    error.status = 403;
    cb(error);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use("/api/webhooks", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_, res) => res.json({
  ok: true, ts: Date.now(),
  gateway: "stripe+mercadopago_pix",
  env: process.env.NODE_ENV,
}));

app.use("/api/auth",     authRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/content",  contentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);

app.use((_, res) => res.status(404).json({ message: "Route not found" }));

app.use((err, req, res, _next) => {
  console.error("[Error]", err.message);
  if (err.code === "CORS_ORIGIN_DENIED") {
    return res.status(403).json({ message: "Origem não autorizada" });
  }
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Black Vision API rodando na porta ${PORT}`);
  console.log(`   Frontend:  ${process.env.FRONTEND_URL}`);
  console.log(`   Backend:   ${process.env.BACKEND_URL}`);
  console.log("   Gateway:   Stripe (cartão/boleto) + Mercado Pago (PIX)\n");
});
