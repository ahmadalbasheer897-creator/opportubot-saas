import { useState, useEffect } from "react"

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
  const [minScore,       setMinScore]       = useState(0)
  const [expanded,       setExpanded]       = useState(null)

  const token   = localStorage.getItem("ob_token")
  const headers = { "Authorization": "Bearer " + token, "Content-Type": "application/json" }

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [s, p] = await Promise.all([
        fetch(API + "/opportunities/stats", { headers }).then(r => r.json()),
        fetch(API + "/profile",             { headers }).then(r => r.json()),
      ])
      setStats(s)
      setProfile(p && Object.keys(p).length > 0 ? p : null)
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
        setPipelineMsg("Pipeline started! New opportunities will appear in a moment.")
        setTimeout(() => { loadAll(); setPipelineMsg("") }, 5000)
      } else {
        setPipelineMsg(data.detail || "Failed to start pipeline")
        setPipelineRunning(false)
      }
    } catch {
      setPipelineMsg("Connection error. Please try again.")
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

  const updateStatus = async (oppId, status, e) => {
    e.stopPropagation()
    await fetch(`${API}/opportunities/${oppId}/status?status=${status}`, {
      method: "PATCH", headers,
    })
    loadOpps()
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

  return (
    <div style={S.page}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={S.header}>
        <div style={S.logo}>🤖 OpportuBot</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 13, opacity: 0.85, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </span>
          <span style={S.planBadge(plan)}>{plan.toUpperCase()}</span>
          {user?.is_owner && (
            <button style={S.btn("#283593")} onClick={() => navigate("admin")}>
              Admin Panel
            </button>
          )}
          <button style={S.btn(COLORS.red)} onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={S.content}>

        {/* ── Stats ─────────────────────────────────────────── */}
        <div style={S.statsRow}>
          {[
            { label: "Total",    val: stats?.total         ?? 0, color: COLORS.dark   },
            { label: "Ready",    val: stats?.ready         ?? 0, color: COLORS.blue   },
            { label: "Applied",  val: stats?.applied       ?? 0, color: COLORS.orange },
            { label: "Accepted", val: stats?.accepted      ?? 0, color: COLORS.green  },
            { label: "Rejected", val: stats?.rejected      ?? 0, color: COLORS.red    },
            { label: "Due Soon", val: stats?.deadline_soon ?? 0, color: COLORS.amber  },
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
            <div style={S.cardTitle}>🚀 Find New Opportunities</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
              {plan === "free"
                ? "Free plan: up to 50 opportunities/month"
                : "Unlimited opportunities — Pro plan active"}
            </div>
            <button
              style={{
                ...S.btn(pipelineRunning ? "#bbb" : COLORS.blue),
                width: "100%", padding: "10px",
              }}
              onClick={runPipeline}
              disabled={pipelineRunning}
            >
              {pipelineRunning ? "⏳ Pipeline running..." : "Run Pipeline"}
            </button>
            {pipelineMsg && (
              <div style={{
                fontSize: 12, marginTop: 8, padding: "8px 10px", borderRadius: 6,
                background: pipelineMsg.includes("started") ? "#E8F5E9" : "#FFEBEE",
                color: pipelineMsg.includes("started") ? COLORS.green : COLORS.red,
              }}>
                {pipelineMsg}
              </div>
            )}
          </div>

          {/* Upload CV */}
          <div style={S.actionCard}>
            <div style={S.cardTitle}>
              📄 {profile ? "Update CV" : "Upload Your CV"}
              {profile && (
                <span style={{ fontSize: 12, color: COLORS.green, fontWeight: 400, marginLeft: 8 }}>
                  ✓ on file
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>
              Upload a PDF — Claude AI extracts your profile for matching
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
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
            {cvMsg && (
              <div style={{
                fontSize: 12, marginTop: 8,
                color: cvMsg.includes("progress") ? COLORS.green : COLORS.red,
              }}>
                {cvMsg}
              </div>
            )}
          </div>

          {/* Upgrade to Pro — only on free plan */}
          {plan === "free" && (
            <div style={{ ...S.actionCard, background: "linear-gradient(135deg,#1A237E,#1565C0)", color: "white" }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>⚡ Upgrade to Pro</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 14 }}>
                Unlimited searches · AI scoring · Email notifications
              </div>
              <button
                style={{
                  width: "100%", padding: "10px", background: "white",
                  color: COLORS.dark, border: "none", borderRadius: 8,
                  fontWeight: 700, cursor: upgradeLoading ? "default" : "pointer", fontSize: 13,
                }}
                onClick={upgradeToPro}
                disabled={upgradeLoading}
              >
                {upgradeLoading ? "Redirecting..." : "Subscribe — IQD 9,990/mo"}
              </button>
              {upgradeMsg && (
                <div style={{ fontSize: 12, marginTop: 8, color: "#ffcdd2" }}>{upgradeMsg}</div>
              )}
            </div>
          )}

          {/* Gift Code — only on free plan */}
          {plan === "free" && (
            <div style={S.actionCard}>
              <div style={S.cardTitle}>🎁 Redeem Gift Code</div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>
                Enter a gift code to unlock Pro features instantly
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...S.input, flex: 1 }}
                  placeholder="OB-XXXXXXXX"
                  value={giftCode}
                  onChange={e => { setGiftCode(e.target.value.toUpperCase()); setGiftMsg("") }}
                />
                <button style={S.btn(COLORS.purple)} onClick={redeemGift}>
                  Redeem
                </button>
              </div>
              {giftMsg && (
                <div style={{
                  fontSize: 12, marginTop: 8,
                  color: giftMsg.includes("activated") ? COLORS.green : COLORS.red,
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
            <div style={{ ...S.cardTitle, marginBottom: 0 }}>
              Opportunities ({opps.length})
            </div>
            {/* Filters */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <select
                style={S.select}
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                {OPP_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
                  </option>
                ))}
              </select>

              <select
                style={S.select}
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>
                  Min score:
                </span>
                <input
                  type="range" min={0} max={100} step={10}
                  value={minScore}
                  onChange={e => setMinScore(+e.target.value)}
                  style={{ width: 80 }}
                />
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.dark, minWidth: 26 }}>
                  {minScore}
                </span>
              </div>
            </div>
          </div>

          {opps.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb" }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 15, marginBottom: 6, color: "#999" }}>
                No opportunities yet
              </div>
              <div style={{ fontSize: 13 }}>
                Click "Run Pipeline" above to find your first opportunities
              </div>
            </div>
          ) : (
            opps.map(opp => (
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
                      <span style={S.scorePill(opp.match_score)}>{opp.match_score}%</span>
                      {opp.opp_type && (
                        <span style={S.typePill}>{opp.opp_type}</span>
                      )}
                      {opp.deadline && opp.deadline !== "Not found" && (
                        <span style={{ fontSize: 11, color: COLORS.orange }}>
                          ⏰ {opp.deadline}
                        </span>
                      )}
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
                    borderTop: "1px solid #f0f0f0",
                  }}>
                    {opp.content && (
                      <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, margin: "0 0 10px" }}>
                        {opp.content.length > 500
                          ? opp.content.slice(0, 500) + "…"
                          : opp.content}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      {opp.apply_url && (
                        <a
                          href={opp.apply_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            ...S.btn(COLORS.green),
                            textDecoration: "none", fontSize: 12, display: "inline-block",
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          Apply Now →
                        </a>
                      )}
                      {opp.nationality_note && (
                        <span style={{ fontSize: 12, color: "#888" }}>
                          🌍 {opp.nationality_note}
                        </span>
                      )}
                      {opp.date_found && (
                        <span style={{ fontSize: 11, color: "#bbb" }}>
                          Found: {opp.date_found}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
