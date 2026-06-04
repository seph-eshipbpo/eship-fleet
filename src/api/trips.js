import { api } from "./client";

export function listTrips(params = {}) {
  const q = new URLSearchParams(params).toString();
  return api.get(`/api/trips${q ? `?${q}` : ""}`);
}

export function createTrip(payload) {
  return api.post("/api/trips", payload);
}

export function updateTrip(id, payload) {
  return api.put(`/api/trips/${id}`, payload);
}
