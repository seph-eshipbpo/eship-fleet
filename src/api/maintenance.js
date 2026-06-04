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
export function approveServiceLog(id, data = {}) {
  return api.post(`/api/pm-service-logs/${id}/approve`, data);
}

export function updateServiceLogHours(id, hours_down) {
  return api.put(`/api/pm-service-logs/${id}/hours`, { hours_down });
}

export function fetchInspectionFlags(params = {}) {
  const q = new URLSearchParams(params).toString();
  return api.get(`/api/inspection-flags${q ? `?${q}` : ""}`);
}

export function resolveInspectionFlag(id, resolution_notes = "") {
  return api.post(`/api/inspection-flags/${id}/resolve`, { resolution_notes });
}
