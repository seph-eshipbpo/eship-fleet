import { useState, useEffect, useMemo, useCallback } from "react";
import { useB } from "./contexts/ThemeContext";
import { fetchPmSchedule, fetchServiceLogs, logService, approveServiceLog, updateServiceLogHours, fetchInspectionFlags, resolveInspectionFlag } from "./api/maintenance";

// ── Log Service modal ────────────────────────────────────────────────────────
const EMPTY_PART = () => ({ name: "", qty: 1, unit_cost: 0 });

function LogModal({ target, onSave, onClose, submitting, error }) {
  const B = useB();
  const [mechanic, setMechanic] = useState("");
  const [parts,    setParts]    = useState([EMPTY_PART()]);
  const [labor,    setLabor]    = useState("");
  const [notes,    setNotes]    = useState("");

  const inp = {
    background: B.navy, border: `1px solid ${B.navyBorder}`,
    borderRadius: 10, padding: "9px 12px", color: B.white, fontSize: 13,
    outline: "none", boxSizing: "border-box",
  };

  function updatePart(i, field, value) {
    setParts(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }
  function addPart()      { setParts(prev => [...prev, EMPTY_PART()]); }
  function removePart(i)  { setParts(prev => prev.filter((_, idx) => idx !== i)); }

  const partsSubtotal = parts.reduce((sum, p) => sum + (parseFloat(p.qty) || 0) * (parseFloat(p.unit_cost) || 0), 0);
  const totalCost     = partsSubtotal + (parseFloat(labor) || 0);

  function handleSubmit() {
    const validParts = parts.filter(p => p.name.trim());
    onSave({
      mechanic,
      parts_used:  validParts.length ? validParts.map(p => ({
        name:      p.name.trim(),
        qty:       parseFloat(p.qty)       || 1,
        unit_cost: parseFloat(p.unit_cost) || 0,
      })) : null,
      labor_cost: parseFloat(labor) || 0,
      notes,
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 100,
      overflowY: "auto", padding: 16 }}>
      <div style={{ background: B.navyMid, borderRadius: 16, padding: 20, width: "100%", maxWidth: 460, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ color: B.white, fontWeight: 700, fontSize: 15 }}>Log Service</div>
            <div style={{ color: B.muted, fontSize: 12 }}>{target.plate} — {target.pm_rule_label}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: B.muted, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* Mechanic */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: B.muted, fontSize: 11, marginBottom: 4 }}>Mechanic / Crew</div>
          <input value={mechanic} onChange={e => setMechanic(e.target.value)}
            placeholder="Name" style={{ ...inp, width: "100%" }} />
        </div>

        {/* Parts Used */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ color: B.muted, fontSize: 11 }}>Parts Used</div>
            <button onClick={addPart} style={{
              background: "none", border: `1px solid ${B.navyBorder}`, borderRadius: 6,
              color: B.blueLight, fontSize: 11, fontWeight: 700, padding: "2px 10px", cursor: "pointer",
            }}>+ Add Part</button>
          </div>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 80px 24px", gap: 6, marginBottom: 4 }}>
            {["Part Name", "Qty", "Unit Cost (₱)", ""].map(h => (
              <div key={h} style={{ color: B.muted, fontSize: 10, fontWeight: 700 }}>{h}</div>
            ))}
          </div>

          {parts.map((part, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 60px 80px 24px", gap: 6, marginBottom: 6 }}>
              <input value={part.name} onChange={e => updatePart(i, "name", e.target.value)}
                placeholder="e.g. Engine Oil" style={{ ...inp }} />
              <input value={part.qty} onChange={e => updatePart(i, "qty", e.target.value)}
                type="number" min="0" step="0.5" placeholder="1" style={{ ...inp, textAlign: "right" }} />
              <input value={part.unit_cost} onChange={e => updatePart(i, "unit_cost", e.target.value)}
                type="number" min="0" step="0.01" placeholder="0" style={{ ...inp, textAlign: "right" }} />
              <button onClick={() => removePart(i)} disabled={parts.length === 1}
                style={{ background: "none", border: "none", color: parts.length === 1 ? B.navyBorder : B.redLight,
                  fontSize: 16, cursor: parts.length === 1 ? "default" : "pointer", padding: 0 }}>×</button>
            </div>
          ))}

          {/* Parts subtotal */}
          {parts.some(p => p.name.trim()) && (
            <div style={{ textAlign: "right", color: B.muted, fontSize: 11, marginTop: 4 }}>
              Parts subtotal: <span style={{ color: B.offWhite, fontWeight: 600 }}>
                ₱{partsSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Labor Cost */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: B.muted, fontSize: 11, marginBottom: 4 }}>Labor Cost (₱)</div>
          <input value={labor} onChange={e => setLabor(e.target.value)}
            type="number" min="0" placeholder="0" style={{ ...inp, width: "100%" }} />
        </div>

        {/* Total cost summary */}
        {(partsSubtotal > 0 || parseFloat(labor) > 0) && (
          <div style={{ background: B.navyLight, borderRadius: 8, padding: "8px 12px", marginBottom: 14,
            display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: B.muted, fontSize: 12 }}>Total Cost</span>
            <span style={{ color: B.greenLight, fontWeight: 700, fontSize: 14 }}>
              ₱{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: B.muted, fontSize: 11, marginBottom: 4 }}>Notes</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Additional notes…" style={{ ...inp, width: "100%", resize: "none" }} />
        </div>

        {error && <p style={{ color: B.redLight, fontSize: 12, marginBottom: 10 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={submitting} style={{
            flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${B.navyBorder}`,
            background: "transparent", color: B.white, fontWeight: 700, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} style={{
            flex: 2, padding: "10px 0", borderRadius: 10, border: "none",
            background: B.blue, color: "#FFFFFF", fontWeight: 700, fontSize: 14,
            cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1,
          }}>
            {submitting ? "Submitting…" : "Submit for Approval"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function MaintenanceEngine() {
  const B = useB();

  const [scheduleData,    setScheduleData]    = useState([]);
  const [pendingLogs,     setPendingLogs]     = useState([]);
  const [completedLogs,   setCompletedLogs]   = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingLogs,     setLoadingLogs]     = useState(false);
  const [tab,             setTab]             = useState("schedule");
  const [inspFlags,       setInspFlags]       = useState([]);
  const [loadingFlags,    setLoadingFlags]    = useState(false);
  const [resolvingFlag,   setResolvingFlag]   = useState(null);
  const [resolveNote,     setResolveNote]     = useState("");
  const [filterVehicle,   setFilterVehicle]   = useState("all");
  const [logTarget,        setLogTarget]        = useState(null);
  const [submitting,       setSubmitting]       = useState(false);
  const [approvingId,      setApprovingId]      = useState(null);
  const [approveHours,     setApproveHours]     = useState("");
  const [editingHoursId,   setEditingHoursId]   = useState(null);
  const [editHoursVal,     setEditHoursVal]     = useState("");
  const [logError,         setLogError]         = useState(null);
  const [expandedPending,  setExpandedPending]  = useState(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const loadSchedule = useCallback(() => {
    setLoadingSchedule(true);
    fetchPmSchedule()
      .then(res => setScheduleData(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoadingSchedule(false));
  }, []);

  const loadLogs = useCallback(() => {
    setLoadingLogs(true);
    Promise.all([
      fetchServiceLogs({ status: "pending",  per_page: 100 }),
      fetchServiceLogs({ status: "approved", per_page: 50  }),
    ])
      .then(([pending, completed]) => {
        setPendingLogs(pending.data   ?? []);
        setCompletedLogs(completed.data ?? []);
      })
      .catch(console.error)
      .finally(() => setLoadingLogs(false));
  }, []);

  useEffect(() => { loadSchedule(); loadLogs(); }, [loadSchedule, loadLogs]);

  useEffect(() => {
    if (tab !== "flags" || inspFlags.length > 0) return;
    setLoadingFlags(true);
    fetchInspectionFlags({ per_page: 100 })
      .then(res => setInspFlags(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingFlags(false));
  }, [tab]);

  function refreshFlags() {
    setLoadingFlags(true);
    fetchInspectionFlags({ per_page: 100 })
      .then(res => setInspFlags(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingFlags(false));
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  // Unique vehicles for the dropdown filter
  const vehicleOptions = useMemo(() => {
    const seen = new Set();
    return scheduleData.filter(row => {
      if (seen.has(row.vehicle_id)) return false;
      seen.add(row.vehicle_id);
      return true;
    });
  }, [scheduleData]);

  const scheduleRows = useMemo(() =>
    filterVehicle === "all"
      ? scheduleData
      : scheduleData.filter(r => String(r.vehicle_id) === filterVehicle),
    [scheduleData, filterVehicle]
  );

  const overdueCount = scheduleData.filter(r => r.status === "overdue").length;
  const dueSoonCount = scheduleData.filter(r => r.status === "due_soon").length;

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleLogSubmit({ mechanic, parts_used, labor_cost, notes }) {
    setSubmitting(true);
    setLogError(null);
    try {
      await logService({
        vehicle_id:  logTarget.vehicle_id,
        pm_rule_id:  logTarget.pm_rule_id,
        mechanic:    mechanic   || null,
        parts_used:  parts_used || null,
        labor_cost,
        notes:       notes || null,
      });
      setLogTarget(null);
      loadLogs();
    } catch (err) {
      setLogError(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(logId) {
    try {
      await approveServiceLog(logId, {
        hours_down: approveHours ? parseFloat(approveHours) : 0,
      });
      setApprovingId(null);
      setApproveHours("");
      loadLogs();      // refresh service log lists
      loadSchedule();  // approval resets PM counter — refresh schedule too
    } catch (err) {
      console.error(err);
    }
  }

  // ── Style helpers ──────────────────────────────────────────────────────────
  function statusBadgeStyle(status) {
    if (status === "overdue")  return { bg: B.statusRedBg,    color: "#dc2626" };
    if (status === "due_soon") return { bg: B.statusYellowBg, color: "#ca8a04" };
    return { bg: B.navyLight, color: "#4ade80" };
  }
  const statusLabel = s => s === "overdue" ? "OVERDUE" : s === "due_soon" ? "DUE SOON" : "OK";
  const barColor    = s => s === "overdue" ? "#dc2626" : s === "due_soon" ? "#fde047" : "#4ade80";

  return (
    <div style={{ minHeight: "unset", background: B.navy, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 16px 0" }}>
        <h2 style={{ color: B.white, fontSize: 20, fontWeight: 700, marginBottom: 2 }}>Maintenance Engine</h2>
        <p style={{ color: B.muted, fontSize: 12, marginBottom: 10 }}>Preventive Maintenance Scheduler</p>

        {/* Summary counters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[
            ["Overdue",          overdueCount,    B.red],
            ["Due Soon",         dueSoonCount,    B.yellowLight],
            ["Pending Approval", pendingLogs.length, B.blueLight],
          ].map(([l, v, c]) => (
            <div key={l} style={{ flex: 1, background: B.navyMid, borderRadius: 10, padding: "8px 10px",
              border: `1px solid ${B.navyBorder}`, textAlign: "center" }}>
              <div style={{ color: c, fontSize: 18, fontWeight: 800 }}>{v}</div>
              <div style={{ color: B.muted, fontSize: 10 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: `1px solid ${B.navyBorder}` }}>
          {[
            ["schedule", "PM Schedule"],
            ["history",  "Service Log"],
            ["flags",    `Insp. Flags${inspFlags.length > 0 ? ` (${inspFlags.length})` : ""}`],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: "8px 16px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
              background: "transparent",
              color: tab === k ? B.white : (k === "flags" && inspFlags.length > 0 ? B.redLight : B.muted),
              borderBottom: `2px solid ${tab === k ? (k === "flags" && inspFlags.length > 0 ? B.redLight : B.blue) : "transparent"}`,
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

        {/* ── PM Schedule ── */}
        {tab === "schedule" && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <select value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)}
                style={{ width: "100%", background: B.navyMid, border: `1px solid ${B.navyBorder}`,
                  borderRadius: 8, padding: "8px 12px", color: B.white, fontSize: 12, outline: "none" }}>
                <option value="all">All Vehicles</option>
                {vehicleOptions.map(v => (
                  <option key={v.vehicle_id} value={String(v.vehicle_id)}>
                    {v.plate} — {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>

            {loadingSchedule ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
                {Array.from({ length: 4 }).map((_, i) => {
                  const sh = { background:`linear-gradient(90deg,${B.navyLight} 25%,${B.navyBorder} 50%,${B.navyLight} 75%)`, backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite", borderRadius:6 };
                  return (
                    <div key={i} style={{ background:B.navyMid, borderRadius:10, padding:"10px 14px", border:`1px solid ${B.navyBorder}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ ...sh, height:13, width:"30%", marginBottom:7 }} />
                          <div style={{ ...sh, height:10, width:"50%" }} />
                        </div>
                        <div style={{ ...sh, height:22, width:60, borderRadius:20 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : scheduleRows.map(row => {
              const { vehicle_id, plate, pm_rule_id, pm_rule_label,
                      trip_limit, km_limit, last_service_date,
                      trips_since, km_since, status, pct } = row;
              const s = statusBadgeStyle(status);
              return (
                <div key={`${vehicle_id}-${pm_rule_id}`} style={{
                  background: B.navyMid, borderRadius: 12, padding: "12px 14px", marginBottom: 8,
                  border: `1px solid ${status === "overdue" ? B.redBorder : B.navyBorder}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <span style={{ color: B.white, fontWeight: 700, fontSize: 13 }}>{plate}</span>
                      <span style={{ color: B.muted, fontSize: 11, marginLeft: 8 }}>{pm_rule_label}</span>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: s.bg, color: s.color,
                    }}>{statusLabel(status)}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, height: 4, background: B.navyLight, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: barColor(status) }} />
                    </div>
                    <span style={{ color: B.muted, fontSize: 10, whiteSpace: "nowrap" }}>
                      {Math.min(Math.round(pct), 200)}%
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
                    <span style={{ color: B.muted }}>Last: {last_service_date ?? "—"}</span>
                    <span style={{ color: B.muted }}>Trips: {trips_since}/{trip_limit ?? "—"}</span>
                    <span style={{ color: B.muted }}>KM: {km_since}/{km_limit ?? "—"}</span>
                  </div>

                  {status !== "ok" && (
                    <button
                      onClick={() => { setLogError(null); setLogTarget({ vehicle_id, plate, pm_rule_id, pm_rule_label }); }}
                      style={{ marginTop: 8, padding: "6px 14px", borderRadius: 8, border: "none",
                        background: B.blue, color: "#FFFFFF", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      Log Service
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Service Log ── */}
        {tab === "history" && (
          <div>
            {/* Pending approval */}
            {pendingLogs.length > 0 && (
              <div>
                <div style={{ color: "#78350f", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                  PENDING APPROVAL ({pendingLogs.length})
                </div>
                {pendingLogs.map(entry => {
                  const isOpen      = expandedPending === entry.id;
                  const parts       = Array.isArray(entry.parts_used) ? entry.parts_used : [];
                  const partsSub    = parts.reduce((s, p) => s + (p.qty ?? 0) * (p.unit_cost ?? 0), 0);
                  const total       = partsSub + (parseFloat(entry.labor_cost) || 0);
                  return (
                    <div key={entry.id} style={{ background: B.statusYellowBg, borderRadius: 12,
                      marginBottom: 8, border: `1px solid ${B.statusYellowBorder}`, overflow: "hidden" }}>

                      {/* Clickable header */}
                      <div onClick={() => setExpandedPending(isOpen ? null : entry.id)}
                        style={{ padding: 12, cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: "#78350f", fontWeight: 700, fontSize: 13 }}>
                            {entry.vehicle?.plate ?? "—"}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ color: "#78350f", fontWeight: 700, fontSize: 12 }}>
                              ₱{total.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                            </span>
                            <span style={{ color: "#57534e", fontSize: 11 }}>{entry.service_date}</span>
                            <span style={{ color: "#57534e", fontSize: 11 }}>{isOpen ? "▲" : "▼"}</span>
                          </div>
                        </div>
                        <div style={{ color: "#1c1917", fontSize: 12, marginBottom: 2 }}>
                          {entry.pm_rule?.label ?? "—"}
                        </div>
                        {entry.mechanic && (
                          <div style={{ color: "#57534e", fontSize: 11 }}>Mechanic: {entry.mechanic}</div>
                        )}
                      </div>

                      {/* Accordion body */}
                      {isOpen && (
                        <div style={{ borderTop: `1px solid ${B.statusYellowBorder}`, padding: "10px 12px 12px" }}>
                          {/* Parts */}
                          {parts.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                              <div style={{ color: "#57534e", fontSize: 10, fontWeight: 700,
                                letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                                Parts Used
                              </div>
                              {parts.map((p, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between",
                                  fontSize: 12, marginBottom: 3 }}>
                                  <span style={{ color: "#1c1917" }}>{p.name} × {p.qty}</span>
                                  <span style={{ color: "#57534e" }}>
                                    ₱{((p.qty ?? 0) * (p.unit_cost ?? 0)).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                              <div style={{ display: "flex", justifyContent: "space-between",
                                fontSize: 11, color: "#57534e", marginTop: 4,
                                borderTop: `1px solid ${B.statusYellowBorder}`, paddingTop: 4 }}>
                                <span>Parts subtotal</span>
                                <span>₱{partsSub.toLocaleString()}</span>
                              </div>
                            </div>
                          )}

                          {/* Labor */}
                          {parseFloat(entry.labor_cost) > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between",
                              fontSize: 12, marginBottom: 8 }}>
                              <span style={{ color: "#57534e" }}>Labor Cost</span>
                              <span style={{ color: "#1c1917" }}>
                                ₱{Number(entry.labor_cost).toLocaleString()}
                              </span>
                            </div>
                          )}

                          {/* Total */}
                          <div style={{ display: "flex", justifyContent: "space-between",
                            fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                            <span style={{ color: "#78350f" }}>Total</span>
                            <span style={{ color: "#78350f" }}>
                              ₱{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          {entry.notes && (
                            <div style={{ color: "#57534e", fontSize: 11, fontStyle: "italic", marginBottom: 10 }}>
                              {entry.notes}
                            </div>
                          )}

                          {/* Inline approve form with hours_down */}
                          {approvingId === entry.id ? (
                            <div style={{ background: "#fefce8", borderRadius: 8, padding: 10, marginTop: 4 }}>
                              <div style={{ color: "#78350f", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                                How many hours was the vehicle in maintenance?
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <input type="number" min="0" step="0.5" value={approveHours}
                                  onChange={e => setApproveHours(e.target.value)}
                                  placeholder="e.g. 3.5"
                                  style={{ flex: 1, borderRadius: 6, border: "1px solid #d97706",
                                    padding: "7px 10px", fontSize: 13, outline: "none" }} />
                                <span style={{ color: "#78350f", fontSize: 12 }}>hrs down</span>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => { setApprovingId(null); setApproveHours(""); }} style={{
                                  flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid #d97706",
                                  background: "transparent", color: "#78350f", fontSize: 12, fontWeight: 700, cursor: "pointer",
                                }}>Cancel</button>
                                <button onClick={() => handleApprove(entry.id)} style={{
                                  flex: 2, padding: "7px 0", borderRadius: 8, border: "none",
                                  background: B.blue, color: "#FFFFFF", fontSize: 12, fontWeight: 700, cursor: "pointer",
                                }}>✓ Approve & Record</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => { setApprovingId(entry.id); setApproveHours(""); }} style={{
                              width: "100%", padding: "8px 0", borderRadius: 8, border: "none",
                              background: B.blue, color: "#FFFFFF", fontSize: 12, fontWeight: 700, cursor: "pointer",
                            }}>✓ Approve & Record</button>
                          )}
                        </div>
                      )}

                      {/* Approve button visible when collapsed */}
                      {!isOpen && approvingId !== entry.id && (
                        <div style={{ padding: "0 12px 12px" }}>
                          <button onClick={() => { setApprovingId(entry.id); setApproveHours(""); setExpandedPending(entry.id); }} style={{
                            padding: "6px 14px", borderRadius: 8, border: "none", background: B.blue,
                            color: "#FFFFFF", fontSize: 11, fontWeight: 700, cursor: "pointer",
                          }}>✓ Approve & Record</button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div style={{ borderBottom: `1px solid ${B.navyBorder}`, marginBottom: 12 }} />
              </div>
            )}

            {/* Completed service log */}
            <div style={{ color: B.muted, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
              COMPLETED SERVICE LOG
            </div>
            {loadingLogs ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {Array.from({ length: 3 }).map((_, i) => {
                  const sh = { background:`linear-gradient(90deg,${B.navyLight} 25%,${B.navyBorder} 50%,${B.navyLight} 75%)`, backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite", borderRadius:6 };
                  return (
                    <div key={i} style={{ background:B.navyMid, borderRadius:10, padding:"10px 14px", border:`1px solid ${B.navyBorder}` }}>
                      <div style={{ ...sh, height:12, width:"40%", marginBottom:7 }} />
                      <div style={{ ...sh, height:10, width:"60%" }} />
                    </div>
                  );
                })}
              </div>
            ) : completedLogs.length === 0 ? (
              <p style={{ color: B.muted, fontSize: 13, textAlign: "center", padding: "16px 0" }}>
                No completed service records yet.
              </p>
            ) : completedLogs.map(entry => (
              <div key={entry.id} style={{ background: B.navyMid, borderRadius: 12, padding: 12,
                marginBottom: 8, border: `1px solid ${B.navyBorder}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: B.white, fontWeight: 700, fontSize: 13 }}>
                    {entry.vehicle?.plate ?? "—"}
                  </span>
                  <span style={{ color: B.muted, fontSize: 11 }}>{entry.service_date}</span>
                </div>
                <div style={{ color: B.offWhite, fontSize: 12, marginBottom: 4 }}>
                  {entry.pm_rule?.label ?? "—"}
                </div>
                {entry.mechanic && (
                  <div style={{ color: B.muted, fontSize: 11, marginBottom: 4 }}>
                    Mechanic: {entry.mechanic}
                  </div>
                )}
                {/* Itemized parts list */}
                {Array.isArray(entry.parts_used) && entry.parts_used.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    {entry.parts_used.map((p, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                        <span style={{ color: B.offWhite }}>{p.name} × {p.qty}</span>
                        <span style={{ color: B.muted }}>
                          ₱{((p.qty ?? 0) * (p.unit_cost ?? 0)).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Footer row: approved by + total on the right */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  borderTop: `1px solid ${B.navyBorder}`, paddingTop: 8, marginTop: 6 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {entry.approved_by && (
                      <span style={{ color: B.muted, fontSize: 11 }}>Approved by: {entry.approved_by}</span>
                    )}
                  </div>

                  {/* Total — larger, blue, right-aligned */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: B.blueLight, fontSize: 18, fontWeight: 800 }}>
                      ₱{Number(entry.total_cost ?? entry.labor_cost ?? 0).toLocaleString()}
                    </div>
                    <div style={{ color: B.muted, fontSize: 10 }}>Total</div>
                  </div>
                </div>

                {/* Down hours — full-width centered button */}
                {editingHoursId === entry.id ? (
                  <div style={{ marginTop: 10, padding: "10px 12px", background: B.navyLight,
                    borderRadius: 8, border: `1px solid ${B.navyBorder}` }}>
                    <div style={{ color: B.offWhite, fontSize: 12, fontWeight: 700,
                      textAlign: "center", marginBottom: 8 }}>⏱ Enter Vehicle Down Hours</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 8 }}>
                      <input type="number" min="0" step="0.5" value={editHoursVal}
                        onChange={e => setEditHoursVal(e.target.value)}
                        placeholder="e.g. 3.5"
                        style={{ width: 90, borderRadius: 6, border: `1px solid ${B.navyBorder}`,
                          background: B.navyMid, color: B.white, padding: "7px 10px",
                          fontSize: 14, outline: "none", textAlign: "center" }} />
                      <span style={{ color: B.muted, fontSize: 13 }}>hours</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setEditingHoursId(null)} style={{
                        flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${B.navyBorder}`,
                        background: "transparent", color: B.muted, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}>Cancel</button>
                      <button onClick={async () => {
                        await updateServiceLogHours(entry.id, parseFloat(editHoursVal) || 0);
                        setEditingHoursId(null);
                        loadLogs();
                      }} style={{
                        flex: 2, padding: "8px 0", borderRadius: 8, border: "none",
                        background: B.blue, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}>Save Down Hours</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingHoursId(entry.id); setEditHoursVal(String(entry.hours_down > 0 ? entry.hours_down : "")); }}
                    style={{ marginTop: 6, padding: "6px 16px", borderRadius: 6, cursor: "pointer",
                      border: `1px solid ${entry.hours_down > 0 ? B.navyBorder : B.blue}`,
                      background: entry.hours_down > 0 ? "transparent" : B.blue,
                      color: entry.hours_down > 0 ? B.offWhite : "#fff",
                      fontSize: 11, fontWeight: 700 }}>
                    {entry.hours_down > 0
                      ? `⏱ ${entry.hours_down} hrs down  ·  Edit`
                      : "⏱ Log Down Hours"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {/* ── Inspection Flags ── */}
        {tab === "flags" && (
          <div>
            {loadingFlags ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {Array.from({length:4}).map((_,i) => {
                  const sh = { background:`linear-gradient(90deg,${B.navyLight} 25%,${B.navyBorder} 50%,${B.navyLight} 75%)`, backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite", borderRadius:6 };
                  return (
                    <div key={i} style={{ background:B.navyMid, borderRadius:12, padding:14, border:`1px solid ${B.navyBorder}` }}>
                      <div style={{ ...sh, height:13, width:"30%", marginBottom:8 }} />
                      <div style={{ ...sh, height:11, width:"70%", marginBottom:6 }} />
                      <div style={{ ...sh, height:11, width:"50%" }} />
                    </div>
                  );
                })}
              </div>
            ) : inspFlags.length === 0 ? (
              <div style={{ textAlign:"center", padding:"32px 0" }}>
                <div style={{ color:B.greenLight, fontSize:24, marginBottom:8 }}>✓</div>
                <div style={{ color:B.greenLight, fontSize:14, fontWeight:700 }}>No open inspection flags</div>
                <div style={{ color:B.muted, fontSize:12, marginTop:4 }}>All reported issues from pre/post-trip inspections have been resolved.</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {inspFlags.map(flag => (
                  <div key={flag.id} style={{ background:B.navyMid, borderRadius:12, padding:14,
                    border:`1px solid ${B.statusRedBorder ?? "#7f1d1d"}` }}>

                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ color:B.white, fontWeight:700, fontSize:14 }}>{flag.vehicle?.plate}</span>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:10,
                          background:"#3a0e0a", border:"1px solid #7f1d1d", color:"#fca5a5" }}>
                          {flag.inspection_type === "pre" ? "Pre-Trip" : "Post-Trip"}
                        </span>
                      </div>
                      <span style={{ color:B.muted, fontSize:11 }}>{flag.inspection_date}</span>
                    </div>

                    <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>
                      {flag.section_label} › <span style={{ color:B.offWhite }}>{flag.item_label}</span>
                    </div>
                    <div style={{ color:B.redLight, fontSize:12, marginBottom: resolvingFlag === flag.id ? 10 : 0 }}>
                      ⚑ {flag.issue}
                    </div>
                    {flag.vehicle?.location && (
                      <div style={{ color:B.muted, fontSize:11, marginBottom: resolvingFlag === flag.id ? 8 : 0 }}>{flag.vehicle.location}</div>
                    )}

                    {/* Resolve form */}
                    {resolvingFlag === flag.id ? (
                      <div style={{ marginTop:8 }}>
                        <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Resolution notes (optional)</div>
                        <textarea value={resolveNote} onChange={e => setResolveNote(e.target.value)}
                          rows={2} placeholder="What was done to fix this issue?"
                          style={{ width:"100%", borderRadius:6, border:`1px solid ${B.navyBorder}`,
                            background:B.navyLight, color:B.white, padding:"7px 10px", fontSize:12,
                            outline:"none", resize:"none", boxSizing:"border-box", marginBottom:8 }} />
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={() => { setResolvingFlag(null); setResolveNote(""); }} style={{
                            flex:1, padding:"7px 0", borderRadius:8, border:`1px solid ${B.navyBorder}`,
                            background:"transparent", color:B.muted, fontSize:12, fontWeight:700, cursor:"pointer",
                          }}>Cancel</button>
                          <button onClick={async () => {
                            await resolveInspectionFlag(flag.id, resolveNote);
                            setResolvingFlag(null); setResolveNote("");
                            refreshFlags();
                          }} style={{
                            flex:2, padding:"7px 0", borderRadius:8, border:"none",
                            background:B.blue, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer",
                          }}>✓ Mark Resolved</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setResolvingFlag(flag.id); setResolveNote(""); }} style={{
                        marginTop:8, padding:"6px 14px", borderRadius:8, border:"none",
                        background:B.blue, color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer",
                      }}>✓ Resolve Issue</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Log Service modal */}
      {logTarget && (
        <LogModal
          target={logTarget}
          onSave={handleLogSubmit}
          onClose={() => setLogTarget(null)}
          submitting={submitting}
          error={logError}
        />
      )}
    </div>
  );
}
