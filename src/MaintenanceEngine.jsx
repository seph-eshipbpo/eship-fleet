import { useState } from "react";

const B = {
  navy: "#0D1B2A", navyMid: "#112236", navyLight: "#1A3350",
  navyBorder: "#1E3A5F", blue: "#2356A8", blueLight: "#2E6AC4",
  white: "#FFFFFF", offWhite: "#C8D8E8", muted: "#7A9BBF",
  green: "#16a34a", greenLight: "#4ade80", red: "#dc2626",
  redLight: "#fca5a5", redBorder: "#7f1d1d", yellow: "#ca8a04",
  yellowLight: "#fde047",
};

const TODAY = new Date("2026-04-21");

function dAgo(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function mkRec(lastDate, tripsSince, kmSince, needsBaseline = false) {
  return { lastServiceDate: lastDate, tripsSince, kmSince, needsBaseline };
}

const PM_RULES = [
  { id:"engine_oil",     label:"Engine Oil Change",      calMonths:2,   tripLimit:30,  kmLimit:1200,  types:["10W","6W","4W"] },
  { id:"fuel_filter",    label:"Fuel Filter Replacement", calMonths:3,   tripLimit:45,  kmLimit:1800,  types:["10W","6W","4W"] },
  { id:"air_filter_rep", label:"Air Filter Replacement",  calMonths:6,   tripLimit:90,  kmLimit:3600,  types:["10W","6W","4W"] },
  { id:"air_filter_cln", label:"Air Filter Cleaning",     calMonths:2,   tripLimit:30,  kmLimit:1200,  types:["10W","6W","4W"] },
  { id:"brake_check",    label:"Brake Inspection",        calWeeks:2,    tripLimit:10,  kmLimit:400,   types:["10W","6W","4W"] },
  { id:"radiator",       label:"Radiator Flush",          calMonths:12,  tripLimit:150, kmLimit:6000,  types:["10W","6W"] },
  { id:"tire_rotation",  label:"Tire Rotation",           calMonths:null,tripLimit:15,  kmLimit:600,   types:["10W","6W","4W"] },
  { id:"drive_belts",    label:"Drive Belt Inspection",   calMonths:null,tripLimit:15,  kmLimit:600,   types:["10W","6W"] },
  { id:"truck_wash",     label:"Truck Wash",              calMonths:null,tripLimit:15,  kmLimit:null,  types:["10W","6W","4W"] },
  { id:"torque_rod",     label:"Torque Rod Check",        calMonths:24,  tripLimit:300, kmLimit:12000, types:["10W","6W"] },
];

const VEHICLES = [
  { id:"v01", plate:"ULD-245", make:"Isuzu", model:"Elf", type:"10W", year:2018, loc:"Valenzuela",
    kmPerTrip:40, trips:28, totalKm:3200, driver:"Rolando Reyes", leadman:"Felix Santos" },
  { id:"v02", plate:"CSY-229", make:"Isuzu", model:"Elf", type:"10W", year:2019, loc:"Valenzuela",
    kmPerTrip:40, trips:12, totalKm:1420, driver:"Eduardo Bautista", leadman:"Antonio Cruz" },
  { id:"v03", plate:"U5V-991", make:"Isuzu", model:"Elf", type:"10W", year:2020, loc:"Cebu",
    kmPerTrip:40, trips:8, totalKm:920, driver:"Benjamin Flores", leadman:"Manuel Ramos" },
  { id:"v04", plate:"NES-2545", make:"Mitsubishi", model:"Canter", type:"6W", year:2017, loc:"Tacloban",
    kmPerTrip:35, trips:14, totalKm:1540, driver:"Rodrigo Villanueva", leadman:"Danilo Aquino" },
  { id:"v05", plate:"U5U-532", make:"Isuzu", model:"NHR", type:"4W", year:2021, loc:"Valenzuela",
    kmPerTrip:25, trips:6, totalKm:580, driver:"Joseph Dela Cruz", leadman:"Rafael Torres" },
  { id:"v06", plate:"NFL-9124", make:"Isuzu", model:"Elf", type:"10W", year:2020, loc:"Cebu",
    kmPerTrip:40, trips:5, totalKm:560, driver:"Vicente Garcia", leadman:"Arturo Mendoza" },
  { id:"v07", plate:"WMJ-284", make:"Isuzu", model:"Elf", type:"10W", year:2018, loc:"Valenzuela",
    kmPerTrip:40, trips:31, totalKm:3560, driver:"Roberto Santos", leadman:"Carlos Reyes" },
  { id:"v08", plate:"NAN-597", make:"Mitsubishi", model:"Canter", type:"6W", year:2019, loc:"Valenzuela",
    kmPerTrip:35, trips:11, totalKm:1240, driver:"Miguel Castro", leadman:"Ramon Diaz" },
  { id:"v09", plate:"KOH-464", make:"Isuzu", model:"Elf", type:"10W", year:2021, loc:"Valenzuela",
    kmPerTrip:40, trips:7, totalKm:820, driver:"Ernesto Lopez", leadman:"Alfredo Navarro" },
  { id:"v10", plate:"XAS-271", make:"Isuzu", model:"NHR", type:"4W", year:2020, loc:"Valenzuela",
    kmPerTrip:25, trips:10, totalKm:920, driver:"Francisco Morales", leadman:"Marcelo Perez" },
  { id:"v11", plate:"XKY-980", make:"Isuzu", model:"NHR", type:"4W", year:2019, loc:"Valenzuela",
    kmPerTrip:25, trips:0, totalKm:0, driver:"Domingo Gonzales", leadman:"Rodrigo Lim" },
  { id:"v12", plate:"U5V-261", make:"Isuzu", model:"Elf", type:"10W", year:2022, loc:"Cebu",
    kmPerTrip:40, trips:4, totalKm:460, driver:"Antonio Ramos", leadman:"Pedro Chan" },
  { id:"v13", plate:"U5U-584", make:"Isuzu", model:"NHR", type:"4W", year:2022, loc:"Valenzuela",
    kmPerTrip:25, trips:3, totalKm:280, driver:"Jose De Leon", leadman:"Michael Tan" },
  { id:"v14", plate:"U5U-588", make:"Isuzu", model:"NHR", type:"4W", year:2022, loc:"Valenzuela",
    kmPerTrip:25, trips:2, totalKm:180, driver:"Ricardo Mateo", leadman:"Christian Ong" },
  { id:"v15", plate:"NDP-5708", make:"Mitsubishi", model:"Canter", type:"6W", year:2021, loc:"Valenzuela",
    kmPerTrip:35, trips:2, totalKm:220, driver:"Armando Delos Santos", leadman:"Allan Garcia" },
  { id:"v16", plate:"WJC-230", make:"Isuzu", model:"NHR", type:"4W", year:2020, loc:"Valenzuela",
    kmPerTrip:25, trips:9, totalKm:840, driver:"Renato Aguilar", leadman:"Efren Fernandez" },
];

const SEED_RECORDS = (() => {
  const r = {};
  VEHICLES.forEach(v => {
    r[v.plate] = {};
    PM_RULES.filter(rule => rule.types.includes(v.type)).forEach(rule => {
      r[v.plate][rule.id] = mkRec(dAgo(45), Math.floor(v.trips * 0.6), Math.floor(v.trips * 0.6 * v.kmPerTrip));
    });
  });
  r["ULD-245"]["engine_oil"] = mkRec(dAgo(55), 28, 1120);
  r["WMJ-284"]["engine_oil"] = mkRec(dAgo(190), 31, 1085);
  r["NES-2545"]["engine_oil"] = mkRec(dAgo(58), 14, 350);
  r["CSY-229"]["engine_oil"] = mkRec(dAgo(54), 12, 480);
  return r;
})();

function computeStatus(rule, rec) {
  const daysService = Math.floor((TODAY - new Date(rec.lastServiceDate)) / 86400000);
  const tripPct = rule.tripLimit ? rec.tripsSince / rule.tripLimit : 0;
  const kmPct = rule.kmLimit ? rec.kmSince / rule.kmLimit : 0;
  let calPct = 0;
  if (rule.calMonths) calPct = daysService / (rule.calMonths * 30);
  if (rule.calWeeks) calPct = daysService / (rule.calWeeks * 7);
  const maxPct = Math.max(tripPct, kmPct, calPct);
  if (maxPct >= 1) return { status:"overdue", pct: Math.min(maxPct * 100, 200), bar:B.red };
  if (maxPct >= 0.8) return { status:"due-soon", pct: maxPct * 100, bar:B.yellowLight };
  return { status:"ok", pct: maxPct * 100, bar:B.greenLight };
}

const SERVICE_HISTORY = [
  { id:"SH001", date:"2026-03-15", plate:"WMJ-284", rule:"Engine Oil Change", mechanic:"Jun Dela Cruz",
    parts:"Engine oil 10W-30 (8L), oil filter", labor:800, cost:2100, approvedBy:"Fleet Manager", notes:"" },
  { id:"SH002", date:"2026-03-20", plate:"ULD-245", rule:"Brake Inspection", mechanic:"Romy Santos",
    parts:"Brake pads (front)", labor:600, cost:3200, approvedBy:"Fleet Manager", notes:"Front pads replaced" },
  { id:"SH003", date:"2026-03-25", plate:"KOH-464", rule:"Engine Oil Change", mechanic:"Jun Dela Cruz",
    parts:"Engine oil 10W-30 (8L), oil filter", labor:800, cost:2100, approvedBy:"Fleet Manager", notes:"" },
  { id:"SH004", date:"2026-04-01", plate:"U5V-991", rule:"Brake Inspection", mechanic:"Romy Santos",
    parts:"Brake fluid top-up", labor:300, cost:450, approvedBy:"Fleet Manager", notes:"" },
  { id:"SH005", date:"2026-04-05", plate:"NAN-597", rule:"Truck Wash", mechanic:"Fleet Crew",
    parts:"Cleaning supplies", labor:500, cost:650, approvedBy:"Fleet Manager", notes:"" },
];

function LogModal({ vehicle, rule, rec, onSave, onClose }) {
  const [mechanic, setMechanic] = useState("");
  const [parts, setParts] = useState("");
  const [labor, setLabor] = useState("");
  const [notes, setNotes] = useState("");

  const inp = {
    width:"100%", background:B.navy, border:`1px solid ${B.navyBorder}`,
    borderRadius:10, padding:"9px 12px", color:B.white, fontSize:13, outline:"none",
    boxSizing:"border-box",
  };

  function handleSubmit() {
    onSave({ mechanic, parts, labor: parseFloat(labor)||0, notes });
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:B.navyMid, borderRadius:16, padding:20, width:"100%", maxWidth:420 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
          <div>
            <div style={{ color:B.white, fontWeight:700, fontSize:15 }}>Log Service</div>
            <div style={{ color:B.muted, fontSize:12 }}>{vehicle.plate} — {rule.label}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:B.muted, fontSize:18, cursor:"pointer" }}>✕</button>
        </div>

        {[["Mechanic / Crew", mechanic, setMechanic, "Name"],
          ["Parts Used", parts, setParts, "List parts and quantities"],
          ["Labor Cost (₱)", labor, setLabor, "0", "number"]].map(([label, val, set, placeholder, type])=>(
          <div key={label} style={{ marginBottom:12 }}>
            <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>{label}</div>
            <input value={val} onChange={e=>set(e.target.value)} placeholder={placeholder}
              type={type||"text"} style={inp} />
          </div>
        ))}

        <div style={{ marginBottom:16 }}>
          <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Notes</div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
            placeholder="Additional notes…" style={{ ...inp, resize:"none" }} />
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{
            flex:1, padding:"10px 0", borderRadius:10, border:`1px solid ${B.navyBorder}`,
            background:"transparent", color:B.white, fontWeight:700, cursor:"pointer",
          }}>Cancel</button>
          <button onClick={handleSubmit} style={{
            flex:2, padding:"10px 0", borderRadius:10, border:"none",
            background:B.blue, color:B.white, fontWeight:700, fontSize:14, cursor:"pointer",
          }}>Submit for Approval</button>
        </div>
      </div>
    </div>
  );
}

export default function MaintenanceEngine() {
  const [records, setRecords] = useState(SEED_RECORDS);
  const [pending, setPending] = useState({});
  const [tab, setTab] = useState("schedule");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [logTarget, setLogTarget] = useState(null);

  function handleLogSubmit({ mechanic, parts, labor, notes }) {
    const { vehicle, rule } = logTarget;
    const serviceId = `SH${String(Object.keys(pending).length + SERVICE_HISTORY.length + 1).padStart(3,"0")}`;
    setPending(prev => ({
      ...prev,
      [serviceId]: {
        id: serviceId, date: TODAY.toISOString().slice(0,10),
        plate: vehicle.plate, rule: rule.label, mechanic, parts,
        labor, cost: labor, notes, status:"pending",
      }
    }));
    setLogTarget(null);
  }

  function confirmApprove(serviceId) {
    const entry = pending[serviceId];
    if (!entry) return;
    setRecords(prev => ({
      ...prev,
      [entry.plate]: {
        ...(prev[entry.plate]||{}),
        [PM_RULES.find(r=>r.label===entry.rule)?.id||""]:
          mkRec(TODAY.toISOString().slice(0,10), 0, 0),
      }
    }));
    setPending(prev => {
      const next = {...prev};
      delete next[serviceId];
      return next;
    });
  }

  const filteredVehicles = filterVehicle === "all" ? VEHICLES : VEHICLES.filter(v=>v.plate===filterVehicle);

  const scheduleRows = filteredVehicles.flatMap(v =>
    PM_RULES.filter(r => r.types.includes(v.type)).map(rule => {
      const rec = records[v.plate]?.[rule.id] || mkRec(dAgo(0), 0, 0, true);
      const s = computeStatus(rule, rec);
      return { vehicle:v, rule, rec, ...s };
    })
  ).sort((a,b) => b.pct - a.pct);

  const overdueCount = scheduleRows.filter(r=>r.status==="overdue").length;
  const dueSoonCount = scheduleRows.filter(r=>r.status==="due-soon").length;
  const pendingCount = Object.keys(pending).length;

  return (
    <div style={{ minHeight:"unset", background:B.navy, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"16px 16px 0" }}>
        <h2 style={{ color:B.white, fontSize:20, fontWeight:700, marginBottom:2 }}>Maintenance Engine</h2>
        <p style={{ color:B.muted, fontSize:12, marginBottom:10 }}>Preventive Maintenance Scheduler</p>

        {/* Summary counts */}
        <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          {[["Overdue", overdueCount, B.red],["Due Soon", dueSoonCount, B.yellowLight],["Pending Approval", pendingCount, B.blueLight]].map(([l,v,c])=>(
            <div key={l} style={{ flex:1, background:B.navyMid, borderRadius:10, padding:"8px 10px",
              border:`1px solid ${B.navyBorder}`, textAlign:"center" }}>
              <div style={{ color:c, fontSize:18, fontWeight:800 }}>{v}</div>
              <div style={{ color:B.muted, fontSize:10 }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${B.navyBorder}` }}>
          {[["schedule","PM Schedule"],["history","Service Log"]].map(([k,label])=>(
            <button key={k} onClick={()=>setTab(k)} style={{
              padding:"8px 16px", border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
              background:"transparent", color:tab===k?B.white:B.muted,
              borderBottom:`2px solid ${tab===k?B.blue:"transparent"}`,
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:16 }}>
        {tab === "schedule" && (
          <div>
            <div style={{ marginBottom:12 }}>
              <select value={filterVehicle} onChange={e=>setFilterVehicle(e.target.value)}
                style={{ width:"100%", background:B.navyMid, border:`1px solid ${B.navyBorder}`,
                  borderRadius:8, padding:"8px 12px", color:B.white, fontSize:12, outline:"none" }}>
                <option value="all">All Vehicles</option>
                {VEHICLES.map(v=><option key={v.id} value={v.plate}>{v.plate} — {v.make} {v.model}</option>)}
              </select>
            </div>

            {scheduleRows.map((row,i)=>{
              const { vehicle:v, rule, rec, status, pct, bar } = row;
              return (
                <div key={`${v.id}-${rule.id}`} style={{
                  background:B.navyMid, borderRadius:12, padding:"12px 14px", marginBottom:8,
                  border:`1px solid ${status==="overdue"?B.redBorder:B.navyBorder}`,
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                    <div>
                      <span style={{ color:B.white, fontWeight:700, fontSize:13 }}>{v.plate}</span>
                      <span style={{ color:B.muted, fontSize:11, marginLeft:8 }}>{rule.label}</span>
                    </div>
                    <span style={{
                      fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20,
                      background: status==="overdue"?"#3a0e0a":status==="due-soon"?"#1a1500":B.navyLight,
                      color: bar,
                    }}>{status==="overdue"?"OVERDUE":status==="due-soon"?"DUE SOON":"OK"}</span>
                  </div>

                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <div style={{ flex:1, height:4, background:B.navyLight, borderRadius:4, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background:bar }} />
                    </div>
                    <span style={{ color:B.muted, fontSize:10, whiteSpace:"nowrap" }}>{Math.min(Math.round(pct),200)}%</span>
                  </div>

                  <div style={{ display:"flex", gap:12, fontSize:11 }}>
                    <span style={{ color:B.muted }}>Last: {rec.lastServiceDate}</span>
                    <span style={{ color:B.muted }}>Trips: {rec.tripsSince}/{rule.tripLimit||"—"}</span>
                    <span style={{ color:B.muted }}>KM: {rec.kmSince}/{rule.kmLimit||"—"}</span>
                  </div>

                  {status !== "ok" && (
                    <button onClick={()=>setLogTarget({vehicle:v,rule,rec})} style={{
                      marginTop:8, padding:"6px 14px", borderRadius:8, border:"none",
                      background:B.blue, color:B.white, fontSize:11, fontWeight:700, cursor:"pointer",
                    }}>Log Service</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "history" && (
          <div>
            {pendingCount > 0 && (
              <div>
                <div style={{ color:B.yellowLight, fontSize:11, fontWeight:700, marginBottom:8 }}>PENDING APPROVAL ({pendingCount})</div>
                {Object.values(pending).map(entry=>(
                  <div key={entry.id} style={{ background:"#1a1500", borderRadius:12, padding:12,
                    marginBottom:8, border:"1px solid #713f12" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ color:B.yellowLight, fontWeight:700, fontSize:13 }}>{entry.plate}</span>
                      <span style={{ color:B.muted, fontSize:11 }}>{entry.date}</span>
                    </div>
                    <div style={{ color:B.offWhite, fontSize:12, marginBottom:4 }}>{entry.rule}</div>
                    <div style={{ color:B.muted, fontSize:11, marginBottom:8 }}>Mechanic: {entry.mechanic}</div>
                    <button onClick={()=>confirmApprove(entry.id)} style={{
                      padding:"6px 14px", borderRadius:8, border:"none", background:B.green,
                      color:B.white, fontSize:11, fontWeight:700, cursor:"pointer",
                    }}>✓ Approve & Record</button>
                  </div>
                ))}
                <div style={{ borderBottom:`1px solid ${B.navyBorder}`, marginBottom:12 }} />
              </div>
            )}

            <div style={{ color:B.muted, fontSize:11, fontWeight:700, marginBottom:8 }}>COMPLETED SERVICE LOG</div>
            {SERVICE_HISTORY.map(entry=>(
              <div key={entry.id} style={{ background:B.navyMid, borderRadius:12, padding:12,
                marginBottom:8, border:`1px solid ${B.navyBorder}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ color:B.white, fontWeight:700, fontSize:13 }}>{entry.plate}</span>
                  <span style={{ color:B.muted, fontSize:11 }}>{entry.date}</span>
                </div>
                <div style={{ color:B.offWhite, fontSize:12, marginBottom:4 }}>{entry.rule}</div>
                <div style={{ color:B.muted, fontSize:11, marginBottom:2 }}>Mechanic: {entry.mechanic}</div>
                {entry.parts && <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Parts: {entry.parts}</div>}
                <div style={{ display:"flex", gap:12 }}>
                  <span style={{ color:B.greenLight, fontSize:11 }}>₱{entry.cost.toLocaleString()}</span>
                  <span style={{ color:B.muted, fontSize:11 }}>Approved by: {entry.approvedBy}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {logTarget && (
        <LogModal
          vehicle={logTarget.vehicle}
          rule={logTarget.rule}
          rec={logTarget.rec}
          onSave={handleLogSubmit}
          onClose={()=>setLogTarget(null)}
        />
      )}
    </div>
  );
}
