import { createCrudService } from "./service";

// Supported list() params: { search, per_page }
// getById() loads pm_rules relationship from the API automatically.
const { list, getById, create, update, remove } = createCrudService("/api/vehicle-types");

export { list, getById, create, update, remove };
