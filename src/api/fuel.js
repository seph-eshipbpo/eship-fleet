import { api } from "./client";

export function listFuelPurchases(params = {}) {
  const q = new URLSearchParams(params).toString();
  return api.get(`/api/fuel-purchases${q ? `?${q}` : ""}`);
}

export function logFuelPurchase(payload) {
  return api.post("/api/fuel-purchases", payload);
}

export function deleteFuelPurchase(id) {
  return api.delete(`/api/fuel-purchases/${id}`);
}
