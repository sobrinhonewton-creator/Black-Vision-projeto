/**
 * routes/tracking.js
 * POST /api/tracking/event
 * GET  /api/tracking/stats
 */

import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { getFirestore } from "../services/firebase.js";

const router = Router();
const VALID_EVENTS = ["pageView", "cardClick", "whatsappClick", "checkoutStart", "checkoutSuccess"];

/* POST /api/tracking/event */
router.post("/event", async (req, res) => {
  const { event, meta = {} } = req.body || {};

  if (!VALID_EVENTS.includes(event)) {
    return res.status(400).json({ message: `Evento inválido. Use: ${VALID_EVENTS.join(", ")}` });
  }

  try {
    const db      = getFirestore();
    const docRef  = db.collection("analytics").doc("global");
    const snap    = await docRef.get();
    const data    = snap.exists ? snap.data() : { pageViews: 0, cardClicks: 0, whatsappClicks: 0, checkoutStarts: 0, checkoutSuccesses: 0 };

    const fieldMap = {
      pageView:         "pageViews",
      cardClick:        "cardClicks",
      whatsappClick:    "whatsappClicks",
      checkoutStart:    "checkoutStarts",
      checkoutSuccess:  "checkoutSuccesses",
    };

    data[fieldMap[event]] = (data[fieldMap[event]] || 0) + 1;
    data.lastUpdated = new Date().toISOString();

    // Log individual event
    await db.collection("events").add({
      event, meta,
      ip: req.ip,
      ua: req.headers["user-agent"]?.slice(0, 120),
      ts: new Date().toISOString(),
    });

    await docRef.set(data);
    res.json({ ok: true });

  } catch (err) {
    console.error("[Tracking]", err.message);
    // Não quebra o front — retorna ok mesmo assim
    res.json({ ok: true, warn: "tracking_write_failed" });
  }
});

/* GET /api/tracking/stats — admin only */
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const db   = getFirestore();
    const snap = await db.collection("analytics").doc("global").get();
    res.json(snap.exists ? snap.data() : {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
