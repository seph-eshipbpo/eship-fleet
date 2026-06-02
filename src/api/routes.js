import { createCrudService } from "./service";

// Supported list() params: { search, is_active, per_page }
// getById() loads origin_location and dest_location relationships from the API automatically.
const { list, getById, create, update, remove } = createCrudService("/api/routes");

export { list, getById, create, update, remove };
