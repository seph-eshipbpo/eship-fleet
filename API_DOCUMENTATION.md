# eShip Fleet Management — Backend API Documentation

**Stack:** Laravel 11 + Filament 3 + Laravel Sanctum  
**Base URL:** `https://api.eshipfleet.com/api/v1`  
**Admin Panel:** `https://api.eshipfleet.com/admin` (Filament)  
**Auth:** Laravel Sanctum — `Authorization: Bearer <token>`

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Database Migrations](#2-database-migrations)
3. [Eloquent Models & Relationships](#3-eloquent-models--relationships)
4. [Authentication](#4-authentication)
5. [API Endpoints](#5-api-endpoints)
   - [Vehicles](#vehicles)
   - [Inspections](#inspections)
   - [Trips & Dispatch](#trips--dispatch)
   - [Preventive Maintenance](#preventive-maintenance)
   - [Service Logs](#service-logs)
   - [Breakdowns](#breakdowns)
   - [Reports & Analytics](#reports--analytics)
   - [Reference Data](#reference-data)
6. [Filament Admin Panel Resources](#6-filament-admin-panel-resources)
7. [Business Logic Services](#7-business-logic-services)
8. [Error Responses](#8-error-responses)
9. [Implementation Order](#9-implementation-order)

---

## 1. Project Setup

```bash
composer create-project laravel/laravel eship-fleet-api
cd eship-fleet-api

# Core packages
composer require laravel/sanctum
composer require filament/filament:"^3.0" -W

# Useful extras
composer require spatie/laravel-permission     # role-based access
composer require spatie/laravel-query-builder  # filter/sort/paginate API queries

# Publish and install
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan filament:install --panels
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
```

**`config/sanctum.php`** — allow SPA (web app) + mobile (token) auth:
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,fleet.eshipbpo.com')),
'expiration' => 60 * 24,  // 24 hours
```

**CORS** (`config/cors.php`):
```php
'allowed_origins' => ['https://fleet.eshipbpo.com', 'http://localhost:5173'],
'supports_credentials' => true,
```

---

## 2. Database Migrations

Run in this order. Each file goes in `database/migrations/`.

### `create_hubs_table`
```php
Schema::create('hubs', function (Blueprint $table) {
    $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
    $table->string('name', 50)->unique();   // 'Valenzuela', 'Cebu', 'Tacloban', 'Davao'
    $table->string('region', 50)->nullable();
    $table->text('address')->nullable();
    $table->timestamps();
});
```

### `create_users_table`
```php
// Extend the default Laravel users migration:
Schema::create('users', function (Blueprint $table) {
    $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
    $table->string('name');
    $table->string('email')->unique();
    $table->string('password');
    $table->enum('role', ['admin','manager','dispatcher','leadman','driver','mechanic'])
          ->default('driver');
    $table->foreignUuid('hub_id')->nullable()->constrained()->nullOnDelete();
    $table->boolean('is_active')->default(true);
    $table->rememberToken();
    $table->timestamps();
});
```

### `create_vehicles_table`
```php
Schema::create('vehicles', function (Blueprint $table) {
    $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
    $table->string('plate', 20)->unique();
    $table->string('make', 50);
    $table->string('model', 50);
    $table->enum('type', ['10W','6W','4W']);
    $table->smallInteger('year')->nullable();
    $table->string('color', 30)->nullable();
    $table->string('owner', 100)->nullable();
    $table->string('registered_owner', 100)->nullable();
    $table->string('chassis_no', 50)->nullable();
    $table->string('motor_no', 50)->nullable();
    $table->foreignUuid('driver_id')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignUuid('leadman_id')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignUuid('hub_id')->nullable()->constrained()->nullOnDelete();

    // Dual status
    $table->enum('op_status', ['running','maintenance','idle'])->default('idle');
    $table->enum('reg_status', ['active','retired','junk','sold'])->default('active');
    $table->enum('condition', ['Good','Fair','Needs Service','Under Repair','Inactive'])->default('Good');

    // Financial
    $table->date('acquisition_date')->nullable();
    $table->decimal('amount', 12, 2)->nullable();
    $table->enum('terms', ['Cash','12 Months','24 Months','36 Months','60 Months','Rental'])->nullable();

    // Documents
    $table->string('fleet_card', 100)->nullable();
    $table->string('insurance_policy', 100)->nullable();
    $table->date('lto_renewal')->nullable();
    $table->string('marine_insurance', 100)->nullable();

    $table->text('remarks')->nullable();
    $table->softDeletes();
    $table->timestamps();

    $table->index('hub_id');
    $table->index('op_status');
    $table->index('reg_status');
});
```

### `create_routes_table`
```php
Schema::create('routes', function (Blueprint $table) {
    $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
    $table->string('name', 100);
    $table->decimal('avg_km', 8, 1);
    $table->decimal('avg_hrs', 4, 1);
    $table->string('zone', 50)->nullable();    // 'Metro Manila', 'Cebu', etc.
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});
```

### `create_trips_table`
```php
Schema::create('trips', function (Blueprint $table) {
    $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
    $table->foreignUuid('vehicle_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('route_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignUuid('driver_id')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignUuid('leadman_id')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->date('trip_date');
    $table->decimal('km', 8, 1)->default(0);
    $table->decimal('hours', 5, 1)->default(0);
    $table->text('notes')->nullable();
    $table->boolean('synced_to_pm')->default(false);
    $table->timestamps();

    $table->index('vehicle_id');
    $table->index('trip_date');
    $table->index(['vehicle_id', 'synced_to_pm']);
});
```

### `create_pm_rules_table`
```php
Schema::create('pm_rules', function (Blueprint $table) {
    $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
    $table->string('code', 30)->unique();      // 'engine_oil', 'fuel_filter', etc.
    $table->string('label', 100);
    $table->smallInteger('trip_limit')->nullable();
    $table->integer('km_limit')->nullable();
    $table->smallInteger('cal_months')->nullable();
    $table->smallInteger('cal_weeks')->nullable();
    $table->json('applicable_types');          // ["10W","6W","4W"]
    $table->timestamps();
});
```

### `create_pm_records_table`
```php
Schema::create('pm_records', function (Blueprint $table) {
    $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
    $table->foreignUuid('vehicle_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('pm_rule_id')->constrained()->cascadeOnDelete();
    $table->date('last_service_date')->nullable();
    $table->integer('trips_since')->default(0);
    $table->decimal('km_since', 10, 1)->default(0);
    $table->boolean('needs_baseline')->default(true);
    $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

    $table->unique(['vehicle_id', 'pm_rule_id']);
    $table->index('vehicle_id');
});
```

### `create_service_logs_table`
```php
Schema::create('service_logs', function (Blueprint $table) {
    $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
    $table->foreignUuid('vehicle_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('pm_rule_id')->constrained()->cascadeOnDelete();
    $table->date('service_date');
    $table->string('mechanic', 100);
    $table->text('parts_used')->nullable();
    $table->decimal('labor_cost', 10, 2)->default(0);
    $table->text('notes')->nullable();
    $table->enum('status', ['pending','approved','rejected'])->default('pending');
    $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
    $table->string('rejection_reason')->nullable();
    $table->timestamp('approved_at')->nullable();
    $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();

    $table->index('vehicle_id');
    $table->index('status');
    $table->index('service_date');
});
```

### `create_inspections_table`
```php
Schema::create('inspections', function (Blueprint $table) {
    $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
    $table->foreignUuid('vehicle_id')->constrained()->cascadeOnDelete();
    $table->enum('type', ['pre','post']);
    $table->foreignUuid('leadman_id')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignUuid('driver_id')->nullable()->constrained('users')->nullOnDelete();
    $table->date('inspection_date');
    $table->decimal('trip_km', 8, 1)->nullable();
    $table->decimal('trip_hours', 5, 1)->nullable();
    $table->text('notes')->nullable();
    $table->smallInteger('total_items')->default(0);
    $table->smallInteger('passed_items')->default(0);
    $table->smallInteger('flagged_items')->default(0);
    $table->timestamps();

    $table->index('vehicle_id');
    $table->index('inspection_date');
});
```

### `create_inspection_items_table`
```php
Schema::create('inspection_items', function (Blueprint $table) {
    $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
    $table->foreignUuid('inspection_id')->constrained()->cascadeOnDelete();
    $table->string('section', 100);
    $table->string('item_code', 50);
    $table->string('item_label', 150);
    $table->enum('result', ['ok','flag','skip']);
    $table->text('issue_notes')->nullable();

    $table->index('inspection_id');
    $table->index(['inspection_id', 'result']);
});
```

### `create_breakdowns_table`
```php
Schema::create('breakdowns', function (Blueprint $table) {
    $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
    $table->foreignUuid('vehicle_id')->constrained()->cascadeOnDelete();
    $table->date('incident_date');
    $table->text('issue');
    $table->string('root_cause', 100)->nullable();
    $table->string('location', 100)->nullable();
    $table->decimal('hours_down', 5, 1)->default(0);
    $table->decimal('repair_cost', 10, 2)->default(0);
    $table->foreignUuid('reported_by')->nullable()->constrained('users')->nullOnDelete();
    $table->enum('status', ['open','in_repair','resolved'])->default('open');
    $table->timestamp('resolved_at')->nullable();
    $table->timestamps();

    $table->index('vehicle_id');
    $table->index('status');
    $table->index('incident_date');
});
```

---

## 3. Eloquent Models & Relationships

### `app/Models/Vehicle.php`
```php
class Vehicle extends Model
{
    use SoftDeletes, HasUuids;

    protected $fillable = [
        'plate','make','model','type','year','color',
        'owner','registered_owner','chassis_no','motor_no',
        'driver_id','leadman_id','hub_id',
        'op_status','reg_status','condition',
        'acquisition_date','amount','terms',
        'fleet_card','insurance_policy','lto_renewal','marine_insurance',
        'remarks',
    ];

    protected $casts = [
        'acquisition_date' => 'date',
        'lto_renewal'      => 'date',
        'amount'           => 'decimal:2',
    ];

    public function driver(): BelongsTo    { return $this->belongsTo(User::class, 'driver_id'); }
    public function leadman(): BelongsTo   { return $this->belongsTo(User::class, 'leadman_id'); }
    public function hub(): BelongsTo       { return $this->belongsTo(Hub::class); }
    public function trips(): HasMany       { return $this->hasMany(Trip::class); }
    public function pmRecords(): HasMany   { return $this->hasMany(PmRecord::class); }
    public function serviceLogs(): HasMany { return $this->hasMany(ServiceLog::class); }
    public function inspections(): HasMany { return $this->hasMany(Inspection::class); }
    public function breakdowns(): HasMany  { return $this->hasMany(Breakdown::class); }

    // Computed PM health — used by API resource and Filament
    public function getPmHealthAttribute(): string
    {
        $records = $this->pmRecords()->with('pmRule')->get();
        if ($records->contains(fn($r) => app(PmService::class)->isOverdue($r))) return 'red';
        if ($records->contains(fn($r) => app(PmService::class)->isDueSoon($r))) return 'yellow';
        if ($records->contains(fn($r) => $r->needs_baseline)) return 'grey';
        return 'green';
    }
}
```

### `app/Models/PmRecord.php`
```php
class PmRecord extends Model
{
    use HasUuids;

    public $timestamps = false;
    protected $touches = ['updated_at'];  // manual update only

    protected $fillable = [
        'vehicle_id','pm_rule_id','last_service_date',
        'trips_since','km_since','needs_baseline',
    ];

    protected $casts = [
        'last_service_date' => 'date',
        'needs_baseline'    => 'boolean',
    ];

    public function vehicle(): BelongsTo { return $this->belongsTo(Vehicle::class); }
    public function pmRule(): BelongsTo  { return $this->belongsTo(PmRule::class); }
}
```

### `app/Models/PmRule.php`
```php
class PmRule extends Model
{
    use HasUuids;

    protected $fillable = ['code','label','trip_limit','km_limit','cal_months','cal_weeks','applicable_types'];
    protected $casts    = ['applicable_types' => 'array'];
}
```

### `app/Models/ServiceLog.php`
```php
class ServiceLog extends Model
{
    use HasUuids;

    protected $fillable = [
        'vehicle_id','pm_rule_id','service_date','mechanic',
        'parts_used','labor_cost','notes','status',
        'approved_by','rejection_reason','approved_at','created_by',
    ];

    protected $casts = ['service_date' => 'date', 'approved_at' => 'datetime'];

    public function vehicle(): BelongsTo  { return $this->belongsTo(Vehicle::class); }
    public function pmRule(): BelongsTo   { return $this->belongsTo(PmRule::class); }
    public function approver(): BelongsTo { return $this->belongsTo(User::class, 'approved_by'); }
    public function creator(): BelongsTo  { return $this->belongsTo(User::class, 'created_by'); }
}
```

### `app/Models/Trip.php`
```php
class Trip extends Model
{
    use HasUuids;

    protected $fillable = [
        'vehicle_id','route_id','driver_id','leadman_id',
        'created_by','trip_date','km','hours','notes','synced_to_pm',
    ];

    protected $casts = ['trip_date' => 'date', 'synced_to_pm' => 'boolean'];

    public function vehicle(): BelongsTo { return $this->belongsTo(Vehicle::class); }
    public function route(): BelongsTo   { return $this->belongsTo(Route::class); }
    public function driver(): BelongsTo  { return $this->belongsTo(User::class, 'driver_id'); }
    public function leadman(): BelongsTo { return $this->belongsTo(User::class, 'leadman_id'); }
}
```

---

## 4. Authentication

Uses **Laravel Sanctum** for both SPA (web) and mobile token auth.

### Routes (`routes/api.php`)
```php
Route::prefix('v1')->group(function () {

    // Public
    Route::post('/auth/login',   [AuthController::class, 'login']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // Protected
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me',      [AuthController::class, 'me']);

        // ... all other routes
    });
});
```

### `app/Http/Controllers/AuthController.php`
```php
public function login(Request $request): JsonResponse
{
    $credentials = $request->validate([
        'email'    => ['required', 'email'],
        'password' => ['required'],
    ]);

    if (!Auth::attempt($credentials)) {
        return response()->json(['error' => 'INVALID_CREDENTIALS'], 401);
    }

    $user  = Auth::user();
    $token = $user->createToken('fleet-api', ['*'], now()->addHours(24))->plainTextToken;

    return response()->json([
        'access_token' => $token,
        'token_type'   => 'Bearer',
        'user' => [
            'id'       => $user->id,
            'name'     => $user->name,
            'role'     => $user->role,
            'hub'      => $user->hub?->name,
        ],
    ]);
}

public function logout(Request $request): Response
{
    $request->user()->currentAccessToken()->delete();
    return response()->noContent();
}
```

### Authorization via Policies

Generate a policy per model:
```bash
php artisan make:policy VehiclePolicy --model=Vehicle
php artisan make:policy ServiceLogPolicy --model=ServiceLog
# ... repeat for Trip, Inspection, Breakdown
```

Example `ServiceLogPolicy`:
```php
public function approve(User $user, ServiceLog $log): bool
{
    return in_array($user->role, ['admin', 'manager'])
        && $log->status === 'pending';
}
```

Register policies in `AuthServiceProvider`, then use in controllers:
```php
$this->authorize('approve', $serviceLog);
```

---

## 5. API Endpoints

All routes are under `routes/api.php` inside the `auth:sanctum` middleware group and prefixed `v1/`.

### Vehicles

#### `GET /vehicles`

Controller: `VehicleController@index`

**Query params (via `spatie/laravel-query-builder`):**

| Param | Example | Notes |
|-------|---------|-------|
| `filter[reg_status]` | `active` | active, retired, junk, sold |
| `filter[op_status]` | `running` | running, maintenance, idle |
| `filter[hub_id]` | `uuid` | |
| `filter[q]` | `NCR-1234` | searches plate, make, driver name |
| `sort` | `-created_at` | prefix `-` for descending |
| `page[number]` | `1` | |
| `page[size]` | `50` | max 200 |

```json
// 200 OK
{
  "data": [
    {
      "id": "uuid",
      "plate": "NCR-1234",
      "make": "Isuzu",
      "model": "Elf",
      "type": "6W",
      "year": 2019,
      "color": "White",
      "driver": { "id": "uuid", "name": "Juan dela Cruz" },
      "leadman": { "id": "uuid", "name": "Pedro Santos" },
      "hub": { "id": "uuid", "name": "Valenzuela" },
      "op_status": "running",
      "reg_status": "active",
      "condition": "Good",
      "lto_renewal": "2026-12-31",
      "pm_health": {
        "status": "yellow",
        "overdue_count": 0,
        "due_soon_count": 2
      }
    }
  ],
  "meta": { "current_page": 1, "per_page": 50, "total": 20 },
  "links": { "first": "...", "last": "...", "next": null, "prev": null }
}
```

#### `GET /vehicles/{vehicle}`

Returns full vehicle + PM health detail.

```json
// 200 OK
{
  "data": {
    "id": "uuid",
    "plate": "NCR-1234",
    // ... all fields ...
    "pm_health": {
      "status": "red",
      "overdue": [
        {
          "rule_code": "engine_oil",
          "label": "Engine Oil Change",
          "trips_since": 32,
          "trip_limit": 30,
          "km_since": 1310,
          "km_limit": 1200,
          "pct_trips": 107,
          "pct_km": 109,
          "last_service_date": "2026-02-10"
        }
      ],
      "due_soon": [],
      "ok": []
    }
  }
}
```

#### `POST /vehicles`

Role: `admin`

```json
// Request
{
  "plate": "NCR-9999",
  "make": "Isuzu",
  "model": "Elf",
  "type": "6W",
  "year": 2022,
  "color": "White",
  "owner": "eShip BPO",
  "registered_owner": "eShip Logistics Inc.",
  "chassis_no": "ISUZU-123456",
  "motor_no": "4HK1-789012",
  "driver_id": "uuid",
  "leadman_id": "uuid",
  "hub_id": "uuid",
  "condition": "Good",
  "acquisition_date": "2022-06-01",
  "amount": 1800000.00,
  "terms": "36 Months",
  "fleet_card": "FC-001",
  "insurance_policy": "POL-2024-099",
  "lto_renewal": "2027-06-01",
  "remarks": ""
}

// 201 Created — returns full vehicle object
```

On create, the controller also calls `PmService::initRecords($vehicle)` to seed `pm_records` rows for every applicable PM rule.

#### `PUT /vehicles/{vehicle}`

Role: `admin`. Same body, all fields optional. Returns updated vehicle.

#### `PATCH /vehicles/{vehicle}/status`

Role: `admin`. Change registry status.

```json
// Request
{ "reg_status": "retired" }

// 200 OK
{ "data": { "id": "uuid", "reg_status": "retired" } }
```

---

### Inspections

#### `GET /inspections`

| Param | Notes |
|-------|-------|
| `filter[vehicle_id]` | uuid |
| `filter[type]` | pre, post |
| `filter[date_from]` / `filter[date_to]` | ISO date |
| `filter[has_flags]` | true/false |
| `sort` | `-inspection_date` |

```json
// 200 OK
{
  "data": [
    {
      "id": "uuid",
      "vehicle": { "id": "uuid", "plate": "NCR-1234", "make": "Isuzu", "model": "Elf" },
      "type": "pre",
      "inspection_date": "2026-05-22",
      "leadman": { "id": "uuid", "name": "Pedro Santos" },
      "driver": { "id": "uuid", "name": "Juan dela Cruz" },
      "trip_km": 120.5,
      "trip_hours": 4.5,
      "total_items": 41,
      "passed_items": 39,
      "flagged_items": 2
    }
  ],
  "meta": { ... }
}
```

#### `GET /inspections/{inspection}`

Includes all checklist items grouped by section.

```json
// 200 OK
{
  "data": {
    "id": "uuid",
    "vehicle": { ... },
    "type": "pre",
    "inspection_date": "2026-05-22",
    "leadman": { ... },
    "driver": { ... },
    "trip_km": 120.5,
    "trip_hours": 4.5,
    "notes": "Driver reported vibration",
    "total_items": 41,
    "passed_items": 39,
    "flagged_items": 2,
    "sections": [
      {
        "section": "Engine & Fluids",
        "items": [
          { "item_code": "engine_oil_level", "item_label": "Engine Oil Level", "result": "ok", "issue_notes": null },
          { "item_code": "coolant_level",    "item_label": "Coolant Level",    "result": "flag", "issue_notes": "Low, topped up" }
        ]
      }
    ]
  }
}
```

#### `POST /inspections`

Role: `driver`, `leadman`, `dispatcher`, `admin`

```json
// Request
{
  "vehicle_id": "uuid",
  "type": "pre",
  "leadman_id": "uuid",
  "driver_id": "uuid",
  "inspection_date": "2026-05-22",
  "trip_km": 120.5,
  "trip_hours": 4.5,
  "notes": "",
  "items": [
    {
      "section": "Engine & Fluids",
      "item_code": "engine_oil_level",
      "item_label": "Engine Oil Level",
      "result": "ok",
      "issue_notes": null
    },
    {
      "section": "Engine & Fluids",
      "item_code": "coolant_level",
      "item_label": "Coolant Level",
      "result": "flag",
      "issue_notes": "Low level, topped up before departure"
    }
  ]
}

// 201 Created
{
  "data": {
    "id": "uuid",
    "total_items": 41,
    "passed_items": 40,
    "flagged_items": 1
  }
}
```

The controller computes `total_items`, `passed_items`, `flagged_items` from the submitted items before saving.

---

### Trips & Dispatch

#### `GET /trips`

| Param | Notes |
|-------|-------|
| `filter[vehicle_id]` | uuid |
| `filter[route_id]` | uuid |
| `filter[date_from]` / `filter[date_to]` | ISO date |
| `filter[synced_to_pm]` | true / false |
| `sort` | `-trip_date` (default) |

```json
// 200 OK
{
  "data": [
    {
      "id": "uuid",
      "vehicle": { "id": "uuid", "plate": "NCR-1234", "make": "Isuzu", "model": "Elf", "type": "6W" },
      "route": { "id": "uuid", "name": "Valenzuela → SLEX", "avg_km": 85, "zone": "Metro Manila" },
      "driver": { "id": "uuid", "name": "Juan dela Cruz" },
      "leadman": { "id": "uuid", "name": "Pedro Santos" },
      "trip_date": "2026-05-22",
      "km": 87.5,
      "hours": 3.5,
      "synced_to_pm": true,
      "notes": ""
    }
  ],
  "meta": { ... }
}
```

#### `POST /trips`

Role: `dispatcher`, `leadman`, `admin`

```json
// Request
{
  "vehicle_id": "uuid",
  "route_id": "uuid",
  "driver_id": "uuid",
  "leadman_id": "uuid",
  "trip_date": "2026-05-22",
  "km": 87.5,
  "hours": 3.5,
  "notes": "",
  "sync_to_pm": true
}

// 201 Created
{
  "data": {
    "id": "uuid",
    "synced_to_pm": true,
    "pm_alerts": [
      {
        "rule_code": "engine_oil",
        "label": "Engine Oil Change",
        "status": "due_soon",
        "trips_since": 27,
        "trip_limit": 30
      }
    ]
  }
}
```

When `sync_to_pm: true`, the controller calls `PmService::syncTrip($trip)` which increments `pm_records` counters and returns any rules that crossed a threshold.

#### `DELETE /trips/{trip}`

Role: `admin`. Soft-deletes the trip and rolls back PM counters via `PmService::rollbackTrip($trip)`.

```json
// 200 OK
{ "message": "Trip deleted and PM counters rolled back." }
```

---

### Preventive Maintenance

#### `GET /pm/status`

Returns PM status for all vehicles (or filtered). Used by the Dashboard and Maintenance Engine screens.

| Param | Notes |
|-------|-------|
| `filter[vehicle_id]` | single vehicle |
| `filter[hub_id]` | filter by hub |
| `filter[status]` | overdue, due_soon, ok, baseline |

```json
// 200 OK
{
  "data": [
    {
      "vehicle": { "id": "uuid", "plate": "NCR-1234", "type": "6W", "hub": "Valenzuela" },
      "health": "red",
      "overdue_count": 1,
      "due_soon_count": 1,
      "rules": [
        {
          "pm_rule_id": "uuid",
          "rule_code": "engine_oil",
          "label": "Engine Oil Change",
          "status": "overdue",
          "trips_since": 32,
          "trip_limit": 30,
          "km_since": 1310,
          "km_limit": 1200,
          "last_service_date": "2026-02-10",
          "days_since_service": 101,
          "cal_months": 2,
          "pct_trips": 107,
          "pct_km": 109,
          "pct_cal": 168
        }
      ]
    }
  ]
}
```

#### `GET /pm/rules`

List all PM rules.

```json
// 200 OK
{
  "data": [
    {
      "id": "uuid",
      "code": "engine_oil",
      "label": "Engine Oil Change",
      "trip_limit": 30,
      "km_limit": 1200,
      "cal_months": 2,
      "cal_weeks": null,
      "applicable_types": ["10W","6W","4W"]
    }
  ]
}
```

#### `POST /pm/rules` / `PUT /pm/rules/{rule}`

Role: `admin`

```json
// Request
{
  "code": "ac_filter",
  "label": "AC Filter Cleaning",
  "trip_limit": 60,
  "km_limit": null,
  "cal_months": 3,
  "cal_weeks": null,
  "applicable_types": ["4W"]
}
// 201 Created / 200 OK — returns rule object
```

---

### Service Logs

#### `GET /service-logs`

| Param | Notes |
|-------|-------|
| `filter[vehicle_id]` | uuid |
| `filter[pm_rule_id]` | uuid |
| `filter[status]` | pending, approved, rejected |
| `filter[date_from]` / `filter[date_to]` | ISO date |
| `sort` | `-service_date` |

```json
// 200 OK
{
  "data": [
    {
      "id": "uuid",
      "vehicle": { "id": "uuid", "plate": "NCR-1234" },
      "pm_rule": { "id": "uuid", "code": "engine_oil", "label": "Engine Oil Change" },
      "service_date": "2026-04-10",
      "mechanic": "Rolly Reyes",
      "parts_used": "Shell Helix 10W-40 (4L), oil filter",
      "labor_cost": 500.00,
      "notes": "",
      "status": "approved",
      "approved_by": { "id": "uuid", "name": "Manager Name" },
      "approved_at": "2026-04-11T09:00:00Z"
    }
  ],
  "meta": { ... }
}
```

#### `POST /service-logs`

Role: `mechanic`, `leadman`, `dispatcher`, `admin`

```json
// Request
{
  "vehicle_id": "uuid",
  "pm_rule_id": "uuid",
  "service_date": "2026-05-20",
  "mechanic": "Rolly Reyes",
  "parts_used": "Shell Helix 10W-40 (4L), oil filter",
  "labor_cost": 500.00,
  "notes": ""
}

// 201 Created
{ "data": { "id": "uuid", "status": "pending" } }
```

#### `PATCH /service-logs/{serviceLog}/approve`

Role: `manager`, `admin`

Calls `PmService::resetCounters($serviceLog)` which sets `trips_since = 0`, `km_since = 0`, `last_service_date = service_date`, `needs_baseline = false`.

```json
// 200 OK
{
  "data": {
    "id": "uuid",
    "status": "approved",
    "approved_at": "2026-05-22T10:00:00Z",
    "pm_reset": {
      "vehicle_id": "uuid",
      "pm_rule_id": "uuid",
      "trips_since": 0,
      "km_since": 0,
      "last_service_date": "2026-05-20"
    }
  }
}
```

#### `PATCH /service-logs/{serviceLog}/reject`

Role: `manager`, `admin`

```json
// Request
{ "reason": "Incorrect parts listed" }

// 200 OK
{ "data": { "id": "uuid", "status": "rejected", "rejection_reason": "Incorrect parts listed" } }
```

---

### Breakdowns

#### `GET /breakdowns`

| Param | Notes |
|-------|-------|
| `filter[vehicle_id]` | uuid |
| `filter[status]` | open, in_repair, resolved |
| `filter[date_from]` / `filter[date_to]` | ISO date |
| `sort` | `-incident_date` |

```json
// 200 OK
{
  "data": [
    {
      "id": "uuid",
      "vehicle": { "id": "uuid", "plate": "NCR-1234", "make": "Isuzu", "model": "Elf" },
      "incident_date": "2026-03-15",
      "issue": "Engine overheating on SLEX southbound",
      "root_cause": "Wear & Tear",
      "location": "SLEX KM 42",
      "hours_down": 6.5,
      "repair_cost": 12500.00,
      "reported_by": { "id": "uuid", "name": "Juan dela Cruz" },
      "status": "resolved",
      "resolved_at": "2026-03-16T14:00:00Z"
    }
  ],
  "meta": { ... }
}
```

#### `POST /breakdowns`

Role: `driver`, `leadman`, `dispatcher`, `admin`

```json
// Request
{
  "vehicle_id": "uuid",
  "incident_date": "2026-05-22",
  "issue": "Flat tire on C-5",
  "root_cause": "Road Damage",
  "location": "C-5 Northbound near BGC",
  "hours_down": 2.0,
  "repair_cost": 3500.00
}

// 201 Created
{ "data": { "id": "uuid", "status": "open" } }
```

#### `PATCH /breakdowns/{breakdown}`

Role: `admin`, `manager`

```json
// Request
{ "status": "resolved", "hours_down": 2.5, "repair_cost": 3800.00 }

// 200 OK
{ "data": { "id": "uuid", "status": "resolved", "resolved_at": "2026-05-22T15:30:00Z" } }
```

---

### Reports & Analytics

All require `manager` or `admin`. These are read-only, aggregated query endpoints.

#### `GET /reports/overview`

**Query params:** `year` (default: current), `hub_id`

```json
// 200 OK
{
  "data": {
    "year": 2026,
    "total_trips": 1878,
    "total_km": 75200,
    "total_breakdowns": 10,
    "maintenance_cost": 130400.00,
    "fuel_cost": 890000.00,
    "fleet_uptime_pct": 95.2,
    "pm_compliance_pct": 88.0,
    "trip_target_pct": 92.0,
    "active_vehicles": 18,
    "vehicles_in_maintenance": 2
  }
}
```

#### `GET /reports/monthly`

**Query params:** `year`, `hub_id`

```json
// 200 OK
{
  "data": [
    {
      "month": "2026-01",
      "trips": 145,
      "target": 160,
      "km": 5800,
      "fuel_cost": 72000.00,
      "maintenance_cost": 9500.00
    }
  ]
}
```

#### `GET /reports/breakdowns`

**Query params:** `year`, `hub_id`

```json
// 200 OK
{
  "data": {
    "total_incidents": 10,
    "total_hours_down": 64,
    "total_cost": 110400.00,
    "root_causes": [
      { "cause": "Wear & Tear", "count": 4, "pct": 40 },
      { "cause": "Driver Error", "count": 3, "pct": 30 }
    ],
    "incidents": [ ... ]
  }
}
```

#### `GET /reports/locations`

```json
// 200 OK
{
  "data": [
    {
      "hub": "Valenzuela",
      "active_vehicles": 14,
      "total_vehicles": 16,
      "total_trips": 1465,
      "pct_of_fleet": 78
    }
  ]
}
```

#### `GET /reports/pm-compliance`

**Query params:** `hub_id`, `vehicle_id`

```json
// 200 OK
{
  "data": {
    "overall_pct": 88.0,
    "overdue_count": 5,
    "due_soon_count": 8,
    "ok_count": 147,
    "by_vehicle": [
      {
        "vehicle": { "id": "uuid", "plate": "NCR-1234" },
        "health": "red",
        "overdue_rules": ["Engine Oil Change"],
        "due_soon_rules": ["Air Filter Cleaning"]
      }
    ]
  }
}
```

---

### Reference Data

#### `GET /routes`
```json
{
  "data": [
    { "id": "uuid", "name": "Valenzuela → SLEX", "avg_km": 85, "avg_hrs": 3.5, "zone": "Metro Manila" }
  ]
}
```

#### `POST /routes` / `PUT /routes/{route}`
Role: `admin`
```json
{ "name": "Valenzuela → NLEX", "avg_km": 60, "avg_hrs": 2.5, "zone": "Metro Manila" }
```

#### `GET /hubs`
```json
{ "data": [{ "id": "uuid", "name": "Valenzuela", "region": "NCR" }] }
```

#### `GET /users`
Role: `admin`, `manager`. Params: `filter[role]`, `filter[hub_id]`, `filter[is_active]`
```json
{
  "data": [
    { "id": "uuid", "name": "Juan dela Cruz", "role": "driver", "hub": "Valenzuela", "is_active": true }
  ]
}
```

---

## 6. Filament Admin Panel Resources

Filament runs at `/admin` and serves **managers and admins**. Generate resources:

```bash
php artisan make:filament-resource Vehicle --generate
php artisan make:filament-resource User --generate
php artisan make:filament-resource ServiceLog --generate
php artisan make:filament-resource Trip --generate
php artisan make:filament-resource Inspection --generate
php artisan make:filament-resource Breakdown --generate
php artisan make:filament-resource PmRule --generate
php artisan make:filament-resource Route --generate
```

### VehicleResource

**Table columns:** Plate, Make/Model, Type, Hub, Driver, Leadman, Op Status (badge), Reg Status (badge), PM Health (badge with color), LTO Renewal (date, highlight if within 30 days)

**Form fields:** All vehicle fields. Use `Select` for driver/leadman/hub (relationship selects), `Select` for type/status enums, `DatePicker` for dates, `TextInput` for text.

**Filters:** Reg Status, Op Status, Hub, PM Health

**Actions:**
- `Action::make('retire')` — changes reg_status to 'retired'
- `Action::make('reactivate')` — changes reg_status to 'active'
- `ViewAction` to see PM detail panel

### ServiceLogResource

**Table columns:** Vehicle (plate), PM Rule, Service Date, Mechanic, Labor Cost, Status (badge: pending=yellow, approved=green, rejected=red), Approved By

**Filters:** Status, Vehicle, PM Rule, Date range

**Actions:**
- `Action::make('approve')` — visible only when status=pending, calls `PmService::resetCounters()`
- `Action::make('reject')` — modal with reason input
- Bulk approve action for managers

### DashboardPage (Custom Filament Page)

Replace the default Filament dashboard with a custom page at `/admin`:

```bash
php artisan make:filament-page Dashboard
```

**Widgets to build:**

```bash
php artisan make:filament-widget FleetOverviewWidget   # cards: running/maintenance/idle/PM overdue counts
php artisan make:filament-widget PmAlertWidget         # table of overdue vehicles
php artisan make:filament-widget PendingApprovalsWidget # count of pending service logs
php artisan make:filament-widget MonthlyTripsChartWidget # bar chart using Filament's built-in chart widget
```

### Filament Access Control

Restrict panel to admin/manager in `app/Providers/Filament/AdminPanelProvider.php`:

```php
->authMiddleware([Authenticate::class])
->authGuard('web')

// In AdminPanelProvider boot():
public function panel(Panel $panel): Panel
{
    return $panel
        ->login()
        ->middleware([...])
        ->authMiddleware([Authenticate::class])
        ->discoverResources(in: app_path('Filament/Resources'), for: 'App\\Filament\\Resources');
}
```

Add a `canAccessPanel` method to the User model:

```php
// app/Models/User.php
public function canAccessPanel(Panel $panel): bool
{
    return in_array($this->role, ['admin', 'manager']) && $this->is_active;
}
```

---

## 7. Business Logic Services

All PM logic lives in a single service class to keep controllers thin.

### `app/Services/PmService.php`

```php
class PmService
{
    /**
     * Seed pm_records for a new vehicle — one row per applicable rule.
     */
    public function initRecords(Vehicle $vehicle): void
    {
        PmRule::all()
            ->filter(fn($rule) => in_array($vehicle->type, $rule->applicable_types))
            ->each(function ($rule) use ($vehicle) {
                PmRecord::firstOrCreate([
                    'vehicle_id' => $vehicle->id,
                    'pm_rule_id' => $rule->id,
                ], [
                    'trips_since'   => 0,
                    'km_since'      => 0,
                    'needs_baseline' => true,
                ]);
            });
    }

    /**
     * Increment counters for all applicable rules when a trip is logged.
     * Returns rules that just crossed into due_soon or overdue.
     */
    public function syncTrip(Trip $trip): array
    {
        $vehicle = $trip->vehicle;
        $alerts  = [];

        PmRecord::where('vehicle_id', $vehicle->id)
            ->with('pmRule')
            ->get()
            ->each(function ($record) use ($trip, &$alerts) {
                $prevStatus = $this->getStatus($record);

                $record->increment('trips_since', 1);
                $record->increment('km_since', $trip->km);
                $record->touch();

                $record->refresh();
                $newStatus = $this->getStatus($record);

                if ($prevStatus === 'ok' && in_array($newStatus, ['due_soon', 'overdue'])) {
                    $alerts[] = [
                        'rule_code'   => $record->pmRule->code,
                        'label'       => $record->pmRule->label,
                        'status'      => $newStatus,
                        'trips_since' => $record->trips_since,
                        'trip_limit'  => $record->pmRule->trip_limit,
                    ];
                }
            });

        $trip->update(['synced_to_pm' => true]);

        return $alerts;
    }

    /**
     * Roll back PM counters when a trip is deleted.
     */
    public function rollbackTrip(Trip $trip): void
    {
        if (!$trip->synced_to_pm) return;

        PmRecord::where('vehicle_id', $trip->vehicle_id)
            ->get()
            ->each(function ($record) use ($trip) {
                $record->decrement('trips_since', 1);
                $record->decrement('km_since', $trip->km);
                $record->touch();
            });
    }

    /**
     * Reset counters after an approved service log.
     */
    public function resetCounters(ServiceLog $log): PmRecord
    {
        $record = PmRecord::where('vehicle_id', $log->vehicle_id)
            ->where('pm_rule_id', $log->pm_rule_id)
            ->firstOrFail();

        $record->update([
            'trips_since'     => 0,
            'km_since'        => 0,
            'last_service_date' => $log->service_date,
            'needs_baseline'  => false,
        ]);

        return $record;
    }

    /**
     * Return 'overdue' | 'due_soon' | 'baseline' | 'ok'
     */
    public function getStatus(PmRecord $record): string
    {
        if ($record->needs_baseline) return 'baseline';

        $rule = $record->pmRule;

        if ($this->isOverdue($record)) return 'overdue';
        if ($this->isDueSoon($record)) return 'due_soon';
        return 'ok';
    }

    public function isOverdue(PmRecord $record): bool
    {
        $rule = $record->pmRule;

        if ($rule->trip_limit && $record->trips_since >= $rule->trip_limit) return true;
        if ($rule->km_limit   && $record->km_since   >= $rule->km_limit)   return true;
        if ($rule->cal_months && $record->last_service_date
            && $record->last_service_date->diffInMonths(now()) >= $rule->cal_months) return true;
        if ($rule->cal_weeks  && $record->last_service_date
            && $record->last_service_date->diffInWeeks(now())  >= $rule->cal_weeks)  return true;

        return false;
    }

    public function isDueSoon(PmRecord $record): bool
    {
        if ($this->isOverdue($record)) return false;

        $rule      = $record->pmRule;
        $threshold = 0.85;

        if ($rule->trip_limit && ($record->trips_since / $rule->trip_limit) >= $threshold) return true;
        if ($rule->km_limit   && ($record->km_since   / $rule->km_limit)   >= $threshold) return true;
        if ($rule->cal_months && $record->last_service_date) {
            $dayLimit = $rule->cal_months * 30;
            if ($record->last_service_date->diffInDays(now()) / $dayLimit >= $threshold) return true;
        }

        return false;
    }
}
```

---

## 8. Error Responses

Laravel's default exception handler returns JSON for API routes. Extend `app/Exceptions/Handler.php` to enforce consistent shape:

```json
// Validation error (422)
{
  "error": "VALIDATION_ERROR",
  "message": "The given data was invalid.",
  "details": {
    "plate": ["The plate field is required."],
    "type":  ["The selected type is invalid."]
  }
}

// Auth errors (401 / 403)
{ "error": "UNAUTHENTICATED", "message": "Unauthenticated." }
{ "error": "FORBIDDEN", "message": "This action is unauthorized." }

// Not found (404)
{ "error": "NOT_FOUND", "message": "No query results for model [Vehicle]." }

// Business rule violation (409 / 422)
{ "error": "UNPROCESSABLE", "message": "Service log is already approved." }
```

Map HTTP codes:

| Status | `error` key | Source |
|--------|------------|--------|
| 401 | `UNAUTHENTICATED` | Sanctum middleware |
| 403 | `FORBIDDEN` | Policy denial |
| 404 | `NOT_FOUND` | Model not found |
| 409 | `CONFLICT` | Unique constraint (e.g. duplicate plate) |
| 422 | `VALIDATION_ERROR` | FormRequest validation |
| 422 | `UNPROCESSABLE` | Business rule check |
| 500 | `INTERNAL_ERROR` | Unexpected exceptions |

---

## 9. Implementation Order

Work through these in sequence — each layer depends on the previous one.

| # | Task | Artisan Commands |
|---|------|-----------------|
| 1 | Project setup, Sanctum, Filament, spatie/permission | See §1 |
| 2 | Migrations | `php artisan migrate` |
| 3 | Models + relationships | `php artisan make:model Hub Trip Route PmRule PmRecord ServiceLog Inspection InspectionItem Breakdown` |
| 4 | Seed data — hubs, PM rules, 12 routes, 20 vehicles | `php artisan make:seeder DatabaseSeeder` |
| 5 | Auth — login/logout/me, role middleware | `php artisan make:controller AuthController` |
| 6 | `PmService` | `app/Services/PmService.php` |
| 7 | Vehicles CRUD | `php artisan make:controller Api/VehicleController --api` |
| 8 | Trips + PM sync | `php artisan make:controller Api/TripController --api` |
| 9 | Service Logs + approve/reject | `php artisan make:controller Api/ServiceLogController --api` |
| 10 | Inspections | `php artisan make:controller Api/InspectionController --api` |
| 11 | Breakdowns | `php artisan make:controller Api/BreakdownController --api` |
| 12 | Reports (aggregation queries) | `php artisan make:controller Api/ReportController` |
| 13 | Filament Resources | See §6 |
| 14 | Filament Dashboard widgets | See §6 |
| 15 | API Resources (response transformers) | `php artisan make:resource VehicleResource TripResource ...` |
| 16 | Form Requests (validation) | `php artisan make:request StoreVehicleRequest ...` |
| 17 | Policies | `php artisan make:policy VehiclePolicy ...` |
