import { useState, useEffect } from "react";
import { resetPassword } from "../api/auth";
import { useTheme } from "../contexts/ThemeContext";
import PasswordInput from "../components/PasswordInput";
import ThemeToggle from "../components/ThemeToggle";

export default function ResetPasswordPage({ token, email: initialEmail, onSuccess }) {
  useEffect(() => { document.title = "eShip Fleet – Reset Password"; }, []);

  const { colors } = useTheme();
  const [email,    setEmail]    = useState(initialEmail || "");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [done,     setDone]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, email, password, confirm);
      setDone(true);
    } catch (err) {
      if (err.errors) {
        const msgs = Object.values(err.errors).flat();
        setError(msgs.join(" "));
      } else {
        setError(err.message || "Failed to reset password.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: colors.bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      boxSizing: "border-box",
      position: "relative",
    }}>

      {/* Theme toggle — top right */}
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <ThemeToggle />
      </div>

      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ color: colors.primary, fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>eShip</div>
          <div style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Fleet Management</div>
        </div>

        {/* Card */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: "28px 24px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Reset password</div>
          <div style={{ fontSize: 13, color: colors.muted, marginBottom: 24 }}>
            Choose a new password for your account.
          </div>

          {error && (
            <div style={{
              background: colors.errorBg,
              border: `1px solid ${colors.errorBorder}`,
              borderRadius: 8,
              padding: "10px 12px",
              color: colors.error,
              fontSize: 13,
              marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          {done ? (
            <>
              <div style={{
                background: colors.successBg,
                border: `1px solid ${colors.successBorder}`,
                borderRadius: 8,
                padding: "14px 12px",
                color: colors.success,
                fontSize: 13,
                marginBottom: 24,
                lineHeight: 1.5,
              }}>
                Your password has been reset. You can now sign in with your new password.
              </div>
              <button
                onClick={onSuccess}
                style={{
                  width: "100%",
                  padding: "11px 0",
                  background: colors.primary,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: 0.3,
                }}
              >
                Sign In
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              {!initialEmail && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 6, letterSpacing: 0.4 }}>
                    EMAIL
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: colors.input,
                      border: `1px solid ${colors.inputBorder}`,
                      borderRadius: 8,
                      color: colors.text,
                      fontSize: 14,
                      padding: "10px 12px",
                      outline: "none",
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 6, letterSpacing: 0.4 }}>
                  NEW PASSWORD
                </label>
                <PasswordInput
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 6, letterSpacing: 0.4 }}>
                  CONFIRM PASSWORD
                </label>
                <PasswordInput
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "11px 0",
                  background: loading ? colors.primaryHv : colors.primary,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: 0.3,
                  opacity: loading ? 0.8 : 1,
                }}
              >
                {loading ? "Resetting…" : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
