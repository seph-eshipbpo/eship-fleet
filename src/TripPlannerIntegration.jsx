import { useState, useEffect, useCallback } from "react";
import { useB } from "./contexts/ThemeContext";
import { api } from "./api/client";
import { listTrips, createTrip, updateTrip } from "./api/trips";
import { fetchPmSchedule } from "./api/maintenance";

export default function TripPlannerIntegration() {
  const B = useB();
  const [tab, setTab] = useState("dispatch");

  // ── Data ────────────────────────────────────────────────────────────────────
  const [vehicles,     setVehicles]     = useState([]);
  const [routes,       setRoutes]       = useState([]);
  const [trips,        setTrips]        = useState([]);
  const [pmSchedule,   setPmSchedule]   = useState([]);
  const [totalTrips,   setTotalTrips]   = useState(0);

  // ── Loading / saving ────────────────────────────────────────────────────────
  const [loadingInit,  setLoadingInit]  = useState(true);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [loadingPm,    setLoadingPm]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [lastSynced,   setLastSynced]   = useState(null);
  const [error,        setError]        = useState(null);

  // ── Complete-trip inline form ────────────────────────────────────────────────
  const [completingId,  setCompletingId]  = useState(null); // trip id being completed
  const [completeKm,    setCompleteKm]    = useState("");
  const [completeHours, setCompleteHours] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");

  // ── Form ────────────────────────────────────────────────────────────────────
  const [formVehicleId, setFormVehicleId] = useState("");
  const [formRouteId,   setFormRouteId]   = useState("");
  const [formDate,      setFormDate]      = useState(new Date().toISOString().slice(0, 10));
  const [formKm,        setFormKm]        = useState("");
  const [formHours,     setFormHours]     = useState("");
  const [formNotes,     setFormNotes]     = useState("");

  // ── Load vehicles + routes on mount ─────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get("/api/vehicles?status=active&per_page=100"),
      api.get("/api/routes?per_page=100"),
    ])
      .then(([vRes, rRes]) => {
        setVehicles(vRes.data ?? []);
        setRoutes(rRes.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingInit(false));
  }, []);

  // ── Load trip log ───────────────────────────────────────────────────────────
  const loadTrips = useCallback(() => {
    setLoadingTrips(true);
    listTrips({ per_page: 50 })
      .then(res => {
        setTrips(res.data ?? []);
        setTotalTrips(res.meta?.total ?? (res.data?.length ?? 0));
      })
      .catch(() => {})
      .finally(() => setLoadingTrips(false));
  }, []);

  useEffect(() => {
    if (tab === "log") loadTrips();
  }, [tab, loadTrips]);

  // ── Load PM schedule ────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== "status" || pmSchedule.length > 0) return;
    setLoadingPm(true);
    fetchPmSchedule()
      .then(res => setPmSchedule(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingPm(false));
  }, [tab]);

  // ── Form handlers ───────────────────────────────────────────────────────────
  function handleRouteChange(routeId) {
    setFormRouteId(routeId);
    const r = routes.find(x => x.id === parseInt(routeId) || String(x.id) === routeId);
    if (r) {
      if (r.avg_km)    setFormKm(String(r.avg_km));
      if (r.avg_hours) setFormHours(String(r.avg_hours));
    }
  }

  function resetForm() {
    setFormVehicleId(""); setFormRouteId("");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormKm(""); setFormHours(""); setFormNotes("");
  }

  async function handleStatusChange(tripId, status, extra = {}) {
    try {
      const res = await updateTrip(tripId, { status, ...extra });
      setTrips(prev => prev.map(t => t.id === tripId ? res.data : t));
      if (status === 'completed') {
        setLastSynced(`Trip #${String(tripId).padStart(4,'0')} marked complete`);
        setCompletingId(null);
        setCompleteKm(""); setCompleteHours(""); setCompleteNotes("");
      }
    } catch (err) {
      setError(err.message || "Failed to update trip.");
    }
  }

  async function submitForm() {
    if (!formVehicleId) return;
    setSaving(true); setError(null);
    try {
      const res = await createTrip({
        vehicle_id: parseInt(formVehicleId),
        trip_date:  formDate,
        km:         formKm    ? parseFloat(formKm)    : null,
        hours:      formHours ? parseFloat(formHours) : null,
        notes:      formNotes || null,
      });
      const plate = res.data?.vehicle?.plate ?? "Trip";
      setLastSynced(`${plate} — ${formDate}`);
      setTotalTrips(prev => prev + 1);
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to log trip.");
    } finally {
      setSaving(false);
    }
  }

  // ── PM schedule grouping ─────────────────────────────────────────────────────
  const overdueItems  = pmSchedule.filter(r => r.status === "overdue");
  const dueSoonItems  = pmSchedule.filter(r => r.status === "due_soon");

  const inp = {
    width:"100%", background:B.navyMid, border:`1px solid ${B.navyBorder}`,
    borderRadius:10, padding:"9px 12px", color:B.white, fontSize:13, outline:"none",
    boxSizing:"border-box",
  };

  const sh = {
    background:`linear-gradient(90deg,${B.navyLight} 25%,${B.navyBorder} 50%,${B.navyLight} 75%)`,
    backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite", borderRadius:6,
  };

  return (
    <div style={{ minHeight:"unset", background:B.navy, display:"flex", flexDirection:"column" }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      <div style={{ padding:"16px 16px 0" }}>
        <h2 style={{ color:B.white, fontSize:20, fontWeight:700, marginBottom:2 }}>Trip Planner</h2>
        <p style={{ color:B.muted, fontSize:12, marginBottom:10 }}>
          Dispatch & PM integration — {totalTrips} trips logged
        </p>

        {lastSynced && (
          <div style={{ background:"#052e16", border:"1px solid #14532d", borderRadius:10,
            padding:"8px 12px", marginBottom:10, color:B.greenLight, fontSize:12 }}>
            ✓ {lastSynced} logged & synced to PM engine
          </div>
        )}

        {overdueItems.length > 0 && (
          <div style={{ background:B.statusRedBg, border:`1px solid ${B.statusRedBorder}`,
            borderRadius:10, padding:"8px 12px", marginBottom:10 }}>
            <div style={{ color:B.redLight, fontSize:11, fontWeight:700, marginBottom:4 }}>
              ⚠ {overdueItems.length} PM OVERDUE
            </div>
            {overdueItems.slice(0, 3).map((a, i) => (
              <div key={i} style={{ color:B.redLight, fontSize:11 }}>
                • {a.plate}: {a.pm_rule_label} ({a.pct}%)
              </div>
            ))}
          </div>
        )}

        <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${B.navyBorder}` }}>
          {[["dispatch","Dispatch"],["log","Trip Log"],["status","PM Status"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding:"8px 14px", border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
              background:"transparent", color:tab===k?B.white:B.muted,
              borderBottom:`2px solid ${tab===k?B.blue:"transparent"}`,
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:16 }}>

        {/* ── DISPATCH ────────────────────────────────────────────────────── */}
        {tab === "dispatch" && (
          <div>
            {error && (
              <div style={{ background:"#3a0e0a", border:"1px solid #7f1d1d", borderRadius:8,
                color:"#fca5a5", fontSize:12, padding:"8px 12px", marginBottom:12 }}>{error}</div>
            )}
            <div style={{ background:B.navyMid, borderRadius:14, padding:16, border:`1px solid ${B.navyBorder}` }}>
              <div style={{ color:B.muted, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:14 }}>LOG NEW TRIP</div>

              <div style={{ marginBottom:12 }}>
                <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Vehicle</div>
                {loadingInit ? (
                  <div style={{ ...sh, height:40, width:"100%" }} />
                ) : (
                  <select value={formVehicleId} onChange={e => setFormVehicleId(e.target.value)} style={inp}>
                    <option value="">Select vehicle…</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.plate} — {v.make} {v.model} ({v.vehicle_type?.code ?? ""})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ marginBottom:12 }}>
                <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Route</div>
                {loadingInit ? (
                  <div style={{ ...sh, height:40, width:"100%" }} />
                ) : (
                  <select value={formRouteId} onChange={e => handleRouteChange(e.target.value)} style={inp}>
                    <option value="">Select route…</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}{r.avg_km ? ` (${r.avg_km}km` : ""}{r.avg_hours ? ` · ${r.avg_hours}hrs)` : r.avg_km ? ")" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
                {[["Date",formDate,setFormDate,"date"],["KM",formKm,setFormKm,"number"],["Hours",formHours,setFormHours,"number"]].map(([label, val, set, type]) => (
                  <div key={label}>
                    <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>{label}</div>
                    <input type={type} value={val} onChange={e => set(e.target.value)} style={inp} />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom:14 }}>
                <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Notes</div>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)}
                  rows={2} placeholder="Trip notes…" style={{ ...inp, resize:"none" }} />
              </div>

              <button onClick={submitForm} disabled={!formVehicleId || saving} style={{
                width:"100%", padding:"12px 0", borderRadius:10, border:"none",
                background: formVehicleId && !saving ? B.blue : B.navyLight,
                color: formVehicleId && !saving ? "#FFFFFF" : B.muted,
                fontWeight:700, fontSize:14,
                cursor: formVehicleId && !saving ? "pointer" : "default",
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? "Saving…" : "Log Trip & Sync to PM"}
              </button>
            </div>
          </div>
        )}

        {/* ── TRIP LOG ─────────────────────────────────────────────────────── */}
        {tab === "log" && (
          loadingTrips ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ background:B.navyMid, borderRadius:12, padding:12, border:`1px solid ${B.navyBorder}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <div style={{ ...sh, height:14, width:"35%" }} />
                    <div style={{ ...sh, height:11, width:"20%" }} />
                  </div>
                  <div style={{ ...sh, height:11, width:"55%", marginBottom:6 }} />
                  <div style={{ ...sh, height:11, width:"40%" }} />
                </div>
              ))}
            </div>
          ) : trips.length === 0 ? (
            <p style={{ color:B.muted, fontSize:13, textAlign:"center", padding:"32px 0" }}>No trips logged yet.</p>
          ) : (
            <div>
              {trips.map(t => {
                const isInProgress = t.status === "in_progress";
                const isCompleted  = t.status === "completed";
                const isCancelled  = t.status === "cancelled";
                const isCompleting = completingId === t.id;

                const statusBadge = isCompleted
                  ? { bg:"#0c1a2e", border:"#1d4ed8", color:"#93c5fd",  label:"✓ Completed" }
                  : isCancelled
                  ? { bg:"#1c1917", border:"#44403c", color:"#9ca3af",  label:"✕ Cancelled" }
                  : { bg:"#052e16", border:"#14532d", color:B.greenLight, label:"▶ In Progress" };

                return (
                  <div key={t.id} style={{ background:B.navyMid, borderRadius:12, padding:12,
                    marginBottom:8, border:`1px solid ${isInProgress ? "#14532d" : B.navyBorder}` }}>

                    {/* Header */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{ color:B.muted, fontSize:10 }}>{t.ref}</span>
                        <span style={{ color:B.white, fontWeight:700, fontSize:14 }}>{t.vehicle?.plate}</span>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20,
                          background:statusBadge.bg, border:`1px solid ${statusBadge.border}`, color:statusBadge.color }}>
                          {statusBadge.label}
                        </span>
                      </div>
                      <span style={{ color:B.muted, fontSize:11 }}>{t.trip_date}</span>
                    </div>

                    {/* Vehicle info */}
                    <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>
                      {t.vehicle?.make} {t.vehicle?.model} · {t.vehicle?.type}
                    </div>
                    <div style={{ display:"flex", gap:12, fontSize:11, marginBottom:isInProgress ? 10 : 0 }}>
                      {t.vehicle?.driver && <span style={{ color:B.muted }}>Driver: {t.vehicle.driver}</span>}
                      {t.km    && <span style={{ color:B.offWhite }}>{t.km} km</span>}
                      {t.hours && <span style={{ color:B.offWhite }}>{t.hours} hrs</span>}
                    </div>
                    {t.notes && <p style={{ color:B.muted, fontSize:11, marginTop:2, fontStyle:"italic" }}>{t.notes}</p>}

                    {/* Actions for in-progress trips */}
                    {isInProgress && !isCompleting && (
                      <div style={{ display:"flex", gap:8, marginTop:10 }}>
                        <button onClick={() => handleStatusChange(t.id, "cancelled")} style={{
                          flex:1, padding:"7px 0", borderRadius:8, border:`1px solid ${B.navyBorder}`,
                          background:"transparent", color:B.muted, fontSize:12, fontWeight:700, cursor:"pointer",
                        }}>✕ Cancel Trip</button>
                        <button onClick={() => {
                          setCompletingId(t.id);
                          setCompleteKm(t.km != null ? String(t.km) : "");
                          setCompleteHours(t.hours != null ? String(t.hours) : "");
                          setCompleteNotes(t.notes || "");
                        }} style={{
                          flex:2, padding:"7px 0", borderRadius:8, border:"none",
                          background:B.blue, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer",
                        }}>✓ Mark Complete</button>
                      </div>
                    )}

                    {/* Inline complete form */}
                    {isInProgress && isCompleting && (
                      <div style={{ marginTop:10, padding:10, background:B.navyLight, borderRadius:8 }}>
                        <div style={{ color:B.muted, fontSize:11, fontWeight:700, marginBottom:4 }}>
                          COMPLETE TRIP — Confirm or enter actual KM & Hours
                        </div>
                        <div style={{ color:B.muted, fontSize:10, marginBottom:8 }}>
                          Pre-filled from dispatch. Adjust if actual values differ.
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                          {[["KM",completeKm,setCompleteKm],["Hours",completeHours,setCompleteHours]].map(([label,val,set])=>(
                            <div key={label}>
                              <div style={{ color:B.muted, fontSize:10, marginBottom:3 }}>{label}</div>
                              <input type="number" value={val} onChange={e=>set(e.target.value)}
                                style={{ width:"100%", background:B.navyMid, border:`1px solid ${B.navyBorder}`,
                                  borderRadius:6, padding:"7px 10px", color:B.white, fontSize:12,
                                  outline:"none", boxSizing:"border-box" }} />
                            </div>
                          ))}
                        </div>
                        <div style={{ marginBottom:8 }}>
                          <div style={{ color:B.muted, fontSize:10, marginBottom:3 }}>Notes</div>
                          <textarea value={completeNotes} onChange={e=>setCompleteNotes(e.target.value)}
                            rows={2} placeholder="Optional notes…"
                            style={{ width:"100%", background:B.navyMid, border:`1px solid ${B.navyBorder}`,
                              borderRadius:6, padding:"7px 10px", color:B.white, fontSize:12,
                              outline:"none", resize:"none", boxSizing:"border-box" }} />
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={() => setCompletingId(null)} style={{
                            flex:1, padding:"8px 0", borderRadius:8, border:`1px solid ${B.navyBorder}`,
                            background:"transparent", color:B.muted, fontSize:12, fontWeight:700, cursor:"pointer",
                          }}>Cancel</button>
                          <button onClick={() => handleStatusChange(t.id, "completed", {
                            km: completeKm ? parseFloat(completeKm) : null,
                            hours: completeHours ? parseFloat(completeHours) : null,
                            notes: completeNotes || null,
                          })} style={{
                            flex:2, padding:"8px 0", borderRadius:8, border:"none",
                            background:B.blue, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer",
                          }}>Save & Complete</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── PM STATUS ────────────────────────────────────────────────────── */}
        {tab === "status" && (
          loadingPm ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ background:B.navyMid, borderRadius:10, padding:12, border:`1px solid ${B.navyBorder}` }}>
                  <div style={{ ...sh, height:13, width:"30%", marginBottom:8 }} />
                  <div style={{ ...sh, height:10, width:"60%", marginBottom:8 }} />
                  <div style={{ ...sh, height:4, width:"100%", borderRadius:2 }} />
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ color:B.muted, fontSize:12, marginBottom:12 }}>
                Live PM schedule — synced with backend
              </div>
              {pmSchedule.length === 0 && (
                <div style={{ textAlign:"center", color:B.greenLight, fontSize:14, padding:20 }}>
                  ✓ All vehicles within PM limits
                </div>
              )}
              {[...overdueItems, ...dueSoonItems].map((a, i) => (
                <div key={i} style={{
                  background: a.status === "overdue" ? B.statusRedBg : B.statusYellowBg,
                  borderRadius:10, padding:12, marginBottom:8,
                  border:`1px solid ${a.status === "overdue" ? B.statusRedBorder : B.statusYellowBorder}`,
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ color:a.status==="overdue"?B.redLight:B.yellowLight, fontWeight:700, fontSize:13 }}>
                      {a.plate}
                    </span>
                    <span style={{ color:a.status==="overdue"?B.redLight:B.yellowLight, fontSize:11 }}>{a.pct}%</span>
                  </div>
                  <div style={{ color:B.offWhite, fontSize:12, marginBottom:6 }}>{a.pm_rule_label}</div>
                  <div style={{ height:4, background:B.navyLight, borderRadius:2 }}>
                    <div style={{ height:"100%", width:`${Math.min(a.pct, 100)}%`,
                      background:a.status==="overdue"?B.red:B.yellowLight, borderRadius:2 }} />
                  </div>
                </div>
              ))}
              {pmSchedule.filter(r => r.status === "ok").map((a, i) => (
                <div key={i} style={{ background:B.navyMid, borderRadius:10, padding:10,
                  marginBottom:6, border:`1px solid ${B.navyBorder}`, display:"flex",
                  justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <span style={{ color:B.offWhite, fontSize:12 }}>{a.plate}</span>
                    <span style={{ color:B.muted, fontSize:11, marginLeft:8 }}>{a.pm_rule_label}</span>
                  </div>
                  <span style={{ color:B.greenLight, fontSize:11 }}>✓ OK</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
