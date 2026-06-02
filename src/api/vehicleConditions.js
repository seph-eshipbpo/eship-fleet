import { createCrudService } from "./service";

// Supported list() params: { search, per_page }
const { list, getById, create, update, remove } = createCrudService("/api/vehicle-conditions");

export { list, getById, create, update, remove };
