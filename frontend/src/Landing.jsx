import { useState } from "react"

const C = {
  dark: "#1A237E", blue: "#1565C0", green: "#2E7D32",
  orange: "#E65100", gray: "#F8F9FA", text: "#1a1a2e",
  light: "#E8EAF6", accent: "#FF6F00",
}

const FEATURES = [
  { icon: "🔍", title: "AI-Powered Search",      desc: "Searches 60+ sources worldwide — scholarships, jobs, internships, conferences, training, and volunteering." },
  { icon: "🧠", title: "Smart Match Score",       desc: "Claude AI reads your CV and scores every opportunity 0–100% based on how well it fits your profile." },
  { icon: "📄", title: "Cover Letter AI",         desc: "Generates a customized, professional cover letter for each opportunity in seconds — in English or Arabic." },
  { icon: "🎤", title: "Interview Prep AI",       desc: "Get tailored mock interview questions and expert answer tips for each specific opportunity." },
  { icon: "📊", title: "Kanban Tracker",          desc: "Track your applications visually: New → Applied → Interview → Offer — all in one dashboard." },
  { icon: "⏰", title: "Deadline Alerts",         desc: "Smart countdown badges warn you when deadlines are close. Never miss a promising opportunity again." },
  { icon: "📧", title: "Daily Digest Email",      desc: "Receive a curated daily email with your top opportunities, sorted by match score." },
  { icon: "🌍", title: "Arabic & English UI",    desc: "Full Arabic RTL support built in. Switch between Arabic and English with one click." },
]

const STEPS = [
  { num: "1", icon: "📄", title: "Upload Your CV",          desc: "Upload your resume and let our AI extract your skills, experience, and goals automatically." },
  { num: "2", icon: "🚀", title: "Run the AI Pipeline",     desc: "Hit 'Run Pipeline' — OpportuBot searches the web, finds opportunities, and scores them for you." },
  { num: "3", icon: "🎯", title: "Apply with Confidence",   desc: "Review your personalized matches, generate cover letters, and prep for interviews — all in one place." },
]

const TESTIMONIALS = [
  { name: "Ahmed K.", role: "Software Engineer",      flag: "🇮🇶", text: "Got 3 interview calls in the first week. The AI match score saved me hours of manual searching." },
  { name: "Sara M.",  role: "PhD Scholarship Seeker", flag: "🇯🇴", text: "Found a fully-funded scholarship I never would have discovered on my own. The cover letter generator is amazing." },
  { name: "Omar T.",  role: "Recent Graduate",         flag: "🇪🇬", text: "The interview prep feature helped me nail my first professional interview. Highly recommend!" },
]

const FAQS = [
  { q: "How does the AI matching work?",            a: "Our AI reads your CV and profile, then scores each opportunity 0–100% based on skill match, experience level, and your preferences." },
  { q: "Is my CV data private?",                    a: "Yes. Your CV is stored securely and only used to personalize your opportunity matches. We never share it with third parties." },
  { q: "What types of opportunities are covered?",  a: "Jobs, scholarships, internships, conferences, training programs, and volunteering — across all industries and countries." },
  { q: "Can I use it in Arabic?",                   a: "Yes! OpportuBot has full Arabic RTL support. Switch between Arabic and English with one click from your dashboard." },
  { q: "What's the difference between Free and Pro?", a: "Free gives you 5 pipeline runs/day and core features. Pro unlocks unlimited runs, priority AI scoring, and advanced analytics." },
]

const STATS = [
  { value: "60+",  label: "Search Sources" },
  { value: "6",    label: "Opportunity Types" },
  { value: "100%", label: "AI-Powered Scoring" },
  { value: "∞",    label: "Opportunities Found" },
]

const PLANS = [
  {
    name: "Free", price: "$0", period: "/month", highlight: false,
    features: ["5 pipeline runs/day", "AI match scoring", "Cover letter generator", "Interview prep", "Kanban tracker", "Up to 20 saved opportunities"],
    cta: "Get Started Free",
  },
  {
    name: "Pro", price: "$9", period: "/month", highlight: true,
    features: ["Unlimited pipeline runs", "Priority AI scoring", "Advanced analytics", "Daily digest emails", "High-match alerts", "Unlimited saved opportunities"],
    cta: "Upgrade to Pro",
  },
]

export default function Landing({ navigate }) {
  const [openFaq, setOpenFaq] = useState(null)

  const btn = (label, onClick, primary = true) => (
    <button onClick={onClick} style={{
      padding: "13px 32px", borderRadius: 8, fontWeight: 700, fontSize: 16,
      cursor: "pointer", border: primary ? "none" : "2px solid white",
      background: primary ? C.accent : "transparent",
      color: "white", transition: "opacity .2s",
    }}
      onMouseOver={e => e.currentTarget.style.opacity = ".85"}
      onMouseOut={e => e.currentTarget.style.opacity = "1"}
    >{label}</button>
  )

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", color: C.text, margin: 0 }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        background: C.dark, color: "white", display: "flex",
        justifyContent: "space-between", alignItems: "center",
        padding: "16px 40px", position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 12px rgba(0,0,0,.3)",
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>🤖 OpportuBot</div>
        <div style={{ display: "flex", gap: 12 }}>
          {btn("Login",    () => navigate("login"),    false)}
          {btn("Sign Up",  () => navigate("register"), true)}
        </div>
      </nav>


      {/* ── HERO ── */}
      <section style={{
        background: `linear-gradient(135deg, ${C.dark} 0%, ${C.blue} 100%)`,
        color: "white", textAlign: "center", padding: "90px 24px 80px",
      }}>
        <div style={{
          display: "inline-block", background: "rgba(255,255,255,.12)",
          borderRadius: 20, padding: "6px 18px", fontSize: 13, fontWeight: 600,
          marginBottom: 24, letterSpacing: 1, textTransform: "uppercase",
        }}>AI-Powered Opportunity Tracker</div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.4rem)", fontWeight: 900, margin: "0 0 20px", lineHeight: 1.15 }}>
          Find Your Next Opportunity<br />
          <span style={{ color: "#FFD54F" }}>Powered by AI</span>
        </h1>
        <p style={{ fontSize: 18, maxWidth: 600, margin: "0 auto 36px", opacity: .88, lineHeight: 1.7 }}>
          OpportuBot searches 60+ sources for scholarships, jobs, internships, and more —
          then scores every result against your CV so you apply smarter, not harder.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {btn("🚀 Get Started Free", () => navigate("register"), true)}
          {btn("Login to Dashboard", () => navigate("login"), false)}
        </div>
      </section>


      {/* ── STATS BAR ── */}
      <section style={{ background: C.dark, color: "white", padding: "28px 24px" }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12, textAlign: "center",
        }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#FFD54F" }}>{s.value}</div>
              <div style={{ fontSize: 13, opacity: .8, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "72px 24px", background: "#fff", textAlign: "center" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>How It Works</h2>
        <p style={{ color: "#555", marginBottom: 48, fontSize: 17 }}>Three steps to your next big opportunity</p>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 32,
        }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ position: "relative" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", background: C.dark, color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 900, margin: "0 auto 16px",
              }}>{step.num}</div>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{step.icon}</div>
              <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
              <p style={{ color: "#555", lineHeight: 1.6, fontSize: 15 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ── FEATURES ── */}
      <section style={{ padding: "72px 24px", background: C.gray, textAlign: "center" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Everything You Need to Land Opportunities</h2>
        <p style={{ color: "#555", marginBottom: 48, fontSize: 17 }}>From search to signed offer — OpportuBot has you covered</p>
        <div style={{
          maxWidth: 1000, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20,
        }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: "#fff", borderRadius: 14, padding: "28px 22px", textAlign: "left",
              boxShadow: "0 2px 12px rgba(0,0,0,.07)", transition: "transform .2s",
            }}
              onMouseOver={e => e.currentTarget.style.transform = "translateY(-4px)"}
              onMouseOut={e => e.currentTarget.style.transform = "none"}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: C.dark }}>{f.title}</h3>
              <p style={{ color: "#555", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "72px 24px", background: "#fff", textAlign: "center" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>What Users Are Saying</h2>
        <p style={{ color: "#555", marginBottom: 48, fontSize: 17 }}>Real results from real people</p>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24,
        }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              background: C.light, borderRadius: 14, padding: "28px 24px", textAlign: "left",
              borderLeft: `4px solid ${C.dark}`,
            }}>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "#333", marginBottom: 20, fontStyle: "italic" }}>
                "{t.text}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", background: C.dark,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>{t.flag}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: "#666" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ── PRICING ── */}
      <section style={{ padding: "72px 24px", background: C.gray, textAlign: "center" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Simple, Transparent Pricing</h2>
        <p style={{ color: "#555", marginBottom: 48, fontSize: 17 }}>Start free. Upgrade when you're ready.</p>
        <div style={{
          maxWidth: 700, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24,
        }}>
          {PLANS.map((plan, i) => (
            <div key={i} style={{
              background: plan.highlight ? C.dark : "#fff",
              color: plan.highlight ? "white" : C.text,
              borderRadius: 16, padding: "36px 28px",
              boxShadow: plan.highlight ? "0 8px 32px rgba(21,101,192,.35)" : "0 2px 12px rgba(0,0,0,.08)",
              position: "relative", transform: plan.highlight ? "scale(1.04)" : "none",
            }}>
              {plan.highlight && (
                <div style={{
                  position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                  background: C.accent, color: "white", padding: "4px 18px",
                  borderRadius: 20, fontSize: 12, fontWeight: 700,
                }}>MOST POPULAR</div>
              )}
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{plan.name}</h3>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 42, fontWeight: 900 }}>{plan.price}</span>
                <span style={{ fontSize: 15, opacity: .7 }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", textAlign: "left" }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ padding: "6px 0", fontSize: 15, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: plan.highlight ? "#69F0AE" : C.green, fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate("register")} style={{
                width: "100%", padding: "13px", borderRadius: 8, fontWeight: 700, fontSize: 16,
                cursor: "pointer", border: plan.highlight ? "none" : `2px solid ${C.dark}`,
                background: plan.highlight ? C.accent : "transparent",
                color: plan.highlight ? "white" : C.dark,
              }}>{plan.cta}</button>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 28, color: "#666", fontSize: 14 }}>
          Have a gift code? Redeem it after signing up for instant Pro access.
        </p>
      </section>


      {/* ── FAQ ── */}
      <section style={{ padding: "72px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, textAlign: "center" }}>Frequently Asked Questions</h2>
          <p style={{ color: "#555", marginBottom: 48, fontSize: 17, textAlign: "center" }}>Everything you need to know</p>
          {FAQS.map((item, i) => (
            <div key={i} style={{
              borderBottom: "1px solid #eee", padding: "20px 0", cursor: "pointer",
            }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{item.q}</h3>
                <span style={{ fontSize: 20, color: C.blue, flexShrink: 0 }}>{openFaq === i ? "−" : "+"}</span>
              </div>
              {openFaq === i && (
                <p style={{ margin: "12px 0 0", color: "#555", lineHeight: 1.7, fontSize: 15 }}>{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        background: `linear-gradient(135deg, ${C.dark} 0%, ${C.blue} 100%)`,
        color: "white", textAlign: "center", padding: "72px 24px",
      }}>
        <h2 style={{ fontSize: 34, fontWeight: 900, marginBottom: 16 }}>Ready to Find Your Next Opportunity?</h2>
        <p style={{ fontSize: 18, opacity: .88, maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.6 }}>
          Join thousands of job seekers and scholars using AI to get ahead.
          It's free to start — no credit card required.
        </p>
        <button onClick={() => navigate("register")} style={{
          padding: "16px 48px", borderRadius: 8, fontWeight: 800, fontSize: 18,
          cursor: "pointer", border: "none", background: C.accent, color: "white",
        }}>🚀 Create Free Account</button>
      </section>


      {/* ── FOOTER ── */}
      <footer style={{ background: "#111", color: "#aaa", textAlign: "center", padding: "32px 24px" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 12 }}>🤖 OpportuBot</div>
        <p style={{ fontSize: 14, marginBottom: 16 }}>
          AI-powered opportunity tracking for scholarships, jobs, internships, and more.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, fontSize: 14, flexWrap: "wrap", marginBottom: 20 }}>
          <span style={{ cursor: "pointer", color: "#ccc" }} onClick={() => navigate("register")}>Sign Up</span>
          <span style={{ cursor: "pointer", color: "#ccc" }} onClick={() => navigate("login")}>Login</span>
          <a href="mailto:support@opportubot.com" style={{ color: "#ccc", textDecoration: "none" }}>Contact</a>
        </div>
        <p style={{ fontSize: 13, margin: 0 }}>© {new Date().getFullYear()} OpportuBot. All rights reserved.</p>
      </footer>

    </div>
  )
}
