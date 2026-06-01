import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ThemeToggle from "./components/ThemeToggle";
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

function getResetParams() {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get("token");
  const email  = params.get("email");
  return token ? { token, email } : null;
}

function clearResetParams() {
  window.history.replaceState({}, "", window.location.pathname);
}

function AuthGate() {
  const { isAuthenticated, signOut } = useAuth();
  const { colors } = useTheme();
  const [screen,       setScreen]       = useState(() => getResetParams() ? "reset" : "login");
  const [activeModule, setActiveModule] = useState("dashboard");
  const resetParams = getResetParams();

  const mod = MODULES.find(m => m.id === activeModule);

  useEffect(() => {
    if (isAuthenticated) {
      document.title = `eShip Fleet – ${mod?.label ?? "Dashboard"}`;
    }
  }, [activeModule, isAuthenticated]);

  if (!isAuthenticated) {
    if (screen === "forgot") {
      return <ForgotPasswordPage onBack={() => setScreen("login")} />;
    }
    if (screen === "reset" && resetParams) {
      return (
        <ResetPasswordPage
          token={resetParams.token}
          email={resetParams.email}
          onSuccess={() => {
            clearResetParams();
            setScreen("login");
          }}
        />
      );
    }
    return <LoginPage onForgotPassword={() => setScreen("forgot")} />;
  }

  const Component = mod?.component;

  return (
    <div style={{
      height: "100%",
      background: colors.bg,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      width: "100%",
    }}>
      {/* Header */}
      <div style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
        <div style={{ ...INNER, display:"flex", alignItems:"center", gap:10, padding:"10px 16px 8px" }}>
          <div style={{ color: colors.primary, fontSize:18, fontWeight:900, letterSpacing:-0.5 }}>eShip</div>
          <div style={{ color: colors.muted, fontSize:11, marginTop:1 }}>Fleet Management</div>
          <div style={{ flex:1 }} />
          <div style={{
            fontSize:10, fontWeight:700, color:"#4ade80",
            background:"#052e16", border:"1px solid #14532d",
            padding:"2px 8px", borderRadius:20,
          }}>LIVE</div>
          <ThemeToggle />
          <button
            onClick={signOut}
            style={{
              background:"none",
              border:`1px solid ${colors.border}`,
              color: colors.muted,
              fontSize:10,
              fontWeight:700,
              padding:"3px 10px",
              borderRadius:20,
              cursor:"pointer",
              letterSpacing:0.3,
            }}
          >
            SIGN OUT
          </button>
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
        background: colors.surface,
        borderTop: `1px solid ${colors.border}`,
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
                borderTop:`2px solid ${active ? colors.tabBorder : "transparent"}`,
              }}>
                <span style={{ fontSize:18, lineHeight:1, color: active ? colors.tabActive : colors.tabInactive }}>{m.icon}</span>
                <span style={{
                  fontSize:9, fontWeight:700, letterSpacing:0.3,
                  color: active ? colors.tabActive : colors.tabInactive,
                }}>{m.label.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ThemeProvider>
  );
}
