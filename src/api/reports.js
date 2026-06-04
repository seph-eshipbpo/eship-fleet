import { api } from "./client";

export function getReportOverview(year) {
  const query = year ? `?year=${year}` : "";
  return api.get(`/api/reports/overview${query}`);
}

export function getReportCosts(year) {
  const query = year ? `?year=${year}` : "";
  return api.get(`/api/reports/costs${query}`);
}

export function getReportLocations(year) {
  const query = year ? `?year=${year}` : "";
  return api.get(`/api/reports/locations${query}`);
}
