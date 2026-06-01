import { useState } from "react";
import { useB } from "./contexts/ThemeContext";

const PM_RULES = [
  { id:"engine_oil",     label:"Engine Oil Change",     calMonths:2,   tripLimit:30,  kmLimit:1200,  types:["10W","6W","4W"] },
  { id:"fuel_filter",    label:"Fuel Filter",           calMonths:3,   tripLimit:45,  kmLimit:1800,  types:["10W","6W","4W"] },
  { id:"air_filter_rep", label:"Air Filter Replacement",calMonths:6,   tripLimit:90,  kmLimit:3600,  types:["10W","6W","4W"] },
  { id:"air_filter_cln", label:"Air Filter Cleaning",   calMonths:2,   tripLimit:30,  kmLimit:1200,  types:["10W","6W","4W"] },
  { id:"brake_check",    label:"Brake Inspection",      calWeeks:2,    tripLimit:10,  kmLimit:400,   types:["10W","6W","4W"] },
  { id:"radiator",       label:"Radiator Flush",        calMonths:12,  tripLimit:150, kmLimit:6000,  types:["10W","6W"] },
  { id:"tire_rotation",  label:"Tire Rotation",         calMonths:null,tripLimit:15,  kmLimit:600,   types:["10W","6W","4W"] },
  { id:"drive_belts",    label:"Drive Belt Check",      calMonths:null,tripLimit:15,  kmLimit:600,   types:["10W","6W"] },
  { id:"truck_wash",     label:"Truck Wash",            calMonths:null,tripLimit:15,  kmLimit:null,  types:["10W","6W","4W"] },
  { id:"torque_rod",     label:"Torque Rod Check",      calMonths:24,  tripLimit:300, kmLimit:12000, types:["10W","6W"] },
];

const VEHICLES = [
  { id:"v01", plate:"ULD-245", make:"Isuzu", model:"Elf", type:"10W", loc:"Valenzuela",
    kmPerTrip:40, driver:"Rolando Reyes", leadman:"Felix Santos" },
  { id:"v02", plate:"CSY-229", make:"Isuzu", model:"Elf", type:"10W", loc:"Valenzuela",
    kmPerTrip:40, driver:"Eduardo Bautista", leadman:"Antonio Cruz" },
  { id:"v03", plate:"U5V-991", make:"Isuzu", model:"Elf", type:"10W", loc:"Cebu",
    kmPerTrip:40, driver:"Benjamin Flores", leadman:"Manuel Ramos" },
  { id:"v04", plate:"NES-2545", make:"Mitsubishi", model:"Canter", type:"6W", loc:"Tacloban",
    kmPerTrip:35, driver:"Rodrigo Villanueva", leadman:"Danilo Aquino" },
  { id:"v05", plate:"U5U-532", make:"Isuzu", model:"NHR", type:"4W", loc:"Valenzuela",
    kmPerTrip:25, driver:"Joseph Dela Cruz", leadman:"Rafael Torres" },
  { id:"v06", plate:"NFL-9124", make:"Isuzu", model:"Elf", type:"10W", loc:"Cebu",
    kmPerTrip:40, driver:"Vicente Garcia", leadman:"Arturo Mendoza" },
  { id:"v07", plate:"WMJ-284", make:"Isuzu", model:"Elf", type:"10W", loc:"Valenzuela",
    kmPerTrip:40, driver:"Roberto Santos", leadman:"Carlos Reyes" },
  { id:"v08", plate:"NAN-597", make:"Mitsubishi", model:"Canter", type:"6W", loc:"Valenzuela",
    kmPerTrip:35, driver:"Miguel Castro", leadman:"Ramon Diaz" },
  { id:"v09", plate:"KOH-464", make:"Isuzu", model:"Elf", type:"10W", loc:"Valenzuela",
    kmPerTrip:40, driver:"Ernesto Lopez", leadman:"Alfredo Navarro" },
  { id:"v10", plate:"XAS-271", make:"Isuzu", model:"NHR", type:"4W", loc:"Valenzuela",
    kmPerTrip:25, driver:"Francisco Morales", leadman:"Marcelo Perez" },
  { id:"v11", plate:"XKY-980", make:"Isuzu", model:"NHR", type:"4W", loc:"Valenzuela",
    kmPerTrip:25, driver:"Domingo Gonzales", leadman:"Rodrigo Lim" },
  { id:"v12", plate:"U5V-261", make:"Isuzu", model:"Elf", type:"10W", loc:"Cebu",
    kmPerTrip:40, driver:"Antonio Ramos", leadman:"Pedro Chan" },
  { id:"v13", plate:"U5U-584", make:"Isuzu", model:"NHR", type:"4W", loc:"Valenzuela",
    kmPerTrip:25, driver:"Jose De Leon", leadman:"Michael Tan" },
  { id:"v14", plate:"U5U-588", make:"Isuzu", model:"NHR", type:"4W", loc:"Valenzuela",
    kmPerTrip:25, driver:"Ricardo Mateo", leadman:"Christian Ong" },
  { id:"v15", plate:"NDP-5708", make:"Mitsubishi", model:"Canter", type:"6W", loc:"Valenzuela",
    kmPerTrip:35, driver:"Armando Delos Santos", leadman:"Allan Garcia" },
  { id:"v16", plate:"WJC-230", make:"Isuzu", model:"NHR", type:"4W", loc:"Valenzuela",
    kmPerTrip:25, driver:"Renato Aguilar", leadman:"Efren Fernandez" },
];

const ROUTES = [
  { id:"R01", name:"Valenzuela → Caloocan", avgKm:18, avgHrs:1.5, zone:"Metro Manila" },
  { id:"R02", name:"Valenzuela → Quezon City", avgKm:22, avgHrs:2.0, zone:"Metro Manila" },
  { id:"R03", name:"Valenzuela → Makati", avgKm:28, avgHrs:2.5, zone:"Metro Manila" },
  { id:"R04", name:"Valenzuela → Pasay", avgKm:32, avgHrs:3.0, zone:"Metro Manila" },
  { id:"R05", name:"Valenzuela → Paranaque", avgKm:38, avgHrs:3.5, zone:"Metro Manila" },
  { id:"R06", name:"Valenzuela → Las Pinas", avgKm:44, avgHrs:4.0, zone:"Metro Manila" },
  { id:"R07", name:"Cebu City Loop", avgKm:35, avgHrs:3.0, zone:"Cebu" },
  { id:"R08", name:"Cebu → Mandaue", avgKm:12, avgHrs:1.0, zone:"Cebu" },
  { id:"R09", name:"Cebu → Lapu-Lapu", avgKm:18, avgHrs:1.5, zone:"Cebu" },
  { id:"R10", name:"Tacloban City Loop", avgKm:25, avgHrs:2.0, zone:"Tacloban" },
  { id:"R11", name:"Valenzuela → Bulacan", avgKm:35, avgHrs:3.0, zone:"North Luzon" },
  { id:"R12", name:"Valenzuela → Pampanga", avgKm:68, avgHrs:5.0, zone:"North Luzon" },
];

function dAgo(n) {
  const d = new Date("2026-04-21");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function buildPmState() {
  const state = {};
  VEHICLES.forEach(v => {
    state[v.plate] = {};
    PM_RULES.filter(r => r.types.includes(v.type)).forEach(r => {
      state[v.plate][r.id] = { lastServiceDate: dAgo(45), tripsSince: 0, kmSince: 0 };
    });
  });
  return state;
}

function buildSeedTrips() {
  const trips = [];
  const pairs = [
    ["ULD-245","R03"],["CSY-229","R01"],["U5V-991","R07"],["NES-2545","R10"],
    ["U5U-532","R02"],["NFL-9124","R08"],["WMJ-284","R04"],["NAN-597","R05"],
    ["KOH-464","R11"],["XAS-271","R06"],["U5V-261","R09"],["WJC-230","R01"],
  ];
  pairs.forEach(([plate, routeId], i) => {
    const v = VEHICLES.find(x => x.plate === plate);
    const r = ROUTES.find(x => x.id === routeId);
    if (!v || !r) return;
    trips.push({
      id: `T${String(i+1).padStart(4,"0")}`,
      plate, make:v.make, model:v.model, type:v.type,
      driver:v.driver, leadman:v.leadman,
      route:r.name, routeId:r.id,
      km:r.avgKm, hours:r.avgHrs,
      date:dAgo(i+1), status:"completed", syncedToPm:true, notes:"",
    });
  });
  return trips;
}

function computePmAlerts(pmState) {
  const alerts = [];
  VEHICLES.forEach(v => {
    PM_RULES.filter(r => r.types.includes(v.type)).forEach(rule => {
      const rec = pmState[v.plate]?.[rule.id];
      if (!rec) return;
      const tripPct = rule.tripLimit ? rec.tripsSince / rule.tripLimit : 0;
      const kmPct = rule.kmLimit ? rec.kmSince / rule.kmLimit : 0;
      const maxPct = Math.max(tripPct, kmPct);
      if (maxPct >= 0.8) {
        alerts.push({ plate:v.plate, rule:rule.label, pct:Math.round(maxPct*100),
          overdue: maxPct >= 1 });
      }
    });
  });
  return alerts.sort((a,b) => b.pct - a.pct);
}

export default function TripPlannerIntegration() {
  const B = useB();
  const [pmState, setPmState] = useState(buildPmState);
  const [tripLog, setTripLog] = useState(buildSeedTrips);
  const [showModal, setShowModal] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [tab, setTab] = useState("dispatch");

  const [formPlate, setFormPlate] = useState("");
  const [formRoute, setFormRoute] = useState("");
  const [formDate, setFormDate] = useState("2026-04-21");
  const [formKm, setFormKm] = useState("");
  const [formHours, setFormHours] = useState("");
  const [formNotes, setFormNotes] = useState("");

  function handleSaveTrip(data) {
    const vehicle = VEHICLES.find(v => v.plate === data.plate);
    const tripId = `T${String(tripLog.length + 1).padStart(4,"0")}`;

    setPmState(prev => {
      const updated = { ...prev, [data.plate]: { ...(prev[data.plate]||{}) } };
      PM_RULES.filter(r => r.types.includes(vehicle?.type || "4W")).forEach(r => {
        const rec = updated[data.plate][r.id] || { tripsSince:0, kmSince:0, lastServiceDate:"2026-01-01" };
        updated[data.plate][r.id] = { ...rec, tripsSince:(rec.tripsSince||0)+1, kmSince:(rec.kmSince||0)+data.km };
      });
      return updated;
    });

    const newTrip = {
      id: tripId, plate: data.plate,
      make: vehicle?.make, model: vehicle?.model, type: vehicle?.type,
      driver: vehicle?.driver, leadman: vehicle?.leadman,
      route: data.route, routeId: data.routeId,
      km: data.km, hours: data.hours, date: data.date,
      status: "completed", syncedToPm: true, notes: data.notes,
    };
    setTripLog(prev => [newTrip, ...prev]);
    setLastSynced(tripId);
    setShowModal(false);
    resetForm();
  }

  function resetForm() {
    setFormPlate(""); setFormRoute(""); setFormDate("2026-04-21");
    setFormKm(""); setFormHours(""); setFormNotes("");
  }

  function submitForm() {
    if (!formPlate || !formRoute) return;
    const route = ROUTES.find(r => r.id === formRoute);
    handleSaveTrip({
      plate: formPlate,
      route: route?.name || formRoute,
      routeId: formRoute,
      km: parseFloat(formKm) || route?.avgKm || 0,
      hours: parseFloat(formHours) || route?.avgHrs || 0,
      date: formDate,
      notes: formNotes,
    });
  }

  const pmAlerts = computePmAlerts(pmState);
  const overdueAlerts = pmAlerts.filter(a => a.overdue);

  const inp = {
    width:"100%", background:B.navyMid, border:`1px solid ${B.navyBorder}`,
    borderRadius:10, padding:"9px 12px", color:B.white, fontSize:13, outline:"none",
    boxSizing:"border-box",
  };

  return (
    <div style={{ minHeight:"unset", background:B.navy, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"16px 16px 0" }}>
        <h2 style={{ color:B.white, fontSize:20, fontWeight:700, marginBottom:2 }}>Trip Planner</h2>
        <p style={{ color:B.muted, fontSize:12, marginBottom:10 }}>Dispatch & PM integration — {tripLog.length} trips logged</p>

        {lastSynced && (
          <div style={{ background:"#052e16", border:"1px solid #14532d", borderRadius:10, padding:"8px 12px",
            marginBottom:10, color:B.greenLight, fontSize:12 }}>
            ✓ {lastSynced} logged & synced to PM engine
          </div>
        )}

        {overdueAlerts.length > 0 && (
          <div style={{ background:B.statusRedBg, border:`1px solid ${B.statusRedBorder}`, borderRadius:10,
            padding:"8px 12px", marginBottom:10 }}>
            <div style={{ color:B.redLight, fontSize:11, fontWeight:700, marginBottom:4 }}>
              ⚠ {overdueAlerts.length} PM OVERDUE
            </div>
            {overdueAlerts.slice(0,3).map((a,i)=>(
              <div key={i} style={{ color:B.redLight, fontSize:11 }}>• {a.plate}: {a.rule} ({a.pct}%)</div>
            ))}
          </div>
        )}

        <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${B.navyBorder}` }}>
          {[["dispatch","Dispatch"],["log","Trip Log"],["status","PM Status"]].map(([k,label])=>(
            <button key={k} onClick={()=>setTab(k)} style={{
              padding:"8px 14px", border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
              background:"transparent", color:tab===k?B.white:B.muted,
              borderBottom:`2px solid ${tab===k?B.blue:"transparent"}`,
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:16 }}>
        {/* DISPATCH */}
        {tab === "dispatch" && (
          <div>
            <div style={{ background:B.navyMid, borderRadius:14, padding:16, border:`1px solid ${B.navyBorder}` }}>
              <div style={{ color:B.muted, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:14 }}>LOG NEW TRIP</div>

              <div style={{ marginBottom:12 }}>
                <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Vehicle</div>
                <select value={formPlate} onChange={e=>setFormPlate(e.target.value)} style={inp}>
                  <option value="">Select vehicle…</option>
                  {VEHICLES.map(v=>(
                    <option key={v.id} value={v.plate}>{v.plate} — {v.make} {v.model} ({v.type})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom:12 }}>
                <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Route</div>
                <select value={formRoute} onChange={e=>{
                  setFormRoute(e.target.value);
                  const r = ROUTES.find(x=>x.id===e.target.value);
                  if(r){ setFormKm(String(r.avgKm)); setFormHours(String(r.avgHrs)); }
                }} style={inp}>
                  <option value="">Select route…</option>
                  {ROUTES.map(r=>(
                    <option key={r.id} value={r.id}>{r.name} ({r.avgKm}km · {r.avgHrs}hrs)</option>
                  ))}
                </select>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
                {[["Date",formDate,setFormDate,"date"],["KM",formKm,setFormKm,"number"],["Hours",formHours,setFormHours,"number"]].map(([label,val,set,type])=>(
                  <div key={label}>
                    <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>{label}</div>
                    <input type={type} value={val} onChange={e=>set(e.target.value)} style={inp} />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom:14 }}>
                <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Notes</div>
                <textarea value={formNotes} onChange={e=>setFormNotes(e.target.value)}
                  rows={2} placeholder="Trip notes…" style={{ ...inp, resize:"none" }} />
              </div>

              <button onClick={submitForm} disabled={!formPlate||!formRoute} style={{
                width:"100%", padding:"12px 0", borderRadius:10, border:"none",
                background: formPlate&&formRoute ? B.blue : B.navyLight,
                color: formPlate&&formRoute ? "#FFFFFF" : B.muted,
                fontWeight:700, fontSize:14, cursor: formPlate&&formRoute?"pointer":"default",
              }}>Log Trip & Sync to PM</button>
            </div>
          </div>
        )}

        {/* TRIP LOG */}
        {tab === "log" && (
          <div>
            {tripLog.map(t=>(
              <div key={t.id} style={{ background:B.navyMid, borderRadius:12, padding:12,
                marginBottom:8, border:`1px solid ${B.navyBorder}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <div>
                    <span style={{ color:B.muted, fontSize:10, marginRight:6 }}>{t.id}</span>
                    <span style={{ color:B.white, fontWeight:700, fontSize:14 }}>{t.plate}</span>
                    {t.syncedToPm && <span style={{ marginLeft:6, fontSize:10, color:B.greenLight }}>✓ PM synced</span>}
                  </div>
                  <span style={{ color:B.muted, fontSize:11 }}>{t.date}</span>
                </div>
                <div style={{ color:B.offWhite, fontSize:12, marginBottom:4 }}>{t.route}</div>
                <div style={{ display:"flex", gap:12, fontSize:11 }}>
                  <span style={{ color:B.muted }}>Driver: {t.driver||"—"}</span>
                  <span style={{ color:B.muted }}>{t.km}km</span>
                  <span style={{ color:B.muted }}>{t.hours}hrs</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PM STATUS */}
        {tab === "status" && (
          <div>
            <div style={{ color:B.muted, fontSize:12, marginBottom:12 }}>
              Live PM counters — updated each time a trip is logged
            </div>
            {pmAlerts.length === 0 && (
              <div style={{ textAlign:"center", color:B.greenLight, fontSize:14, padding:20 }}>
                ✓ All vehicles within PM limits
              </div>
            )}
            {pmAlerts.map((a,i)=>(
              <div key={i} style={{
                background: a.overdue ? B.statusRedBg : B.statusYellowBg,
                borderRadius:10, padding:12, marginBottom:8,
                border:`1px solid ${a.overdue ? B.statusRedBorder : B.statusYellowBorder}`,
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ color:a.overdue?B.redLight:B.yellowLight, fontWeight:700, fontSize:13 }}>{a.plate}</span>
                  <span style={{ color:a.overdue?B.redLight:B.yellowLight, fontSize:11 }}>{a.pct}%</span>
                </div>
                <div style={{ color:B.offWhite, fontSize:12, marginBottom:6 }}>{a.rule}</div>
                <div style={{ height:4, background:B.navyLight, borderRadius:2 }}>
                  <div style={{ height:"100%", width:`${Math.min(a.pct,100)}%`,
                    background:a.overdue?B.red:B.yellowLight, borderRadius:2 }} />
                </div>
              </div>
            ))}

            {VEHICLES.filter(v => !pmAlerts.find(a=>a.plate===v.plate)).map(v=>(
              <div key={v.id} style={{ background:B.navyMid, borderRadius:10, padding:10,
                marginBottom:6, border:`1px solid ${B.navyBorder}`, display:"flex",
                justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ color:B.offWhite, fontSize:12 }}>{v.plate}</span>
                <span style={{ color:B.greenLight, fontSize:11 }}>✓ OK</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
