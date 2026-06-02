import { createCrudService } from "./service";

// Supported list() params: { search, is_active, per_page }
const { list, getById, create, update, remove } = createCrudService("/api/locations");

export { list, getById, create, update, remove };
