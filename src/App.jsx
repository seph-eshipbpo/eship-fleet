import { useState } from "react";
import InspectionApp from "./InspectionApp";
import FleetDashboard from "./FleetDashboard";
import FleetRegistry from "./FleetRegistry";
import ManagementView from "./ManagementView";
import MaintenanceEngine from "./MaintenanceEngine";
import TripPlannerIntegration from "./TripPlannerIntegration";

const MODULES = [
  { id:"dashboard",   label:"Dashboard",   icon:"⊞", component:FleetDashboard },
  { id:"inspection",  label:"Inspect",     icon:"✓", component:InspectionApp },
  { id:"registry",    label:"Registry",    icon:"≡", component:FleetRegistry },
  { id:"management",  label:"Reports",     icon:"↗", component:ManagementView },
  { id:"maintenance", label:"PM",          icon:"⚙", component:MaintenanceEngine },
  { id:"trips",       label:"Trips",       icon:"⊙", component:TripPlannerIntegration },
];

const INNER = {
  width: "100%",
  maxWidth: 680,
  margin: "0 auto",
  boxSizing: "border-box",
};

export default function App() {
  const [activeModule, setActiveModule] = useState("dashboard");
  const mod = MODULES.find(m => m.id === activeModule);
  const Component = mod?.component;

  return (
    <div style={{
      height: "100%",
      background: "#0D1B2A",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      width: "100%",
    }}>
      {/* Header */}
      <div style={{ background: "#112236", borderBottom: "1px solid #1E3A5F", flexShrink: 0 }}>
        <div style={{ ...INNER, display:"flex", alignItems:"center", gap:10, padding:"10px 16px 8px" }}>
          <div style={{ color:"#2356A8", fontSize:18, fontWeight:900, letterSpacing:-0.5 }}>eShip</div>
          <div style={{ color:"#7A9BBF", fontSize:11, marginTop:1 }}>Fleet Management</div>
          <div style={{ flex:1 }} />
          <div style={{
            fontSize:10, fontWeight:700, color:"#4ade80",
            background:"#052e16", border:"1px solid #14532d",
            padding:"2px 8px", borderRadius:20,
          }}>LIVE</div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>
        <div style={{ ...INNER }}>
          {Component && <Component />}
        </div>
      </div>

      {/* Bottom tab bar */}
      <div style={{
        background:"#112236",
        borderTop:"1px solid #1E3A5F",
        flexShrink:0,
        paddingBottom:"env(safe-area-inset-bottom, 0px)",
      }}>
        <div style={{ ...INNER, display:"flex" }}>
          {MODULES.map(m => {
            const active = activeModule === m.id;
            return (
              <button key={m.id} onClick={() => setActiveModule(m.id)} style={{
                flex:1,
                display:"flex",
                flexDirection:"column",
                alignItems:"center",
                justifyContent:"center",
                padding:"8px 2px 6px",
                border:"none",
                background:"transparent",
                cursor:"pointer",
                gap:3,
                borderTop:`2px solid ${active ? "#2356A8" : "transparent"}`,
              }}>
                <span style={{ fontSize:18, lineHeight:1, color:active?"#FFFFFF":"#4A6A8A" }}>{m.icon}</span>
                <span style={{
                  fontSize:9, fontWeight:700, letterSpacing:0.3,
                  color:active?"#FFFFFF":"#4A6A8A",
                }}>{m.label.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
