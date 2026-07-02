import { useState, useEffect } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const COLORS = {
  dark: "#1A237E", blue: "#1565C0", green: "#2E7D32",
  orange: "#E65100", red: "#C62828", purple: "#6A1B9A",
  amber: "#F57F17", gray: "#F0F2F5",
}
const PLAN_COLORS = {
  free: "#757575", pro: "#1565C0", gift: "#6A1B9A", owner: "#1A237E",
}
const TYPE_COLORS = {
  job: "#1565C0", scholarship: "#2E7D32", internship: "#E65100",
  conference: "#6A1B9A", training: "#F57F17", volunteering: "#00838F",
}

const S = {
  page: { fontFamily: "'Segoe UI',Arial,sans-serif", minHeight: "100vh", background: "#F0F2F5" },
  header: {
    background: COLORS.dark, color: "white", padding: "14px 24px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    position: "sticky", top: 0, zIndex: 100,
  },
  title: { fontSize: 18, fontWeight: 700 },
  content: { padding: 24, maxWidth: 1200, margin: "0 auto" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 24 },
  statCard: (color) => ({
    background: "white", borderRadius: 12, padding: "20px 16px",
    textAlign: "center", borderTop: "4px solid " + color,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  }),
  statNum: { fontSize: 30, fontWeight: 700, color: COLORS.dark },
  statLabel: { fontSize: 12, color: "#888", marginTop: 4 },
  section: {
    background: "white", borderRadius: 12, padding: "20px 24px", marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: COLORS.dark, marginBottom: 16 },
  chartsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20, marginBottom: 20 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: COLORS.dark, color: "white", padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600 },
  td: { padding: "10px 14px", fontSize: 13, borderBottom: "1px solid #f5f5f5" },
  badge: (plan) => ({
    padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
    background: PLAN_COLORS[plan] || "#eee", color: plan === "free" ? "#333" : "white",
  }),
  btn: (bg, color = "white") => ({
    padding: "5px 12px", background: bg, color,
    border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600,
  }),
  input: { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13 },
  tabBar: { display: "flex", gap: 4, marginBottom: 20 },
  tab: (active) => ({
    padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: "pointer", border: "none",
    background: active ? COLORS.dark : "white",
    color: active ? "white" : "#555",
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
  }),
}

function BarChart({ data, color = COLORS.blue, height = 80 }) {
  if (!data?.length) return <div style={{ color: "#bbb", fontSize: 13 }}>No data yet</div>
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div>
      <svg viewBox={`0 0 ${data.length * 32} ${height + 24}`} style={{ width: "100%", overflow: "visible" }}>
        {data.map((d, i) => {
          const barH = Math.max((d.count / max) * height, d.count > 0 ? 4 : 0)
          const x = i * 32 + 4
          const y = height - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={24} height={barH} rx={3} fill={color} opacity={0.85} />
              {d.count > 0 && (
                <text x={x + 12} y={y - 3} textAnchor="middle" fontSize={9} fill="#555">{d.count}</text>
              )}
              <text x={x + 12} y={height + 14} textAnchor="middle" fontSize={8} fill="#999">{d.date}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function HBarChart({ data }) {
  if (!data || !Object.keys(data).length) return <div style={{ color: "#bbb", fontSize: 13 }}>No data yet</div>
  const max = Math.max(...Object.values(data), 1)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Object.entries(data).sort((a, b) => b[1] - a[1]).map(([key, val]) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 80, fontSize: 12, color: "#555", textAlign: "right", flexShrink: 0 }}>{key}</div>
          <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 4, height: 18, overflow: "hidden" }}>
            <div style={{
              width: `${(val / max) * 100}%`, height: "100%",
              background: TYPE_COLORS[key] || COLORS.blue, borderRadius: 4,
              minWidth: val > 0 ? 4 : 0, transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ width: 28, fontSize: 12, fontWeight: 700, color: COLORS.dark }}>{val}</div>
        </div>
      ))}
    </div>
  )
}

function PlanDonut({ stats }) {
  const data = [
    { label: "Free",  val: stats.free_users  || 0, color: "#9E9E9E" },
    { label: "Pro",   val: stats.pro_users   || 0, color: COLORS.blue },
    { label: "Gift",  val: stats.gift_users  || 0, color: COLORS.purple },
    { label: "Owner", val: stats.owner_users || 0, color: COLORS.dark },
  ].filter(d => d.val > 0)
  const total = data.reduce((s, d) => s + d.val, 0) || 1
  let cumulative = 0
  const r = 40, cx = 60, cy = 60, size = 120
  const slices = data.map(d => {
    const pct = d.val / total
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2
    cumulative += pct
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2
    const large = pct > 0.5 ? 1 : 0
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle),   y2 = cy + r * Math.sin(endAngle)
    return { ...d, pct, path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z` }
  })
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={2} />)}
        <circle cx={cx} cy={cy} r={22} fill="white" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fontWeight="bold" fill={COLORS.dark}>{total}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
            <span style={{ color: "#555" }}>{d.label}</span>
            <span style={{ fontWeight: 700, color: COLORS.dark }}>{d.val}</span>
            <span style={{ color: "#bbb", fontSize: 11 }}>({Math.round(d.pct * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Admin({ navigate, logout, user }) {
  const [stats,     setStats]     = useState(null)
  const [users,     setUsers]     = useState([])
  const [giftDays,  setGiftDays]  = useState(365)
  const [giftCount, setGiftCount] = useState(1)
  const [newGifts,  setNewGifts]  = useState([])
  const [tab,       setTab]       = useState("analytics")

  const token   = localStorage.getItem("ob_token")
  const headers = { "Authorization": "Bearer " + token, "Content-Type": "application/json" }

  useEffect(() => {
    if (!user?.is_owner) { navigate("dashboard"); return }
    loadData()
  }, [])

  const loadData = async () => {
    const [s, u] = await Promise.all([
      fetch(API + "/admin/stats", { headers }).then(r => r.json()),
      fetch(API + "/admin/users", { headers }).then(r => r.json()),
    ])
    setStats(s)
    setUsers(Array.isArray(u) ? u : (u.users || []))
  }

  const updatePlan = async (userId, plan) => {
    await fetch(API + "/admin/users/" + userId + "/plan", {
      method: "PATCH", headers, body: JSON.stringify({ plan }),
    })
    loadData()
  }

  const toggleUser = async (userId) => {
    await fetch(API + "/admin/users/" + userId + "/toggle", { method: "PATCH", headers })
    loadData()
  }

  const createGifts = async () => {
    const res  = await fetch(API + "/admin/gifts/create", {
      method: "POST", headers,
      body: JSON.stringify({ duration_days: giftDays, count: giftCount }),
    })
    const data = await res.json()
    setNewGifts(data.codes || [])
  }

  if (!stats) return (
    <div style={{ padding: 40, textAlign: "center", color: "#888", fontSize: 15 }}>
      Loading admin panel...
    </div>
  )

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.title}>🤖 OpportuBot — Owner Dashboard</div>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={S.btn("#283593")} onClick={() => navigate("dashboard")}>← My Dashboard</button>
          <button style={S.btn(COLORS.red)} onClick={logout}>Logout</button>
        </div>
      </div>
      <div style={S.content}>
        <div style={S.statsRow}>
          {[
            { label: "Total Users",   val: stats.total_users,         color: COLORS.dark   },
            { label: "Active Users",  val: stats.active_users,        color: COLORS.green  },
            { label: "Pro Users",     val: stats.pro_users,           color: COLORS.blue   },
            { label: "Gift Users",    val: stats.gift_users,          color: COLORS.purple },
            { label: "Total Opps",    val: stats.total_opportunities, color: COLORS.orange },
            { label: "Searches",      val: stats.total_searches,      color: "#00838F"     },
            { label: "Revenue (IQD)", val: (stats.revenue_iqd || 0).toLocaleString(), color: "#2E7D32" },
          ].map(s => (
            <div key={s.label} style={S.statCard(s.color)}>
              <div style={S.statNum}>{s.val ?? 0}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={S.tabBar}>
          {[
            { id: "analytics", label: "📊 Analytics" },
            { id: "users",     label: "👥 Users" },
            { id: "gifts",     label: "🎁 Gift Codes" },
          ].map(t => (
            <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        {tab === "analytics" && (
          <>
            <div style={S.chartsGrid}>
              <div style={S.section}>
                <div style={S.sectionTitle}>📈 New Users — Last 14 Days</div>
                <BarChart data={stats.users_by_day} color={COLORS.dark} height={90} />
              </div>
              <div style={S.section}>
                <div style={S.sectionTitle}>🔍 Searches — Last 7 Days</div>
                <BarChart data={stats.searches_by_day} color="#00838F" height={90} />
              </div>
            </div>
            <div style={S.chartsGrid}>
              <div style={S.section}>
                <div style={S.sectionTitle}>📋 Plan Distribution</div>
                <PlanDonut stats={stats} />
              </div>
              <div style={S.section}>
                <div style={S.sectionTitle}>🗂 Opportunities by Type</div>
                <HBarChart data={stats.opps_by_type} />
              </div>
            </div>
            {(stats.pro_users || 0) > 0 && (
              <div style={{ ...S.section, background: "linear-gradient(135deg,#1B5E20,#2E7D32)", color: "white" }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>💰 Revenue Estimate</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>
                  {(stats.revenue_iqd || 0).toLocaleString()} IQD / month
                </div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
                  {stats.pro_users} Pro subscriber{stats.pro_users !== 1 ? "s" : ""} × 9,990 IQD
                </div>
              </div>
            )}
          </>
        )}
        {tab === "users" && (
          <div style={S.section}>
            <div style={S.sectionTitle}>👥 All Users ({users.length})</div>
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {["ID", "Email", "Name", "Plan", "Active", "Verified", "Joined", "Actions"].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ background: u.is_active ? "white" : "#fff5f5" }}>
                      <td style={S.td}>{u.id}</td>
                      <td style={S.td}>{u.email}</td>
                      <td style={S.td}>{u.full_name || u.name || "—"}</td>
                      <td style={S.td}><span style={S.badge(u.plan)}>{u.plan?.toUpperCase()}</span></td>
                      <td style={S.td}>
                        <span style={{ color: u.is_active ? COLORS.green : COLORS.red, fontWeight: 600 }}>
                          {u.is_active ? "✅" : "❌"}
                        </span>
                      </td>
                      <td style={S.td}>
                        <span style={{ color: u.email_verified ? COLORS.green : "#bbb" }}>
                          {u.email_verified ? "✓" : "—"}
                        </span>
                      </td>
                      <td style={S.td}>{u.created_at?.split("T")[0]}</td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <select value={u.plan} onChange={e => updatePlan(u.id, e.target.value)}
                            style={{ padding: "3px 6px", borderRadius: 6, fontSize: 12, border: "1px solid #ddd" }}>
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="gift">Gift</option>
                          </select>
                          <button style={S.btn(u.is_active ? COLORS.red : COLORS.green)} onClick={() => toggleUser(u.id)}>
                            {u.is_active ? "Block" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "gifts" && (
          <div style={S.section}>
            <div style={S.sectionTitle}>🎁 Generate Gift Codes</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: "#666", marginRight: 6 }}>Days:</label>
                <input type="number" value={giftDays} onChange={e => setGiftDays(+e.target.value)}
                  min={1} max={3650} style={{ ...S.input, width: 80 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#666", marginRight: 6 }}>Count:</label>
                <input type="number" value={giftCount} onChange={e => setGiftCount(+e.target.value)}
                  min={1} max={50} style={{ ...S.input, width: 60 }} />
              </div>
              <button style={S.btn(COLORS.purple)} onClick={createGifts}>Generate Codes</button>
            </div>
            {newGifts.length > 0 && (
              <div style={{ padding: 16, background: "#F3E5F5", borderRadius: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.purple, marginBottom: 10 }}>
                  ✅ Generated {newGifts.length} code(s):
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {newGifts.map(code => (
                    <div key={code} style={{
                      fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: COLORS.dark,
                      padding: "6px 12px", background: "white", borderRadius: 6,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      {code}
                      <button style={{ ...S.btn(COLORS.purple), fontSize: 11 }}
                        onClick={() => navigator.clipboard.writeText(code)}>Copy</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
