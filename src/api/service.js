import { api } from "./client";

/**
 * Factory that produces a standard CRUD service for a given API resource path.
 *
 * Why a factory (OCP + DIP):
 *   - Adding a new resource never requires modifying this file.
 *   - All services depend on the `api` abstraction, not on `fetch` directly.
 */
export function createCrudService(basePath) {
  return {
    /**
     * Fetch a paginated list. Pass any supported query params as an object,
     * e.g. { search: "manila", is_active: true, per_page: 50 }.
     * Undefined/null/empty-string values are stripped automatically.
     */
    list(params = {}) {
      const filtered = Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== ""
      );
      const query = new URLSearchParams(filtered).toString();
      return api.get(query ? `${basePath}?${query}` : basePath);
    },

    getById(id) {
      return api.get(`${basePath}/${id}`);
    },

    create(data) {
      return api.post(basePath, data);
    },

    update(id, data) {
      return api.put(`${basePath}/${id}`, data);
    },

    remove(id) {
      return api.delete(`${basePath}/${id}`);
    },
  };
}
