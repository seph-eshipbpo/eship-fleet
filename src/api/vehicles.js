import { createCrudService } from "./service";

// Supported list() params: { search, status, location_id, vehicle_type_id, health_color, per_page }
const { list, getById, create, update, remove } = createCrudService("/api/vehicles");

export { list, getById, create, update, remove };
