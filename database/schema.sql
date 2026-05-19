-- OpportuBot SaaS Database Schema
-- PostgreSQL

-- ══════════════════════════════════════════
-- USERS
-- ══════════════════════════════════════════
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    full_name       TEXT,
    plan            TEXT DEFAULT 'free',     -- free | pro | gift | owner
    is_active       BOOLEAN DEFAULT TRUE,
    is_owner        BOOLEAN DEFAULT FALSE,
    gifted_by       INTEGER REFERENCES users(id),
    gift_expires_at TIMESTAMP,
    opportunities_this_month INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW(),
    last_login      TIMESTAMP
);

-- ══════════════════════════════════════════
-- USER PROFILES (CV data)
-- ══════════════════════════════════════════
CREATE TABLE user_profiles (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name   TEXT,
    email       TEXT,
    phone       TEXT,
    location    TEXT,
    nationality TEXT,
    linkedin    TEXT,
    degree      TEXT,
    major       TEXT,
    university  TEXT,
    grad_year   TEXT,
    job_title   TEXT,
    experience  TEXT,     -- JSON array
    skills      TEXT,     -- JSON object
    certifications TEXT,  -- JSON array
    summary     TEXT,
    raw_cv_text TEXT,
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- OPPORTUNITIES
-- ══════════════════════════════════════════
CREATE TABLE opportunities (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    opp_type        TEXT,
    title           TEXT,
    url             TEXT,
    content         TEXT,
    match_score     INTEGER DEFAULT 0,
    deadline        TEXT,
    target_email    TEXT,
    apply_url       TEXT,
    cover_letter    TEXT,
    status          TEXT DEFAULT 'new',
    notes           TEXT,
    nationality_eligible BOOLEAN DEFAULT TRUE,
    nationality_note TEXT,
    date_found      TEXT,
    date_applied    TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- PIPELINE RUNS
-- ══════════════════════════════════════════
CREATE TABLE pipeline_runs (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    run_at      TIMESTAMP DEFAULT NOW(),
    found       INTEGER DEFAULT 0,
    analyzed    INTEGER DEFAULT 0,
    status      TEXT DEFAULT 'running'
);

-- ══════════════════════════════════════════
-- SUBSCRIPTIONS / PAYMENTS
-- ══════════════════════════════════════════
CREATE TABLE subscriptions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan        TEXT,
    starts_at   TIMESTAMP DEFAULT NOW(),
    expires_at  TIMESTAMP,
    payment_ref TEXT,
    is_active   BOOLEAN DEFAULT TRUE
);

-- ══════════════════════════════════════════
-- GIFT CODES
-- ══════════════════════════════════════════
CREATE TABLE gift_codes (
    id          SERIAL PRIMARY KEY,
    code        TEXT UNIQUE NOT NULL,
    plan        TEXT DEFAULT 'pro',
    duration_days INTEGER DEFAULT 365,
    created_by  INTEGER REFERENCES users(id),
    used_by     INTEGER REFERENCES users(id),
    used_at     TIMESTAMP,
    expires_at  TIMESTAMP,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════
CREATE INDEX idx_opps_user     ON opportunities(user_id);
CREATE INDEX idx_opps_status   ON opportunities(status);
CREATE INDEX idx_opps_score    ON opportunities(match_score DESC);
CREATE INDEX idx_users_email   ON users(email);
CREATE INDEX idx_users_plan    ON users(plan);
