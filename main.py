"""
OpportuBot SaaS — Backend API
FastAPI + PostgreSQL

Routes:
  /auth/*       — تسجيل، دخول، خروج
  /profile/*    — بيانات المستخدم وCV
  /opportunities/* — الفرص
  /pipeline/*   — تشغيل البحث
  /admin/*      — لوحة تحكم المالك
  /gifts/*      — أكواد الهدايا
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
import jwt
import bcrypt
import asyncpg
import json
from datetime import datetime, timedelta

app = FastAPI(title="OpportuBot API", version="1.0.0")

# CORS — يسمح للـ Frontend بالاتصال
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── إعدادات ──────────────────────────────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://user:pass@localhost/opportubot")
SECRET_KEY   = os.environ.get("SECRET_KEY", "opportubot-secret-change-in-production")
OWNER_EMAIL  = os.environ.get("OWNER_EMAIL", "ahmadalbasheer.897@gmail.com")
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ── حدود الخطط ───────────────────────────────────────────────────────────
PLAN_LIMITS = {
    "free":  {"opportunities_per_month": 50,  "cv_builder": False, "autofill": False, "gmail": False},
    "pro":   {"opportunities_per_month": 9999, "cv_builder": True,  "autofill": True,  "gmail": True},
    "gift":  {"opportunities_per_month": 9999, "cv_builder": True,  "autofill": True,  "gmail": True},
    "owner": {"opportunities_per_month": 9999, "cv_builder": True,  "autofill": True,  "gmail": True},
}

# ── DB Connection ─────────────────────────────────────────────────────────
async def get_db():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()

# ── JWT ───────────────────────────────────────────────────────────────────
def create_token(user_id: int, email: str, plan: str):
    payload = {
        "sub":   str(user_id),
        "email": email,
        "plan":  plan,
        "exp":   datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = int(payload["sub"])
        user = await db.fetchrow("SELECT * FROM users WHERE id=$1 AND is_active=TRUE", user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return dict(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_plan(allowed_plans: list):
    async def checker(user=Depends(get_current_user)):
        if user["plan"] not in allowed_plans and not user["is_owner"]:
            raise HTTPException(
                status_code=403,
                detail="This feature requires Pro plan. Upgrade at opportubot.com/upgrade"
            )
        return user
    return checker

# ══════════════════════════════════════════════════════════════════════════
# AUTH ROUTES
# ══════════════════════════════════════════════════════════════════════════

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str


@app.post("/auth/register")
async def register(data: RegisterRequest, db=Depends(get_db)):
    # تحقق أن الإيميل غير مستخدم
    existing = await db.fetchrow("SELECT id FROM users WHERE email=$1", data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # تشفير كلمة المرور
    pw_hash = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()

    # تحديد الخطة — المالك يحصل على owner تلقائياً
    plan = "owner" if data.email == OWNER_EMAIL else "free"
    is_owner = data.email == OWNER_EMAIL

    user = await db.fetchrow("""
        INSERT INTO users (email, password_hash, full_name, plan, is_owner)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, plan, is_owner
    """, data.email, pw_hash, data.full_name, plan, is_owner)

    token = create_token(user["id"], user["email"], user["plan"])
    return {"token": token, "plan": user["plan"], "is_owner": user["is_owner"]}


@app.post("/auth/login")
async def login(form: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = await db.fetchrow("SELECT * FROM users WHERE email=$1", form.username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not bcrypt.checkpw(form.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.execute("UPDATE users SET last_login=NOW() WHERE id=$1", user["id"])
    token = create_token(user["id"], user["email"], user["plan"])
    return {"access_token": token, "token_type": "bearer",
            "plan": user["plan"], "is_owner": user["is_owner"]}


# ══════════════════════════════════════════════════════════════════════════
# PROFILE ROUTES
# ══════════════════════════════════════════════════════════════════════════

@app.get("/profile")
async def get_profile(user=Depends(get_current_user), db=Depends(get_db)):
    profile = await db.fetchrow(
        "SELECT * FROM user_profiles WHERE user_id=$1", user["id"])
    return dict(profile) if profile else {}


@app.post("/profile/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """رفع CV PDF وتحليله تلقائياً"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")

    content = await file.read()

    # استخراج النص
    import tempfile, os
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        from pypdf import PdfReader
        reader = PdfReader(tmp_path)
        cv_text = "".join(page.extract_text() or "" for page in reader.pages)
    finally:
        os.unlink(tmp_path)

    if not cv_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    # تحليل بـ Claude في الخلفية
    background_tasks.add_task(analyze_and_save_profile, user["id"], cv_text, db)

    return {"message": "CV uploaded successfully. Analysis in progress...",
            "cv_length": len(cv_text)}


async def analyze_and_save_profile(user_id: int, cv_text: str, db):
    """تحليل CV وحفظ Profile في الخلفية"""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

        prompt = """Extract all information from this CV and return ONLY valid JSON:
{
  "full_name": "", "email": "", "phone": "", "location": "",
  "nationality": "", "linkedin": "", "degree": "", "major": "",
  "university": "", "grad_year": "", "job_title": "",
  "experience": [], "skills": {}, "certifications": [], "summary": ""
}

CV TEXT:
""" + cv_text[:3000]

        msg = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}]
        )

        raw = msg.content[0].text.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw.strip())

        conn = await asyncpg.connect(os.environ.get("DATABASE_URL", ""))
        await conn.execute("""
            INSERT INTO user_profiles
                (user_id, full_name, email, phone, location, nationality,
                 linkedin, degree, major, university, grad_year, job_title,
                 experience, skills, certifications, summary, raw_cv_text)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
            ON CONFLICT (user_id) DO UPDATE SET
                full_name=$2, email=$3, phone=$4, location=$5,
                nationality=$6, linkedin=$7, degree=$8, major=$9,
                university=$10, grad_year=$11, job_title=$12,
                experience=$13, skills=$14, certifications=$15,
                summary=$16, raw_cv_text=$17, updated_at=NOW()
        """, user_id,
            data.get("full_name",""), data.get("email",""),
            data.get("phone",""), data.get("location",""),
            data.get("nationality",""), data.get("linkedin",""),
            data.get("degree",""), data.get("major",""),
            data.get("university",""), data.get("grad_year",""),
            data.get("job_title",""),
            json.dumps(data.get("experience",[])),
            json.dumps(data.get("skills",{})),
            json.dumps(data.get("certifications",[])),
            data.get("summary",""), cv_text[:5000]
        )
        await conn.close()
    except Exception as e:
        print("Profile analysis error:", e)


# ══════════════════════════════════════════════════════════════════════════
# OPPORTUNITIES ROUTES
# ══════════════════════════════════════════════════════════════════════════

@app.get("/opportunities")
async def get_opportunities(
    status: Optional[str] = None,
    opp_type: Optional[str] = None,
    min_score: int = 0,
    limit: int = 50,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    query = """SELECT * FROM opportunities WHERE user_id=$1 AND status != 'archived'
               AND match_score >= $2"""
    params = [user["id"], min_score]

    if status:
        query += " AND status=${}".format(len(params)+1)
        params.append(status)
    if opp_type:
        query += " AND opp_type=${}".format(len(params)+1)
        params.append(opp_type)

    query += " ORDER BY match_score DESC LIMIT ${}".format(len(params)+1)
    params.append(limit)

    rows = await db.fetch(query, *params)
    return {"opportunities": [dict(r) for r in rows]}


@app.patch("/opportunities/{opp_id}/status")
async def update_status(
    opp_id: int,
    status: str,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    await db.execute("""
        UPDATE opportunities SET status=$1 WHERE id=$2 AND user_id=$3
    """, status, opp_id, user["id"])
    return {"ok": True}


@app.get("/opportunities/stats")
async def get_stats(user=Depends(get_current_user), db=Depends(get_db)):
    row = await db.fetchrow("""
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status='analyzed' THEN 1 ELSE 0 END) as ready,
            SUM(CASE WHEN status='applied' THEN 1 ELSE 0 END) as applied,
            SUM(CASE WHEN status='accepted' THEN 1 ELSE 0 END) as accepted,
            SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) as rejected,
            SUM(CASE WHEN deadline IS NOT NULL
                     AND deadline != 'Not found'
                     AND deadline::date <= NOW() + INTERVAL '7 days'
                     THEN 1 ELSE 0 END) as deadline_soon
        FROM opportunities WHERE user_id=$1 AND status != 'archived'
    """, user["id"])
    return dict(row)


# ══════════════════════════════════════════════════════════════════════════
# PIPELINE ROUTES
# ══════════════════════════════════════════════════════════════════════════

@app.post("/pipeline/run")
async def run_pipeline(
    background_tasks: BackgroundTasks,
    opp_types: Optional[List[str]] = None,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """تشغيل البايبلاين لجلب فرص جديدة"""
    # تحقق من حدود الخطة
    limits = PLAN_LIMITS.get(user["plan"], PLAN_LIMITS["free"])
    count = await db.fetchval(
        "SELECT COUNT(*) FROM opportunities WHERE user_id=$1 AND date_found >= date_trunc('month', NOW())",
        user["id"]
    )
    if count >= limits["opportunities_per_month"]:
        raise HTTPException(
            status_code=429,
            detail="Monthly limit reached. Upgrade to Pro for unlimited opportunities."
        )

    # إنشاء run record
    run_id = await db.fetchval("""
        INSERT INTO pipeline_runs (user_id) VALUES ($1) RETURNING id
    """, user["id"])

    background_tasks.add_task(execute_pipeline, user["id"], run_id, opp_types)
    return {"run_id": run_id, "message": "Pipeline started"}


async def execute_pipeline(user_id: int, run_id: int, opp_types=None):
    """تنفيذ البايبلاين في الخلفية"""
    # هذا يستدعي نفس منطق main_pipeline.py لكن مخصص للمستخدم
    pass  # سيكتمل في المرحلة القادمة


# ══════════════════════════════════════════════════════════════════════════
# ADMIN ROUTES (للمالك فقط)
# ══════════════════════════════════════════════════════════════════════════

async def require_owner(user=Depends(get_current_user)):
    if not user["is_owner"]:
        raise HTTPException(status_code=403, detail="Owner access required")
    return user


@app.get("/admin/users")
async def admin_get_users(owner=Depends(require_owner), db=Depends(get_db)):
    rows = await db.fetch("""
        SELECT id, email, full_name, plan, is_active, is_owner,
               opportunities_this_month, created_at, last_login
        FROM users ORDER BY created_at DESC
    """)
    return {"users": [dict(r) for r in rows]}


@app.patch("/admin/users/{user_id}/plan")
async def admin_update_plan(
    user_id: int,
    plan: str,
    owner=Depends(require_owner),
    db=Depends(get_db)
):
    """تغيير خطة أي مستخدم"""
    if plan not in ["free", "pro", "gift", "owner"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    await db.execute("UPDATE users SET plan=$1 WHERE id=$2", plan, user_id)
    return {"ok": True, "user_id": user_id, "new_plan": plan}


@app.patch("/admin/users/{user_id}/toggle")
async def admin_toggle_user(
    user_id: int,
    owner=Depends(require_owner),
    db=Depends(get_db)
):
    """تفعيل/إيقاف مستخدم"""
    await db.execute("""
        UPDATE users SET is_active = NOT is_active WHERE id=$1
    """, user_id)
    row = await db.fetchrow("SELECT is_active FROM users WHERE id=$1", user_id)
    return {"ok": True, "is_active": row["is_active"]}


@app.get("/admin/stats")
async def admin_stats(owner=Depends(require_owner), db=Depends(get_db)):
    stats = await db.fetchrow("""
        SELECT
            COUNT(*) as total_users,
            SUM(CASE WHEN plan='free' THEN 1 ELSE 0 END) as free_users,
            SUM(CASE WHEN plan='pro' THEN 1 ELSE 0 END) as pro_users,
            SUM(CASE WHEN plan='gift' THEN 1 ELSE 0 END) as gift_users,
            SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_users
        FROM users WHERE NOT is_owner
    """)
    opps = await db.fetchval("SELECT COUNT(*) FROM opportunities")
    return {**dict(stats), "total_opportunities": opps}


# ══════════════════════════════════════════════════════════════════════════
# GIFT CODES
# ══════════════════════════════════════════════════════════════════════════

class GiftCodeRequest(BaseModel):
    duration_days: int = 365
    count: int = 1


@app.post("/admin/gifts/create")
async def create_gift_codes(
    data: GiftCodeRequest,
    owner=Depends(require_owner),
    db=Depends(get_db)
):
    """إنشاء أكواد هدايا"""
    import secrets
    codes = []
    for _ in range(data.count):
        code = "OB-" + secrets.token_hex(4).upper()
        expires = datetime.utcnow() + timedelta(days=data.duration_days + 30)
        await db.execute("""
            INSERT INTO gift_codes (code, duration_days, created_by, expires_at)
            VALUES ($1, $2, $3, $4)
        """, code, data.duration_days, owner["id"], expires)
        codes.append(code)
    return {"codes": codes, "duration_days": data.duration_days}


@app.post("/gifts/redeem")
async def redeem_gift(
    code: str,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    """استخدام كود هدية"""
    gift = await db.fetchrow("""
        SELECT * FROM gift_codes
        WHERE code=$1 AND is_active=TRUE AND used_by IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
    """, code.upper())

    if not gift:
        raise HTTPException(status_code=400, detail="Invalid or expired gift code")

    expires = datetime.utcnow() + timedelta(days=gift["duration_days"])
    await db.execute("""
        UPDATE gift_codes SET used_by=$1, used_at=NOW(), is_active=FALSE WHERE id=$2
    """, user["id"], gift["id"])
    await db.execute("""
        UPDATE users SET plan='gift', gift_expires_at=$1, gifted_by=$2 WHERE id=$3
    """, expires, gift["created_by"], user["id"])

    return {"ok": True, "plan": "gift",
            "expires_at": expires.isoformat(),
            "message": "Gift activated! Enjoy Pro features."}


# ══════════════════════════════════════════════════════════════════════════
# CV BUILDER (Pro only)
# ══════════════════════════════════════════════════════════════════════════

@app.post("/cv/build/{opp_id}")
async def build_cv(
    opp_id: int,
    user=Depends(require_plan(["pro", "gift", "owner"])),
    db=Depends(get_db)
):
    """بناء CV مخصص لفرصة (Pro فقط)"""
    opp = await db.fetchrow(
        "SELECT * FROM opportunities WHERE id=$1 AND user_id=$2",
        opp_id, user["id"]
    )
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    profile = await db.fetchrow(
        "SELECT * FROM user_profiles WHERE user_id=$1", user["id"]
    )
    if not profile:
        raise HTTPException(status_code=400, detail="Please upload your CV first")

    return {"message": "CV generation queued", "opp_id": opp_id}


# ══════════════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ══════════════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {"service": "OpportuBot API", "version": "1.0.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
