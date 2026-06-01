import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import PasswordInput from "../components/PasswordInput";

const B = {
  bg:        "#0D1B2A",
  surface:   "#112236",
  border:    "#1E3A5F",
  primary:   "#2356A8",
  primaryHv: "#1a4080",
  text:      "#FFFFFF",
  muted:     "#7A9BBF",
  error:     "#ef4444",
  errorBg:   "#1f0a0a",
  input:     "#0D1B2A",
};

const field = {
  width: "100%",
  boxSizing: "border-box",
  background: B.input,
  border: `1px solid ${B.border}`,
  borderRadius: 8,
  color: B.text,
  fontSize: 14,
  padding: "10px 12px",
  outline: "none",
};

const label = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: B.muted,
  marginBottom: 6,
  letterSpacing: 0.4,
};

export default function LoginPage({ onForgotPassword }) {
  useEffect(() => { document.title = "eShip Fleet – Sign In"; }, []);

  const { signIn } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: B.bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      boxSizing: "border-box",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ color: B.primary, fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>eShip</div>
          <div style={{ color: B.muted, fontSize: 12, marginTop: 4 }}>Fleet Management</div>
        </div>

        {/* Card */}
        <div style={{
          background: B.surface,
          border: `1px solid ${B.border}`,
          borderRadius: 12,
          padding: "28px 24px",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: B.text, marginBottom: 4 }}>Sign in</div>
          <div style={{ fontSize: 13, color: B.muted, marginBottom: 24 }}>Enter your credentials to continue</div>

          {error && (
            <div style={{
              background: B.errorBg,
              border: `1px solid ${B.error}`,
              borderRadius: 8,
              padding: "10px 12px",
              color: B.error,
              fontSize: 13,
              marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={label}>EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                style={field}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={label}>PASSWORD</label>
              <PasswordInput
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px 0",
                background: loading ? B.primaryHv : B.primary,
                color: B.text,
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: 0.3,
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button
              onClick={onForgotPassword}
              style={{
                background: "none",
                border: "none",
                color: B.muted,
                fontSize: 13,
                cursor: "pointer",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              Forgot password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
