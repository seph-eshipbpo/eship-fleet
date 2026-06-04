import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useB } from "./contexts/ThemeContext";
import { getReportOverview, getReportCosts, getReportLocations } from "./api/reports";
import { getReportBreakdowns, createBreakdown, updateBreakdown, listBreakdownRootCauses } from "./api/breakdowns";
import { api } from "./api/client";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const TRIP_DATA = [
  { month:"Jan", trips:142, km:5680, target:150 },
  { month:"Feb", trips:138, km:5520, target:150 },
  { month:"Mar", trips:155, km:6200, target:150 },
  { month:"Apr", trips:149, km:5960, target:150 },
  { month:"May", trips:163, km:6520, target:150 },
  { month:"Jun", trips:158, km:6320, target:150 },
  { month:"Jul", trips:145, km:5800, target:150 },
  { month:"Aug", trips:172, km:6880, target:150 },
  { month:"Sep", trips:168, km:6720, target:150 },
  { month:"Oct", trips:175, km:7000, target:150 },
  { month:"Nov", trips:161, km:6440, target:150 },
  { month:"Dec", trips:148, km:5920, target:150 },
];

const COST_DATA = [
  { month:"Jan", fuel:48500, maintenance:12000, total:60500 },
  { month:"Feb", fuel:46200, maintenance:8500,  total:54700 },
  { month:"Mar", fuel:52000, maintenance:15000, total:67000 },
  { month:"Apr", fuel:50100, maintenance:11000, total:61100 },
  { month:"May", fuel:54800, maintenance:9800,  total:64600 },
  { month:"Jun", fuel:53200, maintenance:13500, total:66700 },
  { month:"Jul", fuel:49600, maintenance:7200,  total:56800 },
  { month:"Aug", fuel:57300, maintenance:18000, total:75300 },
  { month:"Sep", fuel:55800, maintenance:14200, total:70000 },
  { month:"Oct", fuel:58200, maintenance:10500, total:68700 },
  { month:"Nov", fuel:54100, maintenance:11800, total:65900 },
  { month:"Dec", fuel:50400, maintenance:9200,  total:59600 },
];

const BREAKDOWNS = [
  { id:"BD001", date:"2026-01-08", plate:"WMJ-284", type:"10W", make:"Isuzu", model:"Elf",
    issue:"Engine seized — complete failure", rootCause:"Overdue oil change", location:"Valenzuela",
    hoursDown:14, cost:28000, status:"resolved" },
  { id:"BD002", date:"2026-01-22", plate:"XAS-271", type:"4W", make:"Isuzu", model:"NHR",
    issue:"Brake fade on descent", rootCause:"Worn brake pads", location:"Valenzuela",
    hoursDown:6, cost:8500, status:"resolved" },
  { id:"BD003", date:"2026-02-05", plate:"ULD-245", type:"10W", make:"Isuzu", model:"Elf",
    issue:"Engine overheating", rootCause:"Coolant leak — cracked hose", location:"Valenzuela",
    hoursDown:8, cost:15000, status:"resolved" },
  { id:"BD004", date:"2026-02-18", plate:"NAN-597", type:"6W", make:"Mitsubishi", model:"Canter",
    issue:"Drive belt failure", rootCause:"Belt wear past service limit", location:"Valenzuela",
    hoursDown:5, cost:4200, status:"resolved" },
  { id:"BD005", date:"2026-02-28", plate:"WJC-230", type:"4W", make:"Isuzu", model:"NHR",
    issue:"Engine stall on route", rootCause:"Clogged fuel filter", location:"Valenzuela",
    hoursDown:4, cost:3500, status:"resolved" },
  { id:"BD006", date:"2026-03-10", plate:"WMJ-284", type:"10W", make:"Isuzu", model:"Elf",
    issue:"Oil leak under engine", rootCause:"Failed oil pan gasket", location:"Valenzuela",
    hoursDown:9, cost:12000, status:"resolved" },
  { id:"BD007", date:"2026-03-18", plate:"XKY-980", type:"4W", make:"Isuzu", model:"NHR",
    issue:"Engine performance loss", rootCause:"Clogged air filter", location:"Valenzuela",
    hoursDown:3, cost:2800, status:"resolved" },
  { id:"BD008", date:"2026-03-25", plate:"KOH-464", type:"10W", make:"Isuzu", model:"Elf",
    issue:"Brake caliper seized", rootCause:"Brake caliper corrosion", location:"Valenzuela",
    hoursDown:5, cost:6500, status:"resolved" },
  { id:"BD009", date:"2026-04-02", plate:"ULD-245", type:"10W", make:"Isuzu", model:"Elf",
    issue:"Oil pressure warning light", rootCause:"Blocked oil pickup screen", location:"Valenzuela",
    hoursDown:7, cost:11000, status:"resolved" },
  { id:"BD010", date:"2026-04-09", plate:"NFL-9124", type:"10W", make:"Isuzu", model:"Elf",
    issue:"Tire blowout on highway", rootCause:"Overinflated tire + road debris", location:"Cebu",
    hoursDown:3, cost:8000, status:"resolved" },
];

const ROOT_CAUSES = (() => {
  const counts = {};
  BREAKDOWNS.forEach(b=>{ counts[b.rootCause]=(counts[b.rootCause]||0)+1; });
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}));
})();

const PIE_COLORS = ["#dc2626", "#ca8a04", "#2356A8", "#4ade80", "#7A9BBF", "#a78bfa"];

const LOCATIONS = [
  { name:"Valenzuela", vehicles:16, active:14, trips:1520, pct:78 },
  { name:"Cebu", vehicles:3, active:3, trips:285, pct:15 },
  { name:"Tacloban", vehicles:1, active:1, trips:70, pct:4 },
  { name:"Davao", vehicles:0, active:0, trips:0, pct:0 },
];

function KpiCard({ label, value, sub, color }) {
  const B = useB();
  return (
    <div style={{ background:B.navyMid, borderRadius:12, padding:"14px 16px", border:`1px solid ${B.navyBorder}`, flex:1 }}>
      <div style={{ color:color||B.white, fontSize:22, fontWeight:800 }}>{value}</div>
      <div style={{ color:B.white, fontSize:12, fontWeight:600, marginTop:2 }}>{label}</div>
      {sub && <div style={{ color:B.muted, fontSize:11, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function GoalGauge({ pct, label }) {
  const B = useB();
  const r = 52, cx = 60, cy = 60;
  const circumference = Math.PI * r;
  const dash = (pct / 100) * circumference;
  const color = pct >= 90 ? B.greenLight : pct >= 70 ? B.yellowLight : B.redLight;
  return (
    <div style={{ textAlign:"center" }}>
      <svg width={120} height={80} viewBox="0 0 120 80">
        <path d={`M ${cx-r},${cy} A ${r},${r} 0 0,1 ${cx+r},${cy}`}
          fill="none" stroke={B.navyLight} strokeWidth={10} strokeLinecap="round" />
        <path d={`M ${cx-r},${cy} A ${r},${r} 0 0,1 ${cx+r},${cy}`}
          fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`} />
        <text x={cx} y={cy-6} textAnchor="middle" fill={color} fontSize={pct > 0 && pct < 1 ? 13 : 18} fontWeight={800}>
          {pct > 0 && pct < 1 ? "<1%" : `${pct}%`}
        </text>
        <text x={cx} y={cy+12} textAnchor="middle" fill={B.muted} fontSize={10}>{label}</text>
      </svg>
    </div>
  );
}

const TABS = [["overview","Overview"],["breakdowns","Breakdowns"],["costs","Cost Analysis"],["locations","Locations"]];

export default function ManagementView() {
  const B = useB();
  const [tab, setTab] = useState("overview");
  const [overview, setOverview]               = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [bdReport, setBdReport]               = useState(null);
  const [loadingBd, setLoadingBd]             = useState(false);

  // ── Log Breakdown modal ────────────────────────────────────────────────────
  const [showBdModal,    setShowBdModal]    = useState(false);
  const [bdModalVehicles, setBdModalVehicles] = useState([]);
  const [bdModalCauses,   setBdModalCauses]   = useState([]);
  const [bdModalSaving,   setBdModalSaving]   = useState(false);
  const [bdModalError,    setBdModalError]    = useState(null);
  const [bdForm, setBdForm] = useState({
    vehicle_id: "", breakdown_root_cause_id: "",
    date: new Date().toISOString().slice(0,10),
    started_at: "", issue: "", cost: "",
  });

  // ── Resolve breakdown inline form ──────────────────────────────────────────
  const [resolvingId,       setResolvingId]       = useState(null);
  const [resolveResolvedAt, setResolveResolvedAt] = useState("");
  const [costReport, setCostReport]           = useState(null);
  const [loadingCost, setLoadingCost]         = useState(false);
  const [locReport, setLocReport]             = useState(null);
  const [loadingLoc, setLoadingLoc]           = useState(false);

  useEffect(() => {
    if (tab !== "overview") return;
    setLoadingOverview(true);
    getReportOverview()
      .then(res => setOverview(res.data))
      .catch(() => {})
      .finally(() => setLoadingOverview(false));
  }, [tab]); // re-fetch every time the user returns to the Overview tab

  useEffect(() => {
    if (tab !== "breakdowns" || bdReport) return;
    setLoadingBd(true);
    getReportBreakdowns()
      .then(res => setBdReport(res.data))
      .catch(() => {})
      .finally(() => setLoadingBd(false));
  }, [tab]);

  function refreshBdReport() {
    setLoadingBd(true);
    getReportBreakdowns()
      .then(res => setBdReport(res.data))
      .catch(() => {})
      .finally(() => setLoadingBd(false));
  }

  async function openBdModal() {
    setShowBdModal(true);
    setBdModalError(null);
    setBdForm({ vehicle_id:"", breakdown_root_cause_id:"",
      date: new Date().toISOString().slice(0,10), started_at:"", issue:"", cost:"" });
    if (bdModalVehicles.length === 0) {
      const [vRes, cRes] = await Promise.all([
        api.get("/api/vehicles?status=active&per_page=100"),
        listBreakdownRootCauses(),
      ]);
      setBdModalVehicles(vRes.data ?? []);
      setBdModalCauses(cRes.data ?? []);
    }
  }

  async function saveBdModal() {
    const missing = [];
    if (!bdForm.vehicle_id) missing.push("Vehicle");
    if (!bdForm.issue?.trim()) missing.push("Issue Description");
    if (!bdForm.cost) missing.push("Repair Cost");
    if (missing.length) {
      setBdModalError(`Please fill in: ${missing.join(", ")}.`); return;
    }
    setBdModalSaving(true); setBdModalError(null);
    try {
      await createBreakdown({
        vehicle_id:              parseInt(bdForm.vehicle_id),
        breakdown_root_cause_id: bdForm.breakdown_root_cause_id ? parseInt(bdForm.breakdown_root_cause_id) : null,
        date:       bdForm.date,
        started_at: bdForm.started_at || null,
        issue:      bdForm.issue,
        cost:       parseFloat(bdForm.cost),
        status:     "open",
      });
      setShowBdModal(false);
      refreshBdReport();
    } catch (err) {
      setBdModalError(err.message || "Failed to save breakdown.");
    } finally {
      setBdModalSaving(false);
    }
  }

  async function resolveBreakdown(bdId) {
    try {
      await updateBreakdown(bdId, {
        status:      "resolved",
        resolved_at: resolveResolvedAt || new Date().toISOString(),
      });
      setResolvingId(null);
      setResolveResolvedAt("");
      refreshBdReport();
    } catch {
      // silent — user can retry
    }
  }

  useEffect(() => {
    if (tab !== "costs" || costReport) return;
    setLoadingCost(true);
    getReportCosts()
      .then(res => setCostReport(res.data))
      .catch(() => {})
      .finally(() => setLoadingCost(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== "locations") return;
    setLoadingLoc(true);
    getReportLocations()
      .then(res => setLocReport(res.data))
      .catch(() => {})
      .finally(() => setLoadingLoc(false));
  }, [tab]);

  // Overview tab — driven by API; show zeros while loading
  const tripChartData   = overview?.monthly_trips  ?? TRIP_DATA;
  const totalTrips      = overview?.total_trips    ?? 0;
  const totalKm         = overview?.total_km       ?? 0;
  const tripTargetPct   = overview?.trip_target_pct   ?? 0;
  const fleetUptimePct  = overview?.fleet_uptime_pct  ?? 0;
  const pmCompliancePct = overview?.pm_compliance_pct ?? 0;
  const maintCost       = overview?.maintenance_cost  ?? 0;

  // Breakdowns tab — from API
  const bdList       = bdReport?.breakdowns   ?? [];
  const rootCauses   = bdReport?.root_causes  ?? ROOT_CAUSES;
  const bdTotalInc   = bdReport?.total_incidents  ?? BREAKDOWNS.length;
  const bdTotalHours = bdReport?.total_down_hours ?? BREAKDOWNS.reduce((a,b)=>a+b.hoursDown,0);
  const bdTotalCost  = bdReport?.total_cost       ?? BREAKDOWNS.reduce((a,b)=>a+b.cost,0);

  // Cost Analysis tab — from API
  const costData = costReport?.monthly ?? COST_DATA;
  const ytdFuel  = costReport?.ytd_fuel        ?? COST_DATA.reduce((a,d)=>a+d.fuel,0);
  const ytdMaint = costReport?.ytd_maintenance ?? COST_DATA.reduce((a,d)=>a+d.maintenance,0);

  return (
    <div style={{ minHeight:"unset", background:B.navy }}>
      <div style={{ padding:"16px 16px 0" }}>
        <h2 style={{ color:B.white, fontSize:20, fontWeight:700, marginBottom:2 }}>Management View</h2>
        <p style={{ color:B.muted, fontSize:12, marginBottom:14 }}>Fleet KPIs & Analytics — YTD 2026</p>
        <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${B.navyBorder}`, overflowX:"auto" }}>
          {TABS.map(([k,label])=>(
            <button key={k} onClick={()=>setTab(k)} style={{
              padding:"8px 14px", border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
              background:"transparent", color:tab===k?B.white:B.muted,
              borderBottom:`2px solid ${tab===k?B.blue:"transparent"}`, whiteSpace:"nowrap",
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:16, overflowY:"auto" }}>
        {/* OVERVIEW */}
        {tab === "overview" && loadingOverview && (() => {
          const sh = { background:`linear-gradient(90deg,${B.navyMid} 25%,${B.navyBorder} 50%,${B.navyMid} 75%)`, backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite", borderRadius:8 };
          return (
            <div>
              <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
              <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                {[1,2].map(i=><div key={i} style={{ flex:1, background:B.navyMid, borderRadius:12, padding:"14px 16px", border:`1px solid ${B.navyBorder}` }}><div style={{ ...sh, height:28, width:"50%", marginBottom:8 }} /><div style={{ ...sh, height:12, width:"60%" }} /></div>)}
              </div>
              <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                {[1,2].map(i=><div key={i} style={{ flex:1, background:B.navyMid, borderRadius:12, padding:"14px 16px", border:`1px solid ${B.navyBorder}` }}><div style={{ ...sh, height:28, width:"40%", marginBottom:8 }} /><div style={{ ...sh, height:12, width:"55%" }} /></div>)}
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:16 }}>
                {[1,2,3].map(i=><div key={i} style={{ ...sh, height:80, width:120 }} />)}
              </div>
              <div style={{ background:B.navyMid, borderRadius:14, padding:14, border:`1px solid ${B.navyBorder}` }}>
                <div style={{ ...sh, height:12, width:"40%", marginBottom:14 }} />
                <div style={{ ...sh, height:180, width:"100%", borderRadius:10 }} />
              </div>
            </div>
          );
        })()}
        {tab === "overview" && !loadingOverview && (
          <div>
            <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
              <KpiCard label="Total Trips" value={totalTrips.toLocaleString()} sub={`YTD ${new Date().getFullYear()}`} color={B.blueLight} />
              <KpiCard label="Total KM" value={totalKm >= 1000 ? (totalKm/1000).toFixed(1)+"k" : totalKm.toLocaleString(undefined,{maximumFractionDigits:1})} sub="YTD" color={B.offWhite} />
            </div>
            <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
              <KpiCard label="Breakdowns" value={bdTotalInc} sub={`${bdTotalHours}hrs total`} color={B.redLight} />
              <KpiCard label="Maint. Cost" value={`₱${(maintCost/1000).toFixed(0)}k`} sub="YTD" color={B.yellowLight} />
            </div>

            <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:16, flexWrap:"wrap" }}>
              <GoalGauge pct={tripTargetPct}   label="Trip Target" />
              <GoalGauge pct={fleetUptimePct}  label="Fleet Uptime" />
              <GoalGauge pct={pmCompliancePct} label="PM Compliance" />
            </div>

            <div style={{ background:B.navyMid, borderRadius:14, padding:14, border:`1px solid ${B.navyBorder}` }}>
              <div style={{ color:B.muted, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:10 }}>MONTHLY TRIPS VS TARGET</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={tripChartData}>
                  <CartesianGrid stroke={B.navyBorder} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill:B.muted, fontSize:10 }} />
                  <YAxis tick={{ fill:B.muted, fontSize:10 }} />
                  <Tooltip contentStyle={{ background:B.navyMid, border:`1px solid ${B.navyBorder}`, borderRadius:8, color:B.white }} />
                  <Line type="monotone" dataKey="trips" stroke={B.blue} strokeWidth={2} dot={false} name="Trips" />
                  <Line type="monotone" dataKey="target" stroke={B.muted} strokeWidth={1} strokeDasharray="4 4" dot={false} name="Target" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* BREAKDOWNS */}
        {tab === "breakdowns" && (
          <div>
            {loadingBd ? (
              (() => {
                const sh = { background:`linear-gradient(90deg,${B.navyMid} 25%,${B.navyBorder} 50%,${B.navyMid} 75%)`, backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite", borderRadius:8 };
                return (
                  <div>
                    <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
                    <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                      {[1,2,3].map(i=><div key={i} style={{ flex:1, background:B.navyMid, borderRadius:12, padding:"14px 16px", border:`1px solid ${B.navyBorder}` }}><div style={{ ...sh, height:28, width:"50%", marginBottom:8 }} /><div style={{ ...sh, height:12, width:"70%" }} /></div>)}
                    </div>
                    <div style={{ background:B.navyMid, borderRadius:14, padding:14, marginBottom:14, border:`1px solid ${B.navyBorder}`, height:140 }}><div style={{ ...sh, height:12, width:"30%", marginBottom:14 }} /><div style={{ ...sh, height:100, width:"100%", borderRadius:10 }} /></div>
                    {[1,2,3].map(i=><div key={i} style={{ background:B.navyMid, borderRadius:12, padding:14, marginBottom:10, border:`1px solid ${B.navyBorder}` }}><div style={{ ...sh, height:13, width:"40%", marginBottom:8 }} /><div style={{ ...sh, height:11, width:"70%", marginBottom:6 }} /><div style={{ ...sh, height:11, width:"50%" }} /></div>)}
                  </div>
                );
              })()
            ) : (
              <div>
                <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                  <KpiCard label="Total Incidents" value={bdTotalInc} color={B.redLight} />
                  <KpiCard label="Total Down Hours" value={bdTotalHours} color={B.yellowLight} />
                  <KpiCard label="Total Cost" value={`₱${(bdTotalCost/1000).toFixed(0)}k`} color={B.offWhite} />
                </div>

                {rootCauses.length > 0 && (
                  <div style={{ background:B.navyMid, borderRadius:14, padding:14, marginBottom:14, border:`1px solid ${B.navyBorder}` }}>
                    <div style={{ color:B.muted, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:10 }}>ROOT CAUSES</div>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <PieChart width={120} height={120}>
                        <Pie data={rootCauses} cx={56} cy={56} innerRadius={36} outerRadius={56} dataKey="value">
                          {rootCauses.map((e,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                        </Pie>
                      </PieChart>
                      <div style={{ flex:1 }}>
                        {rootCauses.map((rc,i)=>(
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                            <span style={{ width:8, height:8, borderRadius:"50%", background:PIE_COLORS[i%PIE_COLORS.length], display:"inline-block" }} />
                            <span style={{ color:B.offWhite, fontSize:11, flex:1 }}>{rc.name}</span>
                            <span style={{ color:B.muted, fontSize:11 }}>{rc.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Log Breakdown button */}
                <button onClick={openBdModal} style={{
                  width:"100%", padding:"10px 0", borderRadius:10, border:"none", marginBottom:14,
                  background:B.blue, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer",
                }}>+ Log Breakdown Incident</button>

                {bdList.length === 0 ? (
                  <p style={{ color:B.muted, fontSize:13, textAlign:"center", padding:"24px 0" }}>No breakdown incidents recorded for this year.</p>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {bdList.map(b => {
                      const isOpen      = b.status === "open";
                      const isResolving = resolvingId === b.id;
                      return (
                        <div key={b.id} style={{ background:B.navyMid, borderRadius:12, padding:14,
                          border:`1px solid ${isOpen ? "#7f1d1d" : B.navyBorder}` }}>

                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ color:B.muted, fontSize:10 }}>{b.ref}</span>
                              <span style={{ color:B.white, fontWeight:700, fontSize:14 }}>{b.plate}</span>
                              {isOpen ? (
                                <span style={{ fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:10,
                                  background:"#3a0e0a", border:"1px solid #7f1d1d", color:"#fca5a5" }}>OPEN</span>
                              ) : (
                                <span style={{ fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:10,
                                  background:"#052e16", border:"1px solid #14532d", color:"#4ade80" }}>RESOLVED</span>
                              )}
                            </div>
                            <span style={{ color:B.muted, fontSize:11 }}>{b.date}</span>
                          </div>

                          <div style={{ color:B.offWhite, fontSize:12, marginBottom:4 }}>{b.issue}</div>
                          <div style={{ color:B.muted, fontSize:11, marginBottom:6 }}>Root cause: {b.root_cause}</div>
                          <div style={{ display:"flex", gap:12, marginBottom: isOpen ? 10 : 0 }}>
                            {b.hours_down > 0 && <span style={{ color:B.yellowLight, fontSize:11 }}>⏱ {b.hours_down}hrs down</span>}
                            <span style={{ color:B.redLight, fontSize:11 }}>₱{Number(b.cost).toLocaleString()}</span>
                            {b.location && <span style={{ color:B.muted, fontSize:11 }}>{b.location}</span>}
                          </div>

                          {/* Resolve action */}
                          {isOpen && !isResolving && (
                            <button onClick={() => {
                              setResolvingId(b.id);
                              setResolveResolvedAt(new Date().toISOString().slice(0,16));
                            }} style={{
                              width:"100%", padding:"7px 0", borderRadius:8, border:"none",
                              background:B.blue, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer",
                            }}>✓ Mark as Resolved</button>
                          )}

                          {/* Inline resolve form */}
                          {isOpen && isResolving && (
                            <div style={{ padding:10, background:B.navyLight, borderRadius:8 }}>
                              <div style={{ color:B.muted, fontSize:11, fontWeight:700, marginBottom:8 }}>
                                RESOLVE — Set time vehicle returned to service
                              </div>
                              <div style={{ marginBottom:8 }}>
                                <div style={{ color:B.muted, fontSize:10, marginBottom:3 }}>Resolved At</div>
                                <input type="datetime-local" value={resolveResolvedAt}
                                  onChange={e => setResolveResolvedAt(e.target.value)}
                                  style={{ width:"100%", background:B.navyMid, border:`1px solid ${B.navyBorder}`,
                                    borderRadius:6, padding:"7px 10px", color:B.white, fontSize:12,
                                    outline:"none", boxSizing:"border-box" }} />
                              </div>
                              <div style={{ color:B.muted, fontSize:10, marginBottom:8 }}>
                                Down hours will be auto-computed from breakdown start → resolved time.
                              </div>
                              <div style={{ display:"flex", gap:8 }}>
                                <button onClick={() => { setResolvingId(null); setResolveResolvedAt(""); }} style={{
                                  flex:1, padding:"8px 0", borderRadius:8, border:`1px solid ${B.navyBorder}`,
                                  background:"transparent", color:B.muted, fontSize:12, fontWeight:700, cursor:"pointer",
                                }}>Cancel</button>
                                <button onClick={() => resolveBreakdown(b.id)} style={{
                                  flex:2, padding:"8px 0", borderRadius:8, border:"none",
                                  background:B.blue, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer",
                                }}>Save & Resolve</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* LOG BREAKDOWN MODAL */}
        {showBdModal && (() => {
          const inputStyle = {
            width:"100%", background:B.navyLight, border:`1px solid ${B.navyBorder}`,
            borderRadius:8, padding:"9px 12px", color:B.white, fontSize:13,
            outline:"none", boxSizing:"border-box",
          };
          return (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:100,
              overflowY:"auto", padding:"20px 16px" }}>
              <div style={{ background:B.navyMid, borderRadius:16, padding:20, maxWidth:520, margin:"0 auto" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <h3 style={{ color:B.white, fontSize:16, fontWeight:700 }}>Log Breakdown Incident</h3>
                  <button onClick={() => setShowBdModal(false)}
                    style={{ background:"none", border:"none", color:B.muted, fontSize:20, cursor:"pointer" }}>✕</button>
                </div>

                {bdModalError && (
                  <div style={{ background:"#3a0e0a", border:"1px solid #7f1d1d", borderRadius:8,
                    color:"#fca5a5", fontSize:12, padding:"8px 12px", marginBottom:12 }}>{bdModalError}</div>
                )}

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {/* Vehicle */}
                  <div style={{ gridColumn:"1/-1" }}>
                    <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Vehicle *</div>
                    <select value={bdForm.vehicle_id}
                      onChange={e => setBdForm(p => ({ ...p, vehicle_id: e.target.value }))}
                      style={inputStyle}>
                      <option value="">Select vehicle…</option>
                      {bdModalVehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.plate} — {v.make} {v.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Breakdown Date *</div>
                    <input type="date" value={bdForm.date}
                      onChange={e => setBdForm(p => ({ ...p, date: e.target.value }))}
                      style={inputStyle} />
                  </div>

                  {/* Started At */}
                  <div>
                    <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Time Vehicle Went Down</div>
                    <input type="datetime-local" value={bdForm.started_at}
                      onChange={e => setBdForm(p => ({ ...p, started_at: e.target.value }))}
                      style={inputStyle} />
                  </div>

                  {/* Root Cause */}
                  <div>
                    <div style={{ color:B.muted, fontSize:11, marginBottom:4 }}>Root Cause</div>
                    <select value={bdForm.breakdown_root_cause_id}
                      onChange={e => setBdForm(p => ({ ...p, breakdown_root_cause_id: e.target.value }))}
                      style={inputStyle}>
                      <option value="">Select cause…</option>
                      {bdModalCauses.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cost */}
                  <div>
                    <div style={{ color: bdModalError && !bdForm.cost ? "#fca5a5" : B.muted, fontSize:11, marginBottom:4 }}>
                      Repair Cost (₱) *
                    </div>
                    <input type="number" value={bdForm.cost} min="0"
                      onChange={e => setBdForm(p => ({ ...p, cost: e.target.value }))}
                      style={{ ...inputStyle, border: `1px solid ${bdModalError && !bdForm.cost ? "#ef4444" : B.navyBorder}` }} />
                  </div>

                  {/* Issue */}
                  <div style={{ gridColumn:"1/-1" }}>
                    <div style={{ color: bdModalError && !bdForm.issue?.trim() ? "#fca5a5" : B.muted, fontSize:11, marginBottom:4 }}>
                      Issue Description *
                    </div>
                    <textarea value={bdForm.issue} rows={3}
                      placeholder="Describe the breakdown issue…"
                      onChange={e => setBdForm(p => ({ ...p, issue: e.target.value }))}
                      style={{ ...inputStyle, resize:"none",
                        border: `1px solid ${bdModalError && !bdForm.issue?.trim() ? "#ef4444" : B.navyBorder}` }} />
                  </div>
                </div>

                <div style={{ display:"flex", gap:10, marginTop:16 }}>
                  <button onClick={() => setShowBdModal(false)} style={{
                    flex:1, padding:"11px 0", borderRadius:10, border:`1px solid ${B.navyBorder}`,
                    background:"transparent", color:B.white, fontWeight:700, cursor:"pointer",
                  }}>Cancel</button>
                  <button onClick={saveBdModal} disabled={bdModalSaving} style={{
                    flex:2, padding:"11px 0", borderRadius:10, border:"none",
                    background:B.blue, color:"#fff", fontWeight:700, fontSize:14,
                    cursor: bdModalSaving ? "not-allowed" : "pointer", opacity: bdModalSaving ? 0.7 : 1,
                  }}>{bdModalSaving ? "Saving…" : "Log Breakdown"}</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* COST ANALYSIS */}
        {tab === "costs" && (
          <div>
            {loadingCost ? (
              (() => {
                const sh = { background:`linear-gradient(90deg,${B.navyMid} 25%,${B.navyBorder} 50%,${B.navyMid} 75%)`, backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite", borderRadius:8 };
                return (
                  <div>
                    <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
                    <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                      {[1,2,3].map(i=><div key={i} style={{ flex:1, background:B.navyMid, borderRadius:12, padding:"14px 16px", border:`1px solid ${B.navyBorder}` }}><div style={{ ...sh, height:28, width:"55%", marginBottom:8 }} /><div style={{ ...sh, height:12, width:"65%" }} /></div>)}
                    </div>
                    <div style={{ background:B.navyMid, borderRadius:14, padding:14, marginBottom:14, border:`1px solid ${B.navyBorder}` }}>
                      <div style={{ ...sh, height:12, width:"35%", marginBottom:14 }} />
                      <div style={{ ...sh, height:200, width:"100%", borderRadius:10 }} />
                    </div>
                    <div style={{ background:B.navyMid, borderRadius:14, padding:14, border:`1px solid ${B.navyBorder}` }}>
                      <div style={{ ...sh, height:12, width:"40%", marginBottom:14 }} />
                      {Array.from({ length: 6 }).map((_,i)=><div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${B.navyBorder}` }}><div style={{ ...sh, height:11, width:30 }} /><div style={{ ...sh, height:11, width:50 }} /><div style={{ ...sh, height:11, width:50 }} /><div style={{ ...sh, height:11, width:40 }} /></div>)}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div>
                <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                  <KpiCard label="YTD Fuel" value={`₱${(ytdFuel/1000).toFixed(0)}k`} color={B.yellowLight} />
                  <KpiCard label="YTD Maintenance" value={`₱${(ytdMaint/1000).toFixed(0)}k`} color={B.redLight} />
                  <KpiCard label="YTD Total" value={`₱${((ytdFuel+ytdMaint)/1000).toFixed(0)}k`} color={B.offWhite} />
                </div>

                <div style={{ background:B.navyMid, borderRadius:14, padding:14, marginBottom:14, border:`1px solid ${B.navyBorder}` }}>
                  <div style={{ color:B.muted, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:10 }}>MONTHLY COSTS (₱)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={costData}>
                      <CartesianGrid stroke={B.navyBorder} strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fill:B.muted, fontSize:10 }} />
                      <YAxis tick={{ fill:B.muted, fontSize:10 }} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ background:B.navyMid, border:`1px solid ${B.navyBorder}`, borderRadius:8, color:B.white }}
                        formatter={v=>`₱${v.toLocaleString()}`} />
                      <Bar dataKey="fuel" fill={B.yellowLight} name="Fuel" stackId="a" />
                      <Bar dataKey="maintenance" fill={B.red} name="Maintenance" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background:B.navyMid, borderRadius:14, padding:14, border:`1px solid ${B.navyBorder}` }}>
                  <div style={{ color:B.muted, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:10 }}>MONTHLY BREAKDOWN</div>
                  {costData.map((d,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0",
                      borderBottom:`1px solid ${B.navyBorder}`, alignItems:"center" }}>
                      <span style={{ color:B.muted, fontSize:12, width:36 }}>{d.month}</span>
                      <span style={{ color:B.yellowLight, fontSize:12 }}>F: ₱{(d.fuel/1000).toFixed(0)}k</span>
                      <span style={{ color:B.redLight, fontSize:12 }}>M: ₱{(d.maintenance/1000).toFixed(0)}k</span>
                      <span style={{ color:B.white, fontSize:12, fontWeight:700 }}>₱{(d.total/1000).toFixed(0)}k</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LOCATIONS */}
        {tab === "locations" && (
          <div>
            <div style={{ color:B.muted, fontSize:12, marginBottom:14 }}>Fleet distribution by hub location</div>
            {loadingLoc ? (
              (() => {
                const sh = { background:`linear-gradient(90deg,${B.navyMid} 25%,${B.navyBorder} 50%,${B.navyMid} 75%)`, backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite", borderRadius:6 };
                return (
                  <div>
                    <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} style={{ background:B.navyMid, borderRadius:12, padding:14, marginBottom:10, border:`1px solid ${B.navyBorder}` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ ...sh, height:14, width:"40%", marginBottom:7 }} />
                            <div style={{ ...sh, height:10, width:"55%" }} />
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                            <div style={{ ...sh, height:14, width:40 }} />
                            <div style={{ ...sh, height:10, width:55 }} />
                          </div>
                        </div>
                        <div style={{ ...sh, height:4, width:"100%", borderRadius:2 }} />
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : (locReport?.locations ?? LOCATIONS).map(loc => (
              <div key={loc.name} style={{ background:B.navyMid, borderRadius:12, padding:14,
                marginBottom:10, border:`1px solid ${B.navyBorder}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <div>
                    <div style={{ color:B.white, fontWeight:700, fontSize:15 }}>{loc.name}</div>
                    <div style={{ color:B.muted, fontSize:11 }}>{loc.active}/{loc.vehicles} vehicles active</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ color:B.blueLight, fontSize:14, fontWeight:700 }}>{loc.trips.toLocaleString()}</div>
                    <div style={{ color:B.muted, fontSize:10 }}>trips YTD</div>
                  </div>
                </div>
                <div style={{ height:4, background:B.navyLight, borderRadius:2 }}>
                  <div style={{ height:"100%", width:`${loc.pct}%`, background:B.blue, borderRadius:2 }} />
                </div>
                <div style={{ color:B.muted, fontSize:10, textAlign:"right", marginTop:4 }}>{loc.pct}% of fleet trips</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
