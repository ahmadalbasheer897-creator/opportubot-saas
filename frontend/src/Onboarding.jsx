import { useState } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const STEPS = ["welcome", "cv", "preferences", "done"]

const S = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(26,35,126,0.92)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, padding: 20,
  },
  box: {
    background: "white", borderRadius: 20, padding: "40px 36px",
    maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  logo: { fontSize: 42, textAlign: "center", marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 700, color: "#1A237E", textAlign: "center", marginBottom: 8 },
  sub: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 28, lineHeight: 1.6 },
  stepBar: { display: "flex", gap: 6, marginBottom: 32, justifyContent: "center" },
  dot: (active, done) => ({
    width: active ? 28 : 10, height: 10, borderRadius: 6,
    background: done ? "#2E7D32" : active ? "#1565C0" : "#ddd",
    transition: "all 0.3s",
  }),
  label: { fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6 },
  input: {
    width: "100%", padding: "10px 14px", border: "1.5px solid #ddd",
    borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box",
    marginBottom: 14,
  },
  select: {
    width: "100%", padding: "10px 14px", border: "1.5px solid #ddd",
    borderRadius: 10, fontSize: 14, background: "white", marginBottom: 14,
    outline: "none", boxSizing: "border-box",
  },
  btn: (bg = "#1565C0", disabled = false) => ({
    width: "100%", padding: "12px", background: disabled ? "#ccc" : bg,
    color: "white", border: "none", borderRadius: 10, fontSize: 15,
    fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", marginTop: 6,
  }),
  skip: {
    background: "none", border: "none", color: "#aaa", fontSize: 13,
    cursor: "pointer", width: "100%", marginTop: 10, textDecoration: "underline",
  },
  fileBox: {
    border: "2px dashed #bbb", borderRadius: 12, padding: "24px 16px",
    textAlign: "center", cursor: "pointer", marginBottom: 14, color: "#888",
    fontSize: 14,
  },
  msg: (ok) => ({
    padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 14,
    background: ok ? "#E8F5E9" : "#FFEBEE",
    color: ok ? "#2E7D32" : "#C62828",
  }),
  checkRow: {
    display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14,
  },
  chip: (active) => ({
    padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
    border: "1.5px solid " + (active ? "#1565C0" : "#ddd"),
    background: active ? "#E3F2FD" : "white",
    color: active ? "#1565C0" : "#555", fontWeight: active ? 600 : 400,
  }),
}

const OPP_TYPES = ["job", "scholarship", "internship", "conference", "training", "volunteering"]
const EXP_LEVELS = ["Beginner", "Junior", "Mid-level", "Senior"]
const COUNTRIES = ["Iraq", "Turkey", "Germany", "USA", "UK", "Canada", "UAE", "Saudi Arabia", "Jordan", "Egypt"]

export default function Onboarding({ onComplete }) {
  const [step,      setStep]      = useState(0)
  const [cvFile,    setCvFile]    = useState(null)
  const [cvMsg,     setCvMsg]     = useState("")
  const [cvOk,      setCvOk]      = useState(false)
  const [uploading, setUploading] = useState(false)
  const [name,      setName]      = useState("")
  const [expLevel,  setExpLevel]  = useState("")
  const [selTypes,  setSelTypes]  = useState([])
  const [selCtry,   setSelCtry]   = useState([])
  const [saving,    setSaving]    = useState(false)

  const token   = localStorage.getItem("ob_token")
  const headers = { "Authorization": "Bearer " + token, "Content-Type": "application/json" }

  const uploadCV = async () => {
    if (!cvFile) return
    setUploading(true); setCvMsg("")
    const form = new FormData()
    form.append("file", cvFile)
    try {
      const res  = await fetch(API + "/profile/upload-cv", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token },
        body: form,
      })
      const data = await res.json()
      if (res.ok) {
        setCvMsg("✅ " + (data.message || "CV uploaded and analyzed!"))
        setCvOk(true)
        setTimeout(() => setStep(2), 1200)
      } else {
        setCvMsg("❌ " + (data.detail || "Upload failed"))
      }
    } catch { setCvMsg("❌ Connection error. Please try again.") }
    setUploading(false)
  }

  const savePreferences = async () => {
    setSaving(true)
    try {
      await fetch(API + "/profile", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name:                name || undefined,
          experience_level:   expLevel || undefined,
          preferred_types:    selTypes.join(",") || undefined,
          preferred_countries: selCtry.join(",") || undefined,
          onboarding_done:    true,
        }),
      })
    } catch {}
    setSaving(false)
    setStep(3)
  }

  const toggleItem = (arr, setArr, val) =>
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])

  const stepIdx = step

  return (
    <div style={S.overlay}>
      <div style={S.box}>
        {/* Step dots */}
        <div style={S.stepBar}>
          {[0,1,2,3].map(i => (
            <div key={i} style={S.dot(i === stepIdx, i < stepIdx)} />
          ))}
        </div>

        {/* ─── Step 0: Welcome ─── */}
        {step === 0 && (
          <>
            <div style={S.logo}>🤖</div>
            <div style={S.title}>Welcome to OpportuBot!</div>
            <div style={S.sub}>
              Your AI-powered opportunity tracker for jobs, scholarships,
              internships, and more. Let's set up your profile in 3 quick steps.
            </div>
            <button style={S.btn()} onClick={() => setStep(1)}>Get Started →</button>
            <button style={S.skip} onClick={() => { savePreferences(); onComplete() }}>
              Skip setup, go to dashboard
            </button>
          </>
        )}

        {/* ─── Step 1: Upload CV ─── */}
        {step === 1 && (
          <>
            <div style={S.logo}>📄</div>
            <div style={S.title}>Upload Your CV</div>
            <div style={S.sub}>
              Our AI will analyze your CV and tailor opportunities to your skills
              and experience. Supports PDF or TXT files.
            </div>
            <label style={S.fileBox}>
              {cvFile ? `📎 ${cvFile.name}` : "Click to select your CV (PDF or TXT)"}
              <input
                type="file" accept=".pdf,.txt" style={{ display: "none" }}
                onChange={e => { setCvFile(e.target.files[0]); setCvMsg("") }}
              />
            </label>
            {cvMsg && <div style={S.msg(cvOk)}>{cvMsg}</div>}
            <button
              style={S.btn("#1565C0", !cvFile || uploading)}
              onClick={uploadCV}
              disabled={!cvFile || uploading}
            >
              {uploading ? "Uploading & Analyzing..." : "Upload CV →"}
            </button>
            <button style={S.skip} onClick={() => setStep(2)}>
              Skip — I'll upload later
            </button>
          </>
        )}

        {/* ─── Step 2: Preferences ─── */}
        {step === 2 && (
          <>
            <div style={S.logo}>⚙️</div>
            <div style={S.title}>Your Preferences</div>
            <div style={S.sub}>Help us find the best opportunities for you.</div>

            <div style={S.label}>Your name (optional)</div>
            <input
              style={S.input} placeholder="e.g. Ahmad Al-Basheer"
              value={name} onChange={e => setName(e.target.value)}
            />

            <div style={S.label}>Experience level</div>
            <div style={S.checkRow}>
              {EXP_LEVELS.map(l => (
                <div key={l} style={S.chip(expLevel === l)} onClick={() => setExpLevel(l)}>{l}</div>
              ))}
            </div>

            <div style={S.label}>Preferred opportunity types</div>
            <div style={S.checkRow}>
              {OPP_TYPES.map(t => (
                <div key={t} style={S.chip(selTypes.includes(t))}
                  onClick={() => toggleItem(selTypes, setSelTypes, t)}>
                  {t}
                </div>
              ))}
            </div>

            <div style={S.label}>Preferred countries</div>
            <div style={S.checkRow}>
              {COUNTRIES.map(c => (
                <div key={c} style={S.chip(selCtry.includes(c))}
                  onClick={() => toggleItem(selCtry, setSelCtry, c)}>
                  {c}
                </div>
              ))}
            </div>

            <button style={S.btn("#2E7D32", saving)} onClick={savePreferences} disabled={saving}>
              {saving ? "Saving..." : "Save & Continue →"}
            </button>
            <button style={S.skip} onClick={() => setStep(3)}>Skip</button>
          </>
        )}

        {/* ─── Step 3: Done ─── */}
        {step === 3 && (
          <>
            <div style={S.logo}>🎉</div>
            <div style={S.title}>You're all set!</div>
            <div style={S.sub}>
              Your profile is ready. Run your first AI pipeline to discover
              personalized opportunities from across the web.
            </div>
            <button style={S.btn("#1A237E")} onClick={onComplete}>
              Go to Dashboard →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
