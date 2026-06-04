import { useState, useEffect, useMemo } from "react";
import { useB } from "./contexts/ThemeContext";
import { list as listVehicles } from "./api/vehicles";
import { fetchPmSchedule } from "./api/maintenance";
import { fetchSections } from "./api/inspections";

const HEALTH_COLOR = { green: "#4ade80", yellow: "#fde047", red: "#fca5a5", grey: "#9ca3af" };

const STATUS_STYLE = {
  running:     { bg: "#052e16", border: "#14532d", text: "#4ade80", label: "Running" },
  maintenance: { bg: "#3a0e0a", border: "#7f1d1d", text: "#fca5a5", label: "Maintenance" },
  idle:        { bg: "#1c1917", border: "#44403c", text: "#9ca3af", label: "Idle" },
};

// Condition → operational status mapping (mirrors the DB backfill migration)
const CONDITION_TO_OPS = {
  "Under Repair": "maintenance",
  "Damaged":      "maintenance",
  "Inactive":     "idle",
};

// ── Resolve operational status — DB column is authoritative; condition is the fallback
function resolveOperationalStatus(vehicle) {
  if (vehicle.operational_status) return vehicle.operational_status;
  const cond        = vehicle.condition?.label ?? "";
  const fleetStatus = vehicle.status ?? "active";
  if (CONDITION_TO_OPS[cond]) return CONDITION_TO_OPS[cond];
  if (["retired","junk","sold"].includes(fleetStatus)) return "idle";
  return "running";
}

// ── Build a dashboard-ready vehicle by joining API vehicle + PM schedule rows
function buildDashboardVehicle(vehicle, pmRows) {
  const overdue = pmRows.filter(r => r.status === "overdue").map(r => r.pm_rule_label);
  const dueSoon = pmRows.filter(r => r.status === "due_soon").map(r => r.pm_rule_label);

  // PM health: override stored health_color with live PM data when available
  let health = vehicle.health_color ?? "grey";
  if (pmRows.length > 0) {
    health = overdue.length > 0 ? "red" : dueSoon.length > 0 ? "yellow" : "green";
  }

  // For the trip tracker, pick the most overdue (highest pct) PM rule
  const worstRow = [...pmRows].sort((a, b) => b.pct - a.pct)[0];

  return {
    id:           vehicle.id,
    plate:        vehicle.plate,
    make:         vehicle.make,
    model:        vehicle.model,
    type:         vehicle.vehicle_type?.code ?? "",
    location:     vehicle.location?.name ?? "",
    condition:    vehicle.condition?.label ?? "",
    status:       resolveOperationalStatus(vehicle),
    health,
    overdue,
    dueSoon,
    tripsSince:   worstRow?.trips_since  ?? 0,
    tripsAllowed: worstRow?.trip_limit   ?? 30,
    lastService:  worstRow?.last_service_date ?? null,
    pmRows,       // full PM rows for the detail panel
  };
}

// ── Shared UI components ──────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.idle;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
      {s.label}
    </span>
  );
}

function HealthDot({ health }) {
  return (
    <span style={{ width: 8, height: 8, borderRadius: "50%",
      background: HEALTH_COLOR[health] ?? "#9ca3af", display: "inline-block" }} />
  );
}

// ── Detail panel (bottom sheet) ───────────────────────────────────────────────
function DetailPanel({ v, sections, onClose }) {
  const B = useB();
  const [tab, setTab] = useState("status");

  // Build flat checklist items per type
  const checklistItems = useMemo(() => {
    const type = tab === "pre" ? "pre" : "post";
    const matchingSections = sections.filter(s => s.inspection_type === type);
    return matchingSections.flatMap(s =>
      (s.items ?? []).map(item => ({ ...item, sectionLabel: s.label }))
    );
  }, [tab, sections]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 100,
      display: "flex", alignItems: "flex-end" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: B.navyMid, borderRadius: "16px 16px 0 0", width: "100%",
        maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "16px 16px 0", borderBottom: `1px solid ${B.navyBorder}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ color: B.white, fontWeight: 800, fontSize: 18 }}>{v.plate}</div>
              <div style={{ color: B.muted, fontSize: 12, marginTop: 2 }}>
                {v.make} {v.model} · {v.type} · {v.location}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: B.muted, fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[["status","Status"],["pre","Pre-Trip"],["post","Post-Trip"]].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: "6px 14px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 700,
                background:  tab === k ? B.navyLight : "transparent",
                color:       tab === k ? B.white : B.muted,
                borderBottom: `2px solid ${tab === k ? B.blue : "transparent"}`,
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: 16 }}>
          {tab === "status" && (
            <div>
              {/* Status / Condition / Health row */}
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                {[
                  ["STATUS",    <StatusBadge status={v.status} />],
                  ["CONDITION", <span style={{ color: B.white, fontSize: 13, fontWeight: 600 }}>{v.condition || "—"}</span>],
                  ["PM HEALTH", (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <HealthDot health={v.health} />
                      <span style={{ color: HEALTH_COLOR[v.health], fontSize: 12, fontWeight: 700, textTransform: "capitalize" }}>
                        {v.health}
                      </span>
                    </div>
                  )],
                ].map(([label, content]) => (
                  <div key={label} style={{ flex: 1, background: B.navyLight, borderRadius: 10, padding: 12 }}>
                    <div style={{ color: B.muted, fontSize: 10, marginBottom: 4 }}>{label}</div>
                    {content}
                  </div>
                ))}
              </div>

              {/* PM Tracker — most critical rule */}
              <div style={{ background: B.navyLight, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ color: B.muted, fontSize: 10, marginBottom: 8 }}>PM TRACKER</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: B.muted, fontSize: 12 }}>Trips since service</span>
                  <span style={{ color: B.white, fontSize: 12, fontWeight: 700 }}>
                    {v.tripsSince} / {v.tripsAllowed}
                  </span>
                </div>
                <div style={{ height: 4, background: B.navyBorder, borderRadius: 2, marginBottom: 8 }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(100, v.tripsAllowed > 0 ? (v.tripsSince / v.tripsAllowed) * 100 : 0)}%`,
                    background: v.tripsSince >= v.tripsAllowed ? B.red
                               : v.tripsSince / v.tripsAllowed > 0.8 ? B.yellowLight
                               : B.blue,
                    borderRadius: 2,
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: B.muted, fontSize: 12 }}>Last Service</span>
                  <span style={{ color: B.white, fontSize: 12 }}>{v.lastService ?? "—"}</span>
                </div>
              </div>

              {/* Overdue PM rules */}
              {v.overdue.length > 0 && (
                <div style={{ background: B.statusRedBg, border: `1px solid ${B.statusRedBorder}`,
                  borderRadius: 10, padding: 10, marginBottom: 8 }}>
                  <div style={{ color: "#991b1b", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                    OVERDUE ({v.overdue.length})
                  </div>
                  {v.overdue.map(item => (
                    <div key={item} style={{ color: "#b91c1c", fontSize: 12, marginBottom: 3 }}>• {item}</div>
                  ))}
                </div>
              )}

              {/* Due soon PM rules */}
              {v.dueSoon.length > 0 && (
                <div style={{ background: B.statusYellowBg, border: `1px solid ${B.statusYellowBorder}`,
                  borderRadius: 10, padding: 10 }}>
                  <div style={{ color: "#78350f", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                    DUE SOON ({v.dueSoon.length})
                  </div>
                  {v.dueSoon.map(item => (
                    <div key={item} style={{ color: "#92400e", fontSize: 12, marginBottom: 3 }}>• {item}</div>
                  ))}
                </div>
              )}

              {/* Full PM schedule breakdown */}
              {v.pmRows.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: B.muted, fontSize: 10, fontWeight: 700, marginBottom: 8 }}>ALL PM RULES</div>
                  {v.pmRows.map(row => (
                    <div key={row.pm_rule_id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "6px 0", borderBottom: `1px solid ${B.navyBorder}`,
                    }}>
                      <span style={{ color: B.offWhite, fontSize: 12 }}>{row.pm_rule_label}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 20,
                        background: row.status === "overdue"  ? B.statusRedBg
                                  : row.status === "due_soon" ? B.statusYellowBg
                                  : B.navyLight,
                        color: row.status === "overdue"  ? "#b91c1c"
                             : row.status === "due_soon" ? "#78350f"
                             : B.greenLight,
                      }}>
                        {row.status === "overdue" ? "OVERDUE" : row.status === "due_soon" ? "DUE SOON" : "OK"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pre-Trip / Post-Trip checklist reference */}
          {(tab === "pre" || tab === "post") && (
            <div>
              <div style={{ color: B.muted, fontSize: 11, marginBottom: 12 }}>
                Quick reference — use the Inspect module for full inspection forms
              </div>
              {checklistItems.length === 0 ? (
                <p style={{ color: B.muted, fontSize: 13 }}>Loading checklist…</p>
              ) : checklistItems.map(item => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 0", borderBottom: `1px solid ${B.navyBorder}` }}>
                  <span style={{ color: B.muted, fontSize: 16 }}>○</span>
                  <span style={{ color: B.offWhite, fontSize: 13 }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function FleetDashboard() {
  const B = useB();

  const [vehicles,      setVehicles]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [selected,      setSelected]      = useState(null);
  const [filter,        setFilter]        = useState("all");
  const [sections,      setSections]      = useState([]);  // pre + post checklist sections

  // Load vehicles + PM schedule in parallel
  useEffect(() => {
    setLoading(true);
    Promise.all([
      listVehicles({ per_page: 100 }),
      fetchPmSchedule(),
      fetchSections("pre"),
      fetchSections("post"),
    ])
      .then(([vehiclesRes, pmRes, preSections, postSections]) => {
        const rawVehicles = vehiclesRes.data ?? [];
        const pmRows      = pmRes.data ?? [];
        const allSections = [
          ...(preSections.data ?? []),
          ...(postSections.data ?? []),
        ];
        setSections(allSections);

        // Join vehicles with their PM schedule rows
        const pmByVehicle = {};
        pmRows.forEach(row => {
          if (!pmByVehicle[row.vehicle_id]) pmByVehicle[row.vehicle_id] = [];
          pmByVehicle[row.vehicle_id].push(row);
        });

        setVehicles(
          rawVehicles.map(v => buildDashboardVehicle(v, pmByVehicle[v.id] ?? []))
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Summary counts ──
  const summary = useMemo(() => ({
    total:       vehicles.length,
    running:     vehicles.filter(v => v.status === "running").length,
    maintenance: vehicles.filter(v => v.status === "maintenance").length,
    idle:        vehicles.filter(v => v.status === "idle").length,
    overdue:     vehicles.filter(v => v.overdue.length > 0).length,
  }), [vehicles]);

  // ── Filtered list ──
  const filtered = useMemo(() =>
    filter === "all"       ? vehicles :
    filter === "attention" ? vehicles.filter(v => v.overdue.length > 0 || v.dueSoon.length > 0) :
                             vehicles.filter(v => v.status === filter),
    [vehicles, filter]
  );

  return (
    <div style={{ minHeight: "unset", background: B.navy, padding: 16 }}>
      <h2 style={{ color: B.white, fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Fleet Dashboard</h2>
      <p style={{ color: B.muted, fontSize: 12, marginBottom: 16 }}>
        Live status — {vehicles.length} vehicles
      </p>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          ["Running",    summary.running,     B.greenLight,  B.statusGreenBg,   B.statusGreenBorder],
          ["Maintenance",summary.maintenance, B.redLight,    B.statusRedBg,     B.statusRedBorder],
          ["Idle",       summary.idle,        B.muted,       B.statusGrayBg,    B.statusGrayBorder],
          ["PM Overdue", summary.overdue,     B.yellowLight, B.statusYellowBg,  B.statusYellowBorder],
        ].map(([label, val, color, bg, border]) => (
          <div key={label} style={{ background: bg, borderRadius: 12, padding: "12px 14px",
            border: `1px solid ${border}` }}>
            <div style={{ color, fontSize: 26, fontWeight: 800 }}>{val}</div>
            <div style={{ color: B.muted, fontSize: 11, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter buttons */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
        {[["all","All"],["running","Running"],["maintenance","Maintenance"],["idle","Idle"],["attention","Needs Attention"]].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: "5px 12px", borderRadius: 20,
            border: `1px solid ${filter === k ? B.blue : B.navyBorder}`,
            background: filter === k ? B.blue : B.navyLight,
            color: filter === k ? "#FFFFFF" : B.muted,
            fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
          }}>{label}</button>
        ))}
      </div>

      {/* Vehicle list */}
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
          {Array.from({ length: 5 }).map((_, i) => {
            const sh = { background:`linear-gradient(90deg,${B.navyLight} 25%,${B.navyBorder} 50%,${B.navyLight} 75%)`, backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite", borderRadius:6 };
            return (
              <div key={i} style={{ background:B.navyMid, borderRadius:12, padding:"12px 14px", border:`1px solid ${B.navyBorder}` }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ ...sh, height:14, width:"35%", marginBottom:8 }} />
                    <div style={{ ...sh, height:11, width:"55%", marginBottom:6 }} />
                    <div style={{ ...sh, height:11, width:"40%" }} />
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                    <div style={{ ...sh, height:11, width:60 }} />
                    <div style={{ ...sh, height:11, width:45 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(v => (
            <button key={v.id} onClick={() => setSelected(v)} style={{
              background: B.navyMid, borderRadius: 12, padding: "12px 14px",
              border: `1px solid ${v.overdue.length > 0 ? B.redBorder ?? "#7f1d1d" : B.navyBorder}`,
              cursor: "pointer", textAlign: "left", width: "100%",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <HealthDot health={v.health} />
                    <span style={{ color: B.white, fontWeight: 700, fontSize: 15 }}>{v.plate}</span>
                    <StatusBadge status={v.status} />
                  </div>
                  <div style={{ color: B.muted, fontSize: 11 }}>
                    {v.make} {v.model} · {v.type} · {v.location}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {v.overdue.length > 0 && (
                    <div style={{ color: B.redLight, fontSize: 10, fontWeight: 700 }}>
                      ⚠ {v.overdue.length} overdue
                    </div>
                  )}
                  {v.dueSoon.length > 0 && v.overdue.length === 0 && (
                    <div style={{ color: B.yellowLight, fontSize: 10, fontWeight: 700 }}>
                      {v.dueSoon.length} due soon
                    </div>
                  )}
                  <div style={{ color: B.muted, fontSize: 10, marginTop: 2 }}>
                    {v.tripsSince}/{v.tripsAllowed} trips
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <DetailPanel
          v={selected}
          sections={sections}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
