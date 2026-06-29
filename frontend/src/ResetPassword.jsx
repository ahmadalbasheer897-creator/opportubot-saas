import { useState, useEffect } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"
const COLORS = { dark: "#1A237E", blue: "#1565C0", green: "#2E7D32", red: "#C62828" }

const S = {
  page: {
    fontFamily: "'Segoe UI',Arial,sans-serif", minHeight: "100vh",
    background: "linear-gradient(135deg,#1A237E,#283593)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "20px",
  },
  card: {
    background: "white", borderRadius: 16, padding: "40px 36px",
    width: "100%", maxWidth: 400,
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 },
  input: {
    width: "100%", padding: "11px 14px", border: "1px solid #ddd",
    borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box",
  },
  group: { marginBottom: 18 },
  err: {
    background: "#FFEBEE", border: "1px solid #FFCDD2", borderRadius: 8,
    padding: "10px 14px", fontSize: 13, color: COLORS.red, marginBottom: 16,
  },
}

export default function ResetPassword({ navigate }) {
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [noToken, setNoToken] = useState(false)

  // Forgot-password request state (when no token in URL)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get("token")
    if (t) setToken(t)
    else setNoToken(true)
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }
    if (password !== confirm) { setError("Passwords do not match"); return }
    setLoading(true); setError("")
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (res.ok) setSuccess(true)
      else setError(data.detail || "Reset failed. Link may have expired.")
    } catch {
      setError("Connection error. Please try again.")
    }
    setLoading(false)
  }

  const sendForgot = async (e) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotLoading(true)
    try {
      await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      })
      setForgotSent(true)
    } catch { /* silent */ }
    setForgotLoading(false)
  }

  // ── No token: show "Forgot Password" request form ──────────────────────────
  if (noToken) return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48 }}>🔐</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.dark, marginTop: 8 }}>
            Forgot Password?
          </div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
            Enter your email and we'll send a reset link.
          </div>
        </div>

        {forgotSent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
            <div style={{ color: COLORS.green, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              Reset link sent!
            </div>
            <div style={{ color: "#555", fontSize: 13, marginBottom: 24 }}>
              Check your inbox. The link expires in 1 hour.
            </div>
            <button onClick={() => navigate("login")}
              style={{ width: "100%", padding: "12px", background: COLORS.blue,
                color: "white", border: "none", borderRadius: 8, fontWeight: 700,
                cursor: "pointer", fontSize: 14 }}>
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={sendForgot}>
            <div style={S.group}>
              <label style={S.label}>Email Address</label>
              <input style={S.input} type="email" placeholder="you@example.com"
                value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} autoFocus />
            </div>
            <button type="submit" disabled={forgotLoading}
              style={{ width: "100%", padding: "13px",
                background: forgotLoading ? "#ccc" : COLORS.blue,
                color: "white", border: "none", borderRadius: 8,
                fontWeight: 700, cursor: forgotLoading ? "default" : "pointer", fontSize: 15 }}>
              {forgotLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={() => navigate("login")}
            style={{ background: "none", border: "none", color: COLORS.blue,
              cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  )

  // ── Success state ───────────────────────────────────────────────────────────
  if (success) return (
    <div style={S.page}>
      <div style={{ ...S.card, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.green, marginBottom: 8 }}>
          Password Reset!
        </div>
        <div style={{ color: "#555", fontSize: 14, marginBottom: 28 }}>
          Your password has been updated. You can now sign in with your new password.
        </div>
        <button onClick={() => navigate("login")}
          style={{ width: "100%", padding: "13px", background: COLORS.blue,
            color: "white", border: "none", borderRadius: 8,
            fontWeight: 700, cursor: "pointer", fontSize: 15 }}>
          Sign In →
        </button>
      </div>
    </div>
  )

  // ── Reset form ──────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48 }}>🔑</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.dark, marginTop: 8 }}>
            Set New Password
          </div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
            Choose a strong password for your account.
          </div>
        </div>

        {error && <div style={S.err}>{error}</div>}

        <form onSubmit={submit}>
          <div style={S.group}>
            <label style={S.label}>New Password</label>
            <input style={S.input} type="password" placeholder="Min. 8 characters"
              value={password} onChange={e => { setPassword(e.target.value); setError("") }} autoFocus />
          </div>
          <div style={S.group}>
            <label style={S.label}>Confirm Password</label>
            <input style={S.input} type="password" placeholder="Repeat password"
              value={confirm} onChange={e => { setConfirm(e.target.value); setError("") }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "13px",
              background: loading ? "#ccc" : COLORS.blue,
              color: "white", border: "none", borderRadius: 8,
              fontWeight: 700, cursor: loading ? "default" : "pointer", fontSize: 15 }}>
            {loading ? "Saving..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  )
}
