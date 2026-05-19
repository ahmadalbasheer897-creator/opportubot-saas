import { useState, useEffect } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const S = {
  page: { fontFamily: "Arial", minHeight: "100vh", background: "#F0F2F5" },
  header: {
    background: "#1A237E", color: "white", padding: "14px 24px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: 700 },
  content: { padding: 24, maxWidth: 1100, margin: "0 auto" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16, marginBottom: 24 },
  statCard: (color) => ({
    background: "white", borderRadius: 12, padding: "20px 16px",
    textAlign: "center", borderTop: "4px solid " + color,
  }),
  statNum: { fontSize: 32, fontWeight: 700, color: "#1A237E" },
  statLabel: { fontSize: 13, color: "#888", marginTop: 4 },
  table: {
    width: "100%", borderCollapse: "collapse", background: "white",
    borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  th: {
    background: "#1A237E", color: "white", padding: "10px 14px",
    textAlign: "left", fontSize: 13, fontWeight: 600,
  },
  td: { padding: "10px 14px", fontSize: 13, borderBottom: "1px solid #f5f5f5" },
  badge: (plan) => ({
    padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
    background: plan === "owner" ? "#1A237E" : plan === "pro" ? "#1565C0" : plan === "gift" ? "#6A1B9A" : "#eee",
    color: plan === "free" ? "#333" : "white",
  }),
  btn: (bg) => ({
    padding: "4px 12px", background: bg, color: "white",
    border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600,
  }),
  section: {
    background: "white", borderRadius: 12, padding: 24, marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: "#1A237E", marginBottom: 16 },
  input: { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, marginRight: 8 },
}

export default function Admin({ navigate, logout, user }) {
  const [stats,     setStats]     = useState(null)
  const [users,     setUsers]     = useState([])
  const [giftDays,  setGiftDays]  = useState(365)
  const [giftCount, setGiftCount] = useState(1)
  const [newGifts,  setNewGifts]  = useState([])
  const token = localStorage.getItem("ob_token")

  const headers = { "Authorization": "Bearer " + token, "Content-Type": "application/json" }

  useEffect(() => {
    if (!user?.is_owner) { navigate("dashboard"); return }
    loadData()
  }, [])

  const loadData = async () => {
    const [s, u] = await Promise.all([
      fetch(API + "/admin/stats",  { headers }).then(r => r.json()),
      fetch(API + "/admin/users",  { headers }).then(r => r.json()),
    ])
    setStats(s)
    setUsers(u.users || [])
  }

  const updatePlan = async (userId, plan) => {
    await fetch(API + "/admin/users/" + userId + "/plan", {
      method: "PATCH", headers,
      body: JSON.stringify({ plan }),
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
    <div style={{ padding: 40, textAlign: "center" }}>Loading admin panel...</div>
  )

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.title}>🤖 OpportuBot — Owner Dashboard</div>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={S.btn("#283593")} onClick={() => navigate("dashboard")}>← My Dashboard</button>
          <button style={S.btn("#C62828")} onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={S.content}>

        {/* Stats */}
        <div style={S.statsRow}>
          {[
            { label: "Total Users",  val: stats.total_users,        color: "#1A237E" },
            { label: "Active Users", val: stats.active_users,       color: "#2E7D32" },
            { label: "Free Users",   val: stats.free_users,         color: "#757575" },
            { label: "Pro Users",    val: stats.pro_users,          color: "#1565C0" },
            { label: "Gift Users",   val: stats.gift_users,         color: "#6A1B9A" },
            { label: "Total Opps",   val: stats.total_opportunities, color: "#E65100" },
          ].map(s => (
            <div key={s.label} style={S.statCard(s.color)}>
              <div style={S.statNum}>{s.val ?? 0}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Gift Code Generator */}
        <div style={S.section}>
          <div style={S.sectionTitle}>🎁 Generate Gift Codes</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <label style={{ fontSize: 13, color: "#666", marginRight: 6 }}>Days:</label>
              <input
                type="number" value={giftDays}
                onChange={e => setGiftDays(+e.target.value)}
                min={1} max={3650}
                style={{ ...S.input, width: 80 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "#666", marginRight: 6 }}>Count:</label>
              <input
                type="number" value={giftCount}
                onChange={e => setGiftCount(+e.target.value)}
                min={1} max={50}
                style={{ ...S.input, width: 60 }}
              />
            </div>
            <button style={S.btn("#6A1B9A")} onClick={createGifts}>Generate Codes</button>
          </div>
          {newGifts.length > 0 && (
            <div style={{ marginTop: 16, padding: 12, background: "#F3E5F5", borderRadius: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#6A1B9A", marginBottom: 8 }}>
                Generated {newGifts.length} gift code(s) — share with users:
              </div>
              {newGifts.map(code => (
                <div key={code} style={{
                  fontFamily: "monospace", fontSize: 15, fontWeight: 700,
                  color: "#1A237E", padding: "4px 0",
                }}>
                  {code}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users Table */}
        <div style={S.section}>
          <div style={S.sectionTitle}>👥 All Users ({users.length})</div>
          <table style={S.table}>
            <thead>
              <tr>
                {["ID", "Email", "Name", "Plan", "Active", "Opps/Month", "Joined", "Actions"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={S.td}>{u.id}</td>
                  <td style={S.td}>{u.email}</td>
                  <td style={S.td}>{u.full_name || "—"}</td>
                  <td style={S.td}>
                    <span style={S.badge(u.plan)}>{u.plan.toUpperCase()}</span>
                  </td>
                  <td style={S.td}>
                    <span style={{ color: u.is_active ? "#2E7D32" : "#C62828", fontWeight: 600 }}>
                      {u.is_active ? "✅" : "❌"}
                    </span>
                  </td>
                  <td style={S.td}>{u.opportunities_this_month || 0}</td>
                  <td style={S.td}>{u.created_at?.split("T")[0]}</td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <select
                        value={u.plan}
                        onChange={e => updatePlan(u.id, e.target.value)}
                        style={{ padding: "3px 6px", borderRadius: 6, fontSize: 12, border: "1px solid #ddd" }}
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="gift">Gift</option>
                      </select>
                      <button
                        style={S.btn(u.is_active ? "#C62828" : "#2E7D32")}
                        onClick={() => toggleUser(u.id)}
                      >
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
    </div>
  )
}
