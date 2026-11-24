-- ====================================================================
-- INSTITUTE OPERATIONS COPILOT - THIRD NORMAL FORM (3NF) SCHEMA
-- PostgreSQL with Row-Level Security (RLS) & Analytical Views
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean existing views and tables if rebuilding
DROP VIEW IF EXISTS public.trainer_safe_students CASCADE;
DROP VIEW IF EXISTS public.trainer_utilization CASCADE;
DROP VIEW IF EXISTS public.emi_due_this_week CASCADE;
DROP VIEW IF EXISTS public.batch_summary CASCADE;
DROP VIEW IF EXISTS public.student_attendance_30d CASCADE;
DROP VIEW IF EXISTS public.student_fee_summary CASCADE;

-- -------------------------------------------------------------
-- 1. USERS & ROLES
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'counselor', 'trainer', 'accounts')),
    trainer_id TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 2. COURSES
-- (Stores pure course master details; fees defined here once)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    duration_weeks INT NOT NULL CHECK (duration_weeks > 0),
    fee NUMERIC(10,2) NOT NULL CHECK (fee >= 0),
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 3. TRAINERS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trainers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    specialization TEXT[] NOT NULL DEFAULT '{}',
    max_hours_per_week INT NOT NULL DEFAULT 25 CHECK (max_hours_per_week > 0),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on_leave', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 4. ROOMS / LABS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 5. BATCHES (3NF)
-- (No duplicated course_name, trainer_name, room_name, or enrolled_count)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.batches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
    trainer_id TEXT NOT NULL REFERENCES public.trainers(id) ON DELETE RESTRICT,
    room_id TEXT REFERENCES public.rooms(id) ON DELETE SET NULL,
    mode TEXT NOT NULL CHECK (mode IN ('classroom', 'online', 'hybrid')),
    max_capacity INT NOT NULL CHECK (max_capacity > 0),
    start_date DATE NOT NULL,
    schedule TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_course ON public.batches(course_id);
CREATE INDEX IF NOT EXISTS idx_batches_trainer ON public.batches(trainer_id);
CREATE INDEX IF NOT EXISTS idx_batches_room ON public.batches(room_id);

-- -------------------------------------------------------------
-- 6. STUDENTS (3NF)
-- (No duplicated course_name, batch_name, fee_paid, fee_pending, attendance_rate, or missed_classes)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    batch_id TEXT NOT NULL REFERENCES public.batches(id) ON DELETE RESTRICT,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropped', 'on_leave')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);

-- -------------------------------------------------------------
-- 7. EMIS (INSTALLMENTS SCHEDULE) (3NF)
-- (No duplicated student_name or batch_name)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.emis (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    installment_no INT NOT NULL CHECK (installment_no > 0),
    total_installments INT NOT NULL CHECK (total_installments >= installment_no),
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'due' CHECK (status IN ('due', 'paid', 'missed', 'waived')),
    paid_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emis_student ON public.emis(student_id);
CREATE INDEX IF NOT EXISTS idx_emis_status_date ON public.emis(status, due_date);

-- -------------------------------------------------------------
-- 8. PAYMENTS (3NF)
-- (Single source of truth for fee collections; fee_paid is computed from here)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    emi_id TEXT REFERENCES public.emis(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    paid_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    method TEXT NOT NULL CHECK (method IN ('upi', 'card', 'bank_transfer', 'cash', 'cheque')),
    transaction_ref TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_emi ON public.payments(emi_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_on ON public.payments(paid_on);

-- -------------------------------------------------------------
-- 9. ATTENDANCE RECORDS (3NF)
-- (No duplicated student_name or batch_name)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    batch_id TEXT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    mode TEXT NOT NULL CHECK (mode IN ('classroom', 'online')),
    duration_minutes INT NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
    verified_by TEXT,
    ip_or_location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_batch ON public.attendance_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(session_date);

-- -------------------------------------------------------------
-- 10. ACTION ITEMS / REMINDERS (3NF)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.action_items (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'rejected', 'failed')),
    requested_by TEXT NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    outbox_reference TEXT
);

CREATE INDEX IF NOT EXISTS idx_actions_student ON public.action_items(student_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON public.action_items(status);

-- -------------------------------------------------------------
-- 11. TIMETABLE SESSIONS (3NF)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.timetable_sessions (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    trainer_id TEXT NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    room_id TEXT REFERENCES public.rooms(id) ON DELETE SET NULL,
    weekday TEXT NOT NULL CHECK (weekday IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('classroom', 'online', 'hybrid')),
    color_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_timetable_batch ON public.timetable_sessions(batch_id);
CREATE INDEX IF NOT EXISTS idx_timetable_trainer ON public.timetable_sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_timetable_weekday ON public.timetable_sessions(weekday);

-- -------------------------------------------------------------
-- 12. PAYMENT RECONCILIATIONS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_reconciliations (
    id TEXT PRIMARY KEY,
    emi_id TEXT REFERENCES public.emis(id) ON DELETE SET NULL,
    utr_number TEXT UNIQUE NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'unmatched' CHECK (status IN ('unmatched', 'reconciled', 'disputed')),
    payer_name TEXT NOT NULL,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 13. CERTIFICATIONS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificates (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    verification_code TEXT UNIQUE NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'revoked')),
    signatory TEXT NOT NULL,
    certificate_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 14. CLASS RECORDINGS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_recordings (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    recording_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    source TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    views_count INT NOT NULL DEFAULT 0,
    key_timestamps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 15. DROPOUT INTERVENTIONS & AUDIT LOGS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dropout_interventions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    notes TEXT,
    intervened_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    status TEXT NOT NULL DEFAULT 'success',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.query_logs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    sql TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'EXECUTED',
    blocked_reason TEXT,
    blocked_layer TEXT,
    row_count INT NOT NULL DEFAULT 0,
    duration_ms INT NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- SQL VIEWS FOR DERIVED DATA (CLEAN 3NF ABSTRACTION)
-- ====================================================================

-- View 1: student_fee_summary
-- Computes total_fee, fee_paid, fee_pending, and overdue amounts cleanly from payments & emis
CREATE OR REPLACE VIEW public.student_fee_summary AS
SELECT
    s.id AS student_id,
    s.name AS student_name,
    s.email,
    s.phone,
    s.status AS student_status,
    s.enrollment_date,
    b.id AS batch_id,
    b.name AS batch_name,
    c.id AS course_id,
    c.name AS course_name,
    c.fee AS total_fee,
    COALESCE(p.paid_amount, 0)::NUMERIC(10,2) AS fee_paid,
    GREATEST(0, c.fee - COALESCE(p.paid_amount, 0))::NUMERIC(10,2) AS fee_pending,
    COALESCE(e.overdue_count, 0) AS overdue_emis_count,
    COALESCE(e.overdue_amount, 0)::NUMERIC(10,2) AS total_overdue_amount
FROM public.students s
JOIN public.batches b ON s.batch_id = b.id
JOIN public.courses c ON b.course_id = c.id
LEFT JOIN (
    SELECT student_id, SUM(amount) AS paid_amount
    FROM public.payments
    GROUP BY student_id
) p ON s.id = p.student_id
LEFT JOIN (
    SELECT
        student_id,
        COUNT(*) AS overdue_count,
        SUM(amount) AS overdue_amount
    FROM public.emis
    WHERE (status = 'missed' OR (status = 'due' AND due_date < CURRENT_DATE))
    GROUP BY student_id
) e ON s.id = e.student_id;

-- View 2: student_attendance_30d
-- Computes total sessions, attended, missed, and attendance rate for the last 30 days
CREATE OR REPLACE VIEW public.student_attendance_30d AS
SELECT
    s.id AS student_id,
    s.name AS student_name,
    s.batch_id,
    COUNT(a.id) AS total_sessions_30d,
    COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END) AS attended_sessions_30d,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS missed_classes_last_30d,
    CASE
        WHEN COUNT(a.id) = 0 THEN 100.0
        ELSE ROUND((COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::NUMERIC * 100.0) / COUNT(a.id)::NUMERIC, 1)
    END AS attendance_rate_30d,
    -- Overall all-time attendance rate
    COALESCE(all_time.overall_attendance_rate, 100.0) AS attendance_rate
FROM public.students s
LEFT JOIN public.attendance_records a
    ON s.id = a.student_id
    AND a.session_date >= (CURRENT_DATE - INTERVAL '30 days')
LEFT JOIN (
    SELECT
        student_id,
        CASE
            WHEN COUNT(*) = 0 THEN 100.0
            ELSE ROUND((COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END)::NUMERIC * 100.0) / COUNT(*)::NUMERIC, 1)
        END AS overall_attendance_rate
    FROM public.attendance_records
    GROUP BY student_id
) all_time ON s.id = all_time.student_id
GROUP BY s.id, s.name, s.batch_id, all_time.overall_attendance_rate;

-- View 3: batch_summary
-- Aggregates batch enrollment, capacity, and average cohort attendance rate
CREATE OR REPLACE VIEW public.batch_summary AS
SELECT
    b.id,
    b.name,
    b.course_id,
    c.name AS course_name,
    b.trainer_id,
    t.name AS trainer_name,
    b.room_id,
    COALESCE(r.name, 'Online / Virtual') AS room_name,
    b.mode,
    b.max_capacity,
    b.start_date,
    b.schedule,
    b.status,
    COUNT(DISTINCT s.id) AS enrolled_count,
    COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS active_students_count,
    ROUND(b.max_capacity - COUNT(DISTINCT s.id), 0) AS seats_remaining,
    COALESCE(
        ROUND(AVG(att.attendance_rate), 1),
        85.0
    ) AS batch_attendance_rate
FROM public.batches b
JOIN public.courses c ON b.course_id = c.id
JOIN public.trainers t ON b.trainer_id = t.id
LEFT JOIN public.rooms r ON b.room_id = r.id
LEFT JOIN public.students s ON b.id = s.batch_id
LEFT JOIN public.student_attendance_30d att ON s.id = att.student_id
GROUP BY b.id, b.name, b.course_id, c.name, b.trainer_id, t.name, b.room_id, r.name, b.mode, b.max_capacity, b.start_date, b.schedule, b.status;

-- View 4: emi_due_this_week
-- Identifies upcoming or recently overdue EMIs due within 7 days
CREATE OR REPLACE VIEW public.emi_due_this_week AS
SELECT
    e.id AS emi_id,
    e.student_id,
    s.name AS student_name,
    s.phone,
    b.name AS batch_name,
    e.amount,
    e.installment_no,
    e.total_installments,
    e.due_date,
    e.status,
    GREATEST(0, (CURRENT_DATE - e.due_date)) AS days_overdue
FROM public.emis e
JOIN public.students s ON e.student_id = s.id
JOIN public.batches b ON s.batch_id = b.id
WHERE e.status != 'paid'
  AND e.due_date BETWEEN (CURRENT_DATE - INTERVAL '7 days') AND (CURRENT_DATE + INTERVAL '7 days')
ORDER BY e.due_date ASC;

-- View 5: trainer_utilization
-- Computes weekly teaching hours and capacity utilization per trainer
CREATE OR REPLACE VIEW public.trainer_utilization AS
SELECT
    t.id,
    t.name,
    t.email,
    t.specialization,
    t.max_hours_per_week,
    t.status,
    COUNT(DISTINCT b.id) AS active_batches_count,
    COALESCE(
        ROUND(
            SUM(
                EXTRACT(EPOCH FROM (ts.end_time - ts.start_time)) / 3600.0
            ), 1
        ), 0
    ) AS allocated_hours,
    ROUND(
        (COALESCE(SUM(EXTRACT(EPOCH FROM (ts.end_time - ts.start_time)) / 3600.0), 0) * 100.0)
        / NULLIF(t.max_hours_per_week, 0),
        1
    ) AS utilization_pct
FROM public.trainers t
LEFT JOIN public.batches b ON t.id = b.trainer_id AND b.status = 'ongoing'
LEFT JOIN public.timetable_sessions ts ON b.id = ts.batch_id AND t.id = ts.trainer_id
GROUP BY t.id, t.name, t.email, t.specialization, t.max_hours_per_week, t.status;

-- View 6: trainer_safe_students
-- Strictly excludes phone number and all financial/fee details for faculty access
CREATE OR REPLACE VIEW public.trainer_safe_students AS
SELECT
    s.id AS student_id,
    s.name,
    s.batch_id,
    b.name AS batch_name,
    c.name AS course_name,
    s.enrollment_date,
    s.status,
    COALESCE(att.attendance_rate, 100.0) AS attendance_rate,
    COALESCE(att.missed_classes_last_30d, 0) AS missed_classes_last_30d
FROM public.students s
JOIN public.batches b ON s.batch_id = b.id
JOIN public.courses c ON b.course_id = c.id
LEFT JOIN public.student_attendance_30d att ON s.id = att.student_id;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropout_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role (backend API) full access to all tables
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS service_role_all ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY service_role_all ON public.%I FOR ALL TO authenticated, service_role, anon USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END $$;

-- ====================================================================
-- READ-ONLY SAFE SQL QUERY RUNNER (Statement Timeout: 3 seconds)
-- Used by Copilot Text-to-SQL pipeline for secure execution
-- ====================================================================
CREATE OR REPLACE FUNCTION public.run_readonly_query(sql_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout TO '3s'
AS $$
DECLARE
    result jsonb;
    clean_sql text;
BEGIN
    clean_sql := trim(sql_text);

    -- Reject data modification / DDL statements
    IF clean_sql ~* '\m(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|call|do)\M' THEN
        RAISE EXCEPTION 'Security Refusal: Only read-only SELECT statements are permitted.';
    END IF;

    -- Reject semicolon-separated multiple statements
    IF clean_sql ~ ';.+' THEN
        RAISE EXCEPTION 'Security Refusal: Multiple statement execution is prohibited.';
    END IF;

    clean_sql := rtrim(clean_sql, ';');

    -- Execute read-only SELECT and aggregate into JSON array
    EXECUTE format('SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t', clean_sql)
    INTO result;

    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.run_readonly_query(text) TO authenticated, service_role, anon;
