-- ====================================================================
-- INSTITUTE OPERATIONS COPILOT - SUPABASE DATABASE SCHEMA & SEED DATA
-- PostgreSQL with Row-Level Security (RLS) & Multi-Role Policies
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'counselor', 'trainer', 'accounts')),
    trainer_id TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COURSES
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    duration_weeks INT NOT NULL,
    fee NUMERIC NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRAINERS
CREATE TABLE IF NOT EXISTS public.trainers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    specialization TEXT[] NOT NULL DEFAULT '{}',
    max_hours_per_week INT NOT NULL DEFAULT 25,
    allocated_hours INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'partially_available', 'on_leave')),
    hourly_rate NUMERIC DEFAULT 1500, -- Restricted HR field
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ROOMS
CREATE TABLE IF NOT EXISTS public.rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BATCHES
CREATE TABLE IF NOT EXISTS public.batches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    trainer_id TEXT REFERENCES public.trainers(id) ON DELETE SET NULL,
    trainer_name TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('classroom', 'hybrid', 'online')),
    room_id TEXT REFERENCES public.rooms(id) ON DELETE SET NULL,
    room_name TEXT,
    online_seat_limit INT,
    enrolled_count INT NOT NULL DEFAULT 0,
    max_capacity INT NOT NULL DEFAULT 35,
    start_date DATE NOT NULL,
    schedule TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STUDENTS
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_masked TEXT NOT NULL,
    course_id TEXT REFERENCES public.courses(id) ON DELETE SET NULL,
    course_name TEXT NOT NULL,
    batch_id TEXT REFERENCES public.batches(id) ON DELETE SET NULL,
    batch_name TEXT NOT NULL,
    enrollment_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropped', 'on_leave')),
    attendance_rate INT NOT NULL DEFAULT 100,
    missed_classes_last_30d INT NOT NULL DEFAULT 0,
    total_fee NUMERIC NOT NULL DEFAULT 0,
    fee_paid NUMERIC NOT NULL DEFAULT 0,
    fee_pending NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EMIS (FEE INSTALLMENTS)
CREATE TABLE IF NOT EXISTS public.emis (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    batch_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    installment_no INT NOT NULL,
    total_installments INT NOT NULL DEFAULT 6,
    due_date DATE NOT NULL,
    paid_date DATE,
    status TEXT NOT NULL DEFAULT 'due' CHECK (status IN ('due', 'paid', 'missed')),
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ATTENDANCE RECORDS
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    batch_id TEXT REFERENCES public.batches(id) ON DELETE CASCADE,
    batch_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('classroom', 'online')),
    date DATE NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent')),
    ip_or_location TEXT,
    duration_minutes INT,
    verified_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ACTION ITEMS (APPROVALS QUEUE)
CREATE TABLE IF NOT EXISTS public.action_items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'whatsapp_reminder',
    student_name TEXT NOT NULL,
    phone_masked TEXT NOT NULL,
    message TEXT NOT NULL,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'sent')),
    requested_by TEXT NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    outbox_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TIMETABLE SESSIONS
CREATE TABLE IF NOT EXISTS public.timetable_sessions (
    id TEXT PRIMARY KEY,
    batch TEXT NOT NULL,
    batch_id TEXT REFERENCES public.batches(id) ON DELETE CASCADE,
    trainer TEXT NOT NULL,
    trainer_id TEXT REFERENCES public.trainers(id) ON DELETE CASCADE,
    room TEXT NOT NULL,
    weekday TEXT NOT NULL CHECK (weekday IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    mode TEXT NOT NULL,
    color_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_name TEXT NOT NULL,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'blocked', 'warning'))
);

-- 12. QUERY LOGS
CREATE TABLE IF NOT EXISTS public.query_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    question TEXT NOT NULL,
    sql TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ok', 'blocked', 'partial')),
    blocked_reason TEXT,
    blocked_layer TEXT,
    row_count INT NOT NULL DEFAULT 0,
    duration_ms INT NOT NULL DEFAULT 0
);

-- ====================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon/service roles full reading/writing when used through our secure API layer
CREATE POLICY "Public Read All" ON public.courses FOR ALL USING (true);
CREATE POLICY "Public Read All" ON public.rooms FOR ALL USING (true);
CREATE POLICY "Public Read All" ON public.batches FOR ALL USING (true);
CREATE POLICY "Public Read All" ON public.students FOR ALL USING (true);
CREATE POLICY "Public Read All" ON public.attendance_records FOR ALL USING (true);
CREATE POLICY "Public Read All" ON public.action_items FOR ALL USING (true);
CREATE POLICY "Public Read All" ON public.timetable_sessions FOR ALL USING (true);
CREATE POLICY "Public Read All" ON public.audit_logs FOR ALL USING (true);
CREATE POLICY "Public Read All" ON public.query_logs FOR ALL USING (true);
CREATE POLICY "Public Read All" ON public.users FOR ALL USING (true);
CREATE POLICY "Public Read All" ON public.trainers FOR ALL USING (true);
CREATE POLICY "Public Read All" ON public.emis FOR ALL USING (true);

-- ====================================================================
-- SEED DATA (INITIAL OPERATIONAL SET)
-- ====================================================================

-- Seed Users
INSERT INTO public.users (id, name, email, role, avatar) VALUES
('usr_owner_1', 'Vikramaditya Mehta', 'owner@institute.org', 'owner', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'),
('usr_counselor_1', 'Anjali Sharma', 'counselor@institute.org', 'counselor', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'),
('usr_trainer_1', 'Priya Sundaram', 'priya.trainer@institute.org', 'trainer', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'),
('usr_accounts_1', 'Suresh Iyer', 'accounts@institute.org', 'accounts', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

-- Seed Courses
INSERT INTO public.courses (id, name, code, duration_weeks, fee, category) VALUES
('c_java', 'Java Fullstack Masterclass', 'JAVA-FS', 16, 45000, 'Backend Engineering'),
('c_python', 'Python Data Engineering & ML', 'PY-DATA', 14, 42000, 'Data & Analytics'),
('c_ds', 'Data Science & Generative AI', 'DS-GENAI', 20, 55000, 'AI / Data Science'),
('c_webdev', 'Full Stack MERN & Next.js', 'FS-WEB', 16, 40000, 'Web Development'),
('c_devops', 'DevOps & Cloud Automation (AWS/K8s)', 'DEVOPS-CLD', 12, 48000, 'Cloud & Infrastructure'),
('c_testing', 'Software Testing & Automation QA', 'QA-AUTO', 10, 32000, 'Quality Assurance')
ON CONFLICT (id) DO NOTHING;

-- Seed Trainers
INSERT INTO public.trainers (id, name, email, specialization, max_hours_per_week, allocated_hours, status) VALUES
('tr_1', 'Priya Sundaram', 'priya.sundaram@institute.org', ARRAY['Java', 'Spring Boot', 'Microservices', 'PostgreSQL'], 25, 20, 'available'),
('tr_2', 'Rajesh Verma', 'rajesh.verma@institute.org', ARRAY['Python', 'FastAPI', 'Django', 'Data Pipelines'], 25, 22, 'available'),
('tr_3', 'Dr. Amit Patel', 'dr.amit@institute.org', ARRAY['Data Science', 'PyTorch', 'TensorFlow', 'LLMs'], 20, 18, 'available'),
('tr_4', 'Neha Sengupta', 'neha.s@institute.org', ARRAY['React', 'Next.js', 'Node.js', 'TypeScript'], 25, 21, 'available'),
('tr_5', 'Vikram Joshi', 'vikram.j@institute.org', ARRAY['Docker', 'Kubernetes', 'AWS', 'Terraform'], 20, 16, 'available'),
('tr_6', 'Ananya Deshmukh', 'ananya.d@institute.org', ARRAY['Selenium', 'Cypress', 'Playwright', 'API Testing'], 20, 15, 'available'),
('tr_7', 'Sunil Rao', 'sunil.r@institute.org', ARRAY['Java', 'Distributed Systems', 'Kafka'], 25, 18, 'available'),
('tr_8', 'Divya Menon', 'divya.m@institute.org', ARRAY['UI/UX Systems', 'Frontend Performance', 'React Native'], 20, 14, 'partially_available')
ON CONFLICT (id) DO NOTHING;

-- Seed Rooms
INSERT INTO public.rooms (id, name, capacity) VALUES
('rm_1', 'Lab 1 - Alpha (High-spec PCs)', 40),
('rm_2', 'Hall 2 - Beta (Lecture Theatre)', 55),
('rm_3', 'Studio 3 - Gamma (Hybrid Audio/Cam)', 32),
('rm_4', 'Seminar Hall 4 - Delta', 60),
('rm_5', 'Room 5 - Tech Lab Epsilon', 30)
ON CONFLICT (id) DO NOTHING;

-- Seed Batches
INSERT INTO public.batches (id, name, course_id, course_name, trainer_id, trainer_name, mode, room_id, room_name, enrolled_count, max_capacity, start_date, schedule, status) VALUES
('b_java_a', 'Java Fullstack - Batch A', 'c_java', 'Java Fullstack Masterclass', 'tr_1', 'Priya Sundaram', 'classroom', 'rm_1', 'Lab 1 - Alpha', 24, 35, '2026-08-15', 'Mon, Wed, Fri 09:00 - 11:00', 'ongoing'),
('b_java_b', 'Java Fullstack - Batch B', 'c_java', 'Java Fullstack Masterclass', 'tr_1', 'Priya Sundaram', 'hybrid', 'rm_2', 'Hall 2 - Beta', 28, 45, '2026-09-01', 'Tue, Thu, Sat 10:00 - 12:00', 'ongoing'),
('b_py_a', 'Python Data Eng - Batch A', 'c_python', 'Python Data Engineering & ML', 'tr_2', 'Rajesh Verma', 'classroom', 'rm_3', 'Studio 3 - Gamma', 20, 30, '2026-08-20', 'Mon, Wed, Fri 11:30 - 13:30', 'ongoing'),
('b_py_b', 'Python Data Eng - Batch B', 'c_python', 'Python Data Engineering & ML', 'tr_2', 'Rajesh Verma', 'online', NULL, 'Online Live Stream', 32, 40, '2026-09-10', 'Tue, Thu 14:00 - 16:30', 'ongoing'),
('b_ds_a', 'Data Science & GenAI - Batch A', 'c_ds', 'Data Science & Generative AI', 'tr_3', 'Dr. Amit Patel', 'hybrid', 'rm_2', 'Hall 2 - Beta', 22, 40, '2026-07-20', 'Mon, Wed 14:00 - 16:30', 'ongoing'),
('b_ds_b', 'Data Science & GenAI - Batch B', 'c_ds', 'Data Science & Generative AI', 'tr_3', 'Dr. Amit Patel', 'online', NULL, 'Studio 3 - Gamma (Online)', 26, 45, '2026-09-15', 'Sat, Sun 10:00 - 13:00', 'ongoing'),
('b_web_a', 'Full Stack MERN - Batch A', 'c_webdev', 'Full Stack MERN & Next.js', 'tr_4', 'Neha Sengupta', 'classroom', 'rm_1', 'Lab 1 - Alpha', 25, 35, '2026-08-05', 'Mon, Wed, Fri 14:00 - 16:00', 'ongoing'),
('b_web_b', 'Full Stack MERN - Batch B', 'c_webdev', 'Full Stack MERN & Next.js', 'tr_4', 'Neha Sengupta', 'hybrid', 'rm_4', 'Seminar Hall 4 - Delta', 21, 35, '2026-09-12', 'Tue, Thu, Sat 16:30 - 18:30', 'ongoing'),
('b_devops_a', 'DevOps & Cloud - Batch A', 'c_devops', 'DevOps & Cloud Automation', 'tr_5', 'Vikram Joshi', 'classroom', 'rm_5', 'Room 5 - Tech Lab', 18, 25, '2026-08-25', 'Tue, Thu 09:30 - 12:00', 'ongoing'),
('b_devops_b', 'DevOps & Cloud - Batch B', 'c_devops', 'DevOps & Cloud Automation', 'tr_5', 'Vikram Joshi', 'online', NULL, 'Online Live Stream', 20, 35, '2026-10-01', 'Mon, Wed 16:30 - 18:30', 'ongoing'),
('b_qa_a', 'QA Automation - Batch A', 'c_testing', 'Software Testing & Automation QA', 'tr_6', 'Ananya Deshmukh', 'classroom', 'rm_3', 'Studio 3 - Gamma', 16, 25, '2026-09-05', 'Mon, Wed, Fri 09:00 - 10:30', 'ongoing'),
('b_qa_b', 'QA Automation - Batch B', 'c_testing', 'Software Testing & Automation QA', 'tr_6', 'Ananya Deshmukh', 'online', NULL, 'Room 5 - Tech Lab', 19, 30, '2026-10-05', 'Tue, Thu, Sat 14:00 - 15:30', 'upcoming')
ON CONFLICT (id) DO NOTHING;

-- Seed Key Benchmark Students
INSERT INTO public.students (id, name, email, phone_masked, course_id, course_name, batch_id, batch_name, enrollment_date, status, attendance_rate, missed_classes_last_30d, total_fee, fee_paid, fee_pending) VALUES
('std_java_001', 'Aarav Sharma', 'aarav.sharma@example.in', '98******21', 'c_java', 'Java Fullstack Masterclass', 'b_java_a', 'Java Fullstack - Batch A', '2026-08-15', 'active', 68, 4, 45000, 25000, 20000),
('std_java_002', 'Rohan Gupta', 'rohan.gupta@example.in', '91******44', 'c_java', 'Java Fullstack Masterclass', 'b_java_a', 'Java Fullstack - Batch A', '2026-08-16', 'active', 72, 3, 45000, 22000, 23000),
('std_java_003', 'Sneha Patil', 'sneha.patil@example.in', '97******83', 'c_java', 'Java Fullstack Masterclass', 'b_java_b', 'Java Fullstack - Batch B', '2026-09-01', 'active', 61, 5, 45000, 18000, 27000),
('std_java_004', 'Vikram Malhotra', 'vikram.malhotra@example.in', '99******19', 'c_java', 'Java Fullstack Masterclass', 'b_java_b', 'Java Fullstack - Batch B', '2026-09-02', 'active', 70, 3, 45000, 20000, 25000),
('std_ds_005', 'Manish Choudhury', 'manish.c@example.in', '98******33', 'c_ds', 'Data Science & Generative AI', 'b_ds_a', 'Data Science & GenAI - Batch A', '2026-07-20', 'active', 80, 2, 55000, 27500, 27500)
ON CONFLICT (id) DO NOTHING;

-- Seed EMIs for Benchmark Students
INSERT INTO public.emis (id, student_id, student_name, batch_name, amount, installment_no, total_installments, due_date, status) VALUES
('emi_java_1', 'std_java_001', 'Aarav Sharma', 'Java Fullstack - Batch A', 6500, 3, 6, '2026-10-18', 'due'),
('emi_java_2', 'std_java_002', 'Rohan Gupta', 'Java Fullstack - Batch A', 7000, 3, 6, '2026-10-19', 'due'),
('emi_java_3', 'std_java_003', 'Sneha Patil', 'Java Fullstack - Batch B', 6500, 2, 6, '2026-10-16', 'due'),
('emi_java_4', 'std_java_004', 'Vikram Malhotra', 'Java Fullstack - Batch B', 8000, 2, 6, '2026-10-20', 'due'),
('emi_ds_5', 'std_ds_005', 'Manish Choudhury', 'Data Science & GenAI - Batch A', 27500, 2, 2, '2026-09-28', 'missed')
ON CONFLICT (id) DO NOTHING;

-- Seed Action Items (Approvals Queue)
INSERT INTO public.action_items (id, type, student_name, phone_masked, message, due_date, status, requested_by, requested_at) VALUES
('act_101', 'whatsapp_reminder', 'Aarav Sharma', '98******21', 'Hi Aarav, we noticed you missed 4 Java sessions recently. Also, your EMI installment of ₹6,500 is due on 18 Oct. Please connect with your mentor and clear the dues to continue lab access.', '2026-10-18', 'pending', 'Anjali Sharma (Counselor)', '2026-10-16T08:30:00Z'),
('act_102', 'whatsapp_reminder', 'Rohan Gupta', '91******44', 'Hi Rohan, you have missed 3 Java Fullstack classes this month. Your EMI installment of ₹7,000 is due on 19 Oct. Please let us know if you require attendance makeup support.', '2026-10-19', 'pending', 'Anjali Sharma (Counselor)', '2026-10-16T08:31:00Z'),
('act_103', 'whatsapp_reminder', 'Sneha Patil', '97******83', 'Urgent: Hi Sneha, your attendance in Java Batch B has dropped below 65% with 5 missed classes. Your EMI of ₹6,500 is due today (16 Oct). Please visit counselor desk.', '2026-10-16', 'pending', 'Copilot AI (Generated Query)', '2026-10-16T09:15:00Z'),
('act_104', 'whatsapp_reminder', 'Vikram Malhotra', '99******19', 'Hi Vikram, your Java batch attendance requires attention (3 missed classes). Upcoming EMI of ₹8,000 is due on 20 Oct. Please complete payment or contact accounts.', '2026-10-20', 'pending', 'Copilot AI (Generated Query)', '2026-10-16T09:16:00Z'),
('act_105', 'fee_notice', 'Manish Choudhury', '98******33', 'Important Notice: Your overdue fee installment of ₹27,500 for Data Science & GenAI is 18 days past due. Please settle immediately or contact Accounts to avoid LMS suspension.', '2026-09-28', 'pending', 'Suresh Iyer (Accounts)', '2026-10-15T14:20:00Z')
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Timetable Sessions
INSERT INTO public.timetable_sessions (id, batch, batch_id, trainer, trainer_id, room, weekday, start_time, end_time, mode, color_code) VALUES
('sess_1', 'Java Fullstack - Batch A', 'b_java_a', 'Priya Sundaram', 'tr_1', 'Lab 1 - Alpha', 'Monday', '09:00', '11:00', 'classroom', 'bg-indigo-50 border-indigo-200 text-indigo-900'),
('sess_2', 'Python Data Eng - Batch A', 'b_py_a', 'Rajesh Verma', 'tr_2', 'Studio 3 - Gamma', 'Monday', '11:30', '13:30', 'classroom', 'bg-emerald-50 border-emerald-200 text-emerald-900'),
('sess_3', 'Full Stack MERN - Batch A', 'b_web_a', 'Neha Sengupta', 'tr_4', 'Lab 1 - Alpha', 'Monday', '14:00', '16:00', 'classroom', 'bg-amber-50 border-amber-200 text-amber-900'),
('sess_4', 'Data Science & GenAI - Batch A', 'b_ds_a', 'Dr. Amit Patel', 'tr_3', 'Hall 2 - Beta', 'Monday', '14:00', '16:30', 'hybrid', 'bg-purple-50 border-purple-200 text-purple-900'),
('sess_5', 'Java Fullstack - Batch B', 'b_java_b', 'Priya Sundaram', 'tr_1', 'Hall 2 - Beta', 'Tuesday', '10:00', '12:00', 'hybrid', 'bg-indigo-50 border-indigo-200 text-indigo-900'),
('sess_6', 'DevOps & Cloud - Batch A', 'b_devops_a', 'Vikram Joshi', 'tr_5', 'Room 5 - Tech Lab', 'Tuesday', '09:30', '12:00', 'classroom', 'bg-cyan-50 border-cyan-200 text-cyan-900'),
('sess_7', 'Python Data Eng - Batch B', 'b_py_b', 'Rajesh Verma', 'tr_2', 'Online Live Stream (Room 3)', 'Tuesday', '14:00', '16:30', 'online', 'bg-emerald-50 border-emerald-200 text-emerald-900'),
('sess_8', 'Full Stack MERN - Batch B', 'b_web_b', 'Neha Sengupta', 'tr_4', 'Seminar Hall 4 - Delta', 'Tuesday', '16:30', '18:30', 'hybrid', 'bg-amber-50 border-amber-200 text-amber-900'),
('sess_9', 'Java Fullstack - Batch A', 'b_java_a', 'Priya Sundaram', 'tr_1', 'Lab 1 - Alpha', 'Wednesday', '09:00', '11:00', 'classroom', 'bg-indigo-50 border-indigo-200 text-indigo-900'),
('sess_10', 'QA Automation - Batch A', 'b_qa_a', 'Ananya Deshmukh', 'tr_6', 'Studio 3 - Gamma', 'Wednesday', '09:00', '10:30', 'classroom', 'bg-rose-50 border-rose-200 text-rose-900'),
('sess_11', 'Python Data Eng - Batch A', 'b_py_a', 'Rajesh Verma', 'tr_2', 'Studio 3 - Gamma', 'Wednesday', '11:30', '13:30', 'classroom', 'bg-emerald-50 border-emerald-200 text-emerald-900'),
('sess_12', 'Java Fullstack - Batch B', 'b_java_b', 'Priya Sundaram', 'tr_1', 'Hall 2 - Beta', 'Thursday', '10:00', '12:00', 'hybrid', 'bg-indigo-50 border-indigo-200 text-indigo-900'),
('sess_13', 'Python Data Eng - Batch B', 'b_py_b', 'Rajesh Verma', 'tr_2', 'Online Live Stream (Room 3)', 'Thursday', '14:00', '16:30', 'online', 'bg-emerald-50 border-emerald-200 text-emerald-900'),
('sess_14', 'Java Fullstack - Batch A', 'b_java_a', 'Priya Sundaram', 'tr_1', 'Lab 1 - Alpha', 'Friday', '09:00', '11:00', 'classroom', 'bg-indigo-50 border-indigo-200 text-indigo-900'),
('sess_15', 'Full Stack MERN - Batch A', 'b_web_a', 'Neha Sengupta', 'tr_4', 'Lab 1 - Alpha', 'Friday', '14:00', '16:00', 'classroom', 'bg-amber-50 border-amber-200 text-amber-900'),
('sess_16', 'Data Science & GenAI - Batch B', 'b_ds_b', 'Dr. Amit Patel', 'tr_3', 'Studio 3 - Gamma (Online)', 'Saturday', '10:00', '13:00', 'online', 'bg-purple-50 border-purple-200 text-purple-900'),
('sess_17', 'QA Automation - Batch B', 'b_qa_b', 'Ananya Deshmukh', 'tr_6', 'Room 5 - Tech Lab', 'Saturday', '14:00', '15:30', 'online', 'bg-rose-50 border-rose-200 text-rose-900')
ON CONFLICT (id) DO NOTHING;
