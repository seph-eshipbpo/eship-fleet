import { api } from "./client";

/**
 * Fetch paginated inspection records.
 * Supported params: vehicle_id, vehicle_plate, inspection_type, per_page
 */
export function fetchInspections(params = {}) {
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  const query = new URLSearchParams(filtered).toString();
  return api.get(query ? `/api/inspections?${query}` : "/api/inspections");
}


/**
 * Fetch active checklist sections for a given inspection type.
 * Returns sections with their items nested (include_items=1).
 *
 * @param {'pre'|'post'} inspectionType
 */
export function fetchSections(inspectionType) {
  return api.get(
    `/api/inspection-checklist-sections?inspection_type=${inspectionType}&include_items=1&is_active=1&per_page=1000`
  );
}

/**
 * Submit a completed inspection.
 *
 * @param {{
 *   vehicle_id: number,
 *   inspection_type: 'pre'|'post',
 *   driver: string|null,
 *   leadman: string|null,
 *   trip_km: number|null,
 *   hours: number|null,
 *   notes: string|null,
 *   items: Array<{ checklist_item_id: number, status: 'pass'|'flag', issue_description: string|null }>
 * }} payload
 */
export function submitInspection(payload) {
  return api.post("/api/inspections", payload);
}

/** Fetch a single inspection with all checklist items (includes section_label, item_label, status). */
export function fetchInspectionDetail(id) {
  return api.get(`/api/inspections/${id}`);
}
