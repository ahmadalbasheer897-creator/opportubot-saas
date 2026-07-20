import { useState, useEffect, useRef } from "react"
import { makeTr } from "./translations"
import Onboarding from "./Onboarding"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

// ─── Theme Palettes ───────────────────────────────────────────────
const PALETTES = {
  dark: {
    bg:"#121214", sidebar:"#18181C", card:"#1E1E22",
    border:"rgba(255,255,255,0.06)", text:"#E6E6E6", muted:"#8E8E93", dim:"#5C5C60",
    blue:"#2F80ED", purple:"#9B51E0", green:"#27AE60", orange:"#F2994A",
    red:"#EB5757", amber:"#F2C94C", cyan:"#56CCF2",
    grad1:"#18181C",
    grad2:"#18181C",
    grad3:"#18181C",
    inputBg:"rgba(255,255,255,0.02)", selectBg:"#18181C", modalBg:"#18181C", isDark:true,
  },
  light: {
    bg:"#f0f4f8", sidebar:"#ffffff", card:"rgba(0,0,0,0.03)",
    border:"rgba(0,0,0,0.09)", text:"#0f172a", muted:"#64748b", dim:"#94a3b8",
    blue:"#2563eb", purple:"#7c3aed", green:"#059669", orange:"#ea580c",
    red:"#dc2626", amber:"#d97706", cyan:"#0891b2",
    grad1:"linear-gradient(135deg,#6d28d9,#4338ca)",
    grad2:"linear-gradient(135deg,#5b21b6,#6d28d9)",
    grad3:"linear-gradient(135deg,#4c1d95,#5b21b6)",
    inputBg:"rgba(0,0,0,0.04)", selectBg:"#f0f4f8", modalBg:"#ffffff", isDark:false,
  },
}
const PLAN_COLORS = { free:"#64748b", pro:"#3b82f6", gift:"#8b5cf6", owner:"#ef4444" }

const OPP_TYPES = ["all","job","scholarship","internship","conference","training","volunteering"]
const STATUSES  = ["all","new","ready","applied","waiting","accepted","rejected","no_reply","restricted"]

const STATUS_DISPLAY = {
  new:"New", ready:"Ready to Apply", applied:"Applied",
  waiting:"Waiting", accepted:"Accepted", rejected:"Rejected",
  no_reply:"No Reply", restricted:"Restricted", archived:"Archived", analyzed:"Ready to Apply"
}
const STATUS_COLORS = {
  new:"#64748b", ready:"#f59e0b", analyzed:"#f59e0b", applied:"#3b82f6",
  waiting:"#8b5cf6", accepted:"#10b981", rejected:"#ef4444",
  no_reply:"#92400e", restricted:"#475569", archived:"#6b7280"
}
const STATUS_BG = {
  new:"rgba(100,116,139,0.15)", ready:"rgba(245,158,11,0.15)", analyzed:"rgba(245,158,11,0.15)",
  applied:"rgba(59,130,246,0.15)", waiting:"rgba(139,92,246,0.15)",
  accepted:"rgba(16,185,129,0.15)", rejected:"rgba(239,68,68,0.15)",
  no_reply:"rgba(146,64,14,0.15)", restricted:"rgba(71,85,105,0.15)"
}

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
  const [clModal,        setClModal]        = useState(null)
  const [ipModal,        setIpModal]        = useState(null)
  const [lang,           setLang]           = useState(() => localStorage.getItem("ob_lang") || "en")
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [viewMode,       setViewMode]       = useState("cards")
  const [noteInputs,     setNoteInputs]     = useState({})
  const [showProfile,    setShowProfile]    = useState(false)
  const [profileEdit,    setProfileEdit]    = useState({})
  const [showSources,    setShowSources]    = useState(false)
  const [sourcesData,    setSourcesData]    = useState(null)
  const [selectedDomains,setSelectedDomains]= useState([])
  const [customSources,  setCustomSources]  = useState([])
  const [customInput,    setCustomInput]    = useState("")
  const [isMobile,       setIsMobile]       = useState(() => typeof window !== "undefined" ? window.innerWidth < 1024 : false)
  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  // ── Theme state ────────────────────────────────────────────────
  const [theme,          setTheme]          = useState(()=>localStorage.getItem("ob_theme")||"dark")
  const [customColors,   setCustomColors]   = useState(()=>{try{return JSON.parse(localStorage.getItem("ob_custom_colors")||"{}")}catch{return {}}})
  const [showThemePicker,setShowThemePicker]= useState(false)
  const [activePage,     setActivePage]     = useState("dashboard")
  const [showAddModal,   setShowAddModal]   = useState(false)
  const [addForm,        setAddForm]        = useState({query:"",type:"job",country:"",limit:10})
  const [addMsg,         setAddMsg]         = useState("")
  const [addLoading,     setAddLoading]     = useState(false)
  const [visitorStats,   setVisitorStats]   = useState(null)
  const [showWidget,     setShowWidget]     = useState(true)
  const [widgetMin,      setWidgetMin]      = useState(false)
  const [activeTab,      setActiveTab]      = useState("all")

  const token   = localStorage.getItem("ob_token")
  const headers = { "Authorization":"Bearer "+token, "Content-Type":"application/json" }

  // ── Compute active palette ────────────────────────────────────
  const sysIsDark = typeof window!=="undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
  const basePalette = theme==="auto" ? PALETTES[sysIsDark?"dark":"light"] : theme==="custom" ? PALETTES.dark : (PALETTES[theme]||PALETTES.dark)
  const C = theme==="custom" ? {
    ...basePalette,
    ...(customColors.bg     ?{bg:customColors.bg}                                  :{}),
    ...(customColors.sidebar?{sidebar:customColors.sidebar}                        :{}),
    ...(customColors.accent ?{blue:customColors.accent,purple:customColors.accent} :{}),
  } : basePalette
  const darkInput  = {padding:"9px 12px",background:C.inputBg,border:"1px solid "+C.border,borderRadius:8,color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",width:"100%"}
  const darkSelect = {...darkInput,background:C.selectBg,cursor:"pointer"}
  const darkBtn    = (bg,fg="white")=>({padding:"9px 16px",background:bg,color:fg,border:"none",borderRadius:8,fontWeight:600,cursor:"pointer",fontSize:13})

  useEffect(() => {
    loadAll()
    const onResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const loadAll = async () => {
    setLoading(true)
    // Record visit (fire & forget — no await)
    fetch(API+"/analytics/visit", {method:"POST", headers}).catch(()=>{})
    try {
      const [s, p, srcs] = await Promise.all([
        fetch(API+"/opportunities/stats",{headers}).then(r=>r.json()),
        fetch(API+"/profile",           {headers}).then(r=>r.json()),
        fetch(API+"/sources",           {headers}).then(r=>r.ok?r.json():null).catch(()=>null),
      ])
      setStats(s)
      setProfile(p && Object.keys(p).length > 0 ? p : null)
      if (srcs) setSourcesData(srcs)
      if (p?.selected_sources) setSelectedDomains(p.selected_sources.split(",").map(d=>d.trim()).filter(Boolean))
      if (p?.custom_sources)   setCustomSources(p.custom_sources.split(",").map(d=>d.trim()).filter(Boolean))
      if (p?.onboarding_done === false && !localStorage.getItem("ob_onboarding_skipped")) setShowOnboarding(true)
      // Load visitor analytics for owner
      if (p?.plan === "owner" || user?.plan === "owner") {
        fetch(API+"/analytics/stats", {headers}).then(r=>r.json()).then(setVisitorStats).catch(()=>{})
      }
    } catch(e){ console.error("loadAll:",e) }
    await loadOpps()
    setLoading(false)
  }

  const loadOpps = async () => {
    let url = `${API}/opportunities?limit=100&min_score=${minScore}`
    if (filterType   !== "all") url += "&type="+filterType
    if (filterStatus !== "all") url += "&status="+filterStatus
    try { const data = await fetch(url,{headers}).then(r=>r.json()); setOpps(data.opportunities||[]) } catch{}
  }

  useEffect(()=>{ if(!loading) loadOpps() },[filterType,filterStatus,minScore])

  const runPipeline = async () => {
    setPipelineRunning(true); setPipelineMsg("")
    try {
      const res  = await fetch(API+"/pipeline/run",{method:"POST",headers})
      const data = await res.json()
      if (res.ok){ setPipelineMsg(makeTr(lang)("pipelineStarted")); setTimeout(()=>{loadAll();setPipelineMsg("")},5000) }
      else { setPipelineMsg(data.detail||"Failed"); setPipelineRunning(false) }
    } catch { setPipelineMsg(makeTr(lang)("connectionError")); setPipelineRunning(false) }
  }

  const uploadCV = async () => {
    if (!cvFile) return; setUploading(true); setCvMsg("")
    const form = new FormData(); form.append("file",cvFile)
    try {
      const res  = await fetch(API+"/profile/upload-cv",{method:"POST",headers:{"Authorization":"Bearer "+token},body:form})
      const data = await res.json()
      setCvMsg(res.ok ? "CV uploaded! AI analysis in progress (~30s)..." : (data.detail||"Upload failed"))
      if (res.ok){ setCvFile(null); setTimeout(()=>loadAll(),8000) }
    } catch { setCvMsg("Upload failed.") }
    setUploading(false)
  }

  const upgradeToPro = async () => {
    setUpgradeLoading(true); setUpgradeMsg("")
    try {
      const res  = await fetch(API+"/payment/checkout",{method:"POST",headers})
      const data = await res.json()
      if (res.ok && data.checkout_url) window.location.href = data.checkout_url
      else { setUpgradeMsg(data.detail||"Could not start checkout."); setUpgradeLoading(false) }
    } catch { setUpgradeMsg("Connection error."); setUpgradeLoading(false) }
  }

  const redeemGift = async () => {
    if (!giftCode.trim()) return
    const res  = await fetch(API+"/gifts/redeem?code="+encodeURIComponent(giftCode.trim().toUpperCase()),{method:"POST",headers})
    const data = await res.json()
    if (res.ok){ setGiftMsg("Gift activated! Expires: "+(data.expires_at?.split("T")[0]||"")); setGiftCode(""); setTimeout(()=>window.location.reload(),1500) }
    else setGiftMsg(data.detail||"Invalid or expired code")
  }

  const saveNote    = async (id) => { const n=noteInputs[id]??""; await fetch(`${API}/opportunities/${id}/notes?notes=${encodeURIComponent(n)}`,{method:"PATCH",headers}) }
  const deleteOpp   = async (id,e) => { e.stopPropagation(); if(!confirm("Remove?")) return; await fetch(`${API}/opportunities/${id}`,{method:"DELETE",headers}); loadOpps() }
  const exportCSV   = () => { const cols=["title","type","score","status","country","deadline","url","notes"]; const rows=[cols.join(","),...filteredOpps.map(o=>cols.map(c=>`"${String(o[c]||"").replace(/"/g,"'")}"`).join(","))]; const b=new Blob([rows.join("\n")],{type:"text/csv"}); const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download="opportunities.csv"; a.click() }
  const saveProfile = async () => { await fetch(API+"/profile",{method:"PUT",headers,body:JSON.stringify(profileEdit)}); setShowProfile(false); loadAll() }
  const saveSources = async () => { await fetch(API+"/profile",{method:"PUT",headers,body:JSON.stringify({selected_sources:selectedDomains.join(","),custom_sources:customSources.join(",")})}); setShowSources(false) }

  const addCustomSource = () => {
    const raw=customInput.trim(); if(!raw) return
    let domain=raw
    try{ const url=raw.startsWith("http")?raw:"https://"+raw; domain=new URL(url).hostname.replace(/^www\./,"") }
    catch{ domain=raw.replace(/^www\./,"").split("/")[0] }
    if(domain&&!customSources.includes(domain)) setCustomSources(p=>[...p,domain])
    setCustomInput("")
  }

  const toggleDomain = (d) => setSelectedDomains(p=>p.includes(d)?p.filter(x=>x!==d):[...p,d])
  const updateStatus = async (id,status,e) => { e.stopPropagation(); await fetch(`${API}/opportunities/${id}/status?status=${status}`,{method:"PATCH",headers}); loadOpps() }

  const openCoverLetter = async (opp,lng="English") => {
    setClModal({oppId:opp.id,oppTitle:opp.title,text:"",lang:lng,loading:true})
    try{
      const res=await fetch(`${API}/opportunities/${opp.id}/cover-letter?language=${lng}`,{method:"POST",headers})
      const data=await res.json()
      setClModal(p=>({...p,text:res.ok?data.cover_letter:"Error: "+(data.detail||"Failed"),loading:false}))
    }catch{ setClModal(p=>({...p,text:"Connection error.",loading:false})) }
  }

  const openInterviewPrep = async (opp,lng="English") => {
    setIpModal({oppId:opp.id,oppTitle:opp.title,questions:null,lang:lng,loading:true})
    try{
      const res=await fetch(`${API}/opportunities/${opp.id}/interview-prep?language=${lng}`,{method:"POST",headers})
      const data=await res.json()
      if(res.ok) setIpModal(p=>({...p,questions:data.questions,loading:false}))
      else setIpModal(p=>({...p,questions:null,loading:false,error:data.detail||"Failed"}))
    }catch{ setIpModal(p=>({...p,questions:null,loading:false,error:"Connection error"})) }
  }

  if (loading) return (
    <div style={{display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",height:"100vh",background:C.bg}}>
      <div style={{fontSize:52,marginBottom:12}}>🤖</div>
      <div style={{color:C.muted,fontSize:15,fontWeight:500}}>Loading OpportuBot...</div>
    </div>
  )

  const displayName = user?.full_name || user?.email || "User"
  const plan        = user?.plan || "free"
  const t     = makeTr(lang)
  const isAr  = lang === "ar"
  const toggleLang = () => { const n=lang==="en"?"ar":"en"; setLang(n); localStorage.setItem("ob_lang",n) }

  const uniqueCountries = [...new Set(opps.map(o=>o.country).filter(c=>c&&c!=="Not found"&&c.trim()))].sort()

  const filteredOpps = opps.filter(opp => {
    // IQ tab: Iraq-friendly opportunities
    if (activeTab==="iq") {
      const loc=(opp.country||"").toLowerCase()
      if(!loc.includes("iraq")&&!loc.includes("international")&&!loc.includes("global")&&!loc.includes("online")&&loc!=="not found"&&loc!=="") return false
    }
    if (filterCountry !== "all" && opp.country !== filterCountry) return false
    if (searchText.trim()) {
      const q=searchText.toLowerCase()
      if(!(opp.title||"").toLowerCase().includes(q)&&!(opp.summary||"").toLowerCase().includes(q)&&!(opp.country||"").toLowerCase().includes(q)) return false
    }
    if (filterDeadline !== "all") {
      const dl=new Date(opp.deadline); if(isNaN(dl)) return filterDeadline!=="overdue"
      const now=new Date(); const we=new Date(); we.setDate(now.getDate()+7); const me=new Date(); me.setDate(now.getDate()+30)
      if(filterDeadline==="overdue"&&dl>=now)             return false
      if(filterDeadline==="week"  &&(dl<now||dl>we))      return false
      if(filterDeadline==="month" &&(dl<now||dl>me))      return false
    }
    return true
  })

  // ── Type/deadline helpers ─────────────────────────────────────────
  const getTypeInfo = (type) => {
    const m = {
      scholarship: {color:"#34d399",label:isAr?"منحة":"Scholarship",bg:"rgba(52,211,153,0.12)", icon:"🎓"},
      job:         {color:"#818cf8",label:isAr?"وظيفة":"Job",       bg:"rgba(129,140,248,0.12)",icon:"💼"},
      internship:  {color:"#22d3ee",label:isAr?"تدريب":"Internship", bg:"rgba(34,211,238,0.12)",icon:"🔬"},
      conference:  {color:"#c084fc",label:isAr?"مؤتمر":"Conference", bg:"rgba(192,132,252,0.12)",icon:"🎤"},
      training:    {color:"#fbbf24",label:isAr?"دورة":"Training",    bg:"rgba(251,191,36,0.12)", icon:"📚"},
      volunteering:{color:"#f43f5e",label:isAr?"تطوع":"Volunteering",bg:"rgba(244,63,94,0.12)",  icon:"🤝"},
    }
    return m[type?.toLowerCase()] || {color:C.muted,label:type||"Opportunity",bg:"rgba(148,163,184,0.1)",icon:"📌"}
  }

  const getDlInfo = (dl) => {
    if (!dl || dl==="Not found") return null
    const d=new Date(dl); if(isNaN(d)) return {icon:"⏰",text:dl,color:C.amber,urgent:false}
    const days=Math.ceil((d-new Date())/86400000)
    if(days<0)  return {icon:"⛔",text:isAr?"منتهية":"Expired",color:"#f87171",urgent:false}
    if(days===0)return {icon:"⏰",text:isAr?"اليوم!":"Today!",color:C.red,urgent:true}
    if(days<=7) return {icon:"⏰",text:`${days}d left`,color:C.red,urgent:true}
    if(days<=30)return {icon:"⏰",text:`${days}d left`,color:C.orange,urgent:false}
    return       {icon:"⏰",text:`${days}d left`,color:C.muted,urgent:false}
  }

  const scoreColor = (s) => s>=70?C.green:s>=40?C.amber:C.red

  // ── KANBAN renderer ──────────────────────────────────────────────
  const KANBAN_COLS = [
    {key:"new",      label:isAr?"جديد":"New",       color:C.blue},
    {key:"analyzed", label:isAr?"تحليل":"Analyzed", color:C.purple},
    {key:"applied",  label:isAr?"تقديم":"Applied",  color:C.orange},
    {key:"accepted", label:isAr?"مقبول":"Accepted", color:C.green},
    {key:"rejected", label:isAr?"مرفوض":"Rejected", color:C.red},
  ]

  const renderKanban = () => (
    <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:12}}>
      {KANBAN_COLS.map(col=>{
        const cols=filteredOpps.filter(o=>(o.status||"new")===col.key)
        return (
          <div key={col.key} style={{minWidth:220,flex:"0 0 240px",background:C.card,border:"1px solid "+C.border,borderRadius:14,padding:"14px 10px",display:"flex",flexDirection:"column",maxHeight:"70vh"}}>
            <div style={{fontWeight:700,fontSize:12,color:col.color,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:7,height:7,borderRadius:"50%",background:col.color}}/>{col.label}</span>
              <span style={{background:"rgba(255,255,255,0.05)",border:"1px solid "+C.border,borderRadius:20,padding:"1px 8px",fontSize:11,color:C.muted}}>{cols.length}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,overflowY:"auto",flex:1}}>
              {cols.map(opp=>{
                const ti=getTypeInfo(opp.type); const dl=getDlInfo(opp.deadline)
                return (
                  <div key={opp.id} style={{background:C.card,borderRadius:10,padding:"10px",border:"1px solid "+C.border,borderLeft:"3px solid "+ti.color,cursor:"pointer"}}
                    onClick={()=>{setViewMode("list");setExpanded(opp.id)}}>
                    <div style={{fontSize:10,fontWeight:700,color:ti.color,background:ti.bg,padding:"1px 6px",borderRadius:5,display:"inline-block",marginBottom:5,textTransform:"uppercase"}}>{ti.label}</div>
                    <div style={{fontSize:12,fontWeight:600,color:C.text,lineHeight:1.4,marginBottom:6}}>{opp.title?.slice(0,55)}{(opp.title?.length>55)?"…":""}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:11,fontWeight:700,color:scoreColor(opp.score)}}>{opp.score}%</span>
                      {dl&&<span style={{fontSize:10,color:dl.color}}>{dl.icon} {dl.text}</span>}
                    </div>
                  </div>
                )
              })}
              {cols.length===0&&<div style={{fontSize:12,color:C.dim,textAlign:"center",padding:"20px 0",border:"1px dashed rgba(255,255,255,0.03)",borderRadius:10}}>{isAr?"لا توجد فرص":"Empty"}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )

  // ── CARDS renderer ───────────────────────────────────────────────
  const renderCards = () => (
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(300px,1fr))",gap:18}}>
      {filteredOpps.map(opp=>{
        const ti=getTypeInfo(opp.type); const dl=getDlInfo(opp.deadline)
        const sc=opp.score||0; const sc_c=scoreColor(sc)
        const tags=(opp.tags||"").split(",").map(tg=>tg.trim()).filter(Boolean).slice(0,3)
        const isExp=expanded===opp.id
        return (
          <div key={opp.id} className="hover-lift motion-fade-in" style={{
            background:C.sidebar,
            border:"1px solid "+(isExp?"rgba(139,92,246,0.4)":C.border),
            borderRadius:18,overflow:"hidden",cursor:"pointer",
            display:"flex",flexDirection:"column",
            boxShadow:isExp?"0 0 0 1px rgba(139,92,246,0.2),0 8px 32px rgba(0,0,0,0.4)":"0 2px 12px rgba(0,0,0,0.15)",
            gridColumn:isExp?"1 / -1":"auto",
            transition:"border-color 0.2s,box-shadow 0.2s",
          }} onClick={()=>setExpanded(isExp?null:opp.id)}>

            {/* ── Card Header: type icon + match gauge ── */}
            <div style={{background:ti.bg,borderBottom:"1px solid "+C.border,padding:"11px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>{ti.icon||"📌"}</span>
                <span style={{fontSize:11,fontWeight:700,color:ti.color,textTransform:"uppercase",letterSpacing:0.7}}>{ti.label}</span>
              </div>
              {/* Flat Match Badge */}
              <div style={{
                border: "1px solid " + (sc >= 70 ? "rgba(39,174,96,0.3)" : sc >= 40 ? "rgba(242,153,74,0.3)" : "rgba(235,87,87,0.3)"),
                background: sc >= 70 ? "rgba(39,174,96,0.08)" : sc >= 40 ? "rgba(242,153,74,0.08)" : "rgba(235,87,87,0.08)",
                padding: "3px 9px",
                borderRadius: 14,
                fontSize: 11,
                fontWeight: 700,
                color: sc_c
              }}>
                {sc}% {isAr ? "تطابق" : "Match"}
              </div>
            </div>

            {/* ── Card Body ── */}
            <div style={{padding:"14px 16px",flex:1,display:"flex",flexDirection:"column",gap:8}}>
              <h3 style={{margin:0,fontSize:14,fontWeight:700,color:C.text,lineHeight:1.4}}>{opp.title?.slice(0,70)}{(opp.title?.length>70)?"…":""}</h3>
              {opp.source&&<div style={{fontSize:11,color:C.dim}}>🌐 {opp.source}</div>}
              {tags.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{tags.map(tag=><span key={tag} style={{fontSize:10,padding:"2px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid "+C.border,borderRadius:10,color:C.muted}}>{tag}</span>)}</div>}
              {opp.summary&&<p style={{margin:0,fontSize:12,color:C.dim,lineHeight:1.5}}>{isExp?opp.summary:opp.summary.slice(0,90)+(opp.summary.length>90?"…":"")}</p>}

              {/* Expanded section */}
              {isExp&&(
                <div style={{borderTop:"1px solid "+C.border,paddingTop:12,display:"flex",flexDirection:"column",gap:12}} onClick={e=>e.stopPropagation()}>
                  {opp.ai_analysis&&<div style={{background:"rgba(139,92,246,0.05)",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:11,color:"#c084fc",fontWeight:700,marginBottom:4}}>✨ AI Analysis</div><p style={{margin:0,fontSize:12,color:C.text,lineHeight:1.5}}>{opp.ai_analysis}</p></div>}
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {opp.url&&<a href={opp.url} target="_blank" rel="noreferrer" style={{padding:"6px 12px",background:C.blue,color:"white",textDecoration:"none",fontSize:11,borderRadius:6,fontWeight:600}} onClick={e=>e.stopPropagation()}>{t("viewOpp")}</a>}
                    <button style={{padding:"6px 10px",background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.2)",color:"#a78bfa",fontSize:11,borderRadius:6,cursor:"pointer",fontWeight:600}} onClick={()=>openCoverLetter(opp,"English")}>{t("coverLetterEN")}</button>
                    <button style={{padding:"6px 10px",background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.2)",color:"#818cf8",fontSize:11,borderRadius:6,cursor:"pointer",fontWeight:600}} onClick={()=>openCoverLetter(opp,"Arabic")}>{t("coverLetterAR")}</button>
                    <button style={{padding:"6px 10px",background:"rgba(6,182,212,0.1)",border:"1px solid rgba(6,182,212,0.2)",color:C.cyan,fontSize:11,borderRadius:6,cursor:"pointer",fontWeight:600}} onClick={()=>openInterviewPrep(opp,isAr?"Arabic":"English")}>{t("interviewPrep")}</button>
                    <button style={{padding:"6px 10px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",color:"#f87171",fontSize:11,borderRadius:6,cursor:"pointer",fontWeight:600}} onClick={e=>deleteOpp(opp.id,e)}>🗑</button>
                  </div>
                  <div onClick={e=>e.stopPropagation()}>
                    <div style={{fontSize:11,color:C.muted,marginBottom:4}}>📝 {isAr?"ملاحظاتي":"My Notes"}</div>
                    <textarea rows={2} placeholder={isAr?"ملاحظاتك...":"Your notes (auto-saved)..."}
                      value={noteInputs[opp.id]??(opp.notes||"")}
                      onChange={e=>setNoteInputs(n=>({...n,[opp.id]:e.target.value}))}
                      onBlur={()=>saveNote(opp.id)}
                      style={{width:"100%",padding:"8px 10px",background:"rgba(255,255,255,0.02)",border:"1px solid "+C.border,borderRadius:8,color:C.text,fontSize:12,resize:"vertical",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Card Footer ── */}
            <div style={{padding:"10px 14px",borderTop:"1px solid "+C.border,background:C.isDark?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.025)"}} onClick={e=>e.stopPropagation()}>
              {/* Location + deadline row */}
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8,fontSize:10,color:C.dim}}>
                <span>{opp.country&&opp.country!=="Not found"?`📍 ${opp.country}`:"📍 Not found"}</span>
                <span>{dl?`${dl.icon} ${dl.text}`:"⏰ Not found"}</span>
              </div>
              {/* Action buttons */}
              <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                {opp.url&&<a href={opp.url} target="_blank" rel="noreferrer" style={{padding:"5px 11px",background:C.blue,color:"white",textDecoration:"none",fontSize:11,borderRadius:7,fontWeight:700,whiteSpace:"nowrap"}} onClick={e=>e.stopPropagation()}>🔗 Apply</a>}
                <button style={{padding:"5px 11px",background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.25)",color:"#a78bfa",fontSize:11,borderRadius:7,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}} onClick={e=>{e.stopPropagation();openCoverLetter(opp,"English")}}>📝 Copy Letter</button>
                <button style={{padding:"5px 11px",background:"rgba(255,255,255,0.04)",border:"1px solid "+C.border,color:C.text,fontSize:11,borderRadius:7,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}} onClick={e=>{e.stopPropagation();setExpanded(isExp?null:opp.id)}}>👁 View</button>
                <button onClick={e=>deleteOpp(opp.id,e)} style={{marginLeft:"auto",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:7,width:28,height:28,color:"#f87171",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>🗑</button>
              </div>
              {/* Move to dropdown + status badge */}
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{isAr?"انقل إلى:":"Move to:"}</span>
                <select value={opp.status||"new"} onChange={e=>updateStatus(opp.id,e.target.value,e)}
                  style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid "+C.border,borderRadius:7,color:C.text,fontSize:11,padding:"4px 8px",cursor:"pointer",outline:"none"}}>
                  <option value="" style={{background:C.selectBg}}>-- select --</option>
                  {["new","ready","applied","waiting","accepted","rejected","no_reply","restricted"].map(sv=><option key={sv} value={sv} style={{background:C.selectBg}}>{STATUS_DISPLAY[sv]||sv}</option>)}
                </select>
                <span style={{padding:"3px 9px",borderRadius:12,fontSize:10,fontWeight:700,background:STATUS_BG[opp.status||"new"]||"rgba(100,116,139,0.15)",color:STATUS_COLORS[opp.status||"new"]||C.muted,whiteSpace:"nowrap"}}>
                  {STATUS_DISPLAY[opp.status||"new"]||"New"}
                </span>
              </div>
              {/* Inline note */}
              <input placeholder={isAr?"أضف ملاحظة...":"Add a note..."} value={noteInputs[opp.id]??(opp.notes||"")}
                onChange={e=>{e.stopPropagation();setNoteInputs(n=>({...n,[opp.id]:e.target.value}))}}
                onBlur={()=>saveNote(opp.id)}
                onClick={e=>e.stopPropagation()}
                style={{width:"100%",padding:"6px 10px",background:"rgba(255,255,255,0.02)",border:"1px solid "+C.border,borderRadius:7,color:C.text,fontSize:11,outline:"none",boxSizing:"border-box"}}/>
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderList = () => {
    const STATUS_BADGE = {
      new:      {bg:"rgba(100,116,139,0.15)", color:"#94a3b8",  label:"New"},
      analyzed: {bg:"rgba(59,130,246,0.15)",  color:"#60a5fa",  label:"Analyzed"},
      applied:  {bg:"rgba(249,115,22,0.15)",  color:"#fb923c",  label:"Applied"},
      accepted: {bg:"rgba(16,185,129,0.15)",  color:"#34d399",  label:"Accepted ✓"},
      rejected: {bg:"rgba(239,68,68,0.15)",   color:"#f87171",  label:"Rejected"},
      archived: {bg:"rgba(100,116,139,0.1)",  color:"#64748b",  label:"Archived"},
    }
    return (
      <div style={{borderRadius:12,overflow:"hidden",border:"1px solid "+C.border}}>
        {/* Table header */}
        {!isMobile&&(
          <div style={{
            display:"grid",
            gridTemplateColumns: "40px 2.5fr 90px 110px 1.2fr 1.2fr 110px 150px",
            gap:10,
            background:C.card,
            borderBottom:"1px solid "+C.border,
            padding:"10px 16px",
            alignItems: "center"
          }}>
            {[
              "",
              isAr?"الفرصة":"Opportunity",
              isAr?"التطابق":"Match",
              isAr?"الحالة":"Status",
              isAr?"الموقع":"Location",
              isAr?"الراتب/القيمة":"Salary/Amount",
              isAr?"الموعد":"Deadline",
              isAr?"إجراءات":"Actions"
            ].map((h,i)=>(
              <div key={i} style={{fontSize:11,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</div>
            ))}
          </div>
        )}
        {/* Table rows */}
        {filteredOpps.map((opp,idx)=>{
          const ti=getTypeInfo(opp.type); const dl=getDlInfo(opp.deadline)
          const sb=STATUS_BADGE[opp.status||"new"]||STATUS_BADGE.new
          const matchColor = opp.score >= 70 ? C.green : opp.score >= 40 ? C.orange : C.red
          const matchBg = opp.score >= 70 ? "rgba(16,185,129,0.12)" : opp.score >= 40 ? "rgba(249,115,22,0.12)" : "rgba(239,68,68,0.12)"
          const matchBorder = opp.score >= 70 ? "rgba(16,185,129,0.25)" : opp.score >= 40 ? "rgba(249,115,22,0.25)" : "rgba(239,68,68,0.25)"

          if (isMobile) {
            return (
              <div key={opp.id} style={{
                background: expanded===opp.id ? "rgba(255,255,255,0.03)" : C.card,
                borderBottom: "1px solid "+C.border,
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                cursor: "pointer"
              }} onClick={() => setExpanded(expanded===opp.id ? null : opp.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 16 }}>{ti.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {opp.title}
                    </span>
                  </div>
                  <span style={{
                    padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                    background: matchBg, color: matchColor, border: "1px solid " + matchBorder
                  }}>
                    {opp.score}%
                  </span>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: C.muted }}>
                  <span>🌐 {opp.source || (isAr ? "مصدر غير معروف" : "Unknown Source")}</span>
                  {dl && <span style={{ color: dl.color, fontWeight: dl.urgent ? 700 : 400 }}>{dl.icon} {dl.text}</span>}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }} onClick={e => e.stopPropagation()}>
                  <select value={opp.status||"new"} onChange={e=>updateStatus(opp.id,e.target.value,e)}
                    style={{background:sb.bg,border:"none",borderRadius:6,color:sb.color,fontSize:10,padding:"3px 6px",cursor:"pointer",outline:"none",fontWeight:700}}>
                    {["new","ready","applied","waiting","accepted","rejected","no_reply","restricted"].map(s=><option key={s} value={s} style={{background:C.selectBg,color:C.text}}>{STATUS_DISPLAY[s]||s}</option>)}
                  </select>
                  
                  <div style={{ display: "flex", gap: 6 }}>
                    {opp.url && <a href={opp.url} target="_blank" rel="noreferrer" style={{ padding: "4px 8px", background: C.blue, color: "white", textDecoration: "none", fontSize: 11, borderRadius: 6, fontWeight: 700 }}>Apply ↗</a>}
                    <button onClick={() => setExpanded(expanded===opp.id ? null : opp.id)} style={{ padding: "4px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid " + C.border, borderRadius: 6, color: C.text, fontSize: 11, fontWeight: 600 }}>
                      {expanded===opp.id ? (isAr ? "إغلاق" : "Close") : (isAr ? "تفاصيل" : "Details")}
                    </button>
                  </div>
                </div>

                {expanded===opp.id && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }} onClick={e => e.stopPropagation()}>
                    {opp.summary&&<p style={{margin:"0 0 10px",fontSize:12,color:C.text,lineHeight:1.5}}>{opp.summary}</p>}
                    {opp.ai_analysis&&<div style={{background:"rgba(139,92,246,0.05)",border:"1px solid rgba(139,92,246,0.12)",borderRadius:8,padding:"10px",marginBottom:10}}><div style={{fontSize:11,color:"#c084fc",fontWeight:700,marginBottom:2}}>✨ AI Analysis</div><p style={{margin:0,fontSize:12,color:C.text,lineHeight:1.5}}>{opp.ai_analysis}</p></div>}
                    
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                      <button style={{padding:"5px 10px",background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.2)",color:"#a78bfa",fontSize:11,borderRadius:6,fontWeight:600}} onClick={()=>openCoverLetter(opp,"English")}>{t("coverLetterEN")}</button>
                      <button style={{padding:"5px 10px",background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.2)",color:"#818cf8",fontSize:11,borderRadius:6,fontWeight:600}} onClick={()=>openCoverLetter(opp,"Arabic")}>{t("coverLetterAR")}</button>
                      <button style={{padding:"5px 10px",background:"rgba(6,182,212,0.1)",border:"1px solid rgba(6,182,212,0.2)",color:C.cyan,fontSize:11,borderRadius:6,fontWeight:600}} onClick={()=>openInterviewPrep(opp,isAr?"Arabic":"English")}>{t("interviewPrep")}</button>
                      <button onClick={e=>deleteOpp(opp.id,e)} style={{padding:"5px 10px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.15)",color:"#f87171",fontSize:11,borderRadius:6,fontWeight:600}}>🗑 Delete</button>
                    </div>

                    <div>
                      <div style={{fontSize:11,color:C.muted,marginBottom:4}}>📝 {isAr?"ملاحظاتي":"My Notes"}</div>
                      <textarea rows={2} placeholder="Write notes..."
                        value={noteInputs[opp.id] ?? (opp.notes||"")}
                        onChange={e=>setNoteInputs(n=>({...n,[opp.id]:e.target.value}))}
                        onBlur={()=>saveNote(opp.id)}
                        style={{width:"100%",padding:"6px 8px",background:"rgba(255,255,255,0.02)",border:"1px solid "+C.border,borderRadius:8,color:C.text,fontSize:12,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          }

          return (
            <div key={opp.id}>
              <div
                className="motion-fade-in"
                style={{
                  display:"grid",
                  gridTemplateColumns:"40px 2.5fr 90px 110px 1.2fr 1.2fr 110px 150px",
                  gap:10,
                  padding:"12px 16px",
                  background:expanded===opp.id?(C.isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)"):idx%2===0?C.card:"transparent",
                  borderBottom:"1px solid "+C.border,
                  cursor:"pointer",
                  alignItems:"center",
                  transition:"background 0.15s"
                }}
                onClick={()=>setExpanded(expanded===opp.id?null:opp.id)}>
                
                {/* 1. Icon */}
                <div style={{fontSize:18, display:"flex", alignItems:"center", justifyContent:"center"}}>{ti.icon||"📌"}</div>
                
                {/* 2. Title + source */}
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{opp.title||"Untitled"}</div>
                  <div style={{fontSize:11,color:C.dim}}>{opp.source || (isAr ? "مصدر غير معروف" : "Unknown Source")}</div>
                </div>
                
                {/* 3. Match % */}
                <div>
                  <span style={{
                    padding:"4px 10px",
                    borderRadius:12,
                    fontSize:11,
                    fontWeight:700,
                    background: matchBg,
                    color: matchColor,
                    border: "1px solid " + matchBorder,
                    display:"inline-flex",
                    alignItems:"center"
                  }}>{opp.score}%</span>
                </div>
                
                {/* 4. Status badge */}
                <div onClick={e=>e.stopPropagation()}>
                  <select value={opp.status||"new"} onChange={e=>updateStatus(opp.id,e.target.value,e)}
                    style={{background:sb.bg,border:"none",borderRadius:8,color:sb.color,fontSize:11,padding:"4px 7px",cursor:"pointer",outline:"none",fontWeight:700}}>
                    {["new","ready","applied","waiting","accepted","rejected","no_reply","restricted"].map(s=><option key={s} value={s} style={{background:C.selectBg,color:C.text}}>{STATUS_DISPLAY[s]||s}</option>)}
                  </select>
                </div>
                
                {/* 5. Location */}
                <div style={{fontSize:12,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  📍 {opp.country || (isAr ? "عالمي" : "Global")}
                </div>

                {/* 6. Salary/Amount */}
                <div style={{fontSize:12,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  💵 {opp.salary || opp.amount || (isAr ? "غير محدد" : "N/A")}
                </div>

                {/* 7. Deadline */}
                <div style={{
                  fontSize:11,
                  color: dl ? dl.color : C.muted,
                  fontWeight: dl?.urgent ? 700 : 500,
                  background: dl?.urgent ? "rgba(239, 68, 68, 0.1)" : "transparent",
                  padding: dl?.urgent ? "2px 6px" : "0",
                  borderRadius: 6,
                  width: "fit-content"
                }}>
                  {dl?`${dl.icon} ${dl.text}`:isAr?"—":"—"}
                </div>
                
                {/* 8. Actions */}
                <div style={{display:"flex",gap:6,alignItems:"center"}} onClick={e=>e.stopPropagation()}>
                  {opp.url&&<a href={opp.url} target="_blank" rel="noreferrer" style={{padding:"5px 10px",background:C.blue,color:"white",textDecoration:"none",fontSize:11,borderRadius:6,fontWeight:700,whiteSpace:"nowrap"}}>Apply ↗</a>}
                  <button
                    onClick={() => setExpanded(expanded===opp.id ? null : opp.id)}
                    style={{
                      padding:"5px 10px",
                      background:"rgba(255,255,255,0.05)",
                      border: "1px solid " + C.border,
                      borderRadius:6,
                      color:C.text,
                      cursor:"pointer",
                      fontSize:11,
                      fontWeight:600,
                      whiteSpace:"nowrap"
                    }}
                  >
                    {expanded===opp.id ? (isAr ? "إغلاق" : "Close") : (isAr ? "تفاصيل" : "Details")}
                  </button>
                  <button onClick={e=>deleteOpp(opp.id,e)} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:6,width:26,height:26,color:"#f87171",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>🗑</button>
                </div>
              </div>
              
              {/* Expanded details */}
              {expanded===opp.id&&(
                <div style={{padding:"16px 20px 16px 56px",borderBottom:"1px solid "+C.border,background:C.isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.01)"}} onClick={e=>e.stopPropagation()}>
                  {opp.summary&&<p style={{margin:"0 0 12px 0",fontSize:13,color:C.text,lineHeight:1.6}}>{opp.summary}</p>}
                  {opp.ai_analysis&&<div style={{background:"rgba(139,92,246,0.05)",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"12px 14px",marginBottom:14}}><div style={{fontSize:12,color:"#c084fc",fontWeight:700,marginBottom:4}}>✨ AI Analysis</div><p style={{margin:0,fontSize:13,color:C.text,lineHeight:1.5}}>{opp.ai_analysis}</p></div>}
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                    {opp.url&&<a href={opp.url} target="_blank" rel="noreferrer" style={{padding:"6px 12px",background:C.blue,color:"white",textDecoration:"none",fontSize:12,borderRadius:6,fontWeight:600}}>{t("viewOpp")}</a>}
                    <button style={{padding:"6px 12px",background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.2)",color:"#a78bfa",fontSize:12,borderRadius:6,cursor:"pointer",fontWeight:600}} onClick={()=>openCoverLetter(opp,"English")}>{t("coverLetterEN")}</button>
                    <button style={{padding:"6px 12px",background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.2)",color:"#818cf8",fontSize:12,borderRadius:6,cursor:"pointer",fontWeight:600}} onClick={()=>openCoverLetter(opp,"Arabic")}>{t("coverLetterAR")}</button>
                    <button style={{padding:"6px 12px",background:"rgba(6,182,212,0.1)",border:"1px solid rgba(6,182,212,0.2)",color:C.cyan,fontSize:12,borderRadius:6,cursor:"pointer",fontWeight:600}} onClick={()=>openInterviewPrep(opp,isAr?"Arabic":"English")}>{t("interviewPrep")}</button>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:C.muted,marginBottom:4}}>📝 {isAr?"ملاحظاتي":"My Notes"}</div>
                    <textarea rows={2} placeholder={isAr?"اكتب ملاحظاتك...":"Write notes (auto-saved)..."}
                      value={noteInputs[opp.id]??(opp.notes||"")}
                      onChange={e=>setNoteInputs(n=>({...n,[opp.id]:e.target.value}))}
                      onBlur={()=>saveNote(opp.id)}
                      style={{width:"100%",padding:"8px 10px",background:"rgba(255,255,255,0.02)",border:"1px solid "+C.border,borderRadius:8,color:C.text,fontSize:13,resize:"vertical",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ── Profile modal helpers ─────────────────────────────────────────
  const mInp = (label,key,ph,type="text") => (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:4}}>{label}</div>
      <input type={type} placeholder={ph} value={profileEdit[key]||""} onChange={e=>setProfileEdit(p=>({...p,[key]:e.target.value}))} style={darkInput}/>
    </div>
  )
  const mSel = (label,key,opts) => (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:4}}>{label}</div>
      <select value={profileEdit[key]||""} onChange={e=>setProfileEdit(p=>({...p,[key]:e.target.value}))} style={darkSelect}>
        <option value="" style={{background:C.selectBg}}>— Select —</option>
        {opts.map(o=><option key={o} value={o} style={{background:C.selectBg}}>{o}</option>)}
      </select>
    </div>
  )
  const mChips = (label,key,opts) => (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:6}}>{label}</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {opts.map(o=>{const on=profileEdit[key]===o;return(
          <div key={o} onClick={()=>setProfileEdit(p=>({...p,[key]:o}))} style={{padding:"4px 12px",borderRadius:14,fontSize:12,cursor:"pointer",border:"1px solid "+(on?C.blue:C.border),background:on?"rgba(59,130,246,0.15)":C.card,color:on?C.blue:"#cbd5e1",fontWeight:on?700:400}}>{o}</div>
        )})}
      </div>
    </div>
  )
  const mSection = (icon,title) => (
    <div style={{fontSize:12,fontWeight:800,color:C.text,borderBottom:"1px solid "+C.border,paddingBottom:6,marginBottom:14,marginTop:16,display:"flex",alignItems:"center",gap:6}}>{icon} {title}</div>
  )

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div style={{fontFamily:"Inter,system-ui,-apple-system,sans-serif",minHeight:"100vh",background:C.bg,color:C.text,display:"flex",flexDirection:isAr?"row-reverse":"row",direction:isAr?"rtl":"ltr"}}>
      
      {/* ── Custom Animations (Handcrafted Motions) ── */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .motion-fade-in {
          animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .hover-lift {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s, box-shadow 0.2s !important;
        }
        .hover-lift:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 6px 20px rgba(0,0,0,0.2) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
        }

        /* Logo animations */
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        @keyframes sparklePulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.25);
            opacity: 1;
          }
        }
        .logo-icon-wrap svg {
          animation: float 2.5s ease-in-out infinite;
        }
        .plane-group, .robot-group {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .logo-container:hover .plane-group {
          transform: translate(2px, -3px) rotate(1deg);
        }
        .logo-container:hover .robot-group {
          transform: translate(1px, -2px) rotate(-1deg);
        }
        .sparkle-group {
          transform-origin: 82px 29px;
          animation: sparklePulse 1.8s ease-in-out infinite;
        }
      `}} />

      {/* ── Onboarding ──────────────────────────────────────── */}
      {showOnboarding&&<Onboarding onComplete={()=>{setShowOnboarding(false);localStorage.setItem("ob_onboarding_skipped","1");loadAll()}}/>}

      {/* ── Mobile overlay ──────────────────────────────────── */}
      {isMobile&&sidebarOpen&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",zIndex:1000}} onClick={()=>setSidebarOpen(false)}/>}

      {/* ════════════════════════ SIDEBAR ════════════════════════ */}
      <div style={{
        width:270,background:C.sidebar,borderRight:isAr?"none":"1px solid "+C.border,borderLeft:isAr?"1px solid "+C.border:"none",
        display:"flex",flexDirection:"column",padding:"24px 20px",boxSizing:"border-box",flexShrink:0,zIndex:1001,
        ...(isMobile?{position:"fixed",top:0,bottom:0,left:isAr?"auto":0,right:isAr?0:"auto",transform:sidebarOpen?"translateX(0)":(isAr?"translateX(100%)":"translateX(-100%)"),transition:"transform 0.3s cubic-bezier(0.4,0,0.2,1)",boxShadow:"0 10px 30px rgba(0,0,0,0.5)"}:{}),
      }}>
        {/* Animated Origami Logo */}
        <div 
          className="logo-container"
          style={{display:"flex",alignItems:"center",gap:10,marginBottom:24,cursor:"pointer",direction:"ltr"}}
          onClick={() => navigate("dashboard")}
        >
          <img
            src="/logo.png"
            alt="OpportuBot"
            style={{width:38,height:38,objectFit:"contain",animation:"float 3s ease-in-out infinite"}}
          />
          <span style={{fontSize:16,fontWeight:800,color:C.text,letterSpacing:"-0.3px"}}>OpportuBot</span>
        </div>

        {/* User widget */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:C.card,borderRadius:12,border:"1px solid "+C.border,marginBottom:24}}>
          <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,flexShrink:0}}>{displayName.charAt(0).toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayName}</div>
            <span style={{padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:700,background:PLAN_COLORS[plan]||C.blue,color:"white"}}>{plan.toUpperCase()}</span>
          </div>
        </div>

        {/* Nav links */}
        <div style={{display:"flex",flexDirection:"column",gap:2,marginBottom:8}}>
          {[
            {icon:"🏠", label:isAr?"الرئيسية":"Dashboard",              key:"dashboard"},
            {icon:"📋", label:isAr?"طلباتي":"My Applications",           key:"applications"},
            {icon:"🔍", label:isAr?"بحث الفرص":"Search Opportunities",   key:"search"},
            {icon:"👤", label:isAr?"الملف الشخصي":"My Profile",          key:"profile"},
            {icon:"📅", label:isAr?"التقويم":"Calendar",                 key:"calendar", soon:true},
            {icon:"✉️", label:isAr?"الرسائل":"Messages",                 key:"messages", soon:true},
            {icon:"❓", label:isAr?"المساعدة":"Help Center",             key:"help",     soon:true},
            ...(plan==="owner"?[
              {icon:"📊",label:isAr?"إحصاءات الزوار":"Visitor Analytics",key:"analytics"},
              {icon:"⚙️",label:t("adminPanel"),key:"admin"},
            ]:[]),
          ].map(item=>{
            const isActive = activePage===item.key
            const handleNavClick = () => {
              if(item.soon) return
              setSidebarOpen(false)
              if(item.key==="profile"){
                setProfileEdit({name:profile?.name||"",phone:profile?.phone||"",nationality:profile?.nationality||"",country_of_residence:profile?.country_of_residence||"",date_of_birth:profile?.date_of_birth||"",gender:profile?.gender||"",linkedin_url:profile?.linkedin_url||"",portfolio_url:profile?.portfolio_url||"",education_level:profile?.education_level||"",field_of_study:profile?.field_of_study||"",university:profile?.university||"",gpa:profile?.gpa||"",graduation_year:profile?.graduation_year||"",current_occupation:profile?.current_occupation||"",skills:profile?.skills||"",experience_level:profile?.experience_level||"",languages:profile?.languages||"",career_goals:profile?.career_goals||"",preferred_countries:profile?.preferred_countries||"",preferred_types:profile?.preferred_types||""})
                setShowProfile(true); return
              }
              if(item.key==="search"){ setShowSources(true); return }
              if(item.key==="analytics"){ setActivePage("analytics"); return }
              if(item.key==="admin"){ navigate("admin"); return }
              if(item.key==="applications"){ setFilterStatus("applied"); setActivePage("applications"); return }
              if(item.key==="dashboard"){ setFilterStatus("all"); setActivePage("dashboard"); return }
              setActivePage(item.key)
            }
            return (
              <button key={item.key} onClick={handleNavClick} style={{
                display:"flex",alignItems:"center",gap:10,padding:"9px 12px",
                background:isActive?"rgba(59,130,246,0.1)":"transparent",
                color:isActive?C.blue:C.muted,
                border:"none",borderRadius:10,fontSize:13,
                fontWeight:isActive?700:500,cursor:item.soon?"default":"pointer",
                textAlign:isAr?"right":"left",width:"100%",
                opacity:item.soon?0.5:1,position:"relative",
                transition:"background 0.15s,color 0.15s",
              }}>
                {isActive&&<div style={{position:"absolute",left:isAr?"auto":0,right:isAr?0:"auto",top:"50%",transform:"translateY(-50%)",width:3,height:20,background:C.blue,borderRadius:"0 2px 2px 0"}}/>}
                <span style={{fontSize:15,width:22,textAlign:"center",flexShrink:0}}>{item.icon}</span>
                <span style={{flex:1}}>{item.label}</span>
                {item.soon&&<span style={{fontSize:9,padding:"2px 5px",borderRadius:6,background:"rgba(99,102,241,0.15)",color:"#818cf8",fontWeight:700}}>Soon</span>}
              </button>
            )
          })}
        </div>
        <div style={{borderTop:"1px solid "+C.border,margin:"4px 0 12px"}}/>


        {/* Sidebar widgets */}
        <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>
          {/* Pipeline */}
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"14px"}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>🚀 {t("findOpps")}</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:10,lineHeight:1.4}}>{plan==="free"?t("freePlanNote"):t("proPlanNote")}</div>
            <button style={{padding:"8px",background:pipelineRunning?"rgba(255,255,255,0.1)":"linear-gradient(135deg,#3b82f6,#8b5cf6)",color:"white",border:"none",borderRadius:8,fontWeight:600,cursor:pipelineRunning?"default":"pointer",fontSize:12,width:"100%"}} onClick={runPipeline} disabled={pipelineRunning}>
              {pipelineRunning?t("pipelineRunning"):t("runPipeline")}
            </button>
            {pipelineMsg&&<div style={{fontSize:11,marginTop:8,padding:"6px 8px",borderRadius:6,background:pipelineMsg.includes("started")||pipelineMsg.includes("بدأ")?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)",color:pipelineMsg.includes("started")||pipelineMsg.includes("بدأ")?C.green:C.red,border:"1px solid "+(pipelineMsg.includes("started")||pipelineMsg.includes("بدأ")?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)")}}>{pipelineMsg}</div>}
          </div>

          {/* CV hint */}
          {!profile?.cv_filename&&(
            <div style={{background:"rgba(245,158,11,0.03)",border:"1px dashed rgba(245,158,11,0.3)",borderRadius:12,padding:"12px"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#fbbf24",marginBottom:4}}>📄 {isAr?"ارفع سيرتك":"Upload Your CV"}</div>
              <div style={{fontSize:11,color:C.muted,marginBottom:8,lineHeight:1.4}}>{isAr?"ارفع سيرة ذاتية لتفعيل المطابقة الذكية":"Upload CV in Profile for AI matching"}</div>
              <button style={{padding:"7px",background:"#fbbf24",color:"#080B10",border:"none",borderRadius:7,fontWeight:700,cursor:"pointer",fontSize:11,width:"100%"}} onClick={()=>{setProfileEdit({name:profile?.name||""});setShowProfile(true);setSidebarOpen(false)}}>
                {isAr?"افتح الملف ←":"Open Profile →"}
              </button>
            </div>
          )}

          {/* Upgrade */}
          {plan==="free"&&(
            <div style={{background:"linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.08))",border:"1px solid rgba(139,92,246,0.2)",borderRadius:12,padding:"12px"}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>⚡ {t("upgradePro")}</div>
              <div style={{fontSize:11,color:C.muted,marginBottom:10,lineHeight:1.4}}>{t("upgradeDesc")}</div>
              <button style={{padding:"8px",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",color:"white",border:"none",borderRadius:8,fontWeight:700,cursor:upgradeLoading?"default":"pointer",fontSize:12,width:"100%"}} onClick={upgradeToPro} disabled={upgradeLoading}>
                {upgradeLoading?t("redirecting"):t("upgradeBtn")}
              </button>
              {upgradeMsg&&<div style={{fontSize:11,marginTop:6,color:C.red}}>{upgradeMsg}</div>}
            </div>
          )}

          {/* Gift code */}
          {plan==="free"&&(
            <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"12px"}}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:4}}>🎁 {t("redeemGift")}</div>
              <div style={{fontSize:11,color:C.muted,marginBottom:8}}>{t("redeemDesc")}</div>
              <div style={{display:"flex",gap:6}}>
                <input style={{...darkInput,fontSize:11,padding:"6px 10px"}} placeholder="OB-XXXXXXXX" value={giftCode} onChange={e=>{setGiftCode(e.target.value.toUpperCase());setGiftMsg("")}}/>
                <button style={{padding:"6px 10px",background:C.purple,color:"white",border:"none",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer"}} onClick={redeemGift}>{t("redeemBtn")}</button>
              </div>
              {giftMsg&&<div style={{fontSize:10,marginTop:6,color:giftMsg.includes("activated")||giftMsg.includes("فُعِّلت")?C.green:C.red}}>{giftMsg}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{marginTop:"auto",display:"flex",flexDirection:"column",gap:6,paddingTop:14,borderTop:"1px solid "+C.border}}>
          {/* Theme picker */}
          <button onClick={()=>setShowThemePicker(true)} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:C.card,border:"1px solid "+C.border,borderRadius:8,color:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",width:"100%"}}>
            <span>{theme==="dark"?"🌙":theme==="light"?"☀️":theme==="auto"?"🖥️":"🎨"}</span>
            <span style={{flex:1,textAlign:"left"}}>{theme==="dark"?"Dark Mode":theme==="light"?"Light Mode":theme==="auto"?"Auto (System)":"Custom"}</span>
            <span style={{fontSize:10,color:C.dim}}>▸</span>
          </button>
          {!isMobile&&<button style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"7px 12px",background:C.card,border:"1px solid "+C.border,borderRadius:8,color:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",width:"100%"}} onClick={toggleLang}>🌐 {isAr?"English":"عربي"}</button>}
          <button style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"7px 12px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:8,color:"#f87171",fontSize:12,fontWeight:600,cursor:"pointer",width:"100%"}} onClick={logout}>🚪 {t("logout")}</button>
        </div>
      </div>

      {/* ════════════════════════ MAIN CONTENT ════════════════════ */}
      <div style={{flex:1,padding:isMobile?"16px":"32px 36px",boxSizing:"border-box",overflowY:"auto",minHeight:"100vh",display:"flex",flexDirection:"column"}}>

        {/* Mobile top bar */}
        {isMobile&&(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.sidebar,padding:"12px 16px",borderRadius:12,border:"1px solid "+C.border,marginBottom:20}}>
            <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",color:C.text,fontSize:22,cursor:"pointer"}}>☰</button>
            <div className="logo-container" style={{fontSize:15,fontWeight:800,display:"flex",alignItems:"center",gap:6,color:C.text,direction:"ltr"}}>
              <img src="/logo.png" alt="OpportuBot" style={{width:30,height:30,objectFit:"contain",animation:"float 3s ease-in-out infinite"}}/>
              <span>OpportuBot</span>
            </div>
            <button style={{background:C.card,border:"1px solid "+C.border,borderRadius:7,padding:"4px 10px",color:C.text,fontSize:11,cursor:"pointer"}} onClick={toggleLang}>{isAr?"EN":"عربي"}</button>
          </div>
        )}

        {activePage!=="analytics"&&<>
        {/* Welcome header */}
        {!isMobile&&(
          <div style={{marginBottom:24}}>
            <h1 style={{margin:0,fontSize:22,fontWeight:800,color:C.text}}>{isAr?`مرحباً بك، ${displayName} 👋`:`Welcome, ${displayName}! 👋`}</h1>
            <p style={{margin:"4px 0 0",fontSize:13,color:C.muted}}>{isAr?"لوحة تتبع الفرص بالذكاء الاصطناعي":"AI-powered opportunity tracking dashboard"}</p>
          </div>
        )}

        {/* Stats — 8 pipeline boxes */}
        {(()=>{
          const waitingCount = opps.filter(o=>(o.status||"new")==="waiting").length
          const noReplyCount = opps.filter(o=>(o.status||"new")==="no_reply").length
          const newCount     = opps.filter(o=>(o.status||"new")==="new").length
          const pipelineStats = [
            { key:"new",      label:isAr?"جديد":"New",          val: newCount,                icon:"📋", bg:"#374151", badge:"#9ca3af" },
            { key:"ready",    label:isAr?"جاهز":"Ready",        val: stats?.ready ?? opps.filter(o=>["analyzed","ready"].includes(o.status||"")).length, icon:"🔔", bg:"#92400e", badge:"#f59e0b" },
            { key:"applied",  label:isAr?"تقديم":"Applied",     val: stats?.applied ?? 0,    icon:"📤", bg:"#1e3a5f", badge:"#3b82f6" },
            { key:"waiting",  label:isAr?"انتظار":"Waiting",    val: waitingCount,            icon:"⏳", bg:"#3b2070", badge:"#8b5cf6" },
            { key:"accepted", label:isAr?"مقبول":"Accepted",    val: stats?.accepted ?? 0,   icon:"✅", bg:"#064e3b", badge:"#10b981" },
            { key:"rejected", label:isAr?"مرفوض":"Rejected",    val: stats?.rejected ?? 0,   icon:"❌", bg:"#7f1d1d", badge:"#ef4444" },
            { key:"no_reply", label:isAr?"لا رد":"No Reply",    val: noReplyCount,            icon:"📭", bg:"#3d2314", badge:"#d97706" },
            { key:"deadline", label:isAr?"قريب!":"Deadline!",   val: stats?.deadline_soon ?? 0, icon:"⚠️", bg:"#7f1d1d", badge:"#f87171" },
          ]
          return (
            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(4,1fr)":"repeat(8,1fr)",gap:8,marginBottom:18}}>
              {pipelineStats.map(s=>(
                <div key={s.key} onClick={()=>{ if(s.key!=="deadline"){ setActiveTab(s.key); setFilterStatus(s.key==="ready"?"analyzed":s.key==="all"?"all":s.key) } }}
                  style={{
                    background: activeTab===s.key ? s.bg : (C.isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.04)"),
                    border:"1px solid "+(activeTab===s.key?s.badge+"55":C.border),
                    borderRadius:12, padding:isMobile?"10px 6px":"14px 10px",
                    display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                    cursor:s.key!=="deadline"?"pointer":"default",
                    transition:"all 0.15s",
                    boxShadow:activeTab===s.key?"0 0 0 1px "+s.badge+"33":"none"
                  }}>
                  <div style={{fontSize:isMobile?18:22,fontWeight:800,color:s.badge,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:isMobile?8:10,fontWeight:600,color:activeTab===s.key?s.badge:C.muted,textAlign:"center",letterSpacing:0.3}}>{s.icon} {s.label}</div>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Opportunities panel */}
        <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:20,padding:isMobile?"14px":"22px",boxShadow:"0 10px 30px rgba(0,0,0,0.15)",flex:1,display:"flex",flexDirection:"column"}}>

          {/* Toolbar */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <h2 style={{margin:0,fontSize:17,fontWeight:800,color:C.text}}>
                {t("opportunities")} <span style={{fontSize:13,fontWeight:500,color:C.muted}}>({filteredOpps.length}{filteredOpps.length!==opps.length?` / ${opps.length}`:""})</span>
              </h2>
              {/* View toggle */}
              <div style={{display:"flex",background:"rgba(255,255,255,0.03)",border:"1px solid "+C.border,borderRadius:8,padding:2}}>
                {[["cards",isAr?"⊟ بطاقات":"⊟ Cards"],["list",isAr?"☰ قائمة":"☰ List"],["kanban",isAr?"⊞ كانبان":"⊞ Kanban"]].map(([m,lbl])=>(
                  <button key={m} onClick={()=>setViewMode(m)} style={{padding:"4px 11px",fontSize:12,border:"none",borderRadius:6,cursor:"pointer",background:viewMode===m?"rgba(255,255,255,0.09)":"transparent",fontWeight:viewMode===m?700:400,color:viewMode===m?C.text:C.muted,boxShadow:viewMode===m?"0 1px 4px rgba(0,0,0,0.2)":"none",outline:"none"}}>{lbl}</button>
                ))}
              </div>
              {filteredOpps.length>0&&<button onClick={exportCSV} style={{padding:"5px 12px",background:C.card,border:"1px solid "+C.border,borderRadius:6,color:C.text,fontSize:11,fontWeight:600,cursor:"pointer"}}>↓ CSV</button>}
              <button onClick={()=>setShowAddModal(true)} style={{padding:"5px 13px",background:"linear-gradient(135deg,"+C.blue+","+C.purple+")",color:"white",border:"none",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>＋ {isAr?"إضافة فرصة":"Add Opportunity"}</button>
            </div>
          </div>

          {/* ── Status tab bar ── */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
            {[
              {key:"all",       label:isAr?"الكل":"All"},
              {key:"ready",     label:isAr?"جاهز للتقديم":"Ready to Apply"},
              {key:"applied",   label:isAr?"تقديم":"Applied"},
              {key:"waiting",   label:isAr?"انتظار":"Waiting"},
              {key:"accepted",  label:isAr?"مقبول":"Accepted"},
              {key:"rejected",  label:isAr?"مرفوض":"Rejected"},
              {key:"no_reply",  label:isAr?"لا رد":"No Reply"},
              {key:"stats",     label:isAr?"إحصاء النجاح":"Success Stats"},
              {key:"restricted",label:isAr?"مقيد":"Restricted"},
              {key:"iq",        label:"🇮🇶 Iraqi OK"},
            ].map(tab=>{
              const isActive = activeTab===tab.key
              const tabColor = STATUS_COLORS[tab.key] || C.blue
              return (
                <button key={tab.key} onClick={()=>{
                  setActiveTab(tab.key)
                  if(tab.key==="all") { setFilterStatus("all"); return }
                  if(tab.key==="stats"||tab.key==="iq") return
                  setFilterStatus(tab.key==="ready"?"analyzed":tab.key)
                }} style={{
                  padding:"5px 12px",
                  background: isActive ? (STATUS_BG[tab.key]||"rgba(59,130,246,0.15)") : "transparent",
                  border:"1px solid "+(isActive?(tabColor+"66"):C.border),
                  borderRadius:20,
                  fontSize:12,fontWeight:isActive?700:500,
                  color:isActive?(tabColor):C.muted,
                  cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s",
                }}>
                  {tab.label}
                </button>
              )
            })}
            {/* Type dropdown */}
            <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{padding:"5px 10px",background:C.selectBg,border:"1px solid "+C.border,borderRadius:20,color:C.text,fontSize:12,cursor:"pointer",outline:"none"}}>
              <option value="all" style={{background:C.selectBg}}>Type...</option>
              {["job","scholarship","internship","conference","training","volunteering"].map(tp=><option key={tp} value={tp} style={{background:C.selectBg}}>{tp.charAt(0).toUpperCase()+tp.slice(1)}</option>)}
            </select>
          </div>

          {/* Deadline warning banner */}
          {(stats?.deadline_soon??0)>0&&(
            <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16}}>⚠️</span>
              <span style={{fontSize:13,fontWeight:600,color:"#f87171"}}>{stats.deadline_soon} {isAr?"فرصة/فرص تنتهي خلال 7 أيام!":"opportunity/ies with deadline within 7 days!"}</span>
            </div>
          )}

          {/* Filters */}
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"14px",marginBottom:18,display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
              <input style={{...darkInput,flex:"1 1 160px",padding:"8px 12px"}} placeholder={t("searchPlaceholder")} value={searchText} onChange={e=>setSearchText(e.target.value)}/>
              <select style={{...darkSelect,flex:"0 0 auto"}} value={filterType} onChange={e=>setFilterType(e.target.value)}>
                {OPP_TYPES.map(tp=><option key={tp} value={tp} style={{background:C.selectBg}}>{tp==="all"?t("allTypes"):t(tp+"s")||(tp.charAt(0).toUpperCase()+tp.slice(1)+"s")}</option>)}
              </select>
              <select style={{...darkSelect,flex:"0 0 auto"}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                {STATUSES.map(s=><option key={s} value={s} style={{background:C.selectBg}}>{s==="all"?t("allStatus"):s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
              {uniqueCountries.length>0&&<select style={{...darkSelect,flex:"0 0 auto"}} value={filterCountry} onChange={e=>setFilterCountry(e.target.value)}>
                <option value="all" style={{background:C.selectBg}}>{t("allCountries")}</option>
                {uniqueCountries.map(c=><option key={c} value={c} style={{background:C.selectBg}}>{c}</option>)}
              </select>}
              <select style={{...darkSelect,flex:"0 0 auto"}} value={filterDeadline} onChange={e=>setFilterDeadline(e.target.value)}>
                <option value="all" style={{background:C.selectBg}}>{t("anyDeadline")}</option>
                <option value="week" style={{background:C.selectBg}}>{t("dueThisWeek")}</option>
                <option value="month" style={{background:C.selectBg}}>{t("dueThisMonth")}</option>
                <option value="overdue" style={{background:C.selectBg}}>{t("overdue")}</option>
              </select>
              {/* Match Score dropdown */}
              <select style={{...darkSelect,flex:"0 0 auto"}} value={minScore} onChange={e=>setMinScore(Number(e.target.value))}>
                <option value={0} style={{background:C.selectBg}}>{isAr?"كل نسب المطابقة":"All Match Scores"}</option>
                <option value={80} style={{background:C.selectBg}}>{isAr?"مطابقة 80% فأكثر":"80%+ Match"}</option>
                <option value={70} style={{background:C.selectBg}}>{isAr?"مطابقة 70% فأكثر":"70%+ Match"}</option>
                <option value={50} style={{background:C.selectBg}}>{isAr?"مطابقة 50% فأكثر":"50%+ Match"}</option>
                <option value={30} style={{background:C.selectBg}}>{isAr?"مطابقة 30% فأكثر":"30%+ Match"}</option>
              </select>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid rgba(255,255,255,0.04)",paddingTop:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{t("minScore")}</span>
                <input type="range" min={0} max={100} step={10} value={minScore} onChange={e=>setMinScore(+e.target.value)} style={{width:90,cursor:"pointer",accentColor:C.blue}}/>
                <span style={{fontSize:12,fontWeight:700,minWidth:30,color:minScore>=70?C.green:minScore>=40?C.amber:C.blue}}>{minScore}%</span>
              </div>
              {(filterType!=="all"||filterStatus!=="all"||filterCountry!=="all"||filterDeadline!=="all"||searchText||minScore>0)&&(
                <button style={{padding:"5px 12px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:7,color:"#f87171",fontSize:11,fontWeight:600,cursor:"pointer"}}
                  onClick={()=>{setFilterType("all");setFilterStatus("all");setFilterCountry("all");setFilterDeadline("all");setSearchText("");setMinScore(0)}}>
                  {t("resetFilters")}
                </button>
              )}
            </div>
          </div>

          {/* Opportunity content */}
          <div style={{flex:1}}>
            {filteredOpps.length===0&&viewMode!=="kanban" ? (
              <div style={{textAlign:"center",padding:"60px 32px",background:C.card,border:"1px dashed "+C.border,borderRadius:14}}>
                <div style={{fontSize:48,marginBottom:14}}>🔍</div>
                <h3 style={{color:C.text,fontSize:15,fontWeight:700,margin:"0 0 6px"}}>{opps.length===0?t("noOppsYet"):t("noResults")}</h3>
                <p style={{color:C.muted,fontSize:13,margin:"0 0 20px",lineHeight:1.5}}>{opps.length===0?t("noOppsHint"):t("noResultsHint")}</p>
                {opps.length===0
                  ? <button style={{padding:"9px 24px",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",color:"white",border:"none",borderRadius:9,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(59,130,246,0.3)"}} onClick={runPipeline} disabled={pipelineRunning}>{pipelineRunning?t("pipelineRunning"):t("runPipeline")}</button>
                  : <button style={{padding:"8px 18px",background:C.card,border:"1px solid "+C.border,borderRadius:8,color:C.text,cursor:"pointer",fontWeight:600}} onClick={()=>{setFilterType("all");setFilterStatus("all");setFilterCountry("all");setFilterDeadline("all");setSearchText("");setMinScore(0)}}>{t("resetFilters")}</button>
                }
              </div>
            ) : viewMode==="kanban" ? renderKanban()
              : viewMode==="cards"  ? renderCards()
              : renderList()
            }
          </div>
        </div>
      </>}
      </div>

      {/* ════════════ SEARCH OPPORTUNITIES MODAL ════════════════════ */}
      {showAddModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}} onClick={()=>{setShowAddModal(false);setAddMsg("")}} >
          <div style={{background:C.modalBg,borderRadius:18,padding:28,width:"100%",maxWidth:480,border:"1px solid "+C.border,boxShadow:"0 24px 60px rgba(0,0,0,0.4)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <h2 style={{margin:0,fontSize:17,fontWeight:800,color:C.text}}>🔍 {isAr?"ابحث عن فرص":"Search Opportunities"}</h2>
              <button onClick={()=>{setShowAddModal(false);setAddMsg("")}} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer",padding:0}}>✕</button>
            </div>
            <p style={{margin:"0 0 16px",fontSize:12,color:C.muted}}>{isAr?"ابحث عن فرص جديدة وأضفها تلقائياً لقائمتك":"Search for new opportunities and add them to your list automatically"}</p>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <input style={{...darkInput}} placeholder={isAr?"كلمة البحث *  (مثال: software engineer Germany)":"Search query * (e.g. scholarships computer science)"} value={addForm.query} onChange={e=>setAddForm(f=>({...f,query:e.target.value}))}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <select style={{...darkSelect}} value={addForm.type} onChange={e=>setAddForm(f=>({...f,type:e.target.value}))}>
                  <option value="" style={{background:C.selectBg}}>{isAr?"كل الأنواع":"All Types"}</option>
                  {["job","scholarship","internship","conference","training","volunteering"].map(tp=><option key={tp} value={tp} style={{background:C.selectBg}}>{tp.charAt(0).toUpperCase()+tp.slice(1)}</option>)}
                </select>
                <input style={{...darkInput}} placeholder={isAr?"الدولة (اختياري)":"Country (optional)"} value={addForm.country} onChange={e=>setAddForm(f=>({...f,country:e.target.value}))}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{isAr?"عدد النتائج:":"Max results:"}</span>
                <input type="range" min={5} max={20} step={5} value={addForm.limit} onChange={e=>setAddForm(f=>({...f,limit:+e.target.value}))} style={{flex:1,accentColor:C.blue}}/>
                <span style={{fontSize:12,fontWeight:700,color:C.blue,minWidth:20}}>{addForm.limit}</span>
              </div>
              {addMsg&&<div style={{padding:"8px 12px",borderRadius:8,fontSize:12,background:addMsg.includes("✅")?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)",color:addMsg.includes("✅")?C.green:C.red,border:"1px solid "+(addMsg.includes("✅")?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)")}}>{addMsg}</div>}
            </div>
            <div style={{display:"flex",gap:10,marginTop:20}}>
              <button onClick={async()=>{
                if(!addForm.query.trim()) return
                setAddLoading(true); setAddMsg("")
                try{
                  const body={query:addForm.query,limit:addForm.limit}
                  if(addForm.type) body.type=addForm.type
                  if(addForm.country) body.country=addForm.country
                  const res=await fetch(API+"/opportunities/search",{method:"POST",headers,body:JSON.stringify(body)})
                  const data=await res.json()
                  if(res.ok){
                    setAddMsg(`✅ ${isAr?"تم إضافة":"Found"} ${data.opportunities?.length??0} ${isAr?"فرصة":"opportunities"}`)
                    loadOpps()
                  } else { setAddMsg("❌ "+(data.detail||"Search failed")) }
                }catch(e){setAddMsg("❌ Connection error")}
                setAddLoading(false)
              }} style={{flex:1,padding:"10px",background:addLoading?"rgba(255,255,255,0.1)":"linear-gradient(135deg,"+C.blue+","+C.purple+")",color:"white",border:"none",borderRadius:9,fontWeight:700,cursor:addLoading?"default":"pointer",fontSize:14}} disabled={addLoading}>
                {addLoading?(isAr?"جاري البحث...":"Searching..."):(isAr?"بحث":"Search")}
              </button>
              <button onClick={()=>{setShowAddModal(false);setAddMsg("")}} style={{padding:"10px 16px",background:C.card,border:"1px solid "+C.border,borderRadius:9,color:C.muted,cursor:"pointer",fontWeight:600,fontSize:13}}>
                {isAr?"إغلاق":"Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ PROFILE MODAL ════════════════════════════════ */}
      {showProfile&&(()=>{
        return(
          <div style={{position:"fixed",inset:0,background:"rgba(3,7,18,0.8)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16}} onClick={()=>setShowProfile(false)}>
            <div style={{background:C.modalBg,border:"1px solid "+C.border,borderRadius:20,padding:isMobile?"18px":"28px",maxWidth:600,width:"100%",boxShadow:"0 25px 50px rgba(0,0,0,0.5)",maxHeight:"90vh",overflowY:"auto",boxSizing:"border-box",color:C.text}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{fontSize:17,fontWeight:800}}>👤 My Profile</div>
                <button style={{background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer"}} onClick={()=>setShowProfile(false)}>✕</button>
              </div>
              <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Fill in your details to improve matching opportunities relevance.</div>

              {mSection("🪪","Personal Information")}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"0 16px"}}>
                {mInp("Full Name","name","Ahmad Al-Basheer")}
                {mInp("Phone / WhatsApp","phone","+964 7XX XXX XXXX")}
                {mInp("Nationality","nationality","Iraqi")}
                {mInp("Country of Residence","country_of_residence","Iraq")}
                {mInp("Date of Birth","date_of_birth","YYYY-MM-DD","date")}
                {mSel("Gender","gender",["Male","Female","Prefer not to say"])}
              </div>

              {mSection("🔗","Online Presence")}
              {mInp("LinkedIn URL","linkedin_url","https://linkedin.com/in/yourname")}
              {mInp("Portfolio / Website","portfolio_url","https://yourwebsite.com")}

              {mSection("🎓","Academic Background")}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"0 16px"}}>
                {mSel("Education Level","education_level",["High School","Bachelor's","Master's","PhD","Other"])}
                {mInp("Field of Study","field_of_study","Computer Science")}
                {mInp("University / Institution","university","University of Baghdad")}
                {mInp("GPA","gpa","3.8 / 4.0")}
                {mInp("Graduation Year","graduation_year","2024")}
              </div>

              {mSection("💼","Professional Info")}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"0 16px"}}>
                {mInp("Current Occupation","current_occupation","Software Engineer")}
                {mInp("Skills (comma-separated)","skills","Python, React")}
              </div>
              {mChips("Experience Level","experience_level",["Beginner","Junior","Mid-level","Senior"])}
              {mInp("Languages","languages","Arabic (Native), English (B2)")}

              {mSection("🎯","Goals & Preferences")}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:4}}>Career Goals</div>
                <textarea placeholder="Describe your career goals..." value={profileEdit.career_goals||""} onChange={e=>setProfileEdit(p=>({...p,career_goals:e.target.value}))} rows={3}
                  style={{...darkInput,resize:"vertical",fontFamily:"inherit"}}/>
              </div>
              {mInp("Preferred Countries","preferred_countries","Germany, UAE")}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:6}}>Opportunity Types of Interest</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["scholarship","job","internship","volunteering","conference","training"].map(tp=>{
                    const sel=(profileEdit.preferred_types||"").split(",").map(x=>x.trim()).filter(Boolean)
                    const on=sel.includes(tp)
                    return <div key={tp} onClick={()=>{const next=on?sel.filter(x=>x!==tp):[...sel,tp];setProfileEdit(p=>({...p,preferred_types:next.join(",")}))}}
                      style={{padding:"4px 12px",borderRadius:14,fontSize:12,cursor:"pointer",border:"1px solid "+(on?C.blue:C.border),background:on?"rgba(59,130,246,0.15)":C.card,color:on?C.blue:"#cbd5e1"}}>
                      {on?"✓ ":""}{tp.charAt(0).toUpperCase()+tp.slice(1)}
                    </div>
                  })}
                </div>
              </div>

              {mSection("📄","CV / Resume")}
              {profile?.cv_filename&&<div style={{fontSize:12,color:C.green,marginBottom:8,fontWeight:600}}>✅ CV on file: {profile.cv_filename}</div>}
              <div style={{fontSize:12,color:C.muted,marginBottom:8}}>Upload your CV (PDF) — OpportuBot extracts skills and experience.</div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
                <input type="file" accept=".pdf" onChange={e=>setCvFile(e.target.files[0])} style={{fontSize:12,flex:1,color:C.text}}/>
                <button style={{padding:"8px 14px",background:uploading||!cvFile?"rgba(255,255,255,0.1)":C.green,color:"white",border:"none",borderRadius:8,fontWeight:600,cursor:uploading||!cvFile?"default":"pointer",fontSize:12}} onClick={uploadCV} disabled={uploading||!cvFile}>
                  {uploading?"Uploading…":"Upload CV"}
                </button>
              </div>
              {cvMsg&&<div style={{fontSize:12,marginBottom:8,color:cvMsg.includes("progress")?C.green:C.red}}>{cvMsg}</div>}

              <div style={{display:"flex",gap:8,marginTop:22}}>
                <button onClick={saveProfile} style={{padding:"10px",background:C.blue,color:"white",border:"none",borderRadius:9,cursor:"pointer",flex:1,fontWeight:600}}>💾 Save Profile</button>
                <button onClick={()=>setShowProfile(false)} style={{padding:"10px",background:"rgba(255,255,255,0.05)",border:"1px solid "+C.border,color:C.text,borderRadius:9,cursor:"pointer",flex:1,fontWeight:600}}>Cancel</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ════════════ SOURCES MODAL ═══════════════════════════════ */}
      {showSources&&(
        <div style={{position:"fixed",inset:0,background:"rgba(3,7,18,0.8)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16}} onClick={()=>setShowSources(false)}>
          <div style={{background:C.modalBg,border:"1px solid "+C.border,borderRadius:20,padding:isMobile?"18px":"28px",maxWidth:580,width:"100%",boxShadow:"0 25px 50px rgba(0,0,0,0.5)",maxHeight:"88vh",overflowY:"auto",color:C.text}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:16,fontWeight:800}}>🌐 Search Sources</div>
              <button style={{background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer"}} onClick={()=>setShowSources(false)}>✕</button>
            </div>
            <p style={{fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.5}}>Choose which websites OpportuBot searches. Leave all unchecked to search all automatically.</p>

            {/* Custom sites */}
            <div style={{background:"rgba(59,130,246,0.03)",border:"1px solid rgba(59,130,246,0.15)",borderRadius:12,padding:"14px",marginBottom:18}}>
              <div style={{fontSize:11,fontWeight:700,color:C.blue,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>➕ Add Your Own Sites</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:10}}>{isAr?"أضف أي موقع تعرفه فيه فرص":"Add any custom portal URL or domain"}</div>
              <div style={{display:"flex",gap:8,marginBottom:customSources.length>0?10:0}}>
                <input placeholder="e.g. opportunitydesk.org" value={customInput} onChange={e=>setCustomInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCustomSource()}
                  style={{...darkInput,padding:"8px 12px",fontSize:12}}/>
                <button onClick={addCustomSource} style={{padding:"8px 14px",background:C.green,color:"white",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>+ Add</button>
              </div>
              {customSources.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {customSources.map(d=><div key={d} style={{padding:"4px 10px",borderRadius:20,fontSize:11,background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",color:C.green,fontWeight:700,display:"flex",alignItems:"center",gap:5}}>🌐 {d} <span onClick={()=>setCustomSources(p=>p.filter(x=>x!==d))} style={{cursor:"pointer",fontSize:14,fontWeight:400}}>×</span></div>)}
              </div>}
            </div>

            {selectedDomains.length>0&&<div style={{marginBottom:12,display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:12,color:C.blue,fontWeight:600}}>{selectedDomains.length} selected</span>
              <button onClick={()=>setSelectedDomains([])} style={{fontSize:10,padding:"2px 8px",borderRadius:6,border:"none",background:"rgba(239,68,68,0.1)",color:"#f87171",cursor:"pointer",fontWeight:600}}>Clear all</button>
            </div>}

            {sourcesData ? Object.entries(sourcesData).map(([type,sources])=>(
              <div key={type} style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>
                  {type==="scholarship"?"🎓 Scholarships":type==="job"?"💼 Jobs":type==="internship"?"🧑‍💻 Internships":type==="volunteering"?"🤝 Volunteering":type==="conference"?"🎤 Conferences":type==="training"?"📚 Training":type}
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                  {sources.map(src=>{const on=selectedDomains.includes(src.domain);return(
                    <div key={src.domain} onClick={()=>toggleDomain(src.domain)} style={{padding:"5px 12px",borderRadius:15,fontSize:12,cursor:"pointer",border:"1px solid "+(on?C.blue:C.border),background:on?"rgba(59,130,246,0.12)":C.card,color:on?C.blue:"#cbd5e1"}}>
                      {on?"✓ ":""}{src.name}
                    </div>
                  )})}
                </div>
              </div>
            )) : <div style={{color:C.muted,fontSize:12,padding:"16px 0"}}>Loading sources...</div>}

            <div style={{display:"flex",gap:8,marginTop:16}}>
              <button onClick={saveSources} style={{padding:"10px",background:C.blue,color:"white",border:"none",borderRadius:9,cursor:"pointer",flex:1,fontWeight:600}}>Save Preferences</button>
              <button onClick={()=>setShowSources(false)} style={{padding:"10px",background:"rgba(255,255,255,0.05)",border:"1px solid "+C.border,color:C.text,borderRadius:9,cursor:"pointer",flex:1,fontWeight:600}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ COVER LETTER MODAL ══════════════════════════ */}
      {clModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(3,7,18,0.8)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16}} onClick={()=>setClModal(null)}>
          <div style={{background:C.modalBg,border:"1px solid "+C.border,borderRadius:20,padding:isMobile?"18px":"28px",maxWidth:680,width:"100%",boxShadow:"0 25px 50px rgba(0,0,0,0.5)",maxHeight:"85vh",overflowY:"auto",color:C.text}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div><div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{t("clTitle")}</div><div style={{fontSize:12,color:C.muted}}>{clModal.oppTitle} · {clModal.lang}</div></div>
              <div style={{display:"flex",gap:8}}>
                {!clModal.loading&&clModal.text&&!clModal.text.startsWith("Error")&&<button style={{padding:"6px 12px",background:C.green,color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}} onClick={()=>navigator.clipboard.writeText(clModal.text)}>{t("copy")}</button>}
                <button style={{padding:"6px 12px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,color:"#f87171",fontSize:12,fontWeight:600,cursor:"pointer"}} onClick={()=>setClModal(null)}>{t("close")}</button>
              </div>
            </div>
            {clModal.loading ? <div style={{textAlign:"center",padding:"40px 0",color:C.muted}}><div style={{fontSize:36,marginBottom:12}}>✍️</div><div>{t("clLoading")}</div><div style={{fontSize:12,marginTop:6,color:C.dim}}>{t("clLoadingHint")}</div></div>
              : <pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit",fontSize:14,lineHeight:1.7,color:C.text,background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:16,margin:0,overflowY:"auto",maxHeight:"50vh"}}>{clModal.text}</pre>}
            {!clModal.loading&&<div style={{marginTop:14,display:"flex",gap:8}}>
              <button style={{padding:"6px 12px",border:"none",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",background:clModal.lang==="Arabic"?C.blue:"rgba(255,255,255,0.05)",color:clModal.lang==="Arabic"?"white":C.muted}} onClick={()=>openCoverLetter({id:clModal.oppId,title:clModal.oppTitle},"Arabic")}>{t("arabic")}</button>
            </div>}
          </div>
        </div>
      )}

      {/* ════════════ VISITOR ANALYTICS PANEL ════════════════════ */}
      {activePage==="analytics"&&plan==="owner"&&(
        <div>
          <div style={{marginBottom:24}}>
            <h1 style={{margin:0,fontSize:22,fontWeight:800,color:C.text}}>📊 {isAr?"إحصاءات الزوار":"Visitor Analytics"}</h1>
            <p style={{margin:"4px 0 0",fontSize:13,color:C.muted}}>{isAr?"تتبع زوار الموقع والمستخدمين المسجلين":"Track site visitors and registered users"}</p>
          </div>
          {!visitorStats ? (
            <div style={{textAlign:"center",padding:"60px 0",color:C.muted}}>
              <div style={{fontSize:40,marginBottom:12}}>📡</div>
              <div>{isAr?"جاري تحميل الإحصاءات...":"Loading analytics..."}</div>
              <button style={{marginTop:16,...darkBtn(C.blue)}} onClick={()=>fetch(API+"/analytics/stats",{headers}).then(r=>r.json()).then(setVisitorStats).catch(()=>{})}>
                {isAr?"تحديث":"Refresh"}
              </button>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              {/* Summary cards */}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:14}}>
                {[
                  {label:isAr?"إجمالي الزيارات":"Total Visits",       val:visitorStats.total_visits,    icon:"👁",  color:C.blue,  bg:"rgba(59,130,246,0.08)",  border:"rgba(59,130,246,0.2)"},
                  {label:isAr?"زيارات اليوم":"Today's Visits",         val:visitorStats.today_visits,    icon:"📅",  color:C.green, bg:"rgba(16,185,129,0.08)",  border:"rgba(16,185,129,0.2)"},
                  {label:isAr?"زيارات الأسبوع":"This Week",            val:visitorStats.week_visits,     icon:"📆",  color:C.purple,bg:"rgba(139,92,246,0.08)",  border:"rgba(139,92,246,0.2)"},
                  {label:isAr?"IPs فريدة":"Unique IPs",                val:visitorStats.unique_ips_total,icon:"🌐",  color:C.cyan,  bg:"rgba(34,211,238,0.08)",  border:"rgba(34,211,238,0.2)"},
                ].map(s=>(
                  <div key={s.label} style={{background:s.bg,border:"1px solid "+s.border,borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"center",gap:14}}>
                    <div style={{fontSize:24,lineHeight:1}}>{s.icon}</div>
                    <div>
                      <div style={{fontSize:28,fontWeight:800,color:s.color,lineHeight:1,marginBottom:3}}>{s.val}</div>
                      <div style={{fontSize:11,color:C.muted,fontWeight:500}}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Logged-in vs anonymous */}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:14}}>
                <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:16,padding:"18px 20px"}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>🔐 {isAr?"نوع الزوار":"Visitor Types"}</div>
                  <div style={{display:"flex",gap:16}}>
                    <div style={{flex:1,textAlign:"center",padding:14,borderRadius:12,background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.15)"}}>
                      <div style={{fontSize:28,fontWeight:800,color:C.green}}>{visitorStats.logged_in_visits}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:4}}>{isAr?"مسجلون":"Logged In"}</div>
                    </div>
                    <div style={{flex:1,textAlign:"center",padding:14,borderRadius:12,background:"rgba(100,116,139,0.06)",border:"1px solid rgba(100,116,139,0.15)"}}>
                      <div style={{fontSize:28,fontWeight:800,color:C.muted}}>{visitorStats.anonymous_visits}</div>
                      <div style={{fontSize:11,color:C.dim,marginTop:4}}>{isAr?"ضيوف":"Anonymous"}</div>
                    </div>
                  </div>
                </div>

                {/* Daily chart (simple bar) */}
                <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:16,padding:"18px 20px"}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>📈 {isAr?"الزيارات (7 أيام)":"Visits (Last 7 days)"}</div>
                  {visitorStats.daily_chart?.length > 0 ? (
                    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:72}}>
                      {visitorStats.daily_chart.map(d=>{
                        const max = Math.max(...visitorStats.daily_chart.map(x=>x.visits),1)
                        const h   = Math.max(4, (d.visits/max)*64)
                        return (
                          <div key={d.day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                            <div style={{fontSize:9,color:C.muted}}>{d.visits}</div>
                            <div style={{width:"100%",height:h,background:C.blue,borderRadius:"3px 3px 0 0",opacity:0.8,transition:"height 0.3s"}}/>
                            <div style={{fontSize:8,color:C.dim}}>{d.day.slice(5)}</div>
                          </div>
                        )
                      })}
                    </div>
                  ) : <div style={{color:C.dim,fontSize:12,textAlign:"center",padding:"24px 0"}}>{isAr?"لا توجد بيانات بعد":"No data yet"}</div>}
                </div>
              </div>

              {/* Top users */}
              {visitorStats.top_users?.length > 0 && (
                <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:16,padding:"18px 20px"}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>🏆 {isAr?"أكثر المستخدمين زيارةً":"Top Visitors"}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {visitorStats.top_users.map((u,i)=>(
                      <div key={u.email} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 12px",background:i===0?"rgba(245,158,11,0.06)":C.card,borderRadius:10,border:"1px solid "+C.border}}>
                        <span style={{fontSize:14,width:22,textAlign:"center"}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":"  "}</span>
                        <span style={{flex:1,fontSize:13,color:C.text,fontWeight:i===0?700:400}}>{u.email}</span>
                        <span style={{fontSize:12,color:C.muted,fontWeight:600}}>{u.visits} {isAr?"زيارة":"visits"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent visits table */}
              <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:16,padding:"18px 20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text}}>🕐 {isAr?"آخر الزيارات":"Recent Visits"}</div>
                  <button style={{...darkBtn("rgba(59,130,246,0.1)","#60a5fa"),fontSize:11,padding:"5px 10px"}}
                    onClick={()=>fetch(API+"/analytics/stats",{headers}).then(r=>r.json()).then(setVisitorStats).catch(()=>{})}>
                    ↻ {isAr?"تحديث":"Refresh"}
                  </button>
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr style={{borderBottom:"1px solid "+C.border}}>
                        {[isAr?"البريد":"Email", isAr?"IP":"IP", isAr?"الصفحة":"Page", isAr?"الوقت":"Time"].map(h=>(
                          <th key={h} style={{padding:"6px 8px",textAlign:"left",color:C.dim,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(visitorStats.recent||[]).map(v=>(
                        <tr key={v.id} style={{borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                          <td style={{padding:"7px 8px",color:v.user_email!=="—"?C.blue:C.dim}}>{v.user_email}</td>
                          <td style={{padding:"7px 8px",color:C.muted,fontFamily:"monospace"}}>{v.ip||"—"}</td>
                          <td style={{padding:"7px 8px",color:C.muted,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.page}</td>
                          <td style={{padding:"7px 8px",color:C.dim,whiteSpace:"nowrap"}}>{v.visited_at?new Date(v.visited_at).toLocaleString():"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!visitorStats.recent||visitorStats.recent.length===0)&&(
                    <div style={{textAlign:"center",padding:"24px 0",color:C.dim}}>{isAr?"لا توجد زيارات بعد":"No visits recorded yet"}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════ THEME PICKER MODAL ══════════════════════════ */}
      {showThemePicker&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10000,padding:16}} onClick={()=>setShowThemePicker(false)}>
          <div style={{background:C.modalBg,border:"1px solid "+C.border,borderRadius:22,padding:28,maxWidth:420,width:"100%",boxShadow:"0 25px 60px rgba(0,0,0,0.5)",color:C.text,boxSizing:"border-box"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:17,fontWeight:800}}>🎨 {isAr?"المظهر":"Theme"}</div>
              <button style={{background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer"}} onClick={()=>setShowThemePicker(false)}>✕</button>
            </div>
            <div style={{fontSize:12,color:C.muted,marginBottom:20}}>{isAr?"اختر كيف يبدو التطبيق لك":"Choose how OpportuBot looks for you."}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              {[
                {key:"dark",  icon:"🌙", label:isAr?"داكن":"Dark",   desc:isAr?"مريح للعيون":"Easy on the eyes"},
                {key:"light", icon:"☀️", label:isAr?"فاتح":"Light",  desc:isAr?"نظيف ومضيء":"Clean & bright"},
                {key:"auto",  icon:"🖥️", label:isAr?"تلقائي":"Auto", desc:isAr?"يتبع النظام":"Follow system"},
                {key:"custom",icon:"🎨", label:isAr?"مخصص":"Custom", desc:isAr?"ألوانك الخاصة":"Your own colors"},
              ].map(opt=>(
                <div key={opt.key} onClick={()=>{setTheme(opt.key);localStorage.setItem("ob_theme",opt.key)}} style={{
                  padding:"14px 12px",borderRadius:14,cursor:"pointer",
                  border:"2px solid "+(theme===opt.key?C.blue:C.border),
                  background:theme===opt.key?"rgba(59,130,246,0.08)":C.card,
                  transition:"border-color 0.15s,background 0.15s",
                }}>
                  <div style={{fontSize:24,marginBottom:8}}>{opt.icon}</div>
                  <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:2}}>{opt.label}</div>
                  <div style={{fontSize:11,color:C.muted}}>{opt.desc}</div>
                  {theme===opt.key&&<div style={{marginTop:8,width:20,height:3,borderRadius:2,background:C.blue}}/>}
                </div>
              ))}
            </div>
            {theme==="custom"&&(
              <div style={{borderTop:"1px solid "+C.border,paddingTop:16,display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:0.5}}>{isAr?"تخصيص الألوان":"CUSTOMIZE COLORS"}</div>
                {[
                  {key:"bg",      label:isAr?"الخلفية":"Background",    default:"#080B10"},
                  {key:"sidebar", label:isAr?"الشريط الجانبي":"Sidebar", default:"#0F131E"},
                  {key:"accent",  label:isAr?"اللون الرئيسي":"Accent",  default:"#3b82f6"},
                ].map(col=>(
                  <div key={col.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:C.card,borderRadius:10,border:"1px solid "+C.border}}>
                    <span style={{fontSize:13,color:C.text,fontWeight:500}}>{col.label}</span>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:26,height:26,borderRadius:6,background:customColors[col.key]||col.default,border:"1px solid "+C.border}}/>
                      <input type="color" value={customColors[col.key]||col.default}
                        onChange={e=>{const nc={...customColors,[col.key]:e.target.value};setCustomColors(nc);localStorage.setItem("ob_custom_colors",JSON.stringify(nc))}}
                        style={{width:36,height:28,cursor:"pointer",border:"none",background:"transparent",padding:0,borderRadius:4}}/>
                    </div>
                  </div>
                ))}
                <button onClick={()=>{setCustomColors({});localStorage.removeItem("ob_custom_colors")}} style={{fontSize:11,color:C.muted,background:"none",border:"1px dashed "+C.border,borderRadius:8,padding:"6px",cursor:"pointer"}}>
                  {isAr?"إعادة تعيين الألوان":"Reset to defaults"}
                </button>
              </div>
            )}
            <button onClick={()=>setShowThemePicker(false)} style={{width:"100%",padding:"11px",background:C.blue,color:"white",border:"none",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:13}}>
              {isAr?"تم":"Done"}
            </button>
          </div>
        </div>
      )}

      {/* ════════════ FLOATING BOT WIDGET ════════════════════════ */}
      {showWidget&&(
        <div style={{position:"fixed",bottom:20,right:20,zIndex:9000,width:widgetMin?220:260,borderRadius:16,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.1)",background:C.sidebar,fontFamily:"inherit"}}>
          {/* Widget header */}
          <div style={{background:"linear-gradient(135deg,#1e3a5f,#2d1b69)",padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <img src="/logo.png" alt="" style={{width:22,height:22,objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>
              <span style={{fontSize:13,fontWeight:700,color:"white"}}>OpportuBot</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setWidgetMin(p=>!p)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.6)",cursor:"pointer",fontSize:16,lineHeight:1,padding:0}}>{widgetMin?"▲":"▼"}</button>
              <button onClick={()=>setShowWidget(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.6)",cursor:"pointer",fontSize:16,lineHeight:1,padding:0}}>×</button>
            </div>
          </div>
          {!widgetMin&&(
            <div style={{padding:"10px 14px",display:"flex",flexDirection:"column",gap:6}}>
              {/* Last updated */}
              <div style={{fontSize:10,color:C.muted,textAlign:"right"}}>Updated {new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div>
              {/* Deadline warning */}
              {(stats?.deadline_soon??0)>0&&(
                <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"6px 10px",fontSize:11,color:"#f87171",fontWeight:600}}>
                  ⚠️ {stats.deadline_soon} deadline(s) this week!
                </div>
              )}
              {/* Stats list */}
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                {[
                  {label:"Ready to Apply", val: stats?.ready ?? 0,    color:"#f59e0b"},
                  {label:"New",            val: opps.filter(o=>(o.status||"new")==="new").length, color:"#9ca3af"},
                  {label:"Applied",        val: stats?.applied ?? 0,  color:"#3b82f6"},
                  {label:"Waiting",        val: opps.filter(o=>o.status==="waiting").length, color:"#8b5cf6"},
                  {label:"Accepted",       val: stats?.accepted ?? 0, color:"#10b981"},
                  {label:"Rejected",       val: stats?.rejected ?? 0, color:"#ef4444"},
                  {label:"No Reply",       val: opps.filter(o=>o.status==="no_reply").length, color:"#d97706"},
                ].map(s=>(
                  <div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"2px 4px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                      <span style={{fontSize:12,color:C.muted}}>{s.label}</span>
                    </div>
                    <span style={{fontSize:13,fontWeight:700,color:s.color}}>{s.val}</span>
                  </div>
                ))}
              </div>
              {/* Open Dashboard button */}
              <button onClick={()=>{setActivePage("dashboard");setFilterStatus("all");setActiveTab("all");setWidgetMin(true)}} style={{marginTop:4,padding:"8px",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",color:"white",border:"none",borderRadius:9,fontWeight:700,cursor:"pointer",fontSize:12,width:"100%"}}>
                🤖 Open Dashboard
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════ INTERVIEW PREP MODAL ════════════════════════ */}
      {ipModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(3,7,18,0.8)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16}} onClick={()=>setIpModal(null)}>
          <div style={{background:C.modalBg,border:"1px solid "+C.border,borderRadius:20,padding:isMobile?"18px":"28px",maxWidth:720,width:"100%",boxShadow:"0 25px 50px rgba(0,0,0,0.5)",maxHeight:"88vh",overflowY:"auto",color:C.text}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div><div style={{fontSize:15,fontWeight:700,color:C.cyan,marginBottom:4}}>{t("ipTitle")}</div><div style={{fontSize:12,color:C.muted}}>{ipModal.oppTitle} · {ipModal.lang}</div></div>
              <button style={{padding:"6px 12px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,color:"#f87171",fontSize:12,fontWeight:600,cursor:"pointer"}} onClick={()=>setIpModal(null)}>{t("close")}</button>
            </div>
            {ipModal.loading ? <div style={{textAlign:"center",padding:"48px 0",color:C.muted}}><div style={{fontSize:40,marginBottom:12}}>🎤</div><div>{t("ipLoading")}</div><div style={{fontSize:12,marginTop:6,color:C.dim}}>{t("ipLoadingHint")}</div></div>
              : ipModal.error ? <div style={{textAlign:"center",padding:"32px 0",color:C.red}}>{ipModal.error}</div>
              : <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {(ipModal.questions||[]).map((q,i)=>(
                    <div key={i} style={{border:"1px solid rgba(34,211,238,0.15)",borderRadius:12,overflow:"hidden"}}>
                      <div style={{background:"rgba(34,211,238,0.05)",padding:"12px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
                        <span style={{background:"#0891b2",color:"white",borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>{i+1}</span>
                        <div style={{flex:1}}><div style={{fontSize:10,color:C.cyan,fontWeight:700,marginBottom:2,textTransform:"uppercase"}}>{q.category}</div><div style={{fontSize:14,fontWeight:600,color:C.text,lineHeight:1.5}}>{q.question}</div></div>
                      </div>
                      <div style={{padding:"12px 16px",background:C.card}}><div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:4}}>{t("answerTip")}</div><div style={{fontSize:13,color:C.text,lineHeight:1.6}}>{q.answer_tip}</div></div>
                    </div>
                  ))}
                </div>}
            {!ipModal.loading&&<div style={{marginTop:18,display:"flex",gap:8}}>
              <button style={{padding:"6px 12px",border:"none",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",background:ipModal.lang==="English"?"#0891b2":"rgba(255,255,255,0.05)",color:ipModal.lang==="English"?"white":C.muted}} onClick={()=>openInterviewPrep({id:ipModal.oppId,title:ipModal.oppTitle},"English")}>{t("english")}</button>
              <button style={{padding:"6px 12px",border:"none",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",background:ipModal.lang==="Arabic"?C.blue:"rgba(255,255,255,0.05)",color:ipModal.lang==="Arabic"?"white":C.muted}} onClick={()=>openInterviewPrep({id:ipModal.oppId,title:ipModal.oppTitle},"Arabic")}>{t("arabic")}</button>
            </div>}
          </div>
        </div>
      )}

    </div>
  )
}
