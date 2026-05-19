import { useState } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const COLORS = {
  dark: "#1A237E", blue: "#1565C0", green: "#2E7D32", red: "#C62828",
}

const S = {
  page: {
    fontFamily: "'Segoe UI',Arial,sans-serif", minHeight: "100vh",
    background: "linear-gradient(135deg,#1A237E,#283593)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "20px",
  },
  card: {
    background: "white", borderRadius: 16, padding: "40px 36px",
    width: "100%", maxWidth: 420,
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  logo: { textAlign: "center", marginBottom: 24 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 },
  input: (err) => ({
    width: "100%", padding: "11px 14px",
    border: "1px solid " + (err ? COLORS.red : "#ddd"),
    borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box",
  }),
  group: { marginBottom: 16 },
  fieldErr: { fontSize: 12, color: COLORS.red, marginTop: 4 },
  hint: { fontSize: 12, color: "#aaa", marginTop: 4 },
  apiErr: {
    background: "#FFEBEE", border: "1px solid #FFCDD2", borderRadius: 8,
    padding: "10px 14px", fontSize: 13, color: COLORS.red, marginBottom: 16,
  },
  divider: {
    textAlign: "center", color: "#bbb", fontSize: 13,
    borderTop: "1px solid #eee", paddingTop: 16, marginTop: 20, marginBottom: 14,
  },
  secondaryBtn: {
    width: "100%", padding: "11px", background: "transparent",
    border: "1px solid #ddd", borderRadius: 8, fontWeight: 600,
    cursor: "pointer", fontSize: 14, color: COLORS.dark,
  },
}

const decodeJWT = (token) => {
  try {
    const payload = token.split(".")[1]
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4)
    return JSON.parse(atob(padded.replace(/-/g, "+").replace(/_/g, "/")))
  } catch { return {} }
}

export default function Register({ navigate, onRegister }) {
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", confirm: "", gift_code: "",
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState("")
  const [loading, setLoading] = useState(false)

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: "" }))
    setApiError("")
  }

  const validate = () => {
    const e = {}
    if (!form.full_name.trim()) e.full_name = "Full name is required"
    if (!form.email.includes("@") || !form.email.includes("."))
      e.email = "Enter a valid email address"
    if (form.password.length < 6) e.password = "At least 6 characters"
    if (form.password !== form.confirm) e.confirm = "Passwords do not match"
    return e
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    setApiError("")

    try {
      const res = await fetch(API + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          full_name: form.full_name.trim(),
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setApiError(data.detail || "Registration failed. Please try again.")
        setLoading(false)
        return
      }

      const jwtPayload = decodeJWT(data.token)
      localStorage.setItem("ob_token", data.token)
      localStorage.setItem("ob_plan", data.plan)
      localStorage.setItem("ob_is_owner", String(data.is_owner))
      localStorage.setItem("ob_email", jwtPayload.email || form.email.trim().toLowerCase())

      // Redeem gift code if provided
      if (form.gift_code.trim()) {
        await fetch(
          API + "/gifts/redeem?code=" + encodeURIComponent(form.gift_code.trim().toUpperCase()),
          {
            method: "POST",
            headers: {
              "Authorization": "Bearer " + data.token,
              "Content-Type": "application/json",
            },
          }
        )
      }

      onRegister?.({
        email: jwtPayload.email || form.email.trim().toLowerCase(),
        full_name: form.full_name.trim(),
        plan: data.plan,
        is_owner: data.is_owner,
      })
      navigate("dashboard")
    } catch {
      setApiError("Connection error. Please check your internet and try again.")
    }
    setLoading(false)
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <div style={{ fontSize: 48 }}>🤖</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.dark, marginTop: 8 }}>
            Create your account
          </div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
            Start finding opportunities with AI — free
          </div>
        </div>

        {apiError && <div style={S.apiErr}>{apiError}</div>}

        <form onSubmit={submit} noValidate>
          <div style={S.group}>
            <label style={S.label}>Full Name</label>
            <input
              style={S.input(errors.full_name)}
              type="text"
              placeholder="Ahmad Al-Basheer"
              value={form.full_name}
              onChange={e => set("full_name", e.target.value)}
              autoFocus
            />
            {errors.full_name && <div style={S.fieldErr}>{errors.full_name}</div>}
          </div>

          <div style={S.group}>
            <label style={S.label}>Email Address</label>
            <input
              style={S.input(errors.email)}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => set("email", e.target.value)}
            />
            {errors.email && <div style={S.fieldErr}>{errors.email}</div>}
          </div>

          <div style={S.group}>
            <label style={S.label}>Password</label>
            <input
              style={S.input(errors.password)}
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={e => set("password", e.target.value)}
            />
            {errors.password && <div style={S.fieldErr}>{errors.password}</div>}
          </div>

          <div style={S.group}>
            <label style={S.label}>Confirm Password</label>
            <input
              style={S.input(errors.confirm)}
              type="password"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={e => set("confirm", e.target.value)}
            />
            {errors.confirm && <div style={S.fieldErr}>{errors.confirm}</div>}
          </div>

          <div style={S.group}>
            <label style={S.label}>
              Gift Code{" "}
              <span style={{ color: "#aaa", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              style={S.input(false)}
              type="text"
              placeholder="OB-XXXXXXXX"
              value={form.gift_code}
              onChange={e => set("gift_code", e.target.value.toUpperCase())}
            />
            <div style={S.hint}>Have a gift code? Enter it for instant Pro access.</div>
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
            {loading ? "Creating account..." : "Create Account — It's Free"}
          </button>
        </form>

        <div style={S.divider}>Already have an account?</div>
        <button style={S.secondaryBtn} onClick={() => navigate("login")}>
          Sign In
        </button>
      </div>
    </div>
  )
}
