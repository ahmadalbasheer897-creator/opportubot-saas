const COLORS = {
  dark:   "#1A237E",
  blue:   "#1565C0",
  green:  "#2E7D32",
  orange: "#E65100",
  gray:   "#F5F5F5",
  text:   "#333",
}

const S = {
  page: { fontFamily:"'Segoe UI',Arial,sans-serif", margin:0, color:COLORS.text },
  nav: {
    display:"flex", justifyContent:"space-between", alignItems:"center",
    padding:"14px 40px", background:COLORS.dark, color:"white",
    position:"sticky", top:0, zIndex:100,
  },
  logo: { fontSize:22, fontWeight:700, display:"flex", alignItems:"center", gap:8 },
  navBtns: { display:"flex", gap:12 },
  btn: (bg, color="white") => ({
    padding:"8px 20px", background:bg, color, border:"none",
    borderRadius:8, fontWeight:600, cursor:"pointer", fontSize:14,
  }),
  hero: {
    background:"linear-gradient(135deg,#1A237E,#283593)",
    color:"white", textAlign:"center", padding:"80px 20px",
  },
  heroTitle: { fontSize:52, fontWeight:700, margin:"0 0 16px" },
  heroSub: { fontSize:20, opacity:0.85, maxWidth:600, margin:"0 auto 36px" },
  heroCtaRow: { display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" },
  plans: { padding:"60px 40px", background:"white" },
  plansTitle: { textAlign:"center", fontSize:32, fontWeight:700, color:COLORS.dark, marginBottom:40 },
  planGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:24, maxWidth:900, margin:"0 auto" },
  planCard: (highlight) => ({
    border: highlight ? "2px solid "+COLORS.blue : "1px solid #ddd",
    borderRadius:16, padding:"28px 24px",
    background: highlight ? "linear-gradient(135deg,#E3F2FD,#BBDEFB)" : "white",
    textAlign:"center", position:"relative",
  }),
  badge: { position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)",
           background:COLORS.blue, color:"white", padding:"3px 16px",
           borderRadius:20, fontSize:12, fontWeight:700 },
  features: { padding:"60px 40px", background:COLORS.gray },
  featTitle: { textAlign:"center", fontSize:32, fontWeight:700, color:COLORS.dark, marginBottom:40 },
  featGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:20, maxWidth:960, margin:"0 auto" },
  featCard: { background:"white", borderRadius:12, padding:"20px", textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" },
  footer: { background:COLORS.dark, color:"white", textAlign:"center", padding:"24px", fontSize:13, opacity:0.8 },
}

const FEATURES = [
  { icon:"🔍", title:"Smart Search", desc:"Searches 60+ sources: scholarships, jobs, internships, conferences, training" },
  { icon:"🧠", title:"AI Analysis", desc:"Claude AI analyzes each opportunity and gives you a match score" },
  { icon:"📄", title:"CV Builder", desc:"Generates a customized CV for each opportunity automatically" },
  { icon:"📧", title:"Gmail Integration", desc:"Detects replies and organizes your emails automatically" },
  { icon:"⚡", title:"Auto Autofill", desc:"Chrome extension fills application forms in one click" },
  { icon:"📊", title:"Success Tracking", desc:"Tracks your applications and shows success statistics" },
  { icon:"🔔", title:"Follow-up Bot", desc:"Sends follow-up emails automatically after 2 weeks" },
  { icon:"🌍", title:"For Everyone", desc:"Works for engineers, students, and professionals worldwide" },
]

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    color: COLORS.text,
    features: ["50 opportunities/month", "AI analysis", "Dashboard", "Basic filters", "Email reminders"],
    missing: ["CV Builder", "Autofill Extension", "Gmail integration", "Follow-up bot"],
    highlight: false,
    cta: "Get Started Free",
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    color: COLORS.blue,
    badge: "Most Popular",
    features: ["Unlimited opportunities", "AI analysis", "CV Builder", "Autofill Extension",
               "Gmail integration", "Follow-up bot", "Success analytics", "Priority support"],
    highlight: true,
    cta: "Start Pro",
  },
]

export default function Landing({ navigate }) {
  return (
    <div style={S.page}>
      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.logo}>🤖 OpportuBot</div>
        <div style={S.navBtns}>
          <button style={S.btn("transparent","white")} onClick={()=>navigate("login")}>Login</button>
          <button style={S.btn("#30D158")} onClick={()=>navigate("register")}>Get Started Free</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={S.hero}>
        <div style={{fontSize:60, marginBottom:16}}>🤖</div>
        <h1 style={S.heroTitle}>Find Your Next Opportunity<br/>With AI</h1>
        <p style={S.heroSub}>
          OpportuBot automatically searches 60+ sources for scholarships, jobs, internships,
          and conferences — then analyzes and ranks them for you.
        </p>
        <div style={S.heroCtaRow}>
          <button style={{...S.btn("#30D158"),padding:"14px 36px",fontSize:16,borderRadius:12}}
                  onClick={()=>navigate("register")}>
            🚀 Start Free — No Credit Card
          </button>
          <button style={{...S.btn("rgba(255,255,255,0.15)"),padding:"14px 36px",fontSize:16,borderRadius:12}}>
            ▶ Watch Demo
          </button>
        </div>
        <p style={{marginTop:24,opacity:0.7,fontSize:14}}>
          Trusted by engineers and students worldwide
        </p>
      </section>

      {/* Features */}
      <section style={S.features}>
        <h2 style={S.featTitle}>Everything You Need to Land Opportunities</h2>
        <div style={S.featGrid}>
          {FEATURES.map(f => (
            <div key={f.title} style={S.featCard}>
              <div style={{fontSize:36,marginBottom:12}}>{f.icon}</div>
              <div style={{fontWeight:700,marginBottom:6,color:COLORS.dark}}>{f.title}</div>
              <div style={{fontSize:13,color:"#666",lineHeight:1.5}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section style={S.plans}>
        <h2 style={S.plansTitle}>Simple, Transparent Pricing</h2>
        <div style={S.planGrid}>
          {PLANS.map(p => (
            <div key={p.name} style={S.planCard(p.highlight)}>
              {p.badge && <div style={S.badge}>{p.badge}</div>}
              <div style={{fontSize:22,fontWeight:700,color:p.color,marginBottom:4}}>{p.name}</div>
              <div style={{fontSize:40,fontWeight:700,color:COLORS.dark}}>
                {p.price}<span style={{fontSize:16,fontWeight:400,color:"#666"}}>{p.period}</span>
              </div>
              <div style={{borderTop:"1px solid #eee",margin:"16px 0",paddingTop:16}}>
                {p.features.map(f => (
                  <div key={f} style={{fontSize:13,padding:"4px 0",color:"#333"}}>✅ {f}</div>
                ))}
                {p.missing?.map(f => (
                  <div key={f} style={{fontSize:13,padding:"4px 0",color:"#bbb"}}>✗ {f}</div>
                ))}
              </div>
              <button
                style={{...S.btn(p.highlight ? COLORS.blue : COLORS.dark), width:"100%", padding:"10px", marginTop:8}}
                onClick={()=>navigate("register")}
              >{p.cta}</button>
            </div>
          ))}
        </div>
        <p style={{textAlign:"center",marginTop:24,fontSize:13,color:"#888"}}>
          🎁 Have a gift code? Redeem it after registration for Pro access.
        </p>
      </section>

      {/* Footer */}
      <footer style={S.footer}>
        <div>🤖 OpportuBot — AI-Powered Opportunity Finder</div>
        <div style={{marginTop:4}}>Built with ❤️ for engineers and students worldwide</div>
      </footer>
    </div>
  )
}
