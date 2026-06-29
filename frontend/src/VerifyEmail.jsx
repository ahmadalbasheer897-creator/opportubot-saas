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
    width: "100%", maxWidth: 420,
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    textAlign: "center",
  },
}

export default function VerifyEmail({ navigate }) {
  const [status, setStatus] = useState("loading") // loading | success | error | no_token
  const [message, setMessage] = useState("")
  const [resendEmail, setResendEmail] = useState("")
  const [resendStatus, setResendStatus] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")
    if (!token) { setStatus("no_token"); return }
    verifyToken(token)
  }, [])

  const verifyToken = async (token) => {
    try {
      const res = await fetch(`${API}/auth/verify-email?token=${token}`)
      const data = await res.json()
      if (res.ok) {
        setStatus("success")
        setMessage(data.message || "Email verified successfully!")
      } else {
        setStatus("error")
        setMessage(data.detail || "Verification failed.")
      }
    } catch {
      setStatus("error")
      setMessage("Connection error. Please try again.")
    }
  }

  const resend = async () => {
    if (!resendEmail) return
    setResendStatus("sending")
    try {
      await fetch(`${API}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      })
      setResendStatus("sent")
    } catch {
      setResendStatus("error")
    }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        {status === "loading" && (
          <>
            <div style={{ fontSize: 52, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.dark }}>
              Verifying your email...
            </div>
            <div style={{ color: "#888", marginTop: 8, fontSize: 14 }}>Please wait a moment.</div>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.green, marginBottom: 8 }}>
              Email Verified!
            </div>
            <div style={{ color: "#555", fontSize: 14, marginBottom: 28 }}>
              Your account is now active. Welcome to OpportuBot!
            </div>
            <button
              onClick={() => navigate("login")}
              style={{
                width: "100%", padding: "13px",
                background: COLORS.blue, color: "white",
                border: "none", borderRadius: 8,
                fontWeight: 700, cursor: "pointer", fontSize: 15,
              }}
            >
              Sign In to Dashboard →
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: 52, marginBottom: 16 }}>❌</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.red, marginBottom: 8 }}>
              Verification Failed
            </div>
            <div style={{ color: "#555", fontSize: 14, marginBottom: 24 }}>
              {message}
            </div>
            <div style={{ borderTop: "1px solid #eee", paddingTop: 20, marginTop: 4 }}>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
                Resend a new verification link:
              </div>
              <input
                type="email"
                placeholder="your@email.com"
                value={resendEmail}
                onChange={e => setResendEmail(e.target.value)}
                style={{
                  width: "100%", padding: "11px 14px", border: "1px solid #ddd",
                  borderRadius: 8, fontSize: 14, boxSizing: "border-box", marginBottom: 10,
                }}
              />
              {resendStatus === "sent" ? (
                <div style={{ color: COLORS.green, fontSize: 13, fontWeight: 600 }}>
                  ✓ Sent! Check your inbox.
                </div>
              ) : (
                <button
                  onClick={resend}
                  disabled={resendStatus === "sending"}
                  style={{
                    width: "100%", padding: "11px",
                    background: resendStatus === "sending" ? "#ccc" : COLORS.dark,
                    color: "white", border: "none", borderRadius: 8,
                    fontWeight: 600, cursor: "pointer", fontSize: 14,
                  }}
                >
                  {resendStatus === "sending" ? "Sending..." : "Resend Verification Email"}
                </button>
              )}
            </div>
          </>
        )}

        {status === "no_token" && (
          <>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.dark, marginBottom: 8 }}>
              Check Your Email
            </div>
            <div style={{ color: "#555", fontSize: 14, marginBottom: 24 }}>
              We sent a verification link to your email address. Click the link to activate your account.
            </div>
            <button
              onClick={() => navigate("login")}
              style={{
                width: "100%", padding: "13px",
                background: COLORS.blue, color: "white",
                border: "none", borderRadius: 8,
                fontWeight: 700, cursor: "pointer", fontSize: 15,
              }}
            >
              Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  )
}
