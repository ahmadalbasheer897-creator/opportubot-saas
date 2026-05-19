# OpportuBot — Railway Deployment Guide

## Repository Structure

```
opportubot_saas/
├── backend/
│   ├── main.py             FastAPI application
│   ├── requirements.txt    Python dependencies
│   ├── railway.toml        Railway build & deploy config
│   └── .env.example        Environment variables template
├── frontend/
│   ├── src/
│   │   ├── App.jsx         Router (landing / login / register / dashboard / admin)
│   │   ├── main.jsx        React entry point
│   │   ├── Landing.jsx     Public landing page
│   │   ├── Login.jsx       Login form
│   │   ├── Register.jsx    Registration form + gift code
│   │   ├── Dashboard.jsx   User dashboard (opportunities, pipeline, CV upload)
│   │   └── Admin.jsx       Owner admin panel
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example        Set VITE_API_URL here
├── database/
│   └── schema.sql          Run this once on your Postgres DB
└── .gitignore
```

---

## Step 1 — Push to GitHub

```bash
cd opportubot_saas
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/opportubot-saas.git
git push -u origin main
```

---

## Step 2 — Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → select `opportubot-saas`
3. Railway auto-detects Python via `backend/railway.toml`
4. Set the **Root Directory** to `backend/`
5. Add a **PostgreSQL** service to the same project (Railway auto-sets `DATABASE_URL`)
6. Set environment variables under **Variables**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Auto-filled by Railway Postgres addon |
| `SECRET_KEY` | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `OWNER_EMAIL` | `ahmadalbasheer.897@gmail.com` |
| `ANTHROPIC_API_KEY` | Your key from console.anthropic.com |

7. **Deploy** — Railway runs: `uvicorn main:app --host 0.0.0.0 --port $PORT`
8. Note your backend URL: `https://your-backend.up.railway.app`

---

## Step 3 — Run Database Schema

After Postgres is created in Railway, connect and run the schema:

```bash
# From Railway dashboard → Postgres service → Connect → copy the connection string
psql "postgresql://..." -f database/schema.sql
```

Or use the Railway shell on the Postgres service and paste the contents of `database/schema.sql`.

---

## Step 4 — Deploy Frontend

### Option A: Railway Static Site
1. Add another service to your Railway project
2. Set **Root Directory** to `frontend/`
3. Set **Build Command** to `npm install && npm run build`
4. Set **Output Directory** to `dist/`
5. Add variable: `VITE_API_URL=https://your-backend.up.railway.app`

### Option B: Vercel (recommended for frontend)
```bash
cd frontend
npm install
npx vercel --prod
# When prompted, set VITE_API_URL to your Railway backend URL
```

---

## Step 5 — Verify Deployment

- `GET https://your-backend.up.railway.app/health` → `{"status":"ok"}`
- `GET https://your-backend.up.railway.app/` → `{"service":"OpportuBot API",...}`
- Open frontend URL → landing page loads, register works, dashboard loads

---

## Environment Variables Reference

### Backend (Railway)
```
DATABASE_URL      PostgreSQL connection string (auto from Railway Postgres addon)
SECRET_KEY        Random 64-char hex string for JWT signing
OWNER_EMAIL       Your email — gets owner/admin plan automatically
ANTHROPIC_API_KEY Claude API key for CV analysis
```

### Frontend (.env or Vercel/Railway env)
```
VITE_API_URL      Full URL of your Railway backend, e.g. https://xxx.up.railway.app
```

---

## Plan Features

| Feature | Free | Pro ($9/mo) | Gift |
|---|---|---|---|
| Opportunities/month | 50 | Unlimited | Unlimited |
| AI analysis | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ |
| CV Builder | ✗ | ✅ | ✅ |
| Autofill extension | ✗ | ✅ | ✅ |
| Gmail integration | ✗ | ✅ | ✅ |

Gift codes are generated in the Admin panel (`/admin`) and given to users who redeem them on registration or from their dashboard.
