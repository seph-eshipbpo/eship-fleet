import { api } from "./client";

export function getReportBreakdowns(year) {
  const query = year ? `?year=${year}` : "";
  return api.get(`/api/reports/breakdowns${query}`);
}

export function listBreakdowns(params = {}) {
  const q = new URLSearchParams(params).toString();
  return api.get(`/api/breakdowns${q ? `?${q}` : ""}`);
}

export function createBreakdown(payload) {
  return api.post("/api/breakdowns", payload);
}

export function updateBreakdown(id, payload) {
  return api.put(`/api/breakdowns/${id}`, payload);
}

export function deleteBreakdown(id) {
  return api.delete(`/api/breakdowns/${id}`);
}
