# OpportuBot SaaS — Deployment Guide

## الهيكل
```
opportubot_saas/
├── backend/          ← FastAPI Python API
│   ├── main.py       ← الـ API الرئيسي
│   ├── requirements.txt
│   └── railway.toml  ← إعدادات Railway
├── frontend/         ← React واجهة المستخدم
│   └── src/
│       ├── App.jsx
│       └── pages/
│           ├── Landing.jsx   ← الصفحة الرئيسية
│           ├── Login.jsx     ← تسجيل الدخول
│           ├── Register.jsx  ← التسجيل
│           ├── Dashboard.jsx ← داشبورد المستخدم
│           └── Admin.jsx     ← لوحة تحكم المالك
└── database/
    └── schema.sql    ← قاعدة البيانات PostgreSQL
```

## خطوات النشر على Railway

### 1. إنشاء حساب Railway
- اذهب لـ railway.app
- سجّل بحساب GitHub

### 2. نشر الـ Backend
```bash
# في مجلد backend:
railway login
railway init
railway up
```

### 3. إضافة قاعدة البيانات
- في Railway dashboard → Add Plugin → PostgreSQL
- سيعطيك DATABASE_URL تلقائياً

### 4. إعداد متغيرات البيئة في Railway
```
ANTHROPIC_API_KEY = sk-ant-...
SERPER_API_KEY    = 07b618bd...
OWNER_EMAIL       = ahmadalbasheer.897@gmail.com
SECRET_KEY        = any-random-secret-string
```

### 5. تشغيل schema قاعدة البيانات
```bash
railway run psql $DATABASE_URL -f database/schema.sql
```

### 6. نشر الـ Frontend على Vercel
```bash
cd frontend
npm install
npm run build
# ثم ارفع على vercel.com
```

## الميزات حسب الخطة

| Feature              | Free | Pro | Gift | Owner |
|----------------------|------|-----|------|-------|
| Opportunities/month  | 50   | ∞   | ∞    | ∞     |
| AI Analysis          | ✅   | ✅  | ✅   | ✅    |
| Dashboard            | ✅   | ✅  | ✅   | ✅    |
| CV Builder           | ❌   | ✅  | ✅   | ✅    |
| Autofill Extension   | ❌   | ✅  | ✅   | ✅    |
| Gmail Integration    | ❌   | ✅  | ✅   | ✅    |
| Follow-up Bot        | ❌   | ✅  | ✅   | ✅    |
| Admin Panel          | ❌   | ❌  | ❌   | ✅    |
| Gift Codes           | ❌   | ❌  | ❌   | ✅    |

## إنشاء كود هدية (للمالك)
```
POST /admin/gifts/create
{"duration_days": 365, "count": 1}
```
سيعطيك كود مثل: OB-A1B2C3D4
أرسله للمستخدم ليفعّل Pro مجاناً.

## التكاليف التقديرية
- Railway (Backend + DB): ~$5/شهر للبداية
- Vercel (Frontend): مجاني
- Anthropic API: ~$0.01 لكل تحليل
- Serper API: 2500 بحث/يوم مجاناً
