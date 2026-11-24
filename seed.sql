-- ====================================================================
-- INSTITUTE OPERATIONS COPILOT - REALISTIC SEED DATA (3NF)
-- Dynamic dates relative to CURRENT_DATE to guarantee perpetual freshness.
-- Run this AFTER executing supabase_schema.sql.
-- ====================================================================

-- 1. USERS (Demo Accounts: Password for all is "password123")
INSERT INTO public.users (id, name, email, password_hash, role, trainer_id, avatar) VALUES
('usr_owner_1', 'Vikramaditya Mehta', 'owner@institute.org', '$2b$12$DNOOHkoUunYI2h47v74bYeJUtXypfZ.nxEeAvQ6KZ72Q4x2wRDqdO', 'owner', NULL, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'),
('usr_counselor_1', 'Anjali Sharma', 'counselor@institute.org', '$2b$12$DNOOHkoUunYI2h47v74bYeJUtXypfZ.nxEeAvQ6KZ72Q4x2wRDqdO', 'counselor', NULL, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'),
('usr_trainer_1', 'Priya Sundaram', 'priya.trainer@institute.org', '$2b$12$DNOOHkoUunYI2h47v74bYeJUtXypfZ.nxEeAvQ6KZ72Q4x2wRDqdO', 'trainer', 'tr_1', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'),
('usr_accounts_1', 'Suresh Iyer', 'accounts@institute.org', '$2b$12$DNOOHkoUunYI2h47v74bYeJUtXypfZ.nxEeAvQ6KZ72Q4x2wRDqdO', 'accounts', NULL, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- 2. COURSES (Master fee definitions)
INSERT INTO public.courses (id, name, code, duration_weeks, fee, category) VALUES
('c_java', 'Java Fullstack Masterclass', 'JAVA-FS', 16, 45000, 'Backend Engineering'),
('c_python', 'Python Data Engineering & ML', 'PY-DATA', 14, 42000, 'Data & Analytics'),
('c_ds', 'Data Science & Generative AI', 'DS-GENAI', 20, 55000, 'AI / Data Science'),
('c_webdev', 'Full Stack MERN & Next.js', 'FS-WEB', 16, 40000, 'Web Development'),
('c_devops', 'DevOps & Cloud Automation', 'DEVOPS-CLD', 12, 48000, 'Cloud Infrastructure'),
('c_testing', 'Software Testing & Automation QA', 'QA-AUTO', 10, 32000, 'Quality Assurance')
ON CONFLICT (id) DO NOTHING;

-- 3. TRAINERS
INSERT INTO public.trainers (id, name, email, specialization, max_hours_per_week, status) VALUES
('tr_1', 'Priya Sundaram', 'priya.sundaram@institute.org', ARRAY['Java', 'Spring Boot', 'Microservices', 'PostgreSQL'], 25, 'available'),
('tr_2', 'Rajesh Verma', 'rajesh.verma@institute.org', ARRAY['Python', 'FastAPI', 'Data Pipelines', 'Airflow'], 25, 'available'),
('tr_3', 'Dr. Amit Patel', 'dr.amit@institute.org', ARRAY['Data Science', 'PyTorch', 'TensorFlow', 'LLMs'], 20, 'available'),
('tr_4', 'Neha Sengupta', 'neha.s@institute.org', ARRAY['React', 'Next.js', 'Node.js', 'TypeScript'], 25, 'available'),
('tr_5', 'Vikram Joshi', 'vikram.j@institute.org', ARRAY['Docker', 'Kubernetes', 'AWS', 'Terraform'], 20, 'available')
ON CONFLICT (id) DO NOTHING;

-- 4. ROOMS
INSERT INTO public.rooms (id, name, capacity) VALUES
('rm_1', 'Lab 1 - Alpha (High-spec PCs)', 40),
('rm_2', 'Hall 2 - Beta (Lecture Theatre)', 55),
('rm_3', 'Studio 3 - Gamma (Hybrid Audio/Cam)', 32),
('rm_4', 'Seminar Hall 4 - Delta', 60),
('rm_5', 'Room 5 - Tech Lab Epsilon', 30)
ON CONFLICT (id) DO NOTHING;

-- 5. BATCHES (Notice: b_ds_a is nearly full with capacity 25, and b_java_a is full cohort)
INSERT INTO public.batches (id, name, course_id, trainer_id, room_id, mode, max_capacity, start_date, schedule, status) VALUES
('b_java_a', 'Java Fullstack - Batch A', 'c_java', 'tr_1', 'rm_1', 'classroom', 35, CURRENT_DATE - INTERVAL '45 days', 'Mon, Wed, Fri 09:00 - 11:00', 'ongoing'),
('b_java_b', 'Java Fullstack - Batch B', 'c_java', 'tr_1', 'rm_2', 'hybrid', 30, CURRENT_DATE - INTERVAL '30 days', 'Tue, Thu, Sat 10:00 - 12:00', 'ongoing'),
('b_py_a', 'Python Data Eng - Batch A', 'c_python', 'tr_2', 'rm_3', 'classroom', 30, CURRENT_DATE - INTERVAL '40 days', 'Mon, Wed, Fri 11:30 - 13:30', 'ongoing'),
('b_py_b', 'Python Data Eng - Batch B', 'c_python', 'tr_2', NULL, 'online', 40, CURRENT_DATE - INTERVAL '20 days', 'Tue, Thu 14:00 - 16:30', 'ongoing'),
('b_ds_a', 'Data Science & GenAI - Batch A', 'c_ds', 'tr_3', 'rm_2', 'hybrid', 12, CURRENT_DATE - INTERVAL '50 days', 'Mon, Wed 14:00 - 16:30', 'ongoing'),
('b_web_a', 'Full Stack MERN - Batch A', 'c_webdev', 'tr_4', 'rm_1', 'classroom', 25, CURRENT_DATE - INTERVAL '15 days', 'Mon, Wed, Fri 14:00 - 16:00', 'ongoing')
ON CONFLICT (id) DO NOTHING;

-- 6. STUDENTS (35 students across India with varied statuses)
INSERT INTO public.students (id, name, email, phone, batch_id, enrollment_date, status) VALUES
-- Batch Java A
('std_101', 'Aarav Sharma', 'aarav.sharma@example.in', '9876543210', 'b_java_a', CURRENT_DATE - INTERVAL '45 days', 'active'),
('std_102', 'Rohan Gupta', 'rohan.gupta@example.in', '9812345678', 'b_java_a', CURRENT_DATE - INTERVAL '45 days', 'active'),
('std_103', 'Sneha Patil', 'sneha.patil@example.in', '9723456789', 'b_java_a', CURRENT_DATE - INTERVAL '44 days', 'active'),
('std_104', 'Vikram Malhotra', 'vikram.m@example.in', '9934567890', 'b_java_a', CURRENT_DATE - INTERVAL '44 days', 'active'),
('std_105', 'Karthik Ramanathan', 'karthik.r@example.in', '9445678901', 'b_java_a', CURRENT_DATE - INTERVAL '43 days', 'active'),
('std_106', 'Divya Nair', 'divya.nair@example.in', '9496789012', 'b_java_a', CURRENT_DATE - INTERVAL '43 days', 'active'),

-- Batch Java B
('std_107', 'Pooja Hegde', 'pooja.h@example.in', '9880123456', 'b_java_b', CURRENT_DATE - INTERVAL '30 days', 'active'),
('std_108', 'Arjun Reddy', 'arjun.reddy@example.in', '9848123456', 'b_java_b', CURRENT_DATE - INTERVAL '30 days', 'active'),
('std_109', 'Meera Mukherjee', 'meera.m@example.in', '9830123456', 'b_java_b', CURRENT_DATE - INTERVAL '29 days', 'active'),
('std_110', 'Rohan Verma', 'rohan.verma@example.in', '9810123456', 'b_java_b', CURRENT_DATE - INTERVAL '29 days', 'dropped'), -- DROPPED STUDENT
('std_111', 'Sanjay Bhatt', 'sanjay.b@example.in', '9412123456', 'b_java_b', CURRENT_DATE - INTERVAL '28 days', 'active'),

-- Batch Python A
('std_112', 'Tanvi Deshmukh', 'tanvi.d@example.in', '9822123456', 'b_py_a', CURRENT_DATE - INTERVAL '40 days', 'active'),
('std_113', 'Abhishek Banerjee', 'abhishek.b@example.in', '9831123456', 'b_py_a', CURRENT_DATE - INTERVAL '40 days', 'active'),
('std_114', 'Naveen Kumar', 'naveen.k@example.in', '9845123456', 'b_py_a', CURRENT_DATE - INTERVAL '39 days', 'active'),
('std_115', 'Ananya Sen', 'ananya.sen@example.in', '9832123456', 'b_py_a', CURRENT_DATE - INTERVAL '39 days', 'on_leave'), -- ON LEAVE STUDENT
('std_116', 'Rahul Dravid Rao', 'rahul.rao@example.in', '9886123456', 'b_py_a', CURRENT_DATE - INTERVAL '38 days', 'active'),

-- Batch Python B (Online)
('std_117', 'Harsh Vardhan', 'harsh.v@example.in', '9910123456', 'b_py_b', CURRENT_DATE - INTERVAL '20 days', 'active'),
('std_118', 'Kavita Sundar', 'kavita.s@example.in', '9841123456', 'b_py_b', CURRENT_DATE - INTERVAL '20 days', 'active'),
('std_119', 'Mohammed Farhan', 'm.farhan@example.in', '9849123456', 'b_py_b', CURRENT_DATE - INTERVAL '19 days', 'active'),
('std_120', 'Shreya Ghoshal', 'shreya.g@example.in', '9820123456', 'b_py_b', CURRENT_DATE - INTERVAL '19 days', 'active'),

-- Batch Data Science & GenAI (b_ds_a: Near capacity with 11 students out of 12 max_capacity)
('std_121', 'Manish Choudhury', 'manish.c@example.in', '9864123456', 'b_ds_a', CURRENT_DATE - INTERVAL '50 days', 'active'),
('std_122', 'Ritu Saxena', 'ritu.saxena@example.in', '9818123456', 'b_ds_a', CURRENT_DATE - INTERVAL '50 days', 'active'),
('std_123', 'Gautam Gambhir', 'gautam.g@example.in', '9811123456', 'b_ds_a', CURRENT_DATE - INTERVAL '49 days', 'active'),
('std_124', 'Preeti Menon', 'preeti.m@example.in', '9447123456', 'b_ds_a', CURRENT_DATE - INTERVAL '49 days', 'active'),
('std_125', 'Nikhil Joshi', 'nikhil.j@example.in', '9823123456', 'b_ds_a', CURRENT_DATE - INTERVAL '48 days', 'active'),
('std_126', 'Swati Kulshrestha', 'swati.k@example.in', '9891123456', 'b_ds_a', CURRENT_DATE - INTERVAL '48 days', 'active'),
('std_127', 'Prateek Shukla', 'prateek.s@example.in', '9871123456', 'b_ds_a', CURRENT_DATE - INTERVAL '47 days', 'active'),
('std_128', 'Isha Singhania', 'isha.s@example.in', '9821123456', 'b_ds_a', CURRENT_DATE - INTERVAL '47 days', 'active'),
('std_129', 'Deepak Chawla', 'deepak.c@example.in', '9810987654', 'b_ds_a', CURRENT_DATE - INTERVAL '46 days', 'active'),
('std_130', 'Anuradha Roy', 'anuradha.r@example.in', '9830987654', 'b_ds_a', CURRENT_DATE - INTERVAL '46 days', 'active'),
('std_131', 'Varun Dhawan', 'varun.d@example.in', '9820987654', 'b_ds_a', CURRENT_DATE - INTERVAL '45 days', 'active'),

-- Batch WebDev
('std_132', 'Aditya Roy Kapoor', 'aditya.r@example.in', '9820456789', 'b_web_a', CURRENT_DATE - INTERVAL '15 days', 'active'),
('std_133', 'Kriti Sanon', 'kriti.s@example.in', '9811456789', 'b_web_a', CURRENT_DATE - INTERVAL '15 days', 'active'),
('std_134', 'Ayushmann Khurrana', 'ayushmann.k@example.in', '9818456789', 'b_web_a', CURRENT_DATE - INTERVAL '14 days', 'active'),
('std_135', 'Radhika Madan', 'radhika.m@example.in', '9891456789', 'b_web_a', CURRENT_DATE - INTERVAL '14 days', 'active')
ON CONFLICT (id) DO NOTHING;

-- 7. EMIS (Installment schedules with a few overdue/missed)
INSERT INTO public.emis (id, student_id, amount, installment_no, total_installments, due_date, status, paid_date) VALUES
-- Aarav: EMI 1 paid, EMI 2 paid, EMI 3 due yesterday (OVERDUE)
('emi_101_1', 'std_101', 7500, 1, 6, CURRENT_DATE - INTERVAL '40 days', 'paid', CURRENT_DATE - INTERVAL '41 days'),
('emi_101_2', 'std_101', 7500, 2, 6, CURRENT_DATE - INTERVAL '10 days', 'paid', CURRENT_DATE - INTERVAL '11 days'),
('emi_101_3', 'std_101', 7500, 3, 6, CURRENT_DATE - INTERVAL '1 day', 'missed', NULL),

-- Rohan Gupta: EMI 1 paid, EMI 2 due in 3 days
('emi_102_1', 'std_102', 7500, 1, 6, CURRENT_DATE - INTERVAL '40 days', 'paid', CURRENT_DATE - INTERVAL '40 days'),
('emi_102_2', 'std_102', 7500, 2, 6, CURRENT_DATE + INTERVAL '3 days', 'due', NULL),

-- Sneha Patil: Overdue EMI by 5 days
('emi_103_1', 'std_103', 7500, 1, 6, CURRENT_DATE - INTERVAL '38 days', 'paid', CURRENT_DATE - INTERVAL '38 days'),
('emi_103_2', 'std_103', 7500, 2, 6, CURRENT_DATE - INTERVAL '5 days', 'missed', NULL),

-- Vikram Malhotra: EMI due in 2 days
('emi_104_1', 'std_104', 7500, 1, 6, CURRENT_DATE - INTERVAL '35 days', 'paid', CURRENT_DATE - INTERVAL '35 days'),
('emi_104_2', 'std_104', 7500, 2, 6, CURRENT_DATE + INTERVAL '2 days', 'due', NULL),

-- Manish Choudhury (DS course: fee 55,000, 2 installments of 27,500): 1 paid, 2 missed 12 days ago
('emi_121_1', 'std_121', 27500, 1, 2, CURRENT_DATE - INTERVAL '45 days', 'paid', CURRENT_DATE - INTERVAL '46 days'),
('emi_121_2', 'std_121', 27500, 2, 2, CURRENT_DATE - INTERVAL '12 days', 'missed', NULL),

-- Ritu Saxena: 1 paid, 2 due in 5 days
('emi_122_1', 'std_122', 27500, 1, 2, CURRENT_DATE - INTERVAL '45 days', 'paid', CURRENT_DATE - INTERVAL '45 days'),
('emi_122_2', 'std_122', 27500, 2, 2, CURRENT_DATE + INTERVAL '5 days', 'due', NULL),

-- Deepak Chawla: overdue by 8 days
('emi_129_1', 'std_129', 27500, 1, 2, CURRENT_DATE - INTERVAL '42 days', 'paid', CURRENT_DATE - INTERVAL '42 days'),
('emi_129_2', 'std_129', 27500, 2, 2, CURRENT_DATE - INTERVAL '8 days', 'missed', NULL)
ON CONFLICT (id) DO NOTHING;

-- 8. PAYMENTS (Truth for fee_paid)
INSERT INTO public.payments (id, student_id, emi_id, amount, paid_on, method, transaction_ref, notes) VALUES
('pay_101_1', 'std_101', 'emi_101_1', 7500, CURRENT_DATE - INTERVAL '41 days', 'upi', 'UPI/321876543210/HDFC', 'Installment 1 paid via GPay'),
('pay_101_2', 'std_101', 'emi_101_2', 7500, CURRENT_DATE - INTERVAL '11 days', 'bank_transfer', 'NEFT/N1029384756', 'Installment 2 paid via NetBanking'),
('pay_102_1', 'std_102', 'emi_102_1', 7500, CURRENT_DATE - INTERVAL '40 days', 'upi', 'UPI/321987654321/ICIC', 'Installment 1 paid via PhonePe'),
('pay_103_1', 'std_103', 'emi_103_1', 7500, CURRENT_DATE - INTERVAL '38 days', 'card', 'POS/CARD/9876', 'Debit card swipe at front desk'),
('pay_104_1', 'std_104', 'emi_104_1', 7500, CURRENT_DATE - INTERVAL '35 days', 'upi', 'UPI/321456789012/SBIN', 'Installment 1 UPI'),
('pay_121_1', 'std_121', 'emi_121_1', 27500, CURRENT_DATE - INTERVAL '46 days', 'bank_transfer', 'RTGS/R20261015887', 'Term 1 RTGS Transfer'),
('pay_122_1', 'std_122', 'emi_122_1', 27500, CURRENT_DATE - INTERVAL '45 days', 'upi', 'UPI/321776543211/AXIS', 'Term 1 UPI Payment'),
('pay_129_1', 'std_129', 'emi_129_1', 27500, CURRENT_DATE - INTERVAL '42 days', 'cheque', 'CHQ/887654/HDFC', 'Cheque cleared')
ON CONFLICT (id) DO NOTHING;

-- 9. ATTENDANCE RECORDS (Uneven attendance across 10 recent dates)
INSERT INTO public.attendance_records (id, student_id, batch_id, session_date, status, mode, duration_minutes, verified_by, ip_or_location) VALUES
-- Aarav Sharma (Good attendance ~85%)
('att_01', 'std_101', 'b_java_a', CURRENT_DATE - INTERVAL '14 days', 'present', 'classroom', 120, 'Front Desk Biometrics', 'Alpha Lab Door 1'),
('att_02', 'std_101', 'b_java_a', CURRENT_DATE - INTERVAL '12 days', 'present', 'classroom', 120, 'Front Desk Biometrics', 'Alpha Lab Door 1'),
('att_03', 'std_101', 'b_java_a', CURRENT_DATE - INTERVAL '10 days', 'absent', 'classroom', 0, 'Counselor Station', NULL),
('att_04', 'std_101', 'b_java_a', CURRENT_DATE - INTERVAL '7 days', 'present', 'classroom', 120, 'Front Desk Biometrics', 'Alpha Lab Door 1'),
('att_05', 'std_101', 'b_java_a', CURRENT_DATE - INTERVAL '5 days', 'absent', 'classroom', 0, 'Counselor Station', NULL),
('att_06', 'std_101', 'b_java_a', CURRENT_DATE - INTERVAL '2 days', 'present', 'classroom', 120, 'Front Desk Biometrics', 'Alpha Lab Door 1'),

-- Sneha Patil (Low attendance ~60% -> Dropout Risk)
('att_07', 'std_103', 'b_java_a', CURRENT_DATE - INTERVAL '14 days', 'absent', 'classroom', 0, 'Counselor Station', NULL),
('att_08', 'std_103', 'b_java_a', CURRENT_DATE - INTERVAL '12 days', 'present', 'classroom', 120, 'Front Desk Biometrics', 'Alpha Lab Door 1'),
('att_09', 'std_103', 'b_java_a', CURRENT_DATE - INTERVAL '10 days', 'absent', 'classroom', 0, 'Counselor Station', NULL),
('att_10', 'std_103', 'b_java_a', CURRENT_DATE - INTERVAL '7 days', 'absent', 'classroom', 0, 'Counselor Station', NULL),
('att_11', 'std_103', 'b_java_a', CURRENT_DATE - INTERVAL '5 days', 'absent', 'classroom', 0, 'Counselor Station', NULL),
('att_12', 'std_103', 'b_java_a', CURRENT_DATE - INTERVAL '2 days', 'present', 'classroom', 110, 'Front Desk Biometrics', 'Alpha Lab Door 1'),

-- Manish Choudhury (High Risk: absent repeatedly + missed fees)
('att_13', 'std_121', 'b_ds_a', CURRENT_DATE - INTERVAL '14 days', 'absent', 'online', 0, 'Zoom WebRTC Hook', NULL),
('att_14', 'std_121', 'b_ds_a', CURRENT_DATE - INTERVAL '11 days', 'absent', 'online', 0, 'Zoom WebRTC Hook', NULL),
('att_15', 'std_121', 'b_ds_a', CURRENT_DATE - INTERVAL '9 days', 'absent', 'online', 0, 'Zoom WebRTC Hook', NULL),
('att_16', 'std_121', 'b_ds_a', CURRENT_DATE - INTERVAL '6 days', 'present', 'online', 150, 'Zoom WebRTC Hook', 'IP 103.21.14.90'),
('att_17', 'std_121', 'b_ds_a', CURRENT_DATE - INTERVAL '2 days', 'absent', 'online', 0, 'Zoom WebRTC Hook', NULL),

-- Ritu Saxena (High attendance 100%)
('att_18', 'std_122', 'b_ds_a', CURRENT_DATE - INTERVAL '14 days', 'present', 'classroom', 150, 'Beta Hall Biometrics', 'Hall 2 Entry'),
('att_19', 'std_122', 'b_ds_a', CURRENT_DATE - INTERVAL '11 days', 'present', 'classroom', 150, 'Beta Hall Biometrics', 'Hall 2 Entry'),
('att_20', 'std_122', 'b_ds_a', CURRENT_DATE - INTERVAL '9 days', 'present', 'classroom', 150, 'Beta Hall Biometrics', 'Hall 2 Entry'),
('att_21', 'std_122', 'b_ds_a', CURRENT_DATE - INTERVAL '6 days', 'present', 'classroom', 150, 'Beta Hall Biometrics', 'Hall 2 Entry'),
('att_22', 'std_122', 'b_ds_a', CURRENT_DATE - INTERVAL '2 days', 'present', 'classroom', 150, 'Beta Hall Biometrics', 'Hall 2 Entry')
ON CONFLICT (id) DO NOTHING;

-- 10. TIMETABLE SESSIONS
INSERT INTO public.timetable_sessions (id, batch_id, trainer_id, room_id, weekday, start_time, end_time, mode, color_code) VALUES
('sess_1', 'b_java_a', 'tr_1', 'rm_1', 'Monday', '09:00', '11:00', 'classroom', 'bg-indigo-50 border-indigo-200 text-indigo-900'),
('sess_2', 'b_py_a', 'tr_2', 'rm_3', 'Monday', '11:30', '13:30', 'classroom', 'bg-emerald-50 border-emerald-200 text-emerald-900'),
('sess_3', 'b_web_a', 'tr_4', 'rm_1', 'Monday', '14:00', '16:00', 'classroom', 'bg-amber-50 border-amber-200 text-amber-900'),
('sess_4', 'b_ds_a', 'tr_3', 'rm_2', 'Monday', '14:00', '16:30', 'hybrid', 'bg-purple-50 border-purple-200 text-purple-900'),
('sess_5', 'b_java_b', 'tr_1', 'rm_2', 'Tuesday', '10:00', '12:00', 'hybrid', 'bg-indigo-50 border-indigo-200 text-indigo-900'),
('sess_6', 'b_py_b', 'tr_2', NULL, 'Tuesday', '14:00', '16:30', 'online', 'bg-emerald-50 border-emerald-200 text-emerald-900'),
('sess_7', 'b_java_a', 'tr_1', 'rm_1', 'Wednesday', '09:00', '11:00', 'classroom', 'bg-indigo-50 border-indigo-200 text-indigo-900'),
('sess_8', 'b_py_a', 'tr_2', 'rm_3', 'Wednesday', '11:30', '13:30', 'classroom', 'bg-emerald-50 border-emerald-200 text-emerald-900'),
('sess_9', 'b_ds_a', 'tr_3', 'rm_2', 'Wednesday', '14:00', '16:30', 'hybrid', 'bg-purple-50 border-purple-200 text-purple-900'),
('sess_10', 'b_java_a', 'tr_1', 'rm_1', 'Friday', '09:00', '11:00', 'classroom', 'bg-indigo-50 border-indigo-200 text-indigo-900')
ON CONFLICT (id) DO NOTHING;

-- 11. ACTION ITEMS (Pending & Sent WhatsApp reminders)
INSERT INTO public.action_items (id, student_id, type, message, due_date, status, requested_by, requested_at, approved_by, approved_at, outbox_reference) VALUES
('act_101', 'std_101', 'whatsapp_reminder', 'Hi Aarav, your EMI installment of ₹7,500 was due yesterday. Please complete payment to avoid lab suspension.', CURRENT_DATE - INTERVAL '1 day', 'pending', 'Anjali Sharma (Counselor)', NOW() - INTERVAL '1 day', NULL, NULL, NULL),
('act_102', 'std_103', 'whatsapp_reminder', 'Urgent: Hi Sneha, your attendance in Java Batch A has dropped to 60%. An overdue fee installment of ₹7,500 is pending. Please meet with counselordesk.', CURRENT_DATE - INTERVAL '5 days', 'pending', 'Copilot AI (Risk Radar)', NOW() - INTERVAL '2 days', NULL, NULL, NULL),
('act_103', 'std_121', 'fee_notice', 'Important Notice: Overdue installment of ₹27,500 for Data Science & GenAI is 12 days past due. Immediate clearance required.', CURRENT_DATE - INTERVAL '12 days', 'pending', 'Suresh Iyer (Accounts)', NOW() - INTERVAL '3 days', NULL, NULL, NULL),
('act_104', 'std_104', 'whatsapp_reminder', 'Reminder: Upcoming fee installment of ₹7,500 is due in 2 days. Quick pay via UPI portal.', CURRENT_DATE + INTERVAL '2 days', 'sent', 'System Scheduler', NOW() - INTERVAL '1 day', 'Vikramaditya Mehta', NOW() - INTERVAL '1 day', 'MSG-WA-904812')
ON CONFLICT (id) DO NOTHING;

-- 12. PAYMENT RECONCILIATIONS
INSERT INTO public.payment_reconciliations (id, emi_id, utr_number, amount, payment_date, status, payer_name, receipt_url) VALUES
('rec_01', 'emi_101_2', 'UPI/321876543210/HDFC', 7500, CURRENT_DATE - INTERVAL '11 days', 'reconciled', 'Aarav Sharma', '/receipts/REC-2026-01.pdf'),
('rec_02', 'emi_121_1', 'RTGS/R20261015887', 27500, CURRENT_DATE - INTERVAL '46 days', 'reconciled', 'Manish Choudhury', '/receipts/REC-2026-02.pdf'),
('rec_03', NULL, 'UPI/998877665544/AXIS', 7500, CURRENT_DATE - INTERVAL '2 days', 'unmatched', 'Unknown Payer (Ref: Student Fee)', NULL)
ON CONFLICT (id) DO NOTHING;

-- 13. CLASS RECORDINGS
INSERT INTO public.class_recordings (id, batch_id, topic, recording_date, duration_minutes, source, video_url, thumbnail_url, views_count, key_timestamps) VALUES
('rec_01', 'b_java_a', 'Microservices Architecture with Spring Cloud & Eureka', CURRENT_DATE - INTERVAL '7 days', 115, 'Lab 1 Recording Rig', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=480&auto=format&fit=crop&q=80', 28, '[{"time":"00:00","label":"Service Registry Setup"},{"time":"42:15","label":"API Gateway Routing"}]'::jsonb),
('rec_02', 'b_ds_a', 'Fine-Tuning Llama 3 with LoRA & PEFT on Custom Corpus', CURRENT_DATE - INTERVAL '6 days', 140, 'Hall 2 Studio Cam', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=480&auto=format&fit=crop&q=80', 42, '[{"time":"00:00","label":"Quantization with bitsandbytes"},{"time":"55:00","label":"Training Loss Evaluation"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
