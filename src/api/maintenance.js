import { api } from "./client";

function qs(params = {}) {
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return filtered.length ? "?" + new URLSearchParams(filtered).toString() : "";
}

/** GET /api/pm-schedule — full vehicle × rule schedule with computed status */
export function fetchPmSchedule(params = {}) {
  return api.get(`/api/pm-schedule${qs(params)}`);
}

/** GET /api/pm-service-logs — list with optional status/vehicle_id filters */
export function fetchServiceLogs(params = {}) {
  return api.get(`/api/pm-service-logs${qs(params)}`);
}

/** POST /api/pm-service-logs — submit a Log Service form */
export function logService(payload) {
  return api.post("/api/pm-service-logs", payload);
}

/** POST /api/pm-service-logs/{id}/approve — approve a pending log */
export function approveServiceLog(id) {
  return api.post(`/api/pm-service-logs/${id}/approve`);
}
