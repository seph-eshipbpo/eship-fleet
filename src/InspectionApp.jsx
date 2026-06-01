import { useState } from "react";
import { useB } from "./contexts/ThemeContext";

const VEHICLES = [
  { id:"v01", plate:"ULD-245", make:"Isuzu", model:"Elf", type:"10W" },
  { id:"v02", plate:"CSY-229", make:"Isuzu", model:"Elf", type:"10W" },
  { id:"v03", plate:"U5V-991", make:"Isuzu", model:"Elf", type:"10W" },
  { id:"v04", plate:"NES-2545", make:"Mitsubishi", model:"Canter", type:"6W" },
  { id:"v05", plate:"U5U-532", make:"Isuzu", model:"NHR", type:"4W" },
  { id:"v06", plate:"NFL-9124", make:"Isuzu", model:"Elf", type:"10W" },
  { id:"v07", plate:"WMJ-284", make:"Isuzu", model:"Elf", type:"10W" },
  { id:"v08", plate:"NAN-597", make:"Mitsubishi", model:"Canter", type:"6W" },
  { id:"v09", plate:"KOH-464", make:"Isuzu", model:"Elf", type:"10W" },
  { id:"v10", plate:"XAS-271", make:"Isuzu", model:"NHR", type:"4W" },
  { id:"v11", plate:"XKY-980", make:"Isuzu", model:"NHR", type:"4W" },
  { id:"v12", plate:"U5V-261", make:"Isuzu", model:"Elf", type:"10W" },
  { id:"v13", plate:"U5U-584", make:"Isuzu", model:"NHR", type:"4W" },
  { id:"v14", plate:"U5U-588", make:"Isuzu", model:"NHR", type:"4W" },
  { id:"v15", plate:"NDP-5708", make:"Mitsubishi", model:"Canter", type:"6W" },
  { id:"v16", plate:"WJC-230", make:"Isuzu", model:"NHR", type:"4W" },
];

const PRE_SECTIONS = [
  { id:"s1", label:"Engine & Fluids", items:[
    { id:"p01", label:"Engine oil level" },
    { id:"p02", label:"Coolant level" },
    { id:"p03", label:"Power steering fluid" },
    { id:"p04", label:"Brake fluid level" },
    { id:"p05", label:"Windshield washer fluid" },
    { id:"p06", label:"No visible oil leaks" },
  ]},
  { id:"s2", label:"Lights & Electrical", items:[
    { id:"p07", label:"Headlights (high & low beam)" },
    { id:"p08", label:"Tail lights" },
    { id:"p09", label:"Brake lights" },
    { id:"p10", label:"Turn signals (all corners)" },
    { id:"p11", label:"Hazard lights" },
    { id:"p12", label:"Reverse lights" },
    { id:"p13", label:"Dashboard warning lights clear" },
  ]},
  { id:"s3", label:"Tires & Wheels", items:[
    { id:"p14", label:"Front left tire pressure & condition" },
    { id:"p15", label:"Front right tire pressure & condition" },
    { id:"p16", label:"Rear left tires (dual) condition" },
    { id:"p17", label:"Rear right tires (dual) condition" },
    { id:"p18", label:"Spare tire secured & inflated" },
    { id:"p19", label:"Wheel lugs tight" },
  ]},
  { id:"s4", label:"Brakes & Steering", items:[
    { id:"p20", label:"Brake pedal firmness" },
    { id:"p21", label:"Parking brake functional" },
    { id:"p22", label:"Steering wheel play acceptable" },
    { id:"p23", label:"No abnormal sounds on steering" },
  ]},
  { id:"s5", label:"Body & Safety", items:[
    { id:"p24", label:"Windshield — no cracks obstructing view" },
    { id:"p25", label:"Mirrors properly adjusted" },
    { id:"p26", label:"Doors open/close/latch properly" },
    { id:"p27", label:"Horn functional" },
    { id:"p28", label:"Wipers functional" },
    { id:"p29", label:"Seatbelts functional (all seats)" },
  ]},
  { id:"s6", label:"Cargo & Load", items:[
    { id:"p30", label:"Cargo area clean and clear" },
    { id:"p31", label:"Tie-down straps/binders present" },
    { id:"p32", label:"Load properly secured" },
    { id:"p33", label:"Tailgate/rollup door functional" },
  ]},
  { id:"s7", label:"Documentation", items:[
    { id:"p34", label:"Vehicle registration on board" },
    { id:"p35", label:"Insurance papers on board" },
    { id:"p36", label:"OR/CR present and valid" },
    { id:"p37", label:"Driver's license valid" },
    { id:"p38", label:"Fleet card present" },
    { id:"p39", label:"First aid kit complete" },
    { id:"p40", label:"Fire extinguisher charged" },
    { id:"p41", label:"Emergency triangle/flares" },
  ]},
];

const POST_SECTIONS = [
  { id:"q1", label:"Engine & Mechanical", items:[
    { id:"q01", label:"Engine temperature normal throughout trip" },
    { id:"q02", label:"No new oil/fluid leaks noticed" },
    { id:"q03", label:"Engine sounds normal on shutdown" },
    { id:"q04", label:"No warning lights activated during trip" },
  ]},
  { id:"q2", label:"Brakes & Drivetrain", items:[
    { id:"q05", label:"Brake performance normal" },
    { id:"q06", label:"No brake fade or unusual pedal feel" },
    { id:"q07", label:"Transmission shifted smoothly" },
    { id:"q08", label:"No vibration or pulling while driving" },
  ]},
  { id:"q3", label:"Tires & Wheels", items:[
    { id:"q09", label:"No tire damage observed after trip" },
    { id:"q10", label:"Wheels secure, no looseness" },
  ]},
  { id:"q4", label:"Body & Exterior", items:[
    { id:"q11", label:"No new damage to body/bumpers" },
    { id:"q12", label:"All lights still operational" },
    { id:"q13", label:"Mirrors intact" },
  ]},
  { id:"q5", label:"Cargo & Load Area", items:[
    { id:"q14", label:"Cargo area swept and cleared" },
    { id:"q15", label:"No damage to cargo area" },
    { id:"q16", label:"Tailgate secured" },
    { id:"q17", label:"All straps/equipment accounted for" },
  ]},
  { id:"q6", label:"Fuel & Fluids", items:[
    { id:"q18", label:"Fuel level recorded" },
    { id:"q19", label:"Refueling done if below quarter tank" },
    { id:"q20", label:"No fuel smell in cab or cargo" },
    { id:"q21", label:"Fluid levels checked post-trip" },
    { id:"q22", label:"Vehicle parked in designated spot" },
  ]},
];

function CheckItem({ item, value, onChange, flagNote, onNoteChange }) {
  const B = useB();
  const passed = value === "ok";
  const flagged = value === "flag";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ flex:1, fontSize:13, color: flagged ? B.redLight : B.offWhite }}>{item.label}</span>
        <button onClick={() => onChange("ok")} style={{
          padding:"4px 12px", borderRadius:8, border:"none", cursor:"pointer", fontSize:18,
          background: passed ? B.green : B.navyLight, color: passed ? "#FFFFFF" : B.muted,
        }}>✓</button>
        <button onClick={() => onChange("flag")} style={{
          padding:"4px 12px", borderRadius:8, border:"none", cursor:"pointer", fontSize:18,
          background: flagged ? B.red : B.navyLight, color: flagged ? "#FFFFFF" : B.muted,
        }}>⚑</button>
      </div>
      {flagged && (
        <input
          value={flagNote || ""}
          onChange={e => onNoteChange(e.target.value)}
          placeholder="Describe the issue…"
          style={{
            width:"100%", borderRadius:8, padding:"7px 10px", fontSize:12, marginTop:6,
            border:`1px solid ${B.statusRedBorder}`, background:B.statusRedBg, color:B.redLight, outline:"none",
            boxSizing:"border-box",
          }}
        />
      )}
    </div>
  );
}

export default function InspectionApp() {
  const B = useB();
  const [screen, setScreen] = useState("home");
  const [type, setType] = useState("pre");
  const [vehicle, setVehicle] = useState(null);
  const [checks, setChecks] = useState({});
  const [flagNotes, setFlagNotes] = useState({});
  const [leadman, setLeadman] = useState("");
  const [driver, setDriver] = useState("");
  const [tripKm, setTripKm] = useState("");
  const [tripHours, setTripHours] = useState("");
  const [notes, setNotes] = useState("");

  const sections = type === "pre" ? PRE_SECTIONS : POST_SECTIONS;

  function startInspection(v) {
    setVehicle(v);
    setChecks({});
    setFlagNotes({});
    setLeadman("");
    setDriver("");
    setTripKm("");
    setTripHours("");
    setNotes("");
    setScreen("form");
  }

  const inputStyle = {
    width:"100%", borderRadius:12, padding:"12px 14px", fontSize:13, fontWeight:500,
    border:`1px solid ${B.navyBorder}`, background:B.navyMid, color:B.white, outline:"none",
    boxSizing:"border-box",
  };

  // HOME SCREEN
  if (screen === "home") {
    return (
      <div style={{ minHeight:"unset", background:B.navy, display:"flex", flexDirection:"column", padding:20 }}>
        <h2 style={{ color:B.white, fontSize:20, fontWeight:700, marginBottom:4 }}>Vehicle Inspection</h2>
        <p style={{ color:B.muted, fontSize:13, marginBottom:20 }}>Select inspection type to begin</p>
        <div style={{ display:"flex", gap:12, marginBottom:24 }}>
          {[["pre","Pre-Trip"],["post","Post-Trip"]].map(([k,label])=>(
            <button key={k} onClick={()=>setType(k)} style={{
              flex:1, padding:"14px 0", borderRadius:12, border:`2px solid ${type===k?B.blue:B.navyBorder}`,
              background: type===k ? B.blue : B.navyLight, color: type===k ? "#FFFFFF" : B.muted, fontWeight:700, fontSize:14, cursor:"pointer",
            }}>{label}</button>
          ))}
        </div>
        <h3 style={{ color:B.muted, fontSize:12, fontWeight:700, letterSpacing:1, marginBottom:12 }}>SELECT VEHICLE</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {VEHICLES.map(v=>(
            <button key={v.id} onClick={()=>startInspection(v)} style={{
              padding:"12px 14px", borderRadius:12, border:`1px solid ${B.navyBorder}`,
              background:B.navyMid, cursor:"pointer", textAlign:"left",
            }}>
              <div style={{ color:B.white, fontWeight:700, fontSize:14 }}>{v.plate}</div>
              <div style={{ color:B.muted, fontSize:11, marginTop:2 }}>{v.make} {v.model} · {v.type}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // FORM SCREEN
  if (screen === "form") {
    const totalItems = sections.reduce((a,s)=>a+s.items.length,0);
    const done = Object.values(checks).filter(v=>v==="ok"||v==="flag").length;
    const flags = Object.values(checks).filter(v=>v==="flag").length;
    const progress = totalItems > 0 ? Math.round((done/totalItems)*100) : 0;

    return (
      <div style={{ minHeight:"unset", background:B.navy, display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ background:B.navyMid, borderBottom:`1px solid ${B.navyBorder}`, padding:"12px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <button onClick={()=>setScreen("home")} style={{
              background:"none", border:"none", color:B.muted, fontSize:18, cursor:"pointer", padding:0,
            }}>←</button>
            <div>
              <div style={{ color:B.white, fontWeight:700, fontSize:15 }}>{type==="pre"?"Pre-Trip":"Post-Trip"} — {vehicle.plate}</div>
              <div style={{ color:B.muted, fontSize:11 }}>{vehicle.make} {vehicle.model} · {vehicle.type}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1, height:6, background:B.navyLight, borderRadius:3 }}>
              <div style={{ height:"100%", width:`${progress}%`, background:flags>0?B.red:B.blue, borderRadius:3, transition:"width .3s" }} />
            </div>
            <span style={{ color:B.muted, fontSize:11, whiteSpace:"nowrap" }}>{done}/{totalItems}</span>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:16 }}>
          {/* Trip Info */}
          <div style={{ background:B.navyMid, borderRadius:14, padding:16, marginBottom:16, border:`1px solid ${B.navyBorder}` }}>
            <div style={{ color:B.muted, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:10 }}>TRIP INFORMATION</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <div>
                <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Leadman</div>
                <input value={leadman} onChange={e=>setLeadman(e.target.value)} placeholder="Name" style={inputStyle} />
              </div>
              <div>
                <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Driver</div>
                <input value={driver} onChange={e=>setDriver(e.target.value)} placeholder="Name" style={inputStyle} />
              </div>
              <div>
                <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Trip KM</div>
                <input value={tripKm} onChange={e=>setTripKm(e.target.value)} placeholder="0" type="number" style={inputStyle} />
              </div>
              <div>
                <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Hours</div>
                <input value={tripHours} onChange={e=>setTripHours(e.target.value)} placeholder="0" type="number" style={inputStyle} />
              </div>
            </div>
            <div>
              <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Notes</div>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="General notes…" rows={2}
                style={{ ...inputStyle, resize:"none" }} />
            </div>
          </div>

          {/* Checklist Sections */}
          {sections.map(section=>{
            const sectionDone = section.items.filter(i=>checks[i.id]==="ok"||checks[i.id]==="flag").length;
            const sectionFlags = section.items.filter(i=>checks[i.id]==="flag").length;
            return (
              <div key={section.id} style={{ background:B.navyMid, borderRadius:14, padding:16, marginBottom:12, border:`1px solid ${B.navyBorder}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <span style={{ color:B.white, fontWeight:700, fontSize:14 }}>{section.label}</span>
                  <span style={{ fontSize:11, color: sectionFlags>0?B.redLight:B.muted }}>
                    {sectionFlags>0 ? `⚠ ${sectionFlags} issue${sectionFlags>1?"s":""}` : `${sectionDone}/${section.items.length} complete`}
                  </span>
                </div>
                {section.items.map(item=>(
                  <CheckItem
                    key={item.id}
                    item={item}
                    value={checks[item.id]}
                    onChange={val=>setChecks(prev=>({...prev,[item.id]:val}))}
                    flagNote={flagNotes[item.id]}
                    onNoteChange={val=>setFlagNotes(prev=>({...prev,[item.id]:val}))}
                  />
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ padding:16, borderTop:`1px solid ${B.navyBorder}`, background:B.navyMid }}>
          <button onClick={()=>setScreen("summary")} style={{
            width:"100%", padding:"14px 0", borderRadius:12, border:"none", cursor:"pointer",
            background: flags>0 ? B.red : B.blue, color:"#FFFFFF", fontWeight:700, fontSize:15,
          }}>
            {flags>0 ? `⚠ Submit with ${flags} Issue${flags>1?"s":""}` : "✓ Submit Inspection"}
          </button>
        </div>
      </div>
    );
  }

  // SUMMARY SCREEN
  if (screen === "summary") {
    const totalItems = sections.reduce((a,s)=>a+s.items.length,0);
    const done = Object.values(checks).filter(v=>v==="ok"||v==="flag").length;
    const flags = Object.values(checks).filter(v=>v==="flag").length;
    const flaggedItems = sections.flatMap(s=>
      s.items.filter(i=>checks[i.id]==="flag").map(i=>({...i, sectionLabel:s.label}))
    );
    const stats = [
      ["Checked", done, B.blue],
      ["Passed", Object.values(checks).filter(v=>v==="ok").length, B.greenLight],
      ["Flagged", flags, B.red],
    ];

    return (
      <div style={{ minHeight:"unset", background:B.navy, display:"flex", flexDirection:"column" }}>
        <div style={{ background:B.navyMid, borderBottom:`1px solid ${B.navyBorder}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>setScreen("form")} style={{ background:"none", border:"none", color:B.muted, fontSize:18, cursor:"pointer", padding:0 }}>←</button>
          <div>
            <div style={{ color:B.white, fontWeight:700, fontSize:15 }}>Inspection Summary</div>
            <div style={{ color:B.muted, fontSize:11 }}>{vehicle.plate} · {type==="pre"?"Pre-Trip":"Post-Trip"}</div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:16 }}>
          {/* Stats */}
          <div style={{ display:"flex", gap:10, marginBottom:16 }}>
            {stats.map(([label,val,color])=>(
              <div key={label} style={{ flex:1, background:B.navyMid, borderRadius:12, padding:"12px 10px", textAlign:"center", border:`1px solid ${B.navyBorder}` }}>
                <div style={{ color, fontSize:24, fontWeight:800 }}>{val}</div>
                <div style={{ color:B.muted, fontSize:11, marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Trip Info Summary */}
          <div style={{ background:B.navyMid, borderRadius:14, padding:14, marginBottom:16, border:`1px solid ${B.navyBorder}` }}>
            <div style={{ color:B.muted, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:8 }}>TRIP INFO</div>
            {[["Vehicle",`${vehicle.plate} — ${vehicle.make} ${vehicle.model}`],["Driver",driver||"—"],["Leadman",leadman||"—"],["KM",tripKm||"—"],["Hours",tripHours||"—"]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ color:B.muted, fontSize:12 }}>{k}</span>
                <span style={{ color:B.white, fontSize:12, fontWeight:600 }}>{v}</span>
              </div>
            ))}
            {notes && <div style={{ color:B.offWhite, fontSize:12, marginTop:6, padding:"8px 10px", background:B.navyLight, borderRadius:8 }}>{notes}</div>}
          </div>

          {/* Flagged Items */}
          {flags > 0 && (
            <div style={{ background:B.statusRedBg, borderRadius:14, padding:14, marginBottom:16, border:`1px solid ${B.statusRedBorder}` }}>
              <div style={{ color:B.redLight, fontSize:12, fontWeight:700, letterSpacing:1, marginBottom:10 }}>⚠ FLAGGED ISSUES ({flags})</div>
              {flaggedItems.map(item=>(
                <div key={item.id} style={{ marginBottom:10, paddingBottom:10, borderBottom:`1px solid ${B.redBorder}` }}>
                  <div style={{ color:B.redLight, fontSize:13, fontWeight:600 }}>{item.label}</div>
                  <div style={{ color:B.muted, fontSize:11, marginTop:1 }}>{item.sectionLabel}</div>
                  {flagNotes[item.id] && <div style={{ color:B.redLight, fontSize:12, marginTop:4, fontStyle:"italic" }}>{flagNotes[item.id]}</div>}
                </div>
              ))}
            </div>
          )}

          {flags === 0 && (
            <div style={{ background:B.statusGreenBg, borderRadius:14, padding:14, marginBottom:16, border:`1px solid ${B.statusGreenBorder}`, textAlign:"center" }}>
              <div style={{ fontSize:28, marginBottom:4 }}>✓</div>
              <div style={{ color:B.greenLight, fontWeight:700, fontSize:14 }}>All items passed</div>
              <div style={{ color:B.muted, fontSize:12, marginTop:2 }}>Vehicle cleared for {type==="pre"?"departure":"parking"}</div>
            </div>
          )}
        </div>

        <div style={{ padding:16, borderTop:`1px solid ${B.navyBorder}`, background:B.navyMid, display:"flex", gap:10 }}>
          <button onClick={()=>setScreen("home")} style={{
            flex:1, padding:"13px 0", borderRadius:12, border:`1px solid ${B.navyBorder}`,
            background:"transparent", color:B.white, fontWeight:700, fontSize:14, cursor:"pointer",
          }}>New Inspection</button>
          <button style={{
            flex:2, padding:"13px 0", borderRadius:12, border:"none", cursor:"pointer",
            background:B.blue, color:B.white, fontWeight:700, fontSize:14,
          }}>Save Report</button>
        </div>
      </div>
    );
  }

  return null;
}
