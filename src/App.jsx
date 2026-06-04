import { useState, useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ThemeToggle from "./components/ThemeToggle";
import { changePassword } from "./api/auth";
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

function ProfileMenu({ colors }) {
  const { user, signOut } = useAuth();
  const [open,    setOpen]    = useState(false);
  const [modal,   setModal]   = useState(null); // "password"
  const [pwForm,  setPwForm]  = useState({ current: "", newPw: "", confirm: "" });
  const [pwError, setPwError] = useState(null);
  const [pwOk,    setPwOk]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [showPw,  setShowPw]  = useState({ current: false, newPw: false, confirm: false });
  const ref = useRef(null);

  const initials = (user?.name ?? user?.email ?? "U")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleChangePw(e) {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { setPwError("New passwords do not match."); return; }
    if (pwForm.newPw.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    setSaving(true); setPwError(null);
    try {
      await changePassword(pwForm.current, pwForm.newPw, pwForm.confirm);
      setPwOk(true);
      setTimeout(() => { setModal(null); setPwOk(false); setPwForm({ current:"", newPw:"", confirm:"" }); }, 1500);
    } catch (err) {
      setPwError(err.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  }

  const menuItem = (icon, label, onClick) => (
    <button onClick={() => { setOpen(false); onClick(); }} style={{
      display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 16px",
      border:"none", background:"transparent", cursor:"pointer", textAlign:"left",
      color: colors.text, fontSize:13, borderBottom:`1px solid ${colors.border}`,
    }}><span style={{ fontSize:16 }}>{icon}</span>{label}</button>
  );

  return (
    <div ref={ref} style={{ position:"relative" }}>
      {/* Avatar button */}
      <button onClick={() => setOpen(o => !o)} style={{
        width:32, height:32, borderRadius:"50%", border:`2px solid ${colors.border}`,
        background: colors.primary, color:"#fff", fontSize:11, fontWeight:800,
        cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
      }}>{initials}</button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position:"absolute", right:0, top:40, width:220, background: colors.surface,
          border:`1px solid ${colors.border}`, borderRadius:12, boxShadow:"0 8px 24px rgba(0,0,0,.15)",
          zIndex:200, overflow:"hidden",
        }}>
          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${colors.border}` }}>
            <div style={{ fontWeight:700, fontSize:14, color: colors.text }}>{user?.name ?? "User"}</div>
            <div style={{ fontSize:11, color: colors.muted, marginTop:2 }}>{user?.email}</div>
          </div>
          {menuItem("🔑", "Change Password", () => { setPwForm({ current:"", newPw:"", confirm:"" }); setPwError(null); setPwOk(false); setModal("password"); })}
          {menuItem("🔒", "Two-Factor Auth", () => alert("2FA coming soon."))}
          <button onClick={() => { setOpen(false); signOut(); }} style={{
            display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 16px",
            border:"none", background:"transparent", cursor:"pointer", textAlign:"left",
            color:"#ef4444", fontSize:13,
          }}><span style={{ fontSize:16 }}>↪</span>Sign Out</button>
        </div>
      )}

      {/* Change Password Modal */}
      {modal === "password" && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background: colors.surface, borderRadius:16, padding:24, width:"100%", maxWidth:400, border:`1px solid ${colors.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h3 style={{ fontSize:16, fontWeight:700, color: colors.text, margin:0 }}>Change Password</h3>
              <button onClick={() => setModal(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color: colors.muted }}>✕</button>
            </div>
            {pwOk ? (
              <div style={{ textAlign:"center", padding:"20px 0", color:"#22c55e", fontSize:14, fontWeight:700 }}>✓ Password changed successfully!</div>
            ) : (
              <form onSubmit={handleChangePw}>
                {pwError && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, color:"#dc2626", fontSize:12, padding:"8px 12px", marginBottom:12 }}>{pwError}</div>}
                {[
                  ["current", "Current Password"],
                  ["newPw",   "New Password"],
                  ["confirm", "Confirm New Password"],
                ].map(([key, label]) => (
                  <div key={key} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, color: colors.muted, marginBottom:4 }}>{label}</div>
                    <div style={{ position:"relative" }}>
                      <input
                        type={showPw[key] ? "text" : "password"}
                        value={pwForm[key]}
                        onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                        style={{ width:"100%", borderRadius:8, padding:"9px 40px 9px 12px", fontSize:13,
                          border:`1px solid ${colors.border}`, background: colors.bg, color: colors.text,
                          outline:"none", boxSizing:"border-box" }} />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                        aria-label={showPw[key] ? "Hide password" : "Show password"}
                        style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                          background:"none", border:"none", cursor:"pointer", padding:0,
                          color: colors.muted, display:"flex", alignItems:"center" }}>
                        {showPw[key] ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ display:"flex", gap:10, marginTop:16 }}>
                  <button type="button" onClick={() => setModal(null)} style={{
                    flex:1, padding:"10px 0", borderRadius:10, border:`1px solid ${colors.border}`,
                    background:"transparent", color: colors.muted, fontWeight:700, cursor:"pointer",
                  }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{
                    flex:2, padding:"10px 0", borderRadius:10, border:"none",
                    background: colors.primary, color:"#fff", fontWeight:700, fontSize:14,
                    cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
                  }}>{saving ? "Saving…" : "Change Password"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function useApiStatus() {
  const [status, setStatus] = useState("checking"); // "live" | "offline" | "checking"

  useEffect(() => {
    const BASE_URL = import.meta.env.VITE_API_URL;

    async function check() {
      if (!navigator.onLine) { setStatus("offline"); return; }
      try {
        const res = await fetch(`${BASE_URL}/api/health`, {
          method: "GET", cache: "no-store",
          signal: AbortSignal.timeout(4000),
        });
        setStatus(res.ok ? "live" : "offline");
      } catch {
        setStatus("offline");
      }
    }

    check();
    const id = setInterval(check, 30_000);
    window.addEventListener("online",  () => check());
    window.addEventListener("offline", () => setStatus("offline"));
    return () => {
      clearInterval(id);
      window.removeEventListener("online",  check);
      window.removeEventListener("offline", () => setStatus("offline"));
    };
  }, []);

  return status;
}

function AuthGate() {
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const apiStatus  = useApiStatus();
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
            fontSize:10, fontWeight:700,
            color:      apiStatus === "live" ? "#4ade80" : apiStatus === "offline" ? "#fca5a5" : "#fcd34d",
            background: apiStatus === "live" ? "#052e16" : apiStatus === "offline" ? "#3a0e0a" : "#1a1000",
            border:    `1px solid ${apiStatus === "live" ? "#14532d" : apiStatus === "offline" ? "#7f1d1d" : "#b45309"}`,
            padding:"2px 8px", borderRadius:20,
          }}>
            {apiStatus === "live" ? "LIVE" : apiStatus === "offline" ? "OFFLINE" : "…"}
          </div>
          <ThemeToggle />
          <ProfileMenu colors={colors} />
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
