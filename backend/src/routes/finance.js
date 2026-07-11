import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import {
  getFinanceCenterData, issueInvoice, markFinanceAlert, prepareInvoice,
  reconcileFinance, scanOperationalAlerts, syncInvoice, updateFinanceCustomer,
} from "../services/financeCenter.js";

const router = Router();
router.use(requireAdmin);

router.get("/", async (_req, res) => {
  try { return res.json(await getFinanceCenterData()); }
  catch (error) { return res.status(500).json({ message: error.message }); }
});

router.post("/reconcile", async (_req, res) => {
  try { return res.json(await reconcileFinance()); }
  catch (error) { return res.status(500).json({ message: error.message }); }
});

router.post("/alerts/scan", async (_req, res) => {
  try { return res.json(await scanOperationalAlerts()); }
  catch (error) { return res.status(500).json({ message: error.message }); }
});

router.patch("/alerts/:id", async (req, res) => {
  try { return res.json(await markFinanceAlert(req.params.id, req.body?.read !== false)); }
  catch (error) { return res.status(500).json({ message: error.message }); }
});

router.patch("/customers/:id", async (req, res) => {
  try { return res.json(await updateFinanceCustomer(req.params.id, req.body || {})); }
  catch (error) { return res.status(400).json({ message: error.message }); }
});

router.post("/invoices/prepare/:transactionId", async (req, res) => {
  try { return res.json(await prepareInvoice(req.params.transactionId)); }
  catch (error) { return res.status(error.status || 400).json({ message: error.message }); }
});

router.post("/invoices/:id/issue", async (req, res) => {
  try { return res.json(await issueInvoice(req.params.id)); }
  catch (error) { return res.status(error.status || 500).json({ message: error.message }); }
});

router.post("/invoices/:id/sync", async (req, res) => {
  try { return res.json(await syncInvoice(req.params.id)); }
  catch (error) { return res.status(error.status || 500).json({ message: error.message }); }
});

export default router;
