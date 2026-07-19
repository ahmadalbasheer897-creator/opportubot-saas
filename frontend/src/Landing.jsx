import { useState, useEffect, useRef } from "react"

// ── Palette (matches Dashboard) ───────────────────────────────────
const C = {
  bg:      "#080B10",
  card:    "rgba(255,255,255,0.03)",
  border:  "rgba(255,255,255,0.07)",
  text:    "#F8FAFC",
  muted:   "#94a3b8",
  dim:     "#64748b",
  blue:    "#3b82f6",
  purple:  "#8b5cf6",
  green:   "#10b981",
  amber:   "#f59e0b",
  red:     "#ef4444",
  cyan:    "#22d3ee",
  grad:    "linear-gradient(135deg,#7c3aed,#4f46e5)",
}

// ── CSS animations injected once ─────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#080B10;font-family:'Inter',system-ui,sans-serif;overflow-x:hidden}

@keyframes fadeUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
@keyframes blob{0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%;transform:scale(1) rotate(0deg)}
  33%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%;transform:scale(1.05) rotate(120deg)}
  66%{border-radius:20% 60% 60% 40%/70% 30% 50% 60%;transform:scale(0.97) rotate(240deg)}}
@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
@keyframes pulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes typewriter{from{width:0}to{width:100%}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes counter{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes gradShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes slideIn{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(124,58,237,.3)}50%{box-shadow:0 0 40px rgba(124,58,237,.6),0 0 60px rgba(79,70,229,.3)}}

.reveal{opacity:0;transform:translateY(32px);transition:opacity .7s ease,transform .7s ease}
.reveal.visible{opacity:1;transform:translateY(0)}

.feat-card{transition:transform .25s,border-color .25s,box-shadow .25s}
.feat-card:hover{transform:translateY(-6px)!important;border-color:rgba(139,92,246,.4)!important;box-shadow:0 12px 40px rgba(124,58,237,.2)!important}

.plan-card{transition:transform .25s,box-shadow .25s}
.plan-card:hover{transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,0,0,.4)!important}

.nav-btn{transition:background .2s,color .2s,transform .15s}
.nav-btn:hover{transform:translateY(-1px)}

.cta-btn{transition:transform .2s,box-shadow .2s,opacity .2s}
.cta-btn:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(124,58,237,.5)}
.cta-btn:active{transform:translateY(0)}

.step-card{transition:border-color .25s,background .25s}
.step-card:hover{border-color:rgba(139,92,246,.5)!important;background:rgba(139,92,246,.06)!important}

.faq-item{transition:background .2s}
.faq-item:hover{background:rgba(255,255,255,.02)}

.testimonial-card{transition:transform .25s,border-color .25s}
.testimonial-card:hover{transform:translateY(-4px);border-color:rgba(139,92,246,.3)!important}

.stat-num{
  background:linear-gradient(135deg,#a78bfa,#60a5fa);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  background-clip:text;
}
`

// ── Scroll-reveal hook ────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.unobserve(el) } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

// ── Animated counter ──────────────────────────────────────────────
function Counter({ target, suffix = "" }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const num = parseInt(target.replace(/\D/g, "")) || 0
        if (!num) { setVal(target); return }
        let start = 0; const dur = 1400; const step = 16
        const inc = num / (dur / step)
        const t = setInterval(() => {
          start += inc; if (start >= num) { setVal(num); clearInterval(t) }
          else setVal(Math.floor(start))
        }, step)
      }
    }, { threshold: 0.5 })
    obs.observe(el); return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{typeof val === "number" ? val + suffix : val}</span>
}

const FEATURES = [
  { icon: "🔍", title: "AI-Powered Search",    desc: "Searches 60+ sources worldwide for scholarships, jobs, internships, conferences, training, and volunteering." },
  { icon: "🧠", title: "Smart Match Score",     desc: "Claude AI reads your CV and scores every opportunity 0–100% based on how well it fits your profile." },
  { icon: "📄", title: "Cover Letter AI",       desc: "Generates a customized cover letter for each opportunity in seconds — in English or Arabic." },
  { icon: "🎤", title: "Interview Prep AI",     desc: "Get tailored mock interview questions and expert answer tips for every specific opportunity." },
  { icon: "📊", title: "Kanban Tracker",        desc: "Track your applications visually: New → Applied → Interview → Offer — all in one dashboard." },
  { icon: "⏰", title: "Deadline Alerts",       desc: "Smart countdown badges warn you when deadlines are close. Never miss a promising opportunity again." },
  { icon: "📧", title: "Daily Digest Email",    desc: "Receive a curated daily email with your top opportunities sorted by AI match score." },
  { icon: "🌍", title: "Arabic & English UI",  desc: "Full Arabic RTL support built in. Switch between Arabic and English with one click." },
]

const STEPS = [
  { num: "01", icon: "📄", title: "Upload Your CV",        desc: "Upload your resume and let our AI extract your skills, experience, and goals automatically." },
  { num: "02", icon: "🚀", title: "Run the AI Pipeline",   desc: "Hit 'Run Pipeline' — OpportuBot searches the web, finds opportunities, and scores them for you." },
  { num: "03", icon: "🎯", title: "Apply with Confidence", desc: "Review your matches, generate cover letters, and prep for interviews — all in one place." },
]

const TESTIMONIALS = [
  { name: "Ahmed K.", role: "Software Engineer",      flag: "🇮🇶", text: "Got 3 interview calls in the first week. The AI match score saved me hours of manual searching." },
  { name: "Sara M.",  role: "PhD Scholarship Seeker", flag: "🇯🇴", text: "Found a fully-funded scholarship I never would have discovered on my own. The cover letter generator is amazing." },
  { name: "Omar T.",  role: "Recent Graduate",         flag: "🇪🇬", text: "The interview prep feature helped me nail my first professional interview. Highly recommend!" },
]

const FAQS = [
  { q: "How does the AI matching work?",              a: "Our AI reads your CV and profile, then scores each opportunity 0–100% based on skill match, experience level, and your preferences." },
  { q: "Is my CV data private?",                      a: "Yes. Your CV is stored securely and only used to personalize your opportunity matches. We never share it with third parties." },
  { q: "What types of opportunities are covered?",    a: "Jobs, scholarships, internships, conferences, training programs, and volunteering — across all industries and countries." },
  { q: "Can I use it in Arabic?",                     a: "Yes! OpportuBot has full Arabic RTL support. Switch between Arabic and English with one click from your dashboard." },
  { q: "What's the difference between Free and Pro?", a: "Free gives you 5 pipeline runs/day and core features. Pro unlocks unlimited runs, priority AI scoring, and advanced analytics." },
]

const PLANS = [
  {
    name: "Free", price: "$0", highlight: false,
    features: ["5 pipeline runs/day", "AI match scoring", "Cover letter generator", "Interview prep", "Kanban tracker", "20 saved opportunities"],
    cta: "Get Started Free",
  },
  {
    name: "Pro ⚡", price: "$9", highlight: true,
    features: ["Unlimited pipeline runs", "Priority AI scoring", "Advanced analytics", "Daily digest emails", "High-match alerts", "Unlimited saved opportunities"],
    cta: "Upgrade to Pro",
  },
]

export default function Landing({ navigate }) {
  const [openFaq, setOpenFaq] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const r1 = useReveal(), r2 = useReveal(), r3 = useReveal(),
        r4 = useReveal(), r5 = useReveal(), r6 = useReveal(), r7 = useReveal()

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: C.bg, color: C.text, overflowX: "hidden" }}>
      <style>{CSS}</style>

      {/* ════════ NAVBAR ════════════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
        padding: "0 40px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(8,11,16,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "background .3s,border-color .3s,backdrop-filter .3s",
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src="/logo.png"
            alt="OpportuBot"
            style={{ width: 40, height: 40, objectFit: "contain", animation: "float 3s ease-in-out infinite" }}
          />
          <span style={{ background: "linear-gradient(135deg,#60a5fa,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            OpportuBot
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="nav-btn" onClick={() => navigate("login")} style={{
            padding: "8px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14,
            background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
            color: C.text, cursor: "pointer",
          }}>Login</button>
          <button className="nav-btn cta-btn" onClick={() => navigate("register")} style={{
            padding: "8px 20px", borderRadius: 8, fontWeight: 700, fontSize: 14,
            background: C.grad, border: "none", color: "white", cursor: "pointer",
          }}>Sign Up Free</button>
        </div>
      </nav>

      {/* ════════ HERO ══════════════════════════════════════════════ */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", overflow: "hidden" }}>

        {/* Animated blobs */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 520, height: 520, borderRadius: "50%", background: "rgba(124,58,237,0.13)", filter: "blur(80px)", top: "5%", left: "10%", animation: "blob 12s ease-in-out infinite" }}/>
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(79,70,229,0.10)", filter: "blur(70px)", top: "30%", right: "8%", animation: "blob 16s ease-in-out infinite reverse" }}/>
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(59,130,246,0.08)", filter: "blur(60px)", bottom: "10%", left: "35%", animation: "blob 10s ease-in-out infinite 2s" }}/>
          {/* Grid overlay */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px" }}/>
          {/* Vignette */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,transparent 40%,#080B10 85%)" }}/>
        </div>

        <div style={{ position: "relative", maxWidth: 780, animation: "fadeUp .8s ease both" }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 28, animation: "fadeUp .6s ease both" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", animation: "pulse 2s ease infinite" }}/>
            AI-Powered Opportunity Tracker
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: "clamp(2.2rem,5.5vw,3.8rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: 22, animation: "fadeUp .8s ease .1s both" }}>
            Find Your Next{" "}
            <span style={{ background: "linear-gradient(135deg,#a78bfa,#60a5fa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundSize: "200%", animation: "gradShift 4s ease infinite" }}>
              Opportunity
            </span>
            <br />Powered by AI
          </h1>

          <p style={{ fontSize: 18, color: C.muted, maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7, animation: "fadeUp .8s ease .2s both" }}>
            OpportuBot searches <strong style={{ color: C.text }}>60+ sources</strong> for scholarships, jobs, internships,
            and more — then scores every result against your CV so you apply smarter.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", animation: "fadeUp .8s ease .3s both" }}>
            <button className="cta-btn" onClick={() => navigate("register")} style={{
              padding: "14px 32px", borderRadius: 10, fontWeight: 800, fontSize: 16,
              background: C.grad, border: "none", color: "white", cursor: "pointer",
              boxShadow: "0 4px 24px rgba(124,58,237,.4)", animation: "glow 3s ease infinite 1s",
            }}>🚀 Get Started Free</button>
            <button className="nav-btn" onClick={() => navigate("login")} style={{
              padding: "14px 32px", borderRadius: 10, fontWeight: 700, fontSize: 16,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              color: C.text, cursor: "pointer",
            }}>Login to Dashboard →</button>
          </div>

          {/* Social proof */}
          <div style={{ marginTop: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, color: C.dim, animation: "fadeIn 1s ease .5s both" }}>
            <div style={{ display: "flex" }}>
              {["🇮🇶","🇯🇴","🇪🇬","🇸🇦","🇩🇪"].map((f,i) => (
                <span key={i} style={{ fontSize: 20, marginLeft: i ? -6 : 0, filter: "drop-shadow(0 1px 2px rgba(0,0,0,.5))" }}>{f}</span>
              ))}
            </div>
            <span>Trusted by students & professionals worldwide</span>
          </div>
        </div>
      </section>

      {/* ════════ STATS ═════════════════════════════════════════════ */}
      <section ref={r1} className="reveal" style={{ padding: "48px 24px", borderTop: "1px solid " + C.border, borderBottom: "1px solid " + C.border, background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 24, textAlign: "center" }}>
          {[
            { value: "60", suffix: "+", label: "Search Sources" },
            { value: "6",  suffix: "",  label: "Opportunity Types" },
            { value: "100",suffix: "%", label: "AI-Powered Scoring" },
            { value: "∞",  suffix: "",  label: "Opportunities Found" },
          ].map(s => (
            <div key={s.label}>
              <div className="stat-num" style={{ fontSize: 42, fontWeight: 900, lineHeight: 1 }}>
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ HOW IT WORKS ══════════════════════════════════════ */}
      <section style={{ padding: "96px 24px", textAlign: "center" }}>
        <div ref={r2} className="reveal">
          <div style={{ fontSize: 12, fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>How It Works</div>
          <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, marginBottom: 12 }}>Three steps to your next opportunity</h2>
          <p style={{ color: C.muted, fontSize: 16, marginBottom: 56 }}>Simple, fast, and powered by AI</p>
        </div>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 24 }}>
          {STEPS.map((step, i) => (
            <div key={i} className="reveal step-card" style={{
              background: C.card, border: "1px solid " + C.border, borderRadius: 18,
              padding: "36px 28px", textAlign: "left", position: "relative",
            }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: "rgba(139,92,246,0.2)", position: "absolute", top: 16, right: 20, lineHeight: 1, fontFamily: "monospace" }}>{step.num}</div>
              <div style={{ fontSize: 38, marginBottom: 16 }}>{step.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: C.text }}>{step.title}</h3>
              <p style={{ color: C.muted, lineHeight: 1.65, fontSize: 14, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ FEATURES ══════════════════════════════════════════ */}
      <section style={{ padding: "96px 24px", background: "rgba(255,255,255,0.01)", borderTop: "1px solid " + C.border }}>
        <div ref={r6} className="reveal" style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.cyan, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Features</div>
          <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, marginBottom: 12 }}>Everything You Need to Land Opportunities</h2>
          <p style={{ color: C.muted, fontSize: 16 }}>From search to signed offer — OpportuBot has you covered</p>
        </div>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 18 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="feat-card" style={{
              background: C.card, border: "1px solid " + C.border, borderRadius: 16,
              padding: "28px 22px", cursor: "default",
            }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: C.text }}>{f.title}</h3>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ TESTIMONIALS ══════════════════════════════════════ */}
      <section style={{ padding: "96px 24px", textAlign: "center" }}>
        <div ref={r7} className="reveal" style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Testimonials</div>
          <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, marginBottom: 12 }}>What Users Are Saying</h2>
          <p style={{ color: C.muted, fontSize: 16 }}>Real results from real people</p>
        </div>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 22 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="testimonial-card" style={{
              background: C.card, border: "1px solid " + C.border,
              borderRadius: 16, padding: "28px 24px", textAlign: "left",
              borderTop: "2px solid rgba(139,92,246,0.25)",
            }}>
              <div style={{ fontSize: 32, color: C.purple, marginBottom: 14, lineHeight: 1 }}>"</div>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: "#cbd5e1", marginBottom: 20 }}>{t.text}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{t.flag}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ PRICING ═══════════════════════════════════════════ */}
      <section style={{ padding: "96px 24px", background: "rgba(255,255,255,0.01)", borderTop: "1px solid " + C.border, textAlign: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.amber, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Pricing</div>
        <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, marginBottom: 12 }}>Simple, Transparent Pricing</h2>
        <p style={{ color: C.muted, fontSize: 16, marginBottom: 56 }}>Start free. Upgrade when you're ready.</p>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 22, alignItems: "center" }}>
          {PLANS.map((plan, i) => (
            <div key={i} className="plan-card" style={{
              background: plan.highlight ? "linear-gradient(145deg,rgba(124,58,237,0.15),rgba(79,70,229,0.1))" : C.card,
              border: plan.highlight ? "1px solid rgba(139,92,246,0.4)" : "1px solid " + C.border,
              borderRadius: 20, padding: "36px 28px", position: "relative",
              boxShadow: plan.highlight ? "0 8px 40px rgba(124,58,237,0.2)" : "none",
              transform: plan.highlight ? "scale(1.03)" : "none",
            }}>
              {plan.highlight && (
                <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: C.grad, color: "white", padding: "4px 18px", borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: 1, whiteSpace: "nowrap" }}>MOST POPULAR</div>
              )}
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: C.text }}>{plan.name}</h3>
              <div style={{ marginBottom: 28 }}>
                <span style={{ fontSize: 48, fontWeight: 900, background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: C.muted }}>/month</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", textAlign: "left" }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ padding: "7px 0", fontSize: 14, display: "flex", gap: 10, alignItems: "flex-start", borderBottom: j < plan.features.length-1 ? "1px solid "+C.border : "none" }}>
                    <span style={{ color: C.green, fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span style={{ color: C.muted }}>{f}</span>
                  </li>
                ))}
              </ul>
              <button className="cta-btn" onClick={() => navigate("register")} style={{
                width: "100%", padding: "13px", borderRadius: 10, fontWeight: 700, fontSize: 15,
                background: plan.highlight ? C.grad : "rgba(255,255,255,0.06)",
                border: plan.highlight ? "none" : "1px solid " + C.border,
                color: C.text, cursor: "pointer",
              }}>{plan.cta}</button>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 24, color: C.dim, fontSize: 13 }}>Have a gift code? Redeem it after signing up for instant Pro access.</p>
      </section>

      {/* ════════ FAQ ═══════════════════════════════════════════════ */}
      <section style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, marginBottom: 12 }}>Frequently Asked Questions</h2>
            <p style={{ color: C.muted, fontSize: 16 }}>Everything you need to know</p>
          </div>
          {FAQS.map((item, i) => (
            <div key={i} className="faq-item" style={{
              borderBottom: "1px solid " + C.border, cursor: "pointer", borderRadius: 10,
              padding: "20px 16px", marginBottom: 4,
            }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <h3 style={{ fontWeight: 600, fontSize: 15, margin: 0, color: C.text }}>{item.q}</h3>
                <span style={{ fontSize: 22, color: C.purple, flexShrink: 0, transition: "transform .2s", transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
              </div>
              {openFaq === i && (
                <p style={{ margin: "12px 0 0", color: C.muted, lineHeight: 1.7, fontSize: 14, animation: "fadeUp .3s ease" }}>{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ════════ FINAL CTA ═════════════════════════════════════════ */}
      <section style={{ position: "relative", padding: "96px 24px", textAlign: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "rgba(124,58,237,0.1)", filter: "blur(100px)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}/>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize: "32px 32px" }}/>
        </div>
        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 900, marginBottom: 16, lineHeight: 1.2 }}>
            Ready to Find Your Next<br/>
            <span style={{ background: "linear-gradient(135deg,#a78bfa,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Opportunity?</span>
          </h2>
          <p style={{ fontSize: 17, color: C.muted, maxWidth: 460, margin: "0 auto 40px", lineHeight: 1.65 }}>
            Join thousands of job seekers and scholars using AI to get ahead. Free to start — no credit card required.
          </p>
          <button className="cta-btn" onClick={() => navigate("register")} style={{
            padding: "16px 48px", borderRadius: 12, fontWeight: 800, fontSize: 18,
            background: C.grad, border: "none", color: "white", cursor: "pointer",
            boxShadow: "0 8px 30px rgba(124,58,237,.5)",
          }}>Create Free Account</button>
        </div>
      </section>

      {/* ════════ FOOTER ════════════════════════════════════════════ */}
      <footer style={{ borderTop: "1px solid " + C.border, padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span>🤖</span>
          <span style={{ background: "linear-gradient(135deg,#60a5fa,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>OpportuBot</span>
        </div>
        <p style={{ fontSize: 13, color: C.dim, marginBottom: 16 }}>AI-powered opportunity tracking for scholarships, jobs, internships, and more.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, fontSize: 13, flexWrap: "wrap", marginBottom: 20 }}>
          <span style={{ cursor: "pointer", color: C.muted }} onClick={() => navigate("register")}>Sign Up</span>
          <span style={{ cursor: "pointer", color: C.muted }} onClick={() => navigate("login")}>Login</span>
          <a href="mailto:support@opportubot.com" style={{ color: C.muted, textDecoration: "none" }}>Contact</a>
        </div>
        <p style={{ fontSize: 12, color: C.dim, margin: 0 }}>© {new Date().getFullYear()} OpportuBot. All rights reserved.</p>
      </footer>
    </div>
  )
}
