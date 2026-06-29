import { useState } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const COLORS = { dark: "#1A237E", blue: "#1565C0", red: "#C62828" }

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
  apiErr: {
    background: "#FFEBEE", border: "1px solid #FFCDD2", borderRadius: 8,
    padding: "10px 14px", fontSize: 13, color: COLORS.red, marginBottom: 16,
  },
  divider: {
    textAlign: "center", color: "#bbb", fontSize: 13,
    borderTop: "1px solid #eee", paddingTop: 16, marginTop: 20, marginBottom: 14,
  },
}

const decodeJWT = (token) => {
  try {
    const payload = token.split(".")[1]
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4)
    return JSON.parse(atob(padded.replace(/-/g, "+").replace(/_/g, "/")))
  } catch { return {} }
}

export default function Login({ navigate, onLogin }) {
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [apiError, setApiError] = useState("")
  const [loading,  setLoading]  = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setApiError("Please fill in all fields"); return }
    setLoading(true)
    setApiError("")

    try {
      const body = new URLSearchParams()
      body.append("username", email.trim().toLowerCase())
      body.append("password", password)

      const res  = await fetch(API + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      })
      const data = await res.json()

      if (!res.ok) {
        setApiError(data.detail || "Invalid email or password")
        setLoading(false)
        return
      }

      const jwtPayload = decodeJWT(data.access_token)
      localStorage.setItem("ob_token",    data.access_token)
      localStorage.setItem("ob_plan",     data.plan)
      localStorage.setItem("ob_is_owner", String(data.is_owner))
      localStorage.setItem("ob_email",    jwtPayload.email || email.trim().toLowerCase())

      onLogin?.({
        email:    jwtPayload.email || email.trim().toLowerCase(),
        plan:     data.plan,
        is_owner: data.is_owner,
      })
      navigate("dashboard")
    } catch {
      setApiError("Connection error. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48 }}>🤖</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.dark, marginTop: 8 }}>
            Welcome back
          </div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
            Sign in to your OpportuBot account
          </div>
        </div>

        {apiError && <div style={S.apiErr}>{apiError}</div>}

        <form onSubmit={submit} noValidate>
          <div style={S.group}>
            <label style={S.label}>Email Address</label>
            <input
              style={S.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setApiError("") }}
              autoFocus
            />
          </div>
          <div style={S.group}>
            <label style={S.label}>Password</label>
            <input
              style={S.input}
              type="password"
              placeholder="Your password"
              value={password}
              onChange={e => { setPassword(e.target.value); setApiError("") }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: "100%", padding: "13px",
              background: loading ? "#ccc" : COLORS.blue,
              color: "white", border: "none", borderRadius: 8,
              fontWeight: 700, cursor: loading ? "default" : "pointer",
              fontSize: 15, marginTop: 4,
            }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "right", marginTop: -10, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => navigate("reset-password")}
            style={{
              background: "none", border: "none", color: COLORS.blue,
              cursor: "pointer", fontSize: 13, textDecoration: "underline", padding: 0,
            }}
          >
            Forgot password?
          </button>
        </div>

        <div style={S.divider}>Don't have an account?</div>
        <button
          style={{
            width: "100%", padding: "11px", background: "transparent",
            border: "1px solid #ddd", borderRadius: 8, fontWeight: 600,
            cursor: "pointer", fontSize: 14, color: COLORS.dark,
          }}
          onClick={() => navigate("register")}
        >
          Create Free Account
        </button>
      </div>
    </div>
  )
}
