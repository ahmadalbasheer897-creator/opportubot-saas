import { useState, useEffect, useRef } from "react"
import { makeTr } from "./translations"
import Onboarding from "./Onboarding"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const COLORS = {
  dark: "#1A237E", blue: "#1565C0", green: "#2E7D32",
  orange: "#E65100", red: "#C62828", purple: "#6A1B9A",
  amber: "#F57F17", gray: "#F0F2F5", text: "#333",
}
const PLAN_COLORS = {
  free: "#757575", pro: "#1565C0", gift: "#6A1B9A", owner: "#1A237E",
}

const S = {
  page: {
    fontFamily: "'Segoe UI',Arial,sans-serif",
    minHeight: "100vh",
    background: COLORS.gray,
  },
  header: {
    background: COLORS.dark, color: "white", padding: "14px 24px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    position: "sticky", top: 0, zIndex: 100,
  },
  logo: { fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 },
  content: { padding: "24px", maxWidth: 1200, margin: "0 auto" },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
    gap: 14, marginBottom: 20,
  },
  statCard: (color) => ({
    background: "white", borderRadius: 12, padding: "18px 14px",
    textAlign: "center", borderTop: "4px solid " + color,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  }),
  statNum: { fontSize: 30, fontWeight: 700, color: COLORS.dark },
  statLabel: { fontSize: 12, color: "#888", marginTop: 4 },
  card: {
    background: "white", borderRadius: 12, padding: "20px 24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  cardTitle: { fontSize: 15, fontWeight: 700, color: COLORS.dark, marginBottom: 14 },
  actionsRow: { display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" },
  actionCard: {
    background: "white", borderRadius: 12, padding: "18px 20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", flex: "1 1 280px",
  },
  btn: (bg, color = "white") => ({
    padding: "9px 18px", background: bg, color,
    border: "none", borderRadius: 8, fontWeight: 600,
    cursor: "pointer", fontSize: 13, whiteSpace: "nowrap",
  }),
  input: {
    padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8,
    fontSize: 13, outline: "none", boxSizing: "border-box",
  },
  select: {
    padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8,
    fontSize: 13, background: "white", cursor: "pointer",
  },
  planBadge: (plan) => ({
    padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
    background: PLAN_COLORS[plan] || "#eee",
    color: plan === "free" ? "#333" : "white",
  }),
  scorePill: (score) => ({
    display: "inline-block", padding: "2px 10px", borderRadius: 12,
    fontSize: 12, fontWeight: 700,
    background: score >= 70 ? "#E8F5E9" : score >= 40 ? "#FFF8E1" : "#FFEBEE",
    color: score >= 70 ? COLORS.green : score >= 40 ? COLORS.amber : COLORS.red,
  }),
  oppItem: {
    border: "1px solid #eee", borderRadius: 10, padding: "14px 16px",
    marginBottom: 8, cursor: "pointer", background: "white",
  },
  typePill: {
    fontSize: 11, background: "#EEEEEE", padding: "2px 8px",
    borderRadius: 8, color: "#555",
  },
  tag: (color) => ({
    fontSize: 11, background: color + "22", padding: "2px 8px",
    borderRadius: 8, color, fontWeight: 600,
  }),
}

const OPP_TYPES = ["all", "job", "scholarship", "internship", "conference", "training"]
const STATUSES  = ["all", "new", "analyzed", "applied", "accepted", "rejected"]

export default function Dashboard({ navigate, logout, user }) {
  const [stats,          setStats]          = useState(null)
  const [opps,           setOpps]           = useState([])
  const [profile,        setProfile]        = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [pipelineRunning,setPipelineRunning] = useState(false)
  const [pipelineMsg,    setPipelineMsg]    = useState("")
  const [giftCode,       setGiftCode]       = useState("")
  const [giftMsg,        setGiftMsg]        = useState("")
  const [cvFile,         setCvFile]         = useState(null)
  const [cvMsg,          setCvMsg]          = useState("")
  const [uploading,      setUploading]      = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [upgradeMsg,     setUpgradeMsg]     = useState("")
  const [filterType,     setFilterType]     = useState("all")
  const [filterStatus,   setFilterStatus]   = useState("all")
  const [filterCountry,  setFilterCountry]  = useState("all")
  const [filterDeadline, setFilterDeadline] = useState("all")
  const [searchText,     setSearchText]     = useState("")
  const [minScore,       setMinScore]       = useState(0)
  const [expanded,       setExpanded]       = useState(null)
  const [clModal,        setClModal]        = useState(null)   // {oppId, oppTitle, text, lang, loading}
  const [ipModal,        setIpModal]        = useState(null)   // {oppId, oppTitle, questions, lang, loading}
  const [lang,           setLang]           = useState(() => localStorage.getItem("ob_lang") || "en")
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [viewMode,       setViewMode]       = useState("list") // "list" | "kanban"
  const [noteInputs,     setNoteInputs]     = useState({})
  const [showProfile,    setShowProfile]    = useState(false)
  const [profileEdit,    setProfileEdit]    = useState({})
  const [showSources,    setShowSources]    = useState(false)
  const [sourcesData,    setSourcesData]    = useState(null)   // grouped by type from /sources
  const [selectedDomains,setSelectedDomains]= useState([])     // user's chosen curated domains
  const [customSources,  setCustomSources]  = useState([])     // user-added custom domains
  const [customInput,    setCustomInput]    = useState("")      // input field value


  const token   = localStorage.getItem("ob_token")
  const headers = { "Authorization": "Bearer " + token, "Content-Type": "application/json" }

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [s, p, srcs] = await Promise.all([
        fetch(API + "/opportunities/stats", { headers }).then(r => r.json()),
        fetch(API + "/profile",             { headers }).then(r => r.json()),
        fetch(API + "/sources",             { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      ])
      setStats(s)
      setProfile(p && Object.keys(p).length > 0 ? p : null)
      if (srcs) setSourcesData(srcs)
      // Init selected domains from saved profile
      if (p && p.selected_sources) {
        setSelectedDomains(p.selected_sources.split(",").map(d => d.trim()).filter(Boolean))
      }
      if (p && p.custom_sources) {
        setCustomSources(p.custom_sources.split(",").map(d => d.trim()).filter(Boolean))
      }
      // Show onboarding for new users who haven't completed it
      if (p && p.onboarding_done === false && !localStorage.getItem("ob_onboarding_skipped")) {
        setShowOnboarding(true)
      }
    } catch (e) { console.error("loadAll:", e) }
    await loadOpps()
    setLoading(false)
  }

  const loadOpps = async () => {
    let url = `${API}/opportunities?limit=100&min_score=${minScore}`
    if (filterType   !== "all") url += "&opp_type=" + filterType
    if (filterStatus !== "all") url += "&status="   + filterStatus
    try {
      const data = await fetch(url, { headers }).then(r => r.json())
      setOpps(data.opportunities || [])
    } catch {}
  }

  useEffect(() => { if (!loading) loadOpps() }, [filterType, filterStatus, minScore])

  const runPipeline = async () => {
    setPipelineRunning(true)
    setPipelineMsg("")
    try {
      const res  = await fetch(API + "/pipeline/run", { method: "POST", headers })
      const data = await res.json()
      if (res.ok) {
        const msg = makeTr(localStorage.getItem("ob_lang") || "en")("pipelineStarted")
        setPipelineMsg(msg)
        setTimeout(() => { loadAll(); setPipelineMsg("") }, 5000)
      } else {
        setPipelineMsg(data.detail || "Failed to start pipeline")
        setPipelineRunning(false)
      }
    } catch {
      setPipelineMsg(makeTr(localStorage.getItem("ob_lang") || "en")("connectionError"))
      setPipelineRunning(false)
    }
  }

  const uploadCV = async () => {
    if (!cvFile) return
    setUploading(true)
    setCvMsg("")
    const form = new FormData()
    form.append("file", cvFile)
    try {
      const res  = await fetch(API + "/profile/upload-cv", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token },
        body: form,
      })
      const data = await res.json()
      setCvMsg(res.ok
        ? "CV uploaded! AI analysis in progress (~30s)..."
        : (data.detail || "Upload failed"))
      if (res.ok) {
        setCvFile(null)
        setTimeout(() => loadAll(), 8000)
      }
    } catch { setCvMsg("Upload failed. Please try again.") }
    setUploading(false)
  }

  const upgradeToPro = async () => {
    setUpgradeLoading(true)
    setUpgradeMsg("")
    try {
      const res  = await fetch(API + "/payment/checkout", { method: "POST", headers })
      const data = await res.json()
      if (res.ok && data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        setUpgradeMsg(data.detail || "Could not start checkout. Try again.")
        setUpgradeLoading(false)
      }
    } catch {
      setUpgradeMsg("Connection error. Please try again.")
      setUpgradeLoading(false)
    }
  }

  const redeemGift = async () => {
    if (!giftCode.trim()) return
    const res  = await fetch(
      API + "/gifts/redeem?code=" + encodeURIComponent(giftCode.trim().toUpperCase()),
      { method: "POST", headers }
    )
    const data = await res.json()
    if (res.ok) {
      setGiftMsg("Gift activated! Expires: " + (data.expires_at?.split("T")[0] || ""))
      setGiftCode("")
      // Refresh page to update plan badge
      setTimeout(() => window.location.reload(), 1500)
    } else {
      setGiftMsg(data.detail || "Invalid or expired code")
    }
  }

  // Deadline countdown helper
  const deadlineBadge = (deadline) => {
    if (!deadline || deadline === "Not found") return null
    const dl = new Date(deadline)
    if (isNaN(dl)) return <span style={{ fontSize: 11, color: COLORS.orange }}>⏰ {deadline}</span>
    const days = Math.ceil((dl - new Date()) / 86400000)
    if (days < 0)  return <span style={{ fontSize: 11, color: COLORS.red,    fontWeight: 700 }}>⛔ Expired</span>
    if (days === 0) return <span style={{ fontSize: 11, color: COLORS.red,   fontWeight: 700 }}>⏰ Today!</span>
    if (days <= 7)  return <span style={{ fontSize: 11, color: COLORS.red,   fontWeight: 700 }}>⏰ {days}d left</span>
    if (days <= 30) return <span style={{ fontSize: 11, color: COLORS.orange, fontWeight: 600 }}>⏰ {days}d left</span>
    return <span style={{ fontSize: 11, color: "#888" }}>⏰ {days}d left</span>
  }

  const saveNote = async (oppId) => {
    const notes = noteInputs[oppId] ?? ""
    await fetch(`${API}/opportunities/${oppId}/notes?notes=${encodeURIComponent(notes)}`, {
      method: "PATCH", headers,
    })
  }

  const deleteOpp = async (oppId, e) => {
    e.stopPropagation()
    if (!confirm("Remove this opportunity?")) return
    await fetch(`${API}/opportunities/${oppId}`, { method: "DELETE", headers })
    loadOpps()
  }

  const exportCSV = () => {
    const cols = ["title","type","score","status","country","deadline","url"]
    const rows = [cols.join(","), ...filteredOpps.map(o =>
      cols.map(c => `"${String(o[c] || "").replace(/"/g, "'")}"` ).join(",")
    )]
    const blob = new Blob([rows.join("\n")], { type: "text/csv" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "opportunities.csv"
    a.click()
  }

  const saveProfile = async () => {
    await fetch(API + "/profile", {
      method: "PUT", headers,
      body: JSON.stringify(profileEdit),
    })
    setShowProfile(false)
    loadAll()
  }

  const saveSources = async () => {
    await fetch(API + "/profile", {
      method: "PUT", headers,
      body: JSON.stringify({
        selected_sources: selectedDomains.join(","),
        custom_sources: customSources.join(","),
      }),
    })
    setShowSources(false)
  }

  const addCustomSource = () => {
    const raw = customInput.trim()
    if (!raw) return
    // Extract clean domain from URL or plain domain
    let domain = raw
    try {
      const url = raw.startsWith("http") ? raw : "https://" + raw
      domain = new URL(url).hostname.replace(/^www\./, "")
    } catch { domain = raw.replace(/^www\./, "").split("/")[0] }
    if (domain && !customSources.includes(domain)) {
      setCustomSources(prev => [...prev, domain])
    }
    setCustomInput("")
  }

  const toggleDomain = (domain) => {
    setSelectedDomains(prev =>
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    )
  }

  const updateStatus = async (oppId, status, e) => {
    e.stopPropagation()
    await fetch(`${API}/opportunities/${oppId}/status?status=${status}`, {
      method: "PATCH", headers,
    })
    loadOpps()
  }

  const openCoverLetter = async (opp, lang = "English") => {
    setClModal({ oppId: opp.id, oppTitle: opp.title, text: "", lang, loading: true })
    try {
      const res  = await fetch(
        `${API}/opportunities/${opp.id}/cover-letter?language=${lang}`,
        { method: "POST", headers }
      )
      const data = await res.json()
      if (res.ok) {
        setClModal(prev => ({ ...prev, text: data.cover_letter, loading: false }))
      } else {
        setClModal(prev => ({ ...prev, text: "Error: " + (data.detail || "Failed"), loading: false }))
      }
    } catch {
      setClModal(prev => ({ ...prev, text: "Connection error. Please try again.", loading: false }))
    }
  }

  const openInterviewPrep = async (opp, lang = "English") => {
    setIpModal({ oppId: opp.id, oppTitle: opp.title, questions: null, lang, loading: true })
    try {
      const res  = await fetch(
        `${API}/opportunities/${opp.id}/interview-prep?language=${lang}`,
        { method: "POST", headers }
      )
      const data = await res.json()
      if (res.ok) {
        setIpModal(prev => ({ ...prev, questions: data.questions, loading: false }))
      } else {
        setIpModal(prev => ({ ...prev, questions: null, loading: false, error: data.detail || "Failed" }))
      }
    } catch {
      setIpModal(prev => ({ ...prev, questions: null, loading: false, error: "Connection error" }))
    }
  }

  if (loading) return (
    <div style={{
      display: "flex", flexDirection: "column", justifyContent: "center",
      alignItems: "center", height: "100vh", background: COLORS.gray,
    }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>🤖</div>
      <div style={{ color: "#888", fontSize: 15 }}>Loading OpportuBot...</div>
    </div>
  )

  const displayName = user?.full_name || user?.email || "User"
  const plan = user?.plan || "free"

  // ── i18n ──────────────────────────────────────────────
  const t    = makeTr(lang)
  const isAr = lang === "ar"
  const toggleLang = () => {
    const next = lang === "en" ? "ar" : "en"
    setLang(next)
    localStorage.setItem("ob_lang", next)
  }

  // ── Client-side derived filters ────────────────────────
  const uniqueCountries = [...new Set(
    opps.map(o => o.country).filter(c => c && c !== "Not found" && c.trim())
  )].sort()

  const filteredOpps = opps.filter(opp => {
    // Country
    if (filterCountry !== "all" && opp.country !== filterCountry) return false
    // Text search
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      if (
        !(opp.title   || "").toLowerCase().includes(q) &&
        !(opp.summary || "").toLowerCase().includes(q) &&
        !(opp.country || "").toLowerCase().includes(q)
      ) return false
    }
    // Deadline
    if (filterDeadline !== "all") {
      const dl = new Date(opp.deadline)
      if (isNaN(dl)) return filterDeadline !== "overdue" // no deadline = not overdue
      const now = new Date()
      const weekEnd  = new Date(); weekEnd.setDate(now.getDate() + 7)
      const monthEnd = new Date(); monthEnd.setDate(now.getDate() + 30)
      if (filterDeadline === "overdue" && dl >= now)               return false
      if (filterDeadline === "week"    && (dl < now || dl > weekEnd))  return false
      if (filterDeadline === "month"   && (dl < now || dl > monthEnd)) return false
    }
    return true
  })

  // ── Kanban renderer ───────────────────────────────────────────────────────
  const KANBAN_COLS = [
    { key: "new",      label: "New",        color: "#1565C0" },
    { key: "analyzed", label: "Analyzed",   color: "#6A1B9A" },
    { key: "applied",  label: "Applied",    color: "#E65100" },
    { key: "accepted", label: "Accepted",   color: "#2E7D32" },
    { key: "rejected", label: "Rejected",   color: "#C62828" },
  ]

  const renderKanban = () => (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
      {KANBAN_COLS.map(col => {
        const colOpps = filteredOpps.filter(o => (o.status || "new") === col.key)
        return (
          <div key={col.key} style={{ minWidth: 200, flex: "0 0 220px" }}>
            <div style={{
              fontWeight: 700, fontSize: 12, color: col.color, marginBottom: 8,
              display: "flex", justifyContent: "space-between",
            }}>
              <span>{col.label}</span>
              <span style={{ background: col.color + "22", color: col.color, borderRadius: 10, padding: "1px 8px" }}>
                {colOpps.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {colOpps.map(opp => (
                <div key={opp.id} style={{
                  background: "white", borderRadius: 10, padding: "10px 12px",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.07)", borderLeft: "3px solid " + col.color,
                  cursor: "pointer",
                }} onClick={() => { setViewMode("list"); setExpanded(opp.id) }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.dark, marginBottom: 4, lineHeight: 1.4 }}>
                    {opp.title?.slice(0, 60)}{(opp.title?.length > 60) ? "…" : ""}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={S.scorePill(opp.score)}>{opp.score}%</span>
                    {deadlineBadge(opp.deadline)}
                  </div>
                </div>
              ))}
              {colOpps.length === 0 && (
                <div style={{ fontSize: 12, color: "#ccc", textAlign: "center", padding: "20px 0" }}>Empty</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div style={{ ...S.page, direction: isAr ? "rtl" : "ltr" }}>

      {/* ── Onboarding Wizard ────────────────────────────────── */}
      {showOnboarding && (
        <Onboarding onComplete={() => {
          setShowOnboarding(false)
          localStorage.setItem("ob_onboarding_skipped", "1")
          loadAll()
        }} />
      )}

      {/* ── Profile Modal ─────────────────────────────────────── */}
      {showProfile && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20,
        }} onClick={() => setShowProfile(false)}>
          <div style={{
            background: "white", borderRadius: 16, padding: 28, maxWidth: 480, width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)", maxHeight: "85vh", overflowY: "auto",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.dark, marginBottom: 4 }}>👤 My Profile</div>
            {profile?.cv_filename && (
              <div style={{ fontSize: 12, color: COLORS.green, marginBottom: 16 }}>
                ✅ CV on file: {profile.cv_filename}
              </div>
            )}
            {[
              { label: "Name", key: "name", type: "text", placeholder: "Your full name" },
              { label: "Skills (comma-separated)", key: "skills", type: "text", placeholder: "React, Python, Marketing..." },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>{f.label}</div>
                <input type={f.type} placeholder={f.placeholder}
                  value={profileEdit[f.key] || ""}
                  onChange={e => setProfileEdit(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Experience Level</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Beginner","Junior","Mid-level","Senior"].map(l => (
                  <div key={l} onClick={() => setProfileEdit(p => ({ ...p, experience_level: l }))}
                    style={{ padding: "5px 14px", borderRadius: 16, fontSize: 13, cursor: "pointer",
                      border: "1.5px solid " + (profileEdit.experience_level === l ? "#1565C0" : "#ddd"),
                      background: profileEdit.experience_level === l ? "#E3F2FD" : "white",
                      color: profileEdit.experience_level === l ? "#1565C0" : "#555", fontWeight: profileEdit.experience_level === l ? 700 : 400 }}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Preferred Countries</div>
              <input placeholder="Iraq, Germany, USA..."
                value={profileEdit.preferred_countries || ""}
                onChange={e => setProfileEdit(p => ({ ...p, preferred_countries: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button onClick={saveProfile}
                style={{ ...S.btn(COLORS.blue), flex: 1 }}>Save Profile</button>
              <button onClick={() => setShowProfile(false)}
                style={{ ...S.btn("#eee", "#555"), flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sources Modal ─────────────────────────────────────── */}
      {showSources && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20,
        }} onClick={() => setShowSources(false)}>
          <div style={{
            background: "white", borderRadius: 16, padding: 28, maxWidth: 560, width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)", maxHeight: "88vh", overflowY: "auto",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.dark, marginBottom: 4 }}>🌐 Search Sources</div>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16, lineHeight: 1.5 }}>
              Choose which websites OpportuBot searches for opportunities.
              Leave all unchecked to search all sources automatically.
            </p>
            {/* ── Custom Sites Section ── */}
            <div style={{ background: "#F0F7FF", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.blue, textTransform: "uppercase",
                letterSpacing: 1, marginBottom: 10 }}>
                ➕ Add Your Own Sites
              </div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
                أضف أي موقع تعرفه فيه فرص — البوت سيبحث فيه تلقائياً
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: customSources.length > 0 ? 10 : 0 }}>
                <input
                  placeholder="مثال: opportunitydesk.org أو الصق رابط كامل"
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCustomSource()}
                  style={{ ...S.input, flex: 1, fontSize: 12 }}
                />
                <button onClick={addCustomSource} style={{ ...S.btn(COLORS.green), fontSize: 12 }}>
                  + Add
                </button>
              </div>
              {customSources.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {customSources.map(domain => (
                    <div key={domain} style={{
                      padding: "5px 12px", borderRadius: 20, fontSize: 12,
                      background: "#E8F5E9", border: "1.5px solid " + COLORS.green,
                      color: COLORS.green, fontWeight: 700,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      🌐 {domain}
                      <span
                        onClick={() => setCustomSources(prev => prev.filter(d => d !== domain))}
                        style={{ cursor: "pointer", fontSize: 16, lineHeight: 1, fontWeight: 400 }}
                        title="Remove"
                      >×</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Curated Sources count + clear ── */}
            {selectedDomains.length > 0 && (
              <div style={{ marginBottom: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: COLORS.blue, fontWeight: 600 }}>
                  {selectedDomains.length} curated source{selectedDomains.length !== 1 ? "s" : ""} selected
                </span>
                <button onClick={() => setSelectedDomains([])}
                  style={{ fontSize: 11, padding: "2px 10px", borderRadius: 10, border: "none",
                    background: "#FFEBEE", color: COLORS.red, cursor: "pointer", fontWeight: 600 }}>
                  Clear all
                </button>
              </div>
            )}
            {sourcesData ? Object.entries(sourcesData).map(([type, sources]) => (
              <div key={type} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase",
                  letterSpacing: 1, marginBottom: 8 }}>
                  {type === "scholarship" ? "🎓 Scholarships" :
                   type === "job" ? "💼 Jobs" :
                   type === "internship" ? "🧑‍💻 Internships" :
                   type === "volunteering" ? "🤝 Volunteering" :
                   type === "conference" ? "🎤 Conferences" :
                   type === "training" ? "📚 Training" : type}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {sources.map(src => {
                    const on = selectedDomains.includes(src.domain)
                    return (
                      <div key={src.domain} onClick={() => toggleDomain(src.domain)} style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                        border: "1.5px solid " + (on ? COLORS.blue : "#ddd"),
                        background: on ? "#E3F2FD" : "white",
                        color: on ? COLORS.blue : "#555",
                        fontWeight: on ? 700 : 400,
                        transition: "all .15s",
                      }}>
                        {on ? "✓ " : ""}{src.name}
                      </div>
                    )
                  })}
                </div>
              </div>
            )) : (
              <div style={{ color: "#888", fontSize: 13, padding: "20px 0" }}>Loading sources...</div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={saveSources}
                style={{ ...S.btn(COLORS.blue), flex: 1 }}>Save Preferences</button>
              <button onClick={() => setShowSources(false)}
                style={{ ...S.btn("#eee", "#555"), flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={S.header}>
        <div style={S.logo}>🤖 {t("appName")}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 13, opacity: 0.85, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </span>
          <span style={S.planBadge(plan)}>{plan.toUpperCase()}</span>
          {/* Language toggle */}
          <button
            style={{
              ...S.btn("rgba(255,255,255,0.15)", "white"),
              border: "1px solid rgba(255,255,255,0.3)", fontSize: 12,
            }}
            onClick={toggleLang}
            title={isAr ? "Switch to English" : "التبديل إلى العربية"}
          >
            {isAr ? "EN" : "عربي"}
          </button>
          <button
            style={{ ...S.btn("rgba(255,255,255,0.15)", "white"), border: "1px solid rgba(255,255,255,0.3)", fontSize: 12 }}
            onClick={() => { setProfileEdit({ name: profile?.name || "", experience_level: profile?.experience_level || "", preferred_countries: profile?.preferred_countries || "", preferred_types: profile?.preferred_types || "", skills: profile?.skills || "" }); setShowProfile(true) }}
          >
            👤 Profile
          </button>
          <button
            style={{ ...S.btn("rgba(255,255,255,0.15)", "white"), border: "1px solid rgba(255,255,255,0.3)", fontSize: 12 }}
            onClick={() => setShowSources(true)}
            title="Choose which sites to search"
          >
            🌐 Sources{(selectedDomains.length + customSources.length) > 0 ? ` (${selectedDomains.length + customSources.length})` : ""}
          </button>
          {user?.is_owner && (
            <button style={S.btn("#283593")} onClick={() => navigate("admin")}>
              {t("adminPanel")}
            </button>
          )}
          <button style={S.btn(COLORS.red)} onClick={logout}>{t("logout")}</button>
        </div>
      </div>

      <div style={S.content}>

        {/* ── Stats ─────────────────────────────────────────── */}
        <div style={S.statsRow}>
          {[
            { label: t("total"),    val: stats?.total         ?? 0, color: COLORS.dark   },
            { label: t("ready"),    val: stats?.ready         ?? 0, color: COLORS.blue   },
            { label: t("applied"),  val: stats?.applied       ?? 0, color: COLORS.orange },
            { label: t("accepted"), val: stats?.accepted      ?? 0, color: COLORS.green  },
            { label: t("rejected"), val: stats?.rejected      ?? 0, color: COLORS.red    },
            { label: t("dueSoon"), val: stats?.deadline_soon ?? 0, color: COLORS.amber  },
          ].map(s => (
            <div key={s.label} style={S.statCard(s.color)}>
              <div style={S.statNum}>{s.val}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Action Cards ──────────────────────────────────── */}
        <div style={S.actionsRow}>

          {/* Run Pipeline */}
          <div style={S.actionCard}>
            <div style={S.cardTitle}>🚀 {t("findOpps")}</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
              {plan === "free" ? t("freePlanNote") : t("proPlanNote")}
            </div>
            <button
              style={{
                ...S.btn(pipelineRunning ? "#bbb" : COLORS.blue),
                width: "100%", padding: "10px",
              }}
              onClick={runPipeline}
              disabled={pipelineRunning}
            >
              {pipelineRunning ? t("pipelineRunning") : t("runPipeline")}
            </button>
            {pipelineMsg && (
              <div style={{
                fontSize: 12, marginTop: 8, padding: "8px 10px", borderRadius: 6,
                background: pipelineMsg.includes("started") || pipelineMsg.includes("بدأ") ? "#E8F5E9" : "#FFEBEE",
                color: pipelineMsg.includes("started") || pipelineMsg.includes("بدأ") ? COLORS.green : COLORS.red,
              }}>
                {pipelineMsg}
              </div>
            )}
          </div>

          {/* Upload CV */}
          <div style={S.actionCard}>
            <div style={S.cardTitle}>
              📄 {profile ? t("updateCV") : t("uploadCV")}
              {profile && (
                <span style={{ fontSize: 12, color: COLORS.green, fontWeight: 400, marginLeft: 8 }}>
                  {t("cvOnFile")}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>
              {t("cvDesc")}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="file"
                accept=".pdf"
                onChange={e => setCvFile(e.target.files[0])}
                style={{ fontSize: 12, flex: 1, minWidth: 0 }}
              />
              <button
                style={S.btn(uploading || !cvFile ? "#bbb" : COLORS.green)}
                onClick={uploadCV}
                disabled={uploading || !cvFile}
              >
                {uploading ? t("uploading") : t("upload")}
              </button>
            </div>
            {cvMsg && (
              <div style={{
                fontSize: 12, marginTop: 8,
                color: cvMsg.includes("progress") || cvMsg.includes("جارٍ") ? COLORS.green : COLORS.red,
              }}>
                {cvMsg}
              </div>
            )}
          </div>

          {/* Upgrade to Pro — only on free plan */}
          {plan === "free" && (
            <div style={{ ...S.actionCard, background: "linear-gradient(135deg,#1A237E,#1565C0)", color: "white" }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>⚡ {t("upgradePro")}</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 14 }}>{t("upgradeDesc")}</div>
              <button
                style={{
                  width: "100%", padding: "10px", background: "white",
                  color: COLORS.dark, border: "none", borderRadius: 8,
                  fontWeight: 700, cursor: upgradeLoading ? "default" : "pointer", fontSize: 13,
                }}
                onClick={upgradeToPro}
                disabled={upgradeLoading}
              >
                {upgradeLoading ? t("redirecting") : t("upgradeBtn")}
              </button>
              {upgradeMsg && (
                <div style={{ fontSize: 12, marginTop: 8, color: "#ffcdd2" }}>{upgradeMsg}</div>
              )}
            </div>
          )}

          {/* Gift Code — only on free plan */}
          {plan === "free" && (
            <div style={S.actionCard}>
              <div style={S.cardTitle}>🎁 {t("redeemGift")}</div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>{t("redeemDesc")}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...S.input, flex: 1 }}
                  placeholder="OB-XXXXXXXX"
                  value={giftCode}
                  onChange={e => { setGiftCode(e.target.value.toUpperCase()); setGiftMsg("") }}
                />
                <button style={S.btn(COLORS.purple)} onClick={redeemGift}>{t("redeemBtn")}</button>
              </div>
              {giftMsg && (
                <div style={{
                  fontSize: 12, marginTop: 8,
                  color: giftMsg.includes("activated") || giftMsg.includes("فُعِّلت") ? COLORS.green : COLORS.red,
                }}>
                  {giftMsg}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── Opportunities ─────────────────────────────────── */}
        <div style={S.card}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ ...S.cardTitle, marginBottom: 0 }}>
                {t("opportunities")} ({filteredOpps.length}{filteredOpps.length !== opps.length ? ` / ${opps.length}` : ""})
              </div>
              {/* View toggle */}
              <div style={{ display: "flex", background: "#f0f2f5", borderRadius: 8, padding: 2 }}>
                {["list","kanban"].map(m => (
                  <button key={m}
                    onClick={() => setViewMode(m)}
                    style={{ padding: "4px 10px", fontSize: 12, border: "none", borderRadius: 6, cursor: "pointer",
                      background: viewMode === m ? "white" : "transparent",
                      fontWeight: viewMode === m ? 700 : 400, color: viewMode === m ? COLORS.dark : "#888",
                      boxShadow: viewMode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                    }}>
                    {m === "list" ? "☰ List" : "⊞ Kanban"}
                  </button>
                ))}
              </div>
              {/* Export CSV */}
              {filteredOpps.length > 0 && (
                <button onClick={exportCSV}
                  style={{ ...S.btn("#37474F"), fontSize: 12, padding: "5px 12px" }}>
                  ↓ CSV
                </button>
              )}
            </div>
            {/* Filters */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {/* Text search */}
              <input
                style={{ ...S.input, width: 160 }}
                placeholder={t("searchPlaceholder")}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />

              {/* Type */}
              <select style={S.select} value={filterType} onChange={e => setFilterType(e.target.value)}>
                {OPP_TYPES.map(tp => (
                  <option key={tp} value={tp}>
                    {tp === "all" ? t("allTypes") : t(tp + "s") || (tp.charAt(0).toUpperCase() + tp.slice(1) + "s")}
                  </option>
                ))}
              </select>

              {/* Status */}
              <select style={S.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s === "all" ? t("allStatus") : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>

              {/* Country */}
              {uniqueCountries.length > 0 && (
                <select style={S.select} value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
                  <option value="all">{t("allCountries")}</option>
                  {uniqueCountries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}

              {/* Deadline */}
              <select style={S.select} value={filterDeadline} onChange={e => setFilterDeadline(e.target.value)}>
                <option value="all">{t("anyDeadline")}</option>
                <option value="week">{t("dueThisWeek")}</option>
                <option value="month">{t("dueThisMonth")}</option>
                <option value="overdue">{t("overdue")}</option>
              </select>

              {/* Min score slider */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>
                  {t("minScore")}
                </span>
                <input
                  type="range" min={0} max={100} step={10}
                  value={minScore}
                  onChange={e => setMinScore(+e.target.value)}
                  style={{ width: 80 }}
                />
                <span style={{
                  fontSize: 12, fontWeight: 700, minWidth: 26,
                  color: minScore >= 70 ? COLORS.green : minScore >= 40 ? COLORS.amber : COLORS.dark,
                }}>
                  {minScore}%
                </span>
              </div>

              {/* Reset filters */}
              {(filterType !== "all" || filterStatus !== "all" || filterCountry !== "all" ||
                filterDeadline !== "all" || searchText || minScore > 0) && (
                <button
                  style={{ ...S.btn("#eee", "#555"), fontSize: 12 }}
                  onClick={() => {
                    setFilterType("all"); setFilterStatus("all"); setFilterCountry("all")
                    setFilterDeadline("all"); setSearchText(""); setMinScore(0)
                  }}
                >
                  {t("resetFilters")}
                </button>
              )}
            </div>
          </div>

          {viewMode === "kanban" ? renderKanban() : filteredOpps.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb" }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 15, marginBottom: 6, color: "#999" }}>
                {opps.length === 0 ? t("noOppsYet") : t("noResults")}
              </div>
              <div style={{ fontSize: 13 }}>
                {opps.length === 0 ? t("noOppsHint") : t("noResultsHint")}
              </div>
            </div>
          ) : (
            filteredOpps.map(opp => (
              <div
                key={opp.id}
                style={{
                  ...S.oppItem,
                  boxShadow: expanded === opp.id
                    ? "0 4px 16px rgba(0,0,0,0.1)"
                    : "none",
                  borderColor: expanded === opp.id ? "#ddd" : "#eee",
                }}
                onClick={() => setExpanded(expanded === opp.id ? null : opp.id)}
              >
                {/* Opp header row */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", gap: 10,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={S.scorePill(opp.score)}>{opp.score}%</span>
                      {opp.type && (
                        <span style={S.typePill}>{opp.type}</span>
                      )}
                      {opp.country && opp.country !== "Not found" && (
                        <span style={{ fontSize: 11, color: "#666" }}>🌍 {opp.country}</span>
                      )}
                      {deadlineBadge(opp.deadline)}
                      {opp.status === "applied" && (
                        <span style={S.tag(COLORS.orange)}>Applied</span>
                      )}
                      {opp.status === "accepted" && (
                        <span style={S.tag(COLORS.green)}>Accepted ✓</span>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.dark, marginBottom: 4 }}>
                      {opp.title || "Untitled Opportunity"}
                    </div>
                    {opp.url && (
                      <a
                        href={opp.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12, color: COLORS.blue, textDecoration: "none" }}
                        onClick={e => e.stopPropagation()}
                      >
                        🔗 {opp.url.length > 70 ? opp.url.slice(0, 70) + "…" : opp.url}
                      </a>
                    )}
                  </div>

                  {/* Status selector */}
                  <select
                    value={opp.status || "new"}
                    onChange={e => updateStatus(opp.id, e.target.value, e)}
                    onClick={e => e.stopPropagation()}
                    style={{ ...S.select, fontSize: 12, padding: "5px 8px", flexShrink: 0 }}
                  >
                    {["new", "analyzed", "applied", "accepted", "rejected", "archived"].map(s => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expanded details */}
                        {expanded === opp.id && (
                  <div style={{
                    marginTop: 12, paddingTop: 12,
                    borderTop: "1px solid #eee",
                  }}>
                    {opp.summary && (
                      <p style={{
                        fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 10,
                      }}>
                        {opp.summary}
                      </p>
                    )}
                    {opp.ai_analysis && (
                      <div style={{
                        background: "#F3F4F6", borderRadius: 8,
                        padding: "10px 12px", fontSize: 12, color: "#444",
                        marginBottom: 10, lineHeight: 1.6,
                      }}>
                        <strong>AI Analysis:</strong> {opp.ai_analysis}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {opp.url && (
                        <a
                          href={opp.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            ...S.btn(COLORS.blue),
                            textDecoration: "none", fontSize: 12,
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          {t("viewOpp")}
                        </a>
                      )}
                      <button
                        style={{ ...S.btn(COLORS.purple), fontSize: 12 }}
                        onClick={e => { e.stopPropagation(); openCoverLetter(opp, "English") }}
                      >
                        {t("coverLetterEN")}
                      </button>
                      <button
                        style={{ ...S.btn(COLORS.dark), fontSize: 12 }}
                        onClick={e => { e.stopPropagation(); openCoverLetter(opp, "Arabic") }}
                      >
                        {t("coverLetterAR")}
                      </button>
                      <button
                        style={{ ...S.btn("#00838F"), fontSize: 12 }}
                        onClick={e => { e.stopPropagation(); openInterviewPrep(opp, isAr ? "Arabic" : "English") }}
                      >
                        {t("interviewPrep")}
                      </button>
                      <button
                        style={{ ...S.btn(COLORS.red), fontSize: 12 }}
                        onClick={e => deleteOpp(opp.id, e)}
                      >
                        🗑 Delete
                      </button>
                    </div>
                    {/* Notes */}
                    <div style={{ marginTop: 10 }} onClick={e => e.stopPropagation()}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 4 }}>📝 My Notes</div>
                      <textarea
                        rows={2}
                        placeholder="Add personal notes (saved automatically on blur)..."
                        value={noteInputs[opp.id] ?? (opp.notes || "")}
                        onChange={e => setNoteInputs(n => ({ ...n, [opp.id]: e.target.value }))}
                        onBlur={() => saveNote(opp.id)}
                        style={{
                          width: "100%", padding: "8px 10px", border: "1px solid #ddd",
                          borderRadius: 8, fontSize: 13, resize: "vertical", outline: "none",
                          fontFamily: "inherit", boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>
                )}

              </div>
            ))
          )}
        </div>

      </div>

      {/* ── Cover Letter Modal ──────────────────────────────── */}
      {clModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 999, padding: 16,
          }}
          onClick={() => setClModal(null)}
        >
          <div
            style={{
              background: "white", borderRadius: 14, padding: 28,
              maxWidth: 680, width: "100%", maxHeight: "85vh",
              overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.dark, marginBottom: 4 }}>
                  {t("clTitle")}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {clModal.oppTitle} · {clModal.lang}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {!clModal.loading && clModal.text && !clModal.text.startsWith("Error") && (
                  <button
                    style={S.btn(COLORS.green, "white")}
                    onClick={() => { navigator.clipboard.writeText(clModal.text) }}
                  >
                    {t("copy")}
                  </button>
                )}
                <button style={S.btn(COLORS.red)} onClick={() => setClModal(null)}>{t("close")}</button>
              </div>
            </div>

            {/* Content */}
            {clModal.loading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✍️</div>
                <div>{t("clLoading")}</div>
                <div style={{ fontSize: 12, marginTop: 6, color: "#bbb" }}>{t("clLoadingHint")}</div>
              </div>
            ) : (
              <pre style={{
                whiteSpace: "pre-wrap", fontFamily: "inherit",
                fontSize: 14, lineHeight: 1.8, color: "#333",
                background: "#F8F9FA", borderRadius: 8, padding: 16,
                margin: 0,
              }}>
                {clModal.text}
              </pre>
            )}

            {/* Switch language */}
            {!clModal.loading && (
              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                <button
                  style={S.btn(clModal.lang === "English" ? COLORS.purple : "#eee", clModal.lang === "English" ? "white" : "#555")}
                  onClick={() => openCoverLetter({ id: clModal.oppId, title: clModal.oppTitle }, "English")}
                >
                  {t("english")}
                </button>
                <button
                  style={S.btn(clModal.lang === "Arabic" ? COLORS.dark : "#eee", clModal.lang === "Arabic" ? "white" : "#555")}
                  onClick={() => openCoverLetter({ id: clModal.oppId, title: clModal.oppTitle }, "Arabic")}
                >
                  {t("arabic")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Interview Prep Modal ─────────────────────────────── */}
      {ipModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 999, padding: 16,
          }}
          onClick={() => setIpModal(null)}
        >
          <div
            style={{
              background: "white", borderRadius: 14, padding: 28,
              maxWidth: 720, width: "100%", maxHeight: "88vh",
              overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#00838F", marginBottom: 4 }}>
                  {t("ipTitle")}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {ipModal.oppTitle} · {ipModal.lang}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={S.btn("#C62828")} onClick={() => setIpModal(null)}>{t("close")}</button>
              </div>
            </div>

            {/* Content */}
            {ipModal.loading ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#888" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎤</div>
                <div>{t("ipLoading")}</div>
                <div style={{ fontSize: 12, marginTop: 6, color: "#bbb" }}>{t("ipLoadingHint")}</div>
              </div>
            ) : ipModal.error ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: COLORS.red }}>
                {ipModal.error}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {(ipModal.questions || []).map((q, i) => (
                  <div
                    key={i}
                    style={{
                      border: "1px solid #e0f2f1", borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    {/* Question */}
                    <div style={{
                      background: "#e0f2f1", padding: "12px 16px",
                      display: "flex", gap: 12, alignItems: "flex-start",
                    }}>
                      <span style={{
                        background: "#00838F", color: "white",
                        borderRadius: "50%", width: 24, height: 24,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: "#00695C", fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>
                          {q.category}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#004D40", lineHeight: 1.5 }}>
                          {q.question}
                        </div>
                      </div>
                    </div>
                    {/* Answer tip */}
                    <div style={{ padding: "12px 16px", background: "#F8F9FA" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6 }}>
                        {t("answerTip")}
                      </div>
                      <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                        {q.answer_tip}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Language toggle */}
            {!ipModal.loading && (
              <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
                <button
                  style={S.btn(ipModal.lang === "English" ? "#00838F" : "#eee", ipModal.lang === "English" ? "white" : "#555")}
                  onClick={() => openInterviewPrep({ id: ipModal.oppId, title: ipModal.oppTitle }, "English")}
                >
                  {t("english")}
                </button>
                <button
                  style={S.btn(ipModal.lang === "Arabic" ? COLORS.dark : "#eee", ipModal.lang === "Arabic" ? "white" : "#555")}
                  onClick={() => openInterviewPrep({ id: ipModal.oppId, title: ipModal.oppTitle }, "Arabic")}
                >
                  {t("arabic")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
