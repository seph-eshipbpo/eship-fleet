import { useState, useMemo } from "react";

const B = {
  navy: "#0D1B2A", navyMid: "#112236", navyLight: "#1A3350",
  navyBorder: "#1E3A5F", blue: "#2356A8", blueLight: "#2E6AC4",
  white: "#FFFFFF", offWhite: "#C8D8E8", muted: "#7A9BBF",
  green: "#16a34a", greenLight: "#4ade80", red: "#dc2626",
  redLight: "#fca5a5", redBorder: "#7f1d1d", yellow: "#ca8a04",
  yellowLight: "#fde047",
};

const TERMS_OPTS = ["Cash","12 Months","24 Months","36 Months","60 Months","Rental"];

const STATUS_STYLE = {
  active:  { bg:"#052e16", border:"#14532d", text:B.greenLight },
  retired: { bg:"#1c1917", border:"#44403c", text:"#9ca3af" },
  junk:    { bg:"#3a0e0a", border:"#7f1d1d", text:B.redLight },
  sold:    { bg:"#1e1b4b", border:"#3730a3", text:"#a5b4fc" },
  rental:  { bg:"#0c1a2e", border:"#1d4ed8", text:"#93c5fd" },
};

const EMPTY_VEHICLE = {
  plate:"", make:"", model:"", type:"10W", year:"", color:"", owner:"eShip BPO",
  registeredOwner:"", chassis:"", motor:"", driver:"", leadman:"",
  location:"Valenzuela", condition:"Good", acquisitionDate:"", amount:"",
  terms:"Cash", fleetCard:"", insurancePn:"", ltoRenewal:"", marineInsurance:"",
  remarks:"", status:"active", retiredDate:"", retiredReason:"",
};

const SEED_VEHICLES = [
  { id:"v001", plate:"ULD-245", make:"Isuzu", model:"Elf", type:"10W", year:"2018", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"JAACFR54H00020001",
    motor:"4HF1-020001", driver:"Rolando Reyes", leadman:"Felix Santos",
    location:"Valenzuela", condition:"Needs Service", acquisitionDate:"2018-06-15",
    amount:"1800000", terms:"36 Months", fleetCard:"FC-001", insurancePn:"INS-2026-001",
    ltoRenewal:"2026-12-31", marineInsurance:"", remarks:"Engine oil overdue", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v002", plate:"CSY-229", make:"Isuzu", model:"Elf", type:"10W", year:"2019", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"JAACFR54H00020002",
    motor:"4HF1-020002", driver:"Eduardo Bautista", leadman:"Antonio Cruz",
    location:"Valenzuela", condition:"Fair", acquisitionDate:"2019-03-10",
    amount:"1900000", terms:"36 Months", fleetCard:"FC-002", insurancePn:"INS-2026-002",
    ltoRenewal:"2026-12-31", marineInsurance:"", remarks:"", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v003", plate:"U5V-991", make:"Isuzu", model:"Elf", type:"10W", year:"2020", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"JAACFR54H00020003",
    motor:"4HF1-020003", driver:"Benjamin Flores", leadman:"Manuel Ramos",
    location:"Cebu", condition:"Good", acquisitionDate:"2020-01-20",
    amount:"2000000", terms:"36 Months", fleetCard:"FC-003", insurancePn:"INS-2026-003",
    ltoRenewal:"2026-12-31", marineInsurance:"INS-M-003", remarks:"Assigned to Cebu hub", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v004", plate:"NES-2545", make:"Mitsubishi", model:"Canter", type:"6W", year:"2017", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"FE84DVCAB00004",
    motor:"4M50-004", driver:"Rodrigo Villanueva", leadman:"Danilo Aquino",
    location:"Tacloban", condition:"Fair", acquisitionDate:"2017-08-05",
    amount:"2200000", terms:"60 Months", fleetCard:"FC-004", insurancePn:"INS-2026-004",
    ltoRenewal:"2026-12-31", marineInsurance:"INS-M-004", remarks:"Tacloban hub unit", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v005", plate:"U5U-532", make:"Isuzu", model:"NHR", type:"4W", year:"2021", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"JABNHR00005",
    motor:"4JB1-005", driver:"Joseph Dela Cruz", leadman:"Rafael Torres",
    location:"Valenzuela", condition:"Good", acquisitionDate:"2021-05-12",
    amount:"950000", terms:"24 Months", fleetCard:"FC-005", insurancePn:"INS-2026-005",
    ltoRenewal:"2026-12-31", marineInsurance:"", remarks:"", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v006", plate:"NFL-9124", make:"Isuzu", model:"Elf", type:"10W", year:"2020", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"JAACFR54H00020006",
    motor:"4HF1-020006", driver:"Vicente Garcia", leadman:"Arturo Mendoza",
    location:"Cebu", condition:"Good", acquisitionDate:"2020-09-30",
    amount:"2050000", terms:"36 Months", fleetCard:"FC-006", insurancePn:"INS-2026-006",
    ltoRenewal:"2026-12-31", marineInsurance:"INS-M-006", remarks:"Assigned to Cebu hub", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v007", plate:"WMJ-284", make:"Isuzu", model:"Elf", type:"10W", year:"2018", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"JAACFR54H00020007",
    motor:"4HF1-020007", driver:"Roberto Santos", leadman:"Carlos Reyes",
    location:"Valenzuela", condition:"Under Repair", acquisitionDate:"2018-11-22",
    amount:"1850000", terms:"36 Months", fleetCard:"FC-007", insurancePn:"INS-2026-007",
    ltoRenewal:"2026-12-31", marineInsurance:"", remarks:"Engine seized — under repair", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v008", plate:"NAN-597", make:"Mitsubishi", model:"Canter", type:"6W", year:"2019", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"FE84DVCAB00008",
    motor:"4M50-008", driver:"Miguel Castro", leadman:"Ramon Diaz",
    location:"Valenzuela", condition:"Fair", acquisitionDate:"2019-07-18",
    amount:"2300000", terms:"60 Months", fleetCard:"FC-008", insurancePn:"INS-2026-008",
    ltoRenewal:"2026-12-31", marineInsurance:"", remarks:"", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v009", plate:"KOH-464", make:"Isuzu", model:"Elf", type:"10W", year:"2021", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"JAACFR54H00020009",
    motor:"4HF1-020009", driver:"Ernesto Lopez", leadman:"Alfredo Navarro",
    location:"Valenzuela", condition:"Good", acquisitionDate:"2021-02-14",
    amount:"2100000", terms:"36 Months", fleetCard:"FC-009", insurancePn:"INS-2026-009",
    ltoRenewal:"2026-12-31", marineInsurance:"", remarks:"", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v010", plate:"XAS-271", make:"Isuzu", model:"NHR", type:"4W", year:"2020", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"JABNHR00010",
    motor:"4JB1-010", driver:"Francisco Morales", leadman:"Marcelo Perez",
    location:"Valenzuela", condition:"Fair", acquisitionDate:"2020-04-08",
    amount:"980000", terms:"24 Months", fleetCard:"FC-010", insurancePn:"INS-2026-010",
    ltoRenewal:"2026-12-31", marineInsurance:"", remarks:"Brake check due soon", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v011", plate:"XKY-980", make:"Isuzu", model:"NHR", type:"4W", year:"2019", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"JABNHR00011",
    motor:"4JB1-011", driver:"Domingo Gonzales", leadman:"Rodrigo Lim",
    location:"Valenzuela", condition:"Inactive", acquisitionDate:"2019-10-25",
    amount:"960000", terms:"24 Months", fleetCard:"FC-011", insurancePn:"INS-2026-011",
    ltoRenewal:"2026-12-31", marineInsurance:"", remarks:"Currently inactive", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v012", plate:"U5V-261", make:"Isuzu", model:"Elf", type:"10W", year:"2022", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"JAACFR54H00020012",
    motor:"4HF1-020012", driver:"Antonio Ramos", leadman:"Pedro Chan",
    location:"Cebu", condition:"Good", acquisitionDate:"2022-01-10",
    amount:"2200000", terms:"36 Months", fleetCard:"FC-012", insurancePn:"INS-2026-012",
    ltoRenewal:"2026-12-31", marineInsurance:"INS-M-012", remarks:"Cebu hub unit", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v013", plate:"U5U-584", make:"Isuzu", model:"NHR", type:"4W", year:"2022", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"JABNHR00013",
    motor:"4JB1-013", driver:"Jose De Leon", leadman:"Michael Tan",
    location:"Valenzuela", condition:"Good", acquisitionDate:"2022-03-15",
    amount:"1050000", terms:"24 Months", fleetCard:"FC-013", insurancePn:"INS-2026-013",
    ltoRenewal:"2026-12-31", marineInsurance:"", remarks:"", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v014", plate:"U5U-588", make:"Isuzu", model:"NHR", type:"4W", year:"2022", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"JABNHR00014",
    motor:"4JB1-014", driver:"Ricardo Mateo", leadman:"Christian Ong",
    location:"Valenzuela", condition:"Good", acquisitionDate:"2022-05-20",
    amount:"1050000", terms:"24 Months", fleetCard:"FC-014", insurancePn:"INS-2026-014",
    ltoRenewal:"2026-12-31", marineInsurance:"", remarks:"", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v015", plate:"NDP-5708", make:"Mitsubishi", model:"Canter", type:"6W", year:"2021", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"FE84DVCAB00015",
    motor:"4M50-015", driver:"Armando Delos Santos", leadman:"Allan Garcia",
    location:"Valenzuela", condition:"Good", acquisitionDate:"2021-08-30",
    amount:"2400000", terms:"60 Months", fleetCard:"FC-015", insurancePn:"INS-2026-015",
    ltoRenewal:"2026-12-31", marineInsurance:"", remarks:"", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v016", plate:"WJC-230", make:"Isuzu", model:"NHR", type:"4W", year:"2020", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"JABNHR00016",
    motor:"4JB1-016", driver:"Renato Aguilar", leadman:"Efren Fernandez",
    location:"Valenzuela", condition:"Fair", acquisitionDate:"2020-11-12",
    amount:"990000", terms:"24 Months", fleetCard:"FC-016", insurancePn:"INS-2026-016",
    ltoRenewal:"2026-12-31", marineInsurance:"", remarks:"Fuel filter due soon", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v017", plate:"RNE-469", make:"Isuzu", model:"NHR", type:"4W", year:"2017", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"JABNHR00017",
    motor:"4JB1-017", driver:"", leadman:"",
    location:"Valenzuela", condition:"Inactive", acquisitionDate:"2017-04-01",
    amount:"850000", terms:"Cash", fleetCard:"FC-017", insurancePn:"INS-2026-017",
    ltoRenewal:"2026-12-31", marineInsurance:"", remarks:"Inactive — awaiting assignment", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v018", plate:"XKY-753", make:"Isuzu", model:"Elf", type:"10W", year:"2016", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"JAACFR54H00020018",
    motor:"4HF1-020018", driver:"", leadman:"",
    location:"Valenzuela", condition:"Inactive", acquisitionDate:"2016-06-20",
    amount:"1600000", terms:"Cash", fleetCard:"FC-018", insurancePn:"INS-2026-018",
    ltoRenewal:"2026-12-31", marineInsurance:"", remarks:"Inactive — consider disposal", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v019", plate:"SKL-112", make:"Isuzu", model:"NHR", type:"4W", year:"2023", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"JABNHR00019",
    motor:"4JB1-019", driver:"", leadman:"",
    location:"Valenzuela", condition:"Good", acquisitionDate:"2023-02-28",
    amount:"1150000", terms:"24 Months", fleetCard:"FC-019", insurancePn:"INS-2026-019",
    ltoRenewal:"2026-12-31", marineInsurance:"", remarks:"Newly acquired", status:"active",
    retiredDate:"", retiredReason:"" },
  { id:"v020", plate:"TBN-338", make:"Mitsubishi", model:"Canter", type:"6W", year:"2023", color:"White",
    owner:"eShip BPO", registeredOwner:"eShip BPO Corp.", chassis:"FE84DVCAB00020",
    motor:"4M50-020", driver:"", leadman:"",
    location:"Valenzuela", condition:"Good", acquisitionDate:"2023-05-10",
    amount:"2500000", terms:"36 Months", fleetCard:"FC-020", insurancePn:"INS-2026-020",
    ltoRenewal:"2026-12-31", marineInsurance:"", remarks:"Newly acquired", status:"active",
    retiredDate:"", retiredReason:"" },
];

const FIELDS = [
  { key:"plate", label:"Plate Number" }, { key:"make", label:"Make" }, { key:"model", label:"Model" },
  { key:"type", label:"Type", type:"select", opts:["10W","6W","4W"] },
  { key:"year", label:"Year" }, { key:"color", label:"Color" },
  { key:"owner", label:"Owner" }, { key:"registeredOwner", label:"Registered Owner" },
  { key:"chassis", label:"Chassis No." }, { key:"motor", label:"Motor No." },
  { key:"driver", label:"Driver" }, { key:"leadman", label:"Leadman" },
  { key:"location", label:"Location", type:"select", opts:["Valenzuela","Cebu","Tacloban","Davao"] },
  { key:"condition", label:"Condition", type:"select", opts:["Good","Fair","Needs Service","Under Repair","Inactive"] },
  { key:"acquisitionDate", label:"Acquisition Date", type:"date" },
  { key:"amount", label:"Amount (₱)" }, { key:"terms", label:"Terms", type:"select", opts:TERMS_OPTS },
  { key:"fleetCard", label:"Fleet Card No." }, { key:"insurancePn", label:"Insurance Policy No." },
  { key:"ltoRenewal", label:"LTO Renewal Date", type:"date" },
  { key:"marineInsurance", label:"Marine Insurance No." },
  { key:"remarks", label:"Remarks", type:"textarea" },
];

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
  const [vehicles, setVehicles] = useState(SEED_VEHICLES);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(msg, type="success") {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 3000);
  }

  const filtered = useMemo(()=>{
    const q = search.toLowerCase();
    return vehicles.filter(v=>{
      const matchSearch = !q || v.plate.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) ||
        v.driver.toLowerCase().includes(q) || v.leadman.toLowerCase().includes(q);
      const matchStatus = filterStatus==="all" || v.status===filterStatus;
      return matchSearch && matchStatus;
    });
  }, [vehicles, search, filterStatus]);

  function openEdit(v) {
    setEditing(v.id);
    setForm({...v});
    setSelected(null);
  }

  function openAdd() {
    const newId = `v${String(vehicles.length+1).padStart(3,"0")}`;
    setForm({ ...EMPTY_VEHICLE, id:newId });
    setShowAddForm(true);
  }

  function handleSave() {
    if (!form.plate.trim()) { showToast("Plate number is required", "error"); return; }
    if (showAddForm) {
      setVehicles(prev=>[...prev, form]);
      showToast(`Vehicle ${form.plate} added`);
    } else {
      setVehicles(prev=>prev.map(v=>v.id===editing?form:v));
      showToast(`Vehicle ${form.plate} updated`);
    }
    setEditing(null);
    setShowAddForm(false);
    setForm(null);
  }

  function handleRetire(v) {
    setVehicles(prev=>prev.map(x=>x.id===v.id?{...x,status:"retired",retiredDate:"2026-04-21"}:x));
    setSelected(null);
    showToast(`${v.plate} retired`);
  }

  function handleReactivate(v) {
    setVehicles(prev=>prev.map(x=>x.id===v.id?{...x,status:"active",retiredDate:"",retiredReason:""}:x));
    setSelected(null);
    showToast(`${v.plate} reactivated`);
  }

  const inputStyle = {
    width:"100%", borderRadius:8, padding:"9px 12px", fontSize:13,
    border:`1px solid ${B.navyBorder}`, background:B.navy, color:B.white, outline:"none",
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
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search plate, driver, make…"
          style={{ ...inputStyle, flex:1 }}
        />
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto" }}>
        {[["all","All"],["active","Active"],["retired","Retired"],["junk","Junk"],["sold","Sold"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilterStatus(k)} style={{
            padding:"4px 12px", borderRadius:20, border:`1px solid ${filterStatus===k?B.blue:B.navyBorder}`,
            background:filterStatus===k?B.blue:B.navyLight, color:filterStatus===k?B.white:B.muted,
            fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap",
          }}>{l}</button>
        ))}
      </div>

      {/* Vehicle List */}
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
              <button onClick={handleSave} style={{
                flex:2, padding:"11px 0", borderRadius:10, border:"none",
                background:B.blue, color:B.white, fontWeight:700, fontSize:14, cursor:"pointer",
              }}>Save Vehicle</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
