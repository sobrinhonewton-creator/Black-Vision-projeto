/**
 * routes/tracking.js
 * POST /api/tracking/event
 * GET  /api/tracking/stats  — admin only
 */

import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { getFirestore } from "../services/firebase.js";

const router = Router();

const VALID_EVENTS = [
  "pageView",
  "cardClick",
  "whatsappClick",
  "checkoutStart",
  "checkoutSuccess",
  "planView",
  "planClick",
];

const FIELD_MAP = {
  pageView:         "pageViews",
  cardClick:        "cardClicks",
  whatsappClick:    "whatsappClicks",
  checkoutStart:    "checkoutStarts",
  checkoutSuccess:  "checkoutSuccesses",
  planView:         "planViews",
  planClick:        "planClicks",
};

const DEFAULT_STATS = {
  pageViews:         0,
  cardClicks:        0,
  whatsappClicks:    0,
  checkoutStarts:    0,
  checkoutSuccesses: 0,
  planViews:         0,
  planClicks:        0,
};

/* POST /api/tracking/event */
router.post("/event", async (req, res) => {
  // Responde imediatamente — tracking nunca deve travar o front
  res.json({ ok: true });

  const { event, meta = {} } = req.body || {};
  if (!VALID_EVENTS.includes(event)) return;

  try {
    const db     = getFirestore();
    const ref    = db.collection("analytics").doc("global");
    const snap   = await ref.get();
    const data   = snap.exists ? snap.data() : { ...DEFAULT_STATS };

    // Incrementa contador global
    const field = FIELD_MAP[event];
    data[field] = (data[field] || 0) + 1;
    data.lastUpdated = new Date().toISOString();

    // Para planView/planClick também incrementa por tier
    if ((event === "planView" || event === "planClick") && meta.tier) {
      const tierField = `${field}_${meta.tier}`;
      data[tierField] = (data[tierField] || 0) + 1;
    }

    await ref.set(data, { merge: true });

    // Log individual para análise futura
    await db.collection("events").add({
      event,
      meta,
      ip: req.ip,
      ua: req.headers["user-agent"]?.slice(0, 120),
      ts: new Date().toISOString(),
    });

  } catch (err) {
    console.error("[Tracking]", err.message);
  }
});

/* GET /api/tracking/stats — admin only */
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const db   = getFirestore();
    const snap = await db.collection("analytics").doc("global").get();
    res.json(snap.exists ? snap.data() : DEFAULT_STATS);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
