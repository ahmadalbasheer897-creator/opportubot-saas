import { useState, useEffect } from "react"
import Landing   from "./Landing"
import Login     from "./Login"
import Register  from "./Register"
import Dashboard from "./Dashboard"
import Admin     from "./Admin"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function App() {
  const [page,    setPage]    = useState("landing")
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("ob_token")
    if (token) {
      validateToken(token)
    } else {
      setLoading(false)
    }
  }, [])

  const validateToken = async (token) => {
    try {
      const res = await fetch(API + "/profile", {
        headers: { "Authorization": "Bearer " + token },
      })
      if (res.ok) {
        setUser(buildUser())
        setPage("dashboard")
      } else {
        clearAuth()
      }
    } catch {
      // Network error — keep landing, user can log in manually
      const plan = localStorage.getItem("ob_plan")
      if (plan) {
        setUser(buildUser())
        setPage("dashboard")
      }
    }
    setLoading(false)
  }

  const buildUser = () => ({
    email:     localStorage.getItem("ob_email") || "",
    plan:      localStorage.getItem("ob_plan")  || "free",
    is_owner:  localStorage.getItem("ob_is_owner") === "true",
  })

  const clearAuth = () => {
    ["ob_token","ob_plan","ob_is_owner","ob_email"].forEach(k => localStorage.removeItem(k))
  }

  const navigate = (newPage) => {
    setPage(newPage)
    window.scrollTo(0, 0)
  }

  const logout = () => {
    clearAuth()
    setUser(null)
    setPage("landing")
  }

  const handleAuth = (userData) => {
    setUser(userData)
  }

  if (loading) return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center",
      height: "100vh", background: "#1A237E", color: "white",
      fontSize: 52,
    }}>
      🤖
    </div>
  )

  if (page === "landing")   return <Landing   navigate={navigate} />
  if (page === "login")     return <Login     navigate={navigate} onLogin={handleAuth} />
  if (page === "register")  return <Register  navigate={navigate} onRegister={handleAuth} />
  if (page === "dashboard") return <Dashboard navigate={navigate} logout={logout} user={user} />
  if (page === "admin")     return <Admin     navigate={navigate} logout={logout} user={user} />

  return <Landing navigate={navigate} />
}
