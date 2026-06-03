import { useState, useMemo, useEffect, useCallback } from "react";
import { useB } from "./contexts/ThemeContext";
import { api } from "./api/client";
import { list as listVehicles, create as createVehicle, update as updateVehicle } from "./api/vehicles";
import { fetchInspections, fetchInspectionDetail } from "./api/inspections";

// ── Map API vehicle response → local form format ──────────────────────────────
function mapApiVehicle(v) {
  return {
    id:              v.id,
    plate:           v.plate            ?? "",
    make:            v.make             ?? "",
    model:           v.model            ?? "",
    type:            v.vehicle_type?.code  ?? "10W",
    year:            v.year?.toString()    ?? "",
    color:           v.color            ?? "",
    owner:           v.owner            ?? "",
    registeredOwner: v.registered_owner ?? "",
    chassis:         v.chassis_no       ?? "",
    motor:           v.motor_no         ?? "",
    driver:          v.driver           ?? "",
    leadman:         v.leadman          ?? "",
    location:        v.location?.name   ?? "",
    condition:       v.condition?.label ?? "",
    acquisitionDate: v.acquisition_date ?? "",
    amount:          v.acquisition_amount != null ? String(v.acquisition_amount) : "",
    terms:           v.acquisition_term?.label ?? "Cash",
    fleetCard:       v.fleet_card_no    ?? "",
    insurancePn:     v.insurance_pn     ?? "",
    ltoRenewal:      v.lto_renewal_date ?? "",
    marineInsurance: v.marine_insurance_no ?? "",
    remarks:         v.remarks          ?? "",
    status:             v.status              ?? "active",
    operationalStatus:  v.operational_status  ?? "running",
    retiredDate:        v.retired_date        ?? "",
    retiredReason:      v.retired_reason      ?? "",
  };
}

// ── Map local form → API payload (resolves string values to FK IDs) ────────────
function formToApiPayload(form, lk) {
  return {
    plate:                form.plate.trim(),
    make:                 form.make.trim(),
    model:                form.model.trim(),
    year:                 form.year         ? parseInt(form.year)         : null,
    color:                form.color         || null,
    owner:                form.owner         || null,
    registered_owner:     form.registeredOwner || null,
    chassis_no:           form.chassis        || null,
    motor_no:             form.motor          || null,
    vehicle_type_id:      lk.typesByCode[form.type]             ?? null,
    location_id:          lk.locationsByName[form.location]     ?? null,
    vehicle_condition_id: lk.conditionsByLabel[form.condition]  ?? null,
    driver:               form.driver         || null,
    leadman:              form.leadman        || null,
    acquisition_date:     form.acquisitionDate || null,
    acquisition_amount:   form.amount         ? parseFloat(form.amount)  : null,
    acquisition_term_id:  lk.termsByLabel[form.terms]           ?? null,
    fleet_card_no:        form.fleetCard       || null,
    insurance_pn:         form.insurancePn     || null,
    lto_renewal_date:     form.ltoRenewal      || null,
    marine_insurance_no:  form.marineInsurance || null,
    remarks:              form.remarks         || null,
    status:               form.status             || "active",
    operational_status:   form.operationalStatus  || "running",
    retired_date:         form.retiredDate        || null,
    retired_reason:       form.retiredReason   || null,
  };
}

const STATUS_STYLE = {
  active:  { bg:"#052e16", border:"#14532d", text:"#4ade80" },
  retired: { bg:"#1c1917", border:"#44403c", text:"#9ca3af" },
  junk:    { bg:"#3a0e0a", border:"#7f1d1d", text:"#fca5a5" },
  sold:    { bg:"#1e1b4b", border:"#3730a3", text:"#a5b4fc" },
  rental:  { bg:"#0c1a2e", border:"#1d4ed8", text:"#93c5fd" },
};

const EMPTY_VEHICLE = {
  plate:"", make:"", model:"", type:"10W", year:"", color:"", owner:"eShip BPO",
  registeredOwner:"", chassis:"", motor:"", driver:"", leadman:"",
  location:"Valenzuela", condition:"Good", operationalStatus:"running",
  acquisitionDate:"", amount:"",
  terms:"Cash", fleetCard:"", insurancePn:"", ltoRenewal:"", marineInsurance:"",
  remarks:"", status:"active", retiredDate:"", retiredReason:"",
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.active;
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20,
      background:s.bg, border:`1px solid ${s.border}`, color:s.text, textTransform:"capitalize" }}>
      {status}
    </span>
  );
}

function Toast({ msg, type }) {
  const B = useB();
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background: type==="error" ? "#7f1d1d" : "#052e16",
      border: `1px solid ${type==="error" ? B.redBorder : "#14532d"}`,
      color: type==="error" ? B.redLight : B.greenLight,
      padding:"10px 20px", borderRadius:10, fontSize:13, fontWeight:600, zIndex:200,
    }}>{msg}</div>
  );
}

export default function FleetRegistry() {
  const B = useB();

  // ── Data state
  const [vehicles,      setVehicles]      = useState([]);
  const [lookups,       setLookups]       = useState(null);   // { typesByCode, locationsByName, ... }
  const [typeOpts,      setTypeOpts]      = useState(["10W","6W","4W"]);
  const [locationOpts,  setLocationOpts]  = useState(["Valenzuela","Cebu","Tacloban","Davao"]);
  const [conditionOpts, setConditionOpts] = useState(["Good","Fair","Needs Service","Under Repair","Inactive"]);
  const [termOpts,      setTermOpts]      = useState(["Cash","12 Months","24 Months","36 Months","60 Months","Rental"]);
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);

  // ── UI state
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOps,    setFilterOps]    = useState("all");  // running | maintenance | idle
  const [selected,     setSelected]     = useState(null);
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState(null);
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [toast,        setToast]        = useState(null);

  // ── Inspection history state
  const [historyVehicle,   setHistoryVehicle]   = useState(null);
  const [historyItems,     setHistoryItems]     = useState([]);
  const [loadingHistory,   setLoadingHistory]   = useState(false);
  const [expandedId,       setExpandedId]       = useState(null);
  const [loadedItems,      setLoadedItems]      = useState({});
  const [loadingItemId,    setLoadingItemId]    = useState(null);
  const [activeTab,        setActiveTab]        = useState({});

  function showToast(msg, type="success") {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 3000);
  }

  // ── Initial data load ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vehiclesRes, types, locs, conds, terms] = await Promise.all([
        listVehicles({ per_page: 100 }),
        api.get("/api/vehicle-types?per_page=100"),
        api.get("/api/locations?per_page=100"),
        api.get("/api/vehicle-conditions?per_page=100"),
        api.get("/api/acquisition-terms?per_page=100"),
      ]);

      const typeList  = types.data  ?? [];
      const locList   = locs.data   ?? [];
      const condList  = conds.data  ?? [];
      const termList  = terms.data  ?? [];

      setTypeOpts(typeList.map(t => t.code));
      setLocationOpts(locList.map(l => l.name));
      setConditionOpts(condList.map(c => c.label));
      setTermOpts(termList.map(t => t.label));

      setLookups({
        typesByCode:       Object.fromEntries(typeList.map(t => [t.code,  t.id])),
        locationsByName:   Object.fromEntries(locList.map(l  => [l.name,  l.id])),
        conditionsByLabel: Object.fromEntries(condList.map(c => [c.label, c.id])),
        termsByLabel:      Object.fromEntries(termList.map(t => [t.label, t.id])),
      });

      setVehicles((vehiclesRes.data ?? []).map(mapApiVehicle));
    } catch (err) {
      showToast("Failed to load fleet data.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── FIELDS definition (options driven by lookup data) ─────────────────────
  const FIELDS = useMemo(() => [
    { key:"plate",          label:"Plate Number" },
    { key:"make",           label:"Make" },
    { key:"model",          label:"Model" },
    { key:"type",           label:"Type",             type:"select", opts:typeOpts },
    { key:"year",           label:"Year" },
    { key:"color",          label:"Color" },
    { key:"owner",          label:"Owner" },
    { key:"registeredOwner",label:"Registered Owner" },
    { key:"chassis",        label:"Chassis No." },
    { key:"motor",          label:"Motor No." },
    { key:"driver",         label:"Driver" },
    { key:"leadman",        label:"Leadman" },
    { key:"location",          label:"Location",           type:"select", opts:locationOpts },
    { key:"condition",         label:"Condition",          type:"select", opts:conditionOpts },
    { key:"operationalStatus", label:"Operational Status", type:"select", opts:["running","maintenance","idle"] },
    { key:"acquisitionDate",label:"Acquisition Date", type:"date" },
    { key:"amount",         label:"Amount (₱)" },
    { key:"terms",          label:"Terms",            type:"select", opts:termOpts },
    { key:"fleetCard",      label:"Fleet Card No." },
    { key:"insurancePn",    label:"Insurance Policy No." },
    { key:"ltoRenewal",     label:"LTO Renewal Date", type:"date" },
    { key:"marineInsurance",label:"Marine Insurance No." },
    { key:"remarks",        label:"Remarks",          type:"textarea" },
  ], [typeOpts, locationOpts, conditionOpts, termOpts]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vehicles.filter(v => {
      const matchSearch = !q
        || v.plate.toLowerCase().includes(q)
        || v.make.toLowerCase().includes(q)
        || v.model.toLowerCase().includes(q)
        || v.driver.toLowerCase().includes(q)
        || v.leadman.toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || v.status === filterStatus;
      const matchOps    = filterOps    === "all" || v.operationalStatus === filterOps;
      return matchSearch && matchStatus && matchOps;
    });
  }, [vehicles, search, filterStatus]);

  // ── Actions ────────────────────────────────────────────────────────────────
  function openEdit(v) {
    setEditing(v.id);
    setForm({ ...v });
    setSelected(null);
  }

  function openAdd() {
    setForm({ ...EMPTY_VEHICLE });
    setShowAddForm(true);
  }

  async function handleSave() {
    if (!form.plate.trim()) { showToast("Plate number is required.", "error"); return; }
    if (!lookups)           { showToast("Lookup data still loading.", "error"); return; }

    setSaving(true);
    try {
      const payload = formToApiPayload(form, lookups);

      if (showAddForm) {
        const res    = await createVehicle(payload);
        const newVeh = mapApiVehicle(res.data);
        setVehicles(prev => [...prev, newVeh]);
        showToast(`Vehicle ${form.plate} added.`);
      } else {
        const res        = await updateVehicle(editing, payload);
        const updatedVeh = mapApiVehicle(res.data);
        setVehicles(prev => prev.map(v => v.id === editing ? updatedVeh : v));
        showToast(`Vehicle ${form.plate} updated.`);
      }

      setEditing(null);
      setShowAddForm(false);
      setForm(null);
    } catch (err) {
      showToast(err.message || "Failed to save vehicle.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRetire(v) {
    if (!lookups) return;
    try {
      await updateVehicle(v.id, {
        ...formToApiPayload(v, lookups),
        status:       "retired",
        retired_date: new Date().toISOString().slice(0, 10),
      });
      setVehicles(prev => prev.map(x =>
        x.id === v.id ? { ...x, status:"retired", retiredDate:new Date().toISOString().slice(0,10) } : x
      ));
      setSelected(null);
      showToast(`${v.plate} retired.`);
    } catch (err) {
      showToast(err.message || "Failed to retire vehicle.", "error");
    }
  }

  async function handleReactivate(v) {
    if (!lookups) return;
    try {
      await updateVehicle(v.id, {
        ...formToApiPayload(v, lookups),
        status:         "active",
        retired_date:   null,
        retired_reason: null,
      });
      setVehicles(prev => prev.map(x =>
        x.id === v.id ? { ...x, status:"active", retiredDate:"", retiredReason:"" } : x
      ));
      setSelected(null);
      showToast(`${v.plate} reactivated.`);
    } catch (err) {
      showToast(err.message || "Failed to reactivate vehicle.", "error");
    }
  }

  function openHistory(v) {
    setHistoryVehicle(v);
    setHistoryItems([]);
    setLoadingHistory(true);
    fetchInspections({ vehicle_plate: v.plate, per_page: 50 })
      .then(res => setHistoryItems(res.data ?? []))
      .catch(() => setHistoryItems([]))
      .finally(() => setLoadingHistory(false));
  }

  const inputStyle = {
    width:"100%", borderRadius:8, padding:"9px 12px", fontSize:13,
    border:`1px solid ${B.navyBorder}`, background:B.navyLight, color:B.white, outline:"none",
    boxSizing:"border-box",
  };

  const isFormOpen = editing !== null || showAddForm;

  return (
    <div style={{ minHeight:"unset", background:B.navy, padding:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
        <div>
          <h2 style={{ color:B.white, fontSize:20, fontWeight:700, marginBottom:2 }}>Fleet Registry</h2>
          <p style={{ color:B.muted, fontSize:12 }}>{vehicles.length} vehicles registered</p>
        </div>
        <button onClick={openAdd} style={{
          padding:"8px 16px", borderRadius:10, border:"none", background:B.blue,
          color:B.white, fontWeight:700, fontSize:13, cursor:"pointer",
        }}>+ Add</button>
      </div>

      {/* Search & Filter */}
      <div style={{ display:"flex", gap:8, margin:"14px 0 10px" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search plate, driver, make…"
          style={{ ...inputStyle, flex:1 }} />
      </div>
      {/* Fleet status filter */}
      <div style={{ display:"flex", gap:6, marginBottom:8, overflowX:"auto" }}>
        {[["all","All"],["active","Active"],["retired","Retired"],["junk","Junk"],["sold","Sold"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilterStatus(k)} style={{
            padding:"4px 12px", borderRadius:20, border:`1px solid ${filterStatus===k?B.blue:B.navyBorder}`,
            background:filterStatus===k?B.blue:B.navyLight, color:filterStatus===k?"#FFFFFF":B.muted,
            fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap",
          }}>{l}</button>
        ))}
      </div>

      {/* Operational status filter */}
      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto" }}>
        {[
          ["all",         "All Ops"],
          ["running",     "Running",     "#4ade80", "#052e16", "#14532d"],
          ["maintenance", "Maintenance", "#fca5a5", "#3a0e0a", "#7f1d1d"],
          ["idle",        "Idle",        "#9ca3af", "#1c1917", "#44403c"],
        ].map(([k, l, textColor, bgActive, borderActive]) => {
          const isActive = filterOps === k;
          return (
            <button key={k} onClick={() => setFilterOps(k)} style={{
              padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700,
              cursor:"pointer", whiteSpace:"nowrap",
              border:  isActive ? `1px solid ${borderActive ?? B.blue}` : `1px solid ${B.navyBorder}`,
              background: isActive ? (bgActive ?? B.blue)  : B.navyLight,
              color:      isActive ? (textColor ?? "#FFF") : B.muted,
            }}>{l}</button>
          );
        })}
      </div>

      {/* Vehicle list */}
      {loading ? (
        <p style={{ color:B.muted, fontSize:13, textAlign:"center", padding:"24px 0" }}>Loading fleet data…</p>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.map(v=>(
            <button key={v.id} onClick={()=>setSelected(v===selected?null:v)} style={{
              background:B.navyMid, borderRadius:12, padding:"12px 14px",
              border:`1px solid ${B.navyBorder}`, cursor:"pointer", textAlign:"left", width:"100%",
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <span style={{ color:B.white, fontWeight:700, fontSize:15 }}>{v.plate}</span>
                    <StatusBadge status={v.status} />
                    {v.operationalStatus && v.operationalStatus !== "running" && (
                      <span style={{
                        fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20,
                        background: v.operationalStatus === "maintenance" ? "#3a0e0a" : "#1c1917",
                        border: `1px solid ${v.operationalStatus === "maintenance" ? "#7f1d1d" : "#44403c"}`,
                        color:  v.operationalStatus === "maintenance" ? "#fca5a5" : "#9ca3af",
                        textTransform:"capitalize",
                      }}>{v.operationalStatus}</span>
                    )}
                  </div>
                  <div style={{ color:B.muted, fontSize:11 }}>{v.make} {v.model} · {v.type} · {v.year}</div>
                  {v.driver && <div style={{ color:B.offWhite, fontSize:11, marginTop:2 }}>Driver: {v.driver}</div>}
                </div>
                <div style={{ color:B.muted, fontSize:11, textAlign:"right" }}>
                  <div>{v.location}</div>
                  <div style={{ marginTop:2 }}>{v.condition}</div>
                </div>
              </div>

              {selected?.id === v.id && (
                <div onClick={e=>e.stopPropagation()} style={{ marginTop:12, borderTop:`1px solid ${B.navyBorder}`, paddingTop:12 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:10 }}>
                    {[["Chassis",v.chassis],["Motor",v.motor],["Fleet Card",v.fleetCard],
                      ["Insurance",v.insurancePn],["LTO Renewal",v.ltoRenewal],["Leadman",v.leadman]].map(([k,val])=>(
                      <div key={k}>
                        <div style={{ color:B.muted, fontSize:10 }}>{k}</div>
                        <div style={{ color:B.offWhite, fontSize:12, fontWeight:500 }}>{val||"—"}</div>
                      </div>
                    ))}
                  </div>
                  {v.remarks && <div style={{ color:B.muted, fontSize:12, marginBottom:10 }}>Remarks: {v.remarks}</div>}
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>openEdit(v)} style={{
                      flex:1, padding:"8px 0", borderRadius:8, border:`1px solid ${B.blue}`,
                      background:"transparent", color:B.blueLight, fontSize:12, fontWeight:700, cursor:"pointer",
                    }}>Edit</button>
                    <button onClick={()=>openHistory(v)} style={{
                      flex:1, padding:"8px 0", borderRadius:8, border:`1px solid ${B.navyBorder}`,
                      background:"transparent", color:B.muted, fontSize:12, fontWeight:700, cursor:"pointer",
                    }}>History</button>
                    {v.status==="active" ? (
                      <button onClick={()=>handleRetire(v)} style={{
                        flex:1, padding:"8px 0", borderRadius:8, border:`1px solid ${B.navyBorder}`,
                        background:"transparent", color:B.muted, fontSize:12, fontWeight:700, cursor:"pointer",
                      }}>Retire</button>
                    ) : (
                      <button onClick={()=>handleReactivate(v)} style={{
                        flex:1, padding:"8px 0", borderRadius:8, border:"1px solid #14532d",
                        background:"transparent", color:B.greenLight, fontSize:12, fontWeight:700, cursor:"pointer",
                      }}>Reactivate</button>
                    )}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isFormOpen && form && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:100, overflowY:"auto", padding:"20px 16px" }}>
          <div style={{ background:B.navyMid, borderRadius:16, padding:20, maxWidth:600, margin:"0 auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
              <h3 style={{ color:B.white, fontSize:16, fontWeight:700 }}>{showAddForm?"Add Vehicle":"Edit Vehicle"}</h3>
              <button onClick={()=>{ setEditing(null); setShowAddForm(false); setForm(null); }}
                style={{ background:"none", border:"none", color:B.muted, fontSize:18, cursor:"pointer" }}>✕</button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {FIELDS.map(f=>(
                <div key={f.key} style={{ gridColumn: f.type==="textarea"?"1/-1":"auto" }}>
                  <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>{f.label}</div>
                  {f.type==="select" ? (
                    <select value={form[f.key]||""} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                      style={{ ...inputStyle }}>
                      {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type==="textarea" ? (
                    <textarea value={form[f.key]||""} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                      rows={2} style={{ ...inputStyle, resize:"none" }} />
                  ) : (
                    <input type={f.type||"text"} value={form[f.key]||""} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                      style={inputStyle} />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={()=>{ setEditing(null); setShowAddForm(false); setForm(null); }} style={{
                flex:1, padding:"11px 0", borderRadius:10, border:`1px solid ${B.navyBorder}`,
                background:"transparent", color:B.white, fontWeight:700, cursor:"pointer",
              }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{
                flex:2, padding:"11px 0", borderRadius:10, border:"none",
                background:B.blue, color:"#FFFFFF", fontWeight:700, fontSize:14,
                cursor:saving?"not-allowed":"pointer", opacity:saving?0.7:1,
              }}>{saving?"Saving…":"Save Vehicle"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Inspection History Modal */}
      {historyVehicle && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:100, overflowY:"auto", padding:"20px 16px" }}>
          <div style={{ background:B.navyMid, borderRadius:16, padding:20, maxWidth:600, margin:"0 auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <h3 style={{ color:B.white, fontSize:16, fontWeight:700, marginBottom:2 }}>
                  {historyVehicle.plate} — Inspection History
                </h3>
                <p style={{ color:B.muted, fontSize:12 }}>
                  {historyVehicle.make} {historyVehicle.model} · {historyVehicle.type}
                </p>
              </div>
              <button onClick={()=>{ setHistoryVehicle(null); setHistoryItems([]); setExpandedId(null); setLoadedItems({}); }}
                style={{ background:"none", border:"none", color:B.muted, fontSize:20, cursor:"pointer" }}>✕</button>
            </div>

            {loadingHistory ? (
              <p style={{ color:B.muted, fontSize:13, textAlign:"center", padding:"24px 0" }}>Loading…</p>
            ) : historyItems.length === 0 ? (
              <p style={{ color:B.muted, fontSize:13, textAlign:"center", padding:"24px 0" }}>
                No inspection records found.
              </p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {historyItems.map(insp => {
                  const isPre      = insp.inspection_type === "pre";
                  const hasFlags   = insp.flagged_count > 0;
                  const dateStr    = insp.trip?.trip_date ?? insp.submitted_at?.slice(0,10) ?? "—";
                  const isExpanded = expandedId === insp.id;
                  const items      = loadedItems[insp.id];
                  const isLoading  = loadingItemId === insp.id;

                  const sections = items
                    ? Object.values(
                        items.reduce((acc, item) => {
                          const key = item.section_label;
                          if (!acc[key]) acc[key] = { label: key, sort: item.section_sort, items: [] };
                          acc[key].items.push(item);
                          return acc;
                        }, {})
                      ).sort((a, b) => a.sort - b.sort)
                    : [];

                  function toggleExpand() {
                    if (isExpanded) { setExpandedId(null); return; }
                    setExpandedId(insp.id);
                    if (!loadedItems[insp.id]) {
                      setLoadingItemId(insp.id);
                      fetchInspectionDetail(insp.id)
                        .then(res => setLoadedItems(prev => ({ ...prev, [insp.id]: res.data?.items ?? [] })))
                        .catch(() => setLoadedItems(prev => ({ ...prev, [insp.id]: [] })))
                        .finally(() => setLoadingItemId(null));
                    }
                  }

                  return (
                    <div key={insp.id} style={{
                      background:B.navyLight, borderRadius:12, overflow:"hidden",
                      border:`1px solid ${hasFlags ? B.statusRedBorder : B.navyBorder}`,
                    }}>
                      <div onClick={toggleExpand} style={{ padding:"12px 14px", cursor:"pointer" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{
                              fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20,
                              background: isPre ? "#0c1a2e" : "#1a1000",
                              border: `1px solid ${isPre ? "#1d4ed8" : "#b45309"}`,
                              color: isPre ? "#93c5fd" : "#fcd34d",
                            }}>
                              {isPre ? "Pre-Trip" : "Post-Trip"}
                            </span>
                            <span style={{ color:B.offWhite, fontSize:13, fontWeight:600 }}>{dateStr}</span>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                            <span style={{ color:B.greenLight, fontSize:12 }}>✓ {insp.passed_count}</span>
                            {hasFlags && <span style={{ color:B.redLight, fontSize:12 }}>⚑ {insp.flagged_count}</span>}
                            <span style={{ color:B.muted, fontSize:12 }}>{isExpanded ? "▲" : "▼"}</span>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:16, fontSize:11, color:B.muted }}>
                          {insp.driver  && <span>Driver: <span style={{ color:B.offWhite }}>{insp.driver}</span></span>}
                          {insp.leadman && <span>Leadman: <span style={{ color:B.offWhite }}>{insp.leadman}</span></span>}
                          {insp.trip_km && <span>KM: <span style={{ color:B.offWhite }}>{insp.trip_km}</span></span>}
                          {insp.hours   && <span>Hours: <span style={{ color:B.offWhite }}>{insp.hours}</span></span>}
                        </div>
                        {insp.notes && (
                          <p style={{ color:B.muted, fontSize:11, marginTop:4, fontStyle:"italic" }}>{insp.notes}</p>
                        )}
                      </div>

                      {isExpanded && (
                        <div style={{ borderTop:`1px solid ${B.navyBorder}` }}>
                          {isLoading ? (
                            <p style={{ color:B.muted, fontSize:12, textAlign:"center", padding:"16px 0" }}>Loading items…</p>
                          ) : sections.length === 0 ? (
                            <p style={{ color:B.muted, fontSize:12, textAlign:"center", padding:"16px 0" }}>No items recorded.</p>
                          ) : (() => {
                            const currentTab = activeTab[insp.id] ?? sections[0]?.label;
                            const tabSection = sections.find(s => s.label === currentTab) ?? sections[0];
                            return (
                              <>
                                <div style={{ display:"flex", overflowX:"auto", borderBottom:`1px solid ${B.navyBorder}` }}>
                                  {sections.map(sec => {
                                    const secHasFlags = sec.items.some(i => i.status === "flag");
                                    const isActive    = currentTab === sec.label;
                                    return (
                                      <button key={sec.label}
                                        onClick={e => { e.stopPropagation(); setActiveTab(prev => ({ ...prev, [insp.id]: sec.label })); }}
                                        style={{
                                          flexShrink:0, padding:"12px 14px 14px", border:"none", cursor:"pointer",
                                          background:"transparent", fontSize:11, fontWeight:700, lineHeight:1.2,
                                          color: isActive ? (secHasFlags ? B.redLight : B.blueLight) : B.muted,
                                          borderBottom: isActive ? `2px solid ${secHasFlags ? B.redLight : B.blue}` : "2px solid transparent",
                                          whiteSpace:"nowrap",
                                        }}>
                                        {sec.label}
                                        {secHasFlags && <span style={{ color:B.redLight, marginLeft:4 }}>⚑</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div style={{ padding:"10px 14px" }}>
                                  {tabSection?.items.sort((a,b) => a.item_sort - b.item_sort).map(item => (
                                    <div key={item.id} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:8 }}>
                                      <span style={{
                                        fontSize:13, fontWeight:700, flexShrink:0, marginTop:1,
                                        color: item.status === "flag" ? B.redLight : B.greenLight,
                                      }}>
                                        {item.status === "flag" ? "⚑" : "✓"}
                                      </span>
                                      <div>
                                        <span style={{ fontSize:12, color: item.status === "flag" ? B.redLight : B.offWhite }}>
                                          {item.item_label}
                                        </span>
                                        {item.issue_description && (
                                          <p style={{ color:B.redLight, fontSize:11, margin:"2px 0 0", fontStyle:"italic" }}>
                                            {item.issue_description}
                                          </p>
                                        )}
                                        {item.resolved_at && (
                                          <p style={{ color:B.greenLight, fontSize:10, margin:"2px 0 0" }}>✓ Resolved</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
