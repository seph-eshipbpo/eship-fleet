import { useState } from "react";
import { useB } from "./contexts/ThemeContext";

const HEALTH_COLOR = { green:"#4ade80", yellow:"#fde047", red:"#fca5a5", grey:"#9ca3af" };

const VEHICLES = [
  { id:"v01", plate:"ULD-245", make:"Isuzu", model:"Elf", type:"10W", location:"Valenzuela", condition:"Needs Service", status:"running",
    health:"red", lastService:"2026-02-20", nextDue:"2026-04-05", tripsSince:28, tripsAllowed:30, overdue:["Engine Oil","Brake Check"], dueSoon:[] },
  { id:"v02", plate:"CSY-229", make:"Isuzu", model:"Elf", type:"10W", location:"Valenzuela", condition:"Fair", status:"running",
    health:"yellow", lastService:"2026-02-22", nextDue:"2026-04-22", tripsSince:12, tripsAllowed:30, overdue:[], dueSoon:["Engine Oil"] },
  { id:"v03", plate:"U5V-991", make:"Isuzu", model:"Elf", type:"10W", location:"Cebu", condition:"Good", status:"running",
    health:"green", lastService:"2026-03-10", nextDue:"2026-05-10", tripsSince:8, tripsAllowed:30, overdue:[], dueSoon:[] },
  { id:"v04", plate:"NES-2545", make:"Mitsubishi", model:"Canter", type:"6W", location:"Tacloban", condition:"Fair", status:"running",
    health:"yellow", lastService:"2026-02-18", nextDue:"2026-04-18", tripsSince:14, tripsAllowed:30, overdue:[], dueSoon:["Brake Check"] },
  { id:"v05", plate:"U5U-532", make:"Isuzu", model:"NHR", type:"4W", location:"Valenzuela", condition:"Good", status:"running",
    health:"green", lastService:"2026-03-15", nextDue:"2026-05-15", tripsSince:6, tripsAllowed:30, overdue:[], dueSoon:[] },
  { id:"v06", plate:"NFL-9124", make:"Isuzu", model:"Elf", type:"10W", location:"Cebu", condition:"Good", status:"running",
    health:"green", lastService:"2026-03-20", nextDue:"2026-05-20", tripsSince:5, tripsAllowed:30, overdue:[], dueSoon:[] },
  { id:"v07", plate:"WMJ-284", make:"Isuzu", model:"Elf", type:"10W", location:"Valenzuela", condition:"Under Repair", status:"maintenance",
    health:"red", lastService:"2026-01-15", nextDue:"2026-03-15", tripsSince:31, tripsAllowed:30, overdue:["Engine Oil","Radiator","Drive Belts"], dueSoon:[] },
  { id:"v08", plate:"NAN-597", make:"Mitsubishi", model:"Canter", type:"6W", location:"Valenzuela", condition:"Fair", status:"running",
    health:"yellow", lastService:"2026-02-25", nextDue:"2026-04-25", tripsSince:11, tripsAllowed:30, overdue:[], dueSoon:["Engine Oil"] },
  { id:"v09", plate:"KOH-464", make:"Isuzu", model:"Elf", type:"10W", location:"Valenzuela", condition:"Good", status:"running",
    health:"green", lastService:"2026-03-18", nextDue:"2026-05-18", tripsSince:7, tripsAllowed:30, overdue:[], dueSoon:[] },
  { id:"v10", plate:"XAS-271", make:"Isuzu", model:"NHR", type:"4W", location:"Valenzuela", condition:"Fair", status:"running",
    health:"yellow", lastService:"2026-02-28", nextDue:"2026-04-28", tripsSince:10, tripsAllowed:30, overdue:[], dueSoon:["Brake Check"] },
  { id:"v11", plate:"XKY-980", make:"Isuzu", model:"NHR", type:"4W", location:"Valenzuela", condition:"Inactive", status:"idle",
    health:"grey", lastService:"2026-01-10", nextDue:"2026-03-10", tripsSince:0, tripsAllowed:30, overdue:["Engine Oil"], dueSoon:[] },
  { id:"v12", plate:"U5V-261", make:"Isuzu", model:"Elf", type:"10W", location:"Cebu", condition:"Good", status:"running",
    health:"green", lastService:"2026-03-22", nextDue:"2026-05-22", tripsSince:4, tripsAllowed:30, overdue:[], dueSoon:[] },
  { id:"v13", plate:"U5U-584", make:"Isuzu", model:"NHR", type:"4W", location:"Valenzuela", condition:"Good", status:"running",
    health:"green", lastService:"2026-03-25", nextDue:"2026-05-25", tripsSince:3, tripsAllowed:30, overdue:[], dueSoon:[] },
  { id:"v14", plate:"U5U-588", make:"Isuzu", model:"NHR", type:"4W", location:"Valenzuela", condition:"Good", status:"running",
    health:"green", lastService:"2026-03-28", nextDue:"2026-05-28", tripsSince:2, tripsAllowed:30, overdue:[], dueSoon:[] },
  { id:"v15", plate:"NDP-5708", make:"Mitsubishi", model:"Canter", type:"6W", location:"Valenzuela", condition:"Good", status:"running",
    health:"green", lastService:"2026-03-30", nextDue:"2026-05-30", tripsSince:2, tripsAllowed:30, overdue:[], dueSoon:[] },
  { id:"v16", plate:"WJC-230", make:"Isuzu", model:"NHR", type:"4W", location:"Valenzuela", condition:"Fair", status:"running",
    health:"yellow", lastService:"2026-03-01", nextDue:"2026-05-01", tripsSince:9, tripsAllowed:30, overdue:[], dueSoon:["Fuel Filter"] },
  { id:"v17", plate:"RNE-469", make:"Isuzu", model:"NHR", type:"4W", location:"Valenzuela", condition:"Inactive", status:"idle",
    health:"grey", lastService:"2025-12-01", nextDue:"2026-02-01", tripsSince:0, tripsAllowed:30, overdue:["Engine Oil","Fuel Filter"], dueSoon:[] },
  { id:"v18", plate:"XKY-753", make:"Isuzu", model:"Elf", type:"10W", location:"Valenzuela", condition:"Inactive", status:"idle",
    health:"grey", lastService:"2025-11-15", nextDue:"2026-01-15", tripsSince:0, tripsAllowed:30, overdue:["Engine Oil","Radiator"], dueSoon:[] },
  { id:"v19", plate:"SKL-112", make:"Isuzu", model:"NHR", type:"4W", location:"Valenzuela", condition:"Good", status:"running",
    health:"green", lastService:"2026-04-01", nextDue:"2026-06-01", tripsSince:1, tripsAllowed:30, overdue:[], dueSoon:[] },
  { id:"v20", plate:"TBN-338", make:"Mitsubishi", model:"Canter", type:"6W", location:"Valenzuela", condition:"Good", status:"running",
    health:"green", lastService:"2026-04-02", nextDue:"2026-06-02", tripsSince:1, tripsAllowed:30, overdue:[], dueSoon:[] },
];

const PRE_ITEMS = [
  { id:"p1", label:"Engine oil level" },
  { id:"p2", label:"Coolant level" },
  { id:"p3", label:"Brake fluid" },
  { id:"p4", label:"Headlights & taillights" },
  { id:"p5", label:"Brake lights & signals" },
  { id:"p6", label:"Tire pressure & condition" },
  { id:"p7", label:"Spare tire secured" },
  { id:"p8", label:"Brakes — pedal firmness" },
  { id:"p9", label:"Mirrors & windshield" },
  { id:"p10", label:"Documents on board" },
];

const POST_ITEMS = [
  { id:"q1", label:"Engine temp normal throughout" },
  { id:"q2", label:"No new leaks observed" },
  { id:"q3", label:"Brakes performed normally" },
  { id:"q4", label:"No new body damage" },
  { id:"q5", label:"Cargo area cleared" },
  { id:"q6", label:"Fuel level recorded" },
  { id:"q7", label:"Vehicle parked in designated spot" },
];

const STATUS_STYLE = {
  running:     { bg:"#052e16", border:"#14532d", text:"#4ade80", label:"Running" },
  maintenance: { bg:"#3a0e0a", border:"#7f1d1d", text:"#fca5a5", label:"Maintenance" },
  idle:        { bg:"#1c1917", border:"#44403c", text:"#9ca3af", label:"Idle" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.idle;
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20,
      background:s.bg, border:`1px solid ${s.border}`, color:s.text }}>
      {s.label}
    </span>
  );
}

function HealthDot({ health }) {
  return <span style={{ width:8, height:8, borderRadius:"50%", background:HEALTH_COLOR[health]||"#9ca3af", display:"inline-block" }} />;
}

function DetailPanel({ v, onClose }) {
  const B = useB();
  const [tab, setTab] = useState("status");
  const items = tab === "pre" ? PRE_ITEMS : POST_ITEMS;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:100, display:"flex", alignItems:"flex-end" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:B.navyMid, borderRadius:"16px 16px 0 0", width:"100%", maxHeight:"80vh", overflow:"hidden", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"16px 16px 0", borderBottom:`1px solid ${B.navyBorder}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <div>
              <div style={{ color:B.white, fontWeight:800, fontSize:18 }}>{v.plate}</div>
              <div style={{ color:B.muted, fontSize:12, marginTop:2 }}>{v.make} {v.model} · {v.type} · {v.location}</div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", color:B.muted, fontSize:20, cursor:"pointer" }}>✕</button>
          </div>
          <div style={{ display:"flex", gap:4 }}>
            {[["status","Status"],["pre","Pre-Trip"],["post","Post-Trip"]].map(([k,label])=>(
              <button key={k} onClick={()=>setTab(k)} style={{
                padding:"6px 14px", borderRadius:"8px 8px 0 0", border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
                background: tab===k ? B.navyLight : "transparent",
                color: tab===k ? B.white : B.muted,
                borderBottom: `2px solid ${tab===k?B.blue:"transparent"}`,
              }}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowY:"auto", padding:16 }}>
          {tab === "status" && (
            <div>
              <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                <div style={{ flex:1, background:B.navyLight, borderRadius:10, padding:12 }}>
                  <div style={{ color:B.muted, fontSize:10, marginBottom:4 }}>STATUS</div>
                  <StatusBadge status={v.status} />
                </div>
                <div style={{ flex:1, background:B.navyLight, borderRadius:10, padding:12 }}>
                  <div style={{ color:B.muted, fontSize:10, marginBottom:4 }}>CONDITION</div>
                  <div style={{ color:B.white, fontSize:13, fontWeight:600 }}>{v.condition}</div>
                </div>
                <div style={{ flex:1, background:B.navyLight, borderRadius:10, padding:12 }}>
                  <div style={{ color:B.muted, fontSize:10, marginBottom:4 }}>PM HEALTH</div>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <HealthDot health={v.health} />
                    <span style={{ color:HEALTH_COLOR[v.health], fontSize:12, fontWeight:700, textTransform:"capitalize" }}>{v.health}</span>
                  </div>
                </div>
              </div>
              <div style={{ background:B.navyLight, borderRadius:10, padding:12, marginBottom:10 }}>
                <div style={{ color:B.muted, fontSize:10, marginBottom:8 }}>PM TRACKER</div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ color:B.muted, fontSize:12 }}>Trips since service</span>
                  <span style={{ color:B.white, fontSize:12, fontWeight:700 }}>{v.tripsSince} / {v.tripsAllowed}</span>
                </div>
                <div style={{ height:4, background:B.navyBorder, borderRadius:2, marginBottom:8 }}>
                  <div style={{ height:"100%", width:`${Math.min(100,(v.tripsSince/v.tripsAllowed)*100)}%`,
                    background: v.tripsSince>=v.tripsAllowed ? B.red : v.tripsSince/v.tripsAllowed>0.8 ? B.yellowLight : B.blue,
                    borderRadius:2 }} />
                </div>
                {[["Last Service",v.lastService],["Next Due",v.nextDue]].map(([k,val])=>(
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ color:B.muted, fontSize:12 }}>{k}</span>
                    <span style={{ color:B.white, fontSize:12 }}>{val}</span>
                  </div>
                ))}
              </div>
              {v.overdue.length > 0 && (
                <div style={{ background:B.statusRedBg, border:`1px solid ${B.statusRedBorder}`, borderRadius:10, padding:10 }}>
                  <div style={{ color:B.redLight, fontSize:11, fontWeight:700, marginBottom:6 }}>OVERDUE ({v.overdue.length})</div>
                  {v.overdue.map(item=>(
                    <div key={item} style={{ color:B.redLight, fontSize:12, marginBottom:3 }}>• {item}</div>
                  ))}
                </div>
              )}
              {v.dueSoon.length > 0 && (
                <div style={{ background:B.statusYellowBg, border:`1px solid ${B.statusYellowBorder}`, borderRadius:10, padding:10, marginTop:8 }}>
                  <div style={{ color:B.yellowLight, fontSize:11, fontWeight:700, marginBottom:6 }}>DUE SOON ({v.dueSoon.length})</div>
                  {v.dueSoon.map(item=>(
                    <div key={item} style={{ color:B.yellowLight, fontSize:12, marginBottom:3 }}>• {item}</div>
                  ))}
                </div>
              )}
            </div>
          )}
          {(tab === "pre" || tab === "post") && (
            <div>
              <div style={{ color:B.muted, fontSize:11, marginBottom:12 }}>
                Quick reference checklist — use Inspection module for full forms
              </div>
              {items.map(item=>(
                <div key={item.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0",
                  borderBottom:`1px solid ${B.navyBorder}` }}>
                  <span style={{ color:B.muted, fontSize:16 }}>○</span>
                  <span style={{ color:B.offWhite, fontSize:13 }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FleetDashboard() {
  const B = useB();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  const summary = {
    total: VEHICLES.length,
    running: VEHICLES.filter(v=>v.status==="running").length,
    maintenance: VEHICLES.filter(v=>v.status==="maintenance").length,
    idle: VEHICLES.filter(v=>v.status==="idle").length,
    overdue: VEHICLES.filter(v=>v.overdue.length>0).length,
  };

  const filtered = filter === "all" ? VEHICLES :
    filter === "attention" ? VEHICLES.filter(v=>v.overdue.length>0||v.dueSoon.length>0) :
    VEHICLES.filter(v=>v.status===filter);

  return (
    <div style={{ minHeight:"unset", background:B.navy, padding:16 }}>
      <h2 style={{ color:B.white, fontSize:20, fontWeight:700, marginBottom:4 }}>Fleet Dashboard</h2>
      <p style={{ color:B.muted, fontSize:12, marginBottom:16 }}>Live status — {VEHICLES.length} vehicles</p>

      {/* Summary Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        {[
          ["Running",     summary.running,     B.greenLight,  B.statusGreenBg,  B.statusGreenBorder],
          ["Maintenance", summary.maintenance, B.redLight,    B.statusRedBg,    B.statusRedBorder],
          ["Idle",        summary.idle,        B.muted,       B.statusGrayBg,   B.statusGrayBorder],
          ["PM Overdue",  summary.overdue,     B.yellowLight, B.statusYellowBg, B.statusYellowBorder],
        ].map(([label,val,color,bg,border])=>(
          <div key={label} style={{ background:bg, borderRadius:12, padding:"12px 14px", border:`1px solid ${border}` }}>
            <div style={{ color, fontSize:26, fontWeight:800 }}>{val}</div>
            <div style={{ color:B.muted, fontSize:11, marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto" }}>
        {[["all","All"],["running","Running"],["maintenance","Maintenance"],["idle","Idle"],["attention","Needs Attention"]].map(([k,label])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{
            padding:"5px 12px", borderRadius:20, border:`1px solid ${filter===k?B.blue:B.navyBorder}`,
            background: filter===k ? B.blue : B.navyLight, color: filter===k ? "#FFFFFF" : B.muted,
            fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap",
          }}>{label}</button>
        ))}
      </div>

      {/* Vehicle List */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {filtered.map(v=>(
          <button key={v.id} onClick={()=>setSelected(v)} style={{
            background:B.navyMid, borderRadius:12, padding:"12px 14px",
            border:`1px solid ${v.overdue.length>0?B.redBorder||"#7f1d1d":B.navyBorder}`,
            cursor:"pointer", textAlign:"left", width:"100%",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                  <HealthDot health={v.health} />
                  <span style={{ color:B.white, fontWeight:700, fontSize:15 }}>{v.plate}</span>
                  <StatusBadge status={v.status} />
                </div>
                <div style={{ color:B.muted, fontSize:11 }}>{v.make} {v.model} · {v.type} · {v.location}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                {v.overdue.length > 0 && (
                  <div style={{ color:B.redLight, fontSize:10, fontWeight:700 }}>⚠ {v.overdue.length} overdue</div>
                )}
                {v.dueSoon.length > 0 && v.overdue.length === 0 && (
                  <div style={{ color:B.yellowLight, fontSize:10, fontWeight:700 }}>{v.dueSoon.length} due soon</div>
                )}
                <div style={{ color:B.muted, fontSize:10, marginTop:2 }}>{v.tripsSince}/{v.tripsAllowed} trips</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && <DetailPanel v={selected} onClose={()=>setSelected(null)} />}
    </div>
  );
}
