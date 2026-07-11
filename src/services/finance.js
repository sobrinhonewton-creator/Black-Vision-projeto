import api from "./api.js";

export async function fetchFinanceCenter() {
  const { data } = await api.get("/api/finance");
  return data;
}

export async function reconcileFinance() {
  const { data } = await api.post("/api/finance/reconcile");
  return data;
}

export async function scanFinanceAlerts() {
  const { data } = await api.post("/api/finance/alerts/scan");
  return data;
}

export async function markAlert(id, read = true) {
  const { data } = await api.patch(`/api/finance/alerts/${id}`, { read });
  return data;
}

export async function updateCustomer(id, patch) {
  const { data } = await api.patch(`/api/finance/customers/${id}`, patch);
  return data;
}

export async function issueInvoice(id) {
  const { data } = await api.post(`/api/finance/invoices/${id}/issue`);
  return data;
}

export async function syncInvoice(id) {
  const { data } = await api.post(`/api/finance/invoices/${id}/sync`);
  return data;
}
