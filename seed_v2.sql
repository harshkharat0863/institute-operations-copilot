-- ====================================================================
-- APEX INSTITUTE OF SOFTWARE ENGINEERING, KORAMANGALA, BENGALURU
-- Realistic 3NF Operations & Analytics Seed Data (seed_v2.sql)
--
-- Fictional Institute Profile:
-- - Name: Apex Institute of Software Engineering
-- - Location: 4th Block, 80 Feet Road, Koramangala, Bengaluru, Karnataka
-- - Focus: Industry-aligned Fullstack, Data Engineering, and Generative AI
--
-- All dates use PostgreSQL dynamic expressions relative to CURRENT_DATE
-- to ensure perpetual freshness whenever loaded.
-- ====================================================================

-- -------------------------------------------------------------
-- 0. CLEAN SLATE: Truncate data tables with CASCADE
-- (Preserves public.users so existing demo logins remain intact)
-- -------------------------------------------------------------
TRUNCATE TABLE
    public.action_items,
    public.attendance_records,
    public.certificates,
    public.class_recordings,
    public.dropout_interventions,
    public.payment_reconciliations,
    public.payments,
    public.emis,
    public.students,
    public.timetable_sessions,
    public.batches,
    public.rooms,
    public.trainers,
    public.courses,
    public.audit_logs,
    public.query_logs
RESTART IDENTITY CASCADE;

-- -------------------------------------------------------------
-- 1. USERS (Keep exact demo accounts, IDs, roles, and password hashes)
-- Password for all demo accounts is 'password123'
-- -------------------------------------------------------------
INSERT INTO public.users (id, name, email, password_hash, role, trainer_id, avatar) VALUES
('usr_owner_1', 'Vikramaditya Mehta', 'owner@institute.org', '$2b$12$DNOOHkoUunYI2h47v74bYeJUtXypfZ.nxEeAvQ6KZ72Q4x2wRDqdO', 'owner', NULL, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'),
('usr_counselor_1', 'Anjali Sharma', 'counselor@institute.org', '$2b$12$DNOOHkoUunYI2h47v74bYeJUtXypfZ.nxEeAvQ6KZ72Q4x2wRDqdO', 'counselor', NULL, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'),
('usr_trainer_1', 'Priya Sundaram', 'priya.trainer@institute.org', '$2b$12$DNOOHkoUunYI2h47v74bYeJUtXypfZ.nxEeAvQ6KZ72Q4x2wRDqdO', 'trainer', 'tr_1', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'),
('usr_accounts_1', 'Suresh Iyer', 'accounts@institute.org', '$2b$12$DNOOHkoUunYI2h47v74bYeJUtXypfZ.nxEeAvQ6KZ72Q4x2wRDqdO', 'accounts', NULL, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- -------------------------------------------------------------
-- 2. COURSES (Realistic names, codes, uneven fees, 3-instalment plans)
-- -------------------------------------------------------------
INSERT INTO public.courses (id, name, code, duration_weeks, fee, category) VALUES
('c_java', 'Java Fullstack Masterclass', 'JFS-2026', 16, 47200.00, 'Backend Engineering'),
('c_python', 'Python Data Engineering & ML', 'PDE-2026', 14, 38500.00, 'Data & Analytics'),
('c_ds', 'Data Science & Generative AI', 'DS-GENAI', 20, 58400.00, 'AI / Data Science'),
('c_webdev', 'Full Stack MERN & Next.js', 'FS-WEB', 16, 42600.00, 'Web Development'),
('c_devops', 'DevOps & Cloud Automation', 'DEVOPS-CLD', 12, 49800.00, 'Cloud Infrastructure'),
('c_testing', 'Software Testing & Automation QA', 'QA-AUTO', 10, 33500.00, 'Quality Assurance');

-- -------------------------------------------------------------
-- 3. TRAINERS (6 trainers with realistic specialisations, loads, 1 on leave)
-- -------------------------------------------------------------
INSERT INTO public.trainers (id, name, email, specialization, max_hours_per_week, status) VALUES
('tr_1', 'Priya Sundaram', 'priya.sundaram@apextech.example.in', ARRAY['Java', 'Spring Boot 3', 'Microservices', 'PostgreSQL', 'Kafka'], 25, 'available'),
('tr_2', 'Rajesh Verma', 'rajesh.verma@apextech.example.in', ARRAY['Python', 'FastAPI', 'Apache Airflow', 'PySpark', 'Snowflake'], 25, 'available'),
('tr_3', 'Dr. Amit Patel', 'amit.patel@apextech.example.in', ARRAY['PyTorch', 'Hugging Face', 'LangChain', 'Vector DBs', 'LLMOps'], 20, 'available'),
('tr_4', 'Neha Sengupta', 'neha.sengupta@apextech.example.in', ARRAY['TypeScript', 'React 19', 'Next.js', 'GraphQL', 'TailwindCSS'], 24, 'available'),
('tr_5', 'Vikram Joshi', 'vikram.joshi@apextech.example.in', ARRAY['Kubernetes', 'Docker', 'Terraform', 'AWS Cloud Architecture', 'CI/CD'], 20, 'on_leave'),
('tr_6', 'Kavita Krishnamurthy', 'kavita.k@apextech.example.in', ARRAY['Selenium WebDriver', 'Playwright', 'Cypress', 'JUnit5', 'CI Test Pipelines'], 22, 'available');

-- -------------------------------------------------------------
-- 4. ROOMS / LABS (Apex Koramangala Facility)
-- -------------------------------------------------------------
INSERT INTO public.rooms (id, name, capacity) VALUES
('rm_1', 'Lab 1 - Turing Hall (Workstations & Dual Monitors)', 40),
('rm_2', 'Hall 2 - Lovelace Auditorium (Hybrid Lecture Theatre)', 55),
('rm_3', 'Studio 3 - Shannon Interactive Pod (Smart Podium)', 32),
('rm_4', 'Lab 4 - Von Neumann System Lab', 45),
('rm_5', 'Seminar Room 5 - Ramanujan Collaboration Suite', 25);

-- -------------------------------------------------------------
-- 5. BATCHES (Realistic batch codes, spread schedules, near-full vs spare)
-- b_ds_a is nearly full (11 of 12 seats filled)
-- b_web_a has spare seats (11 of 25 seats filled)
-- -------------------------------------------------------------
INSERT INTO public.batches (id, name, course_id, trainer_id, room_id, mode, max_capacity, start_date, schedule, status) VALUES
('b_java_a', 'Java Fullstack - Batch A (JFS-NOV26-A)', 'c_java', 'tr_1', 'rm_1', 'classroom', 35, (CURRENT_DATE - INTERVAL '45 days'), 'Mon, Wed, Fri 09:00 - 11:00', 'ongoing'),
('b_java_b', 'Java Fullstack - Batch B (JFS-OCT26-B)', 'c_java', 'tr_1', 'rm_2', 'hybrid', 30, (CURRENT_DATE - INTERVAL '30 days'), 'Tue, Thu, Sat 10:00 - 12:00', 'ongoing'),
('b_py_a', 'Python Data Eng - Batch A (PDE-NOV26-A)', 'c_python', 'tr_2', 'rm_3', 'classroom', 30, (CURRENT_DATE - INTERVAL '45 days'), 'Mon, Wed, Fri 11:30 - 13:30', 'ongoing'),
('b_py_b', 'Python Data Eng - Batch B (PDE-NOV26-B)', 'c_python', 'tr_2', NULL, 'online', 40, (CURRENT_DATE - INTERVAL '23 days'), 'Tue, Thu 14:00 - 16:30', 'ongoing'),
('b_ds_a', 'Data Science & GenAI - Batch A (DS-OCT26-A)', 'c_ds', 'tr_3', 'rm_2', 'hybrid', 12, (CURRENT_DATE - INTERVAL '52 days'), 'Mon, Wed 14:00 - 16:30', 'ongoing'),
('b_web_a', 'Full Stack MERN - Batch A (MERN-NOV26-A)', 'c_webdev', 'tr_4', 'rm_1', 'classroom', 25, (CURRENT_DATE - INTERVAL '17 days'), 'Mon, Wed, Fri 14:00 - 16:00', 'ongoing');

-- -------------------------------------------------------------
-- 6. STUDENTS (62 students across India with realistic mix of names, emails, phone numbers)
-- -------------------------------------------------------------
INSERT INTO public.students (id, name, email, phone, batch_id, enrollment_date, status) VALUES
('std_101', 'Aarav Sharma', 'aarav.sharma@apextech.example.in', '9820317492', 'b_java_a', (CURRENT_DATE - INTERVAL '45 days'), 'active'),
('std_102', 'Rohan Gupta', 'rohan.g@apextech.example.in', '9833519824', 'b_java_a', (CURRENT_DATE - INTERVAL '45 days'), 'active'),
('std_103', 'Sneha Patil', 'sneha.patil@apextech.example.in', '9711840251', 'b_java_a', (CURRENT_DATE - INTERVAL '44 days'), 'active'),
('std_104', 'Vikram Malhotra', 'v.malhotra@apextech.example.in', '9448102938', 'b_java_a', (CURRENT_DATE - INTERVAL '43 days'), 'active'),
('std_105', 'Karthik Ramanathan', 'karthik.r@apextech.example.in', '9496182740', 'b_java_a', (CURRENT_DATE - INTERVAL '42 days'), 'active'),
('std_106', 'Divya Nair', 'divya.nair@apextech.example.in', '9880192837', 'b_java_a', (CURRENT_DATE - INTERVAL '42 days'), 'active'),
('std_107', 'Chinmay Kulkarni', 'chinmay.k@apextech.example.in', '9822019482', 'b_java_a', (CURRENT_DATE - INTERVAL '40 days'), 'active'),
('std_108', 'Priyanka Iyer', 'priyanka.iyer@apextech.example.in', '9845102948', 'b_java_a', (CURRENT_DATE - INTERVAL '40 days'), 'active'),
('std_109', 'Siddharth Rao', 'sid.rao@apextech.example.in', '9819203847', 'b_java_a', (CURRENT_DATE - INTERVAL '38 days'), 'dropped'),
('std_110', 'Bhavna Chawla', 'bhavna.c@apextech.example.in', '9820192847', 'b_java_a', (CURRENT_DATE - INTERVAL '38 days'), 'active'),
('std_111', 'Aniket Deshpande', 'aniket.d@apextech.example.in', '9823192038', 'b_java_a', (CURRENT_DATE - INTERVAL '36 days'), 'active'),
('std_112', 'Rituparna Ghosh', 'ritu.ghosh@apextech.example.in', '9830192847', 'b_java_a', (CURRENT_DATE - INTERVAL '35 days'), 'active'),
('std_113', 'Pooja Hegde', 'pooja.hegde@apextech.example.in', '9886192837', 'b_java_b', (CURRENT_DATE - INTERVAL '30 days'), 'active'),
('std_114', 'Arjun Reddy', 'arjun.reddy@apextech.example.in', '9848192847', 'b_java_b', (CURRENT_DATE - INTERVAL '30 days'), 'active'),
('std_115', 'Meera Mukherjee', 'meera.m@apextech.example.in', '9831102948', 'b_java_b', (CURRENT_DATE - INTERVAL '29 days'), 'active'),
('std_116', 'Rohan Verma', 'rohan.v@apextech.example.in', '9810192847', 'b_java_b', (CURRENT_DATE - INTERVAL '29 days'), 'dropped'),
('std_117', 'Sanjay Bhatt', 'sanjay.bhatt@apextech.example.in', '9412192847', 'b_java_b', (CURRENT_DATE - INTERVAL '28 days'), 'active'),
('std_118', 'Manoj Bajpayee', 'manoj.b@apextech.example.in', '9867192847', 'b_java_b', (CURRENT_DATE - INTERVAL '28 days'), 'active'),
('std_119', 'Saurabh Ganguly', 'saurabh.g@apextech.example.in', '9832192847', 'b_java_b', (CURRENT_DATE - INTERVAL '26 days'), 'active'),
('std_120', 'Tarun Nambiar', 'tarun.n@apextech.example.in', '9447192847', 'b_java_b', (CURRENT_DATE - INTERVAL '26 days'), 'active'),
('std_121', 'Sunita Reddy', 'sunita.reddy@apextech.example.in', '9849102938', 'b_java_b', (CURRENT_DATE - INTERVAL '25 days'), 'active'),
('std_122', 'Aakash Pillai', 'aakash.pillai@apextech.example.in', '9497192847', 'b_java_b', (CURRENT_DATE - INTERVAL '25 days'), 'active'),
('std_123', 'Tanvi Deshmukh', 'tanvi.d@apextech.example.in', '9822102948', 'b_py_a', (CURRENT_DATE - INTERVAL '45 days'), 'active'),
('std_124', 'Abhishek Banerjee', 'abhishek.b@apextech.example.in', '9831192837', 'b_py_a', (CURRENT_DATE - INTERVAL '44 days'), 'active'),
('std_125', 'Naveen Kumar', 'naveen.k@apextech.example.in', '9845192837', 'b_py_a', (CURRENT_DATE - INTERVAL '40 days'), 'active'),
('std_126', 'Ananya Sen', 'ananya.sen@apextech.example.in', '9832192848', 'b_py_a', (CURRENT_DATE - INTERVAL '40 days'), 'on_leave'),
('std_127', 'Rahul Dravid Rao', 'rahul.d.rao@apextech.example.in', '9886102948', 'b_py_a', (CURRENT_DATE - INTERVAL '38 days'), 'active'),
('std_128', 'Shubman Gill', 'shubman.gill@apextech.example.in', '9815192837', 'b_py_a', (CURRENT_DATE - INTERVAL '38 days'), 'active'),
('std_129', 'Nandini Dasgupta', 'nandini.d@apextech.example.in', '9830102948', 'b_py_a', (CURRENT_DATE - INTERVAL '36 days'), 'active'),
('std_130', 'Siddheshwar Mane', 'siddheshwar.m@apextech.example.in', '9821192847', 'b_py_a', (CURRENT_DATE - INTERVAL '35 days'), 'active'),
('std_131', 'Deepa Venkat', 'deepa.venkat@apextech.example.in', '9840192847', 'b_py_a', (CURRENT_DATE - INTERVAL '35 days'), 'active'),
('std_132', 'Mohit Aggarwal', 'mohit.a@apextech.example.in', '9811102948', 'b_py_a', (CURRENT_DATE - INTERVAL '32 days'), 'active'),
('std_133', 'Harsh Vardhan', 'harsh.v@apextech.example.in', '9910192847', 'b_py_b', (CURRENT_DATE - INTERVAL '23 days'), 'active'),
('std_134', 'Kavita Sundar', 'kavita.sundar@apextech.example.in', '9841192847', 'b_py_b', (CURRENT_DATE - INTERVAL '23 days'), 'active'),
('std_135', 'Mohammed Farhan', 'm.farhan@apextech.example.in', '9849192847', 'b_py_b', (CURRENT_DATE - INTERVAL '20 days'), 'active'),
('std_136', 'Shreya Ghoshal', 'shreya.g@apextech.example.in', '9820192838', 'b_py_b', (CURRENT_DATE - INTERVAL '20 days'), 'active'),
('std_137', 'Zeeshan Khan', 'zeeshan.k@apextech.example.in', '9890192847', 'b_py_b', (CURRENT_DATE - INTERVAL '18 days'), 'active'),
('std_138', 'Devendra Fadnavis', 'devendra.f@apextech.example.in', '9822192049', 'b_py_b', (CURRENT_DATE - INTERVAL '18 days'), 'active'),
('std_139', 'Komal Bhasin', 'komal.b@apextech.example.in', '9810102948', 'b_py_b', (CURRENT_DATE - INTERVAL '16 days'), 'active'),
('std_140', 'Tejaswi Yadav', 'tejaswi.y@apextech.example.in', '9431192847', 'b_py_b', (CURRENT_DATE - INTERVAL '16 days'), 'active'),
('std_141', 'Manish Choudhury', 'manish.c@apextech.example.in', '9864192847', 'b_ds_a', (CURRENT_DATE - INTERVAL '52 days'), 'active'),
('std_142', 'Ritu Saxena', 'ritu.saxena@apextech.example.in', '9818192847', 'b_ds_a', (CURRENT_DATE - INTERVAL '52 days'), 'active'),
('std_143', 'Gautam Gambhir', 'gautam.g@apextech.example.in', '9811192847', 'b_ds_a', (CURRENT_DATE - INTERVAL '50 days'), 'active'),
('std_144', 'Preeti Menon', 'preeti.m@apextech.example.in', '9447102948', 'b_ds_a', (CURRENT_DATE - INTERVAL '50 days'), 'active'),
('std_145', 'Nikhil Joshi', 'nikhil.joshi@apextech.example.in', '9823192847', 'b_ds_a', (CURRENT_DATE - INTERVAL '48 days'), 'active'),
('std_146', 'Swati Kulshrestha', 'swati.k@apextech.example.in', '9891192847', 'b_ds_a', (CURRENT_DATE - INTERVAL '48 days'), 'active'),
('std_147', 'Prateek Shukla', 'prateek.shukla@apextech.example.in', '9871192847', 'b_ds_a', (CURRENT_DATE - INTERVAL '46 days'), 'active'),
('std_148', 'Isha Singhania', 'isha.singhania@apextech.example.in', '9821192837', 'b_ds_a', (CURRENT_DATE - INTERVAL '46 days'), 'active'),
('std_149', 'Deepak Chawla', 'deepak.chawla@apextech.example.in', '9810192039', 'b_ds_a', (CURRENT_DATE - INTERVAL '45 days'), 'active'),
('std_150', 'Anuradha Roy', 'anuradha.roy@apextech.example.in', '9830192039', 'b_ds_a', (CURRENT_DATE - INTERVAL '45 days'), 'active'),
('std_151', 'Varun Dhawan', 'varun.d@apextech.example.in', '9820192039', 'b_ds_a', (CURRENT_DATE - INTERVAL '44 days'), 'active'),
('std_152', 'Aditya Roy Kapoor', 'aditya.rk@apextech.example.in', '9820456781', 'b_web_a', (CURRENT_DATE - INTERVAL '17 days'), 'active'),
('std_153', 'Kriti Sanon', 'kriti.sanon@apextech.example.in', '9811456782', 'b_web_a', (CURRENT_DATE - INTERVAL '17 days'), 'active'),
('std_154', 'Ayushmann Khurrana', 'ayushmann.k@apextech.example.in', '9818456783', 'b_web_a', (CURRENT_DATE - INTERVAL '16 days'), 'active'),
('std_155', 'Radhika Madan', 'radhika.madan@apextech.example.in', '9891456784', 'b_web_a', (CURRENT_DATE - INTERVAL '16 days'), 'active'),
('std_156', 'Rajalakshmi Balan', 'rajalakshmi.b@apextech.example.in', '9444192847', 'b_web_a', (CURRENT_DATE - INTERVAL '14 days'), 'active'),
('std_157', 'Amrita Pritam', 'amrita.p@apextech.example.in', '9814192847', 'b_web_a', (CURRENT_DATE - INTERVAL '14 days'), 'active'),
('std_158', 'Jaspreet Bumrah', 'jaspreet.b@apextech.example.in', '9825192847', 'b_web_a', (CURRENT_DATE - INTERVAL '12 days'), 'active'),
('std_159', 'Harpreet Kaur', 'harpreet.k@apextech.example.in', '9876192847', 'b_web_a', (CURRENT_DATE - INTERVAL '12 days'), 'active'),
('std_160', 'Venkatesh Prasad', 'venkatesh.p@apextech.example.in', '9844192847', 'b_web_a', (CURRENT_DATE - INTERVAL '10 days'), 'active'),
('std_161', 'Gayatri Sundaram', 'gayatri.sundaram@apextech.example.in', '9840192038', 'b_web_a', (CURRENT_DATE - INTERVAL '10 days'), 'active'),
('std_162', 'Suraj Pancholi', 'suraj.p@apextech.example.in', '9820192040', 'b_web_a', (CURRENT_DATE - INTERVAL '8 days'), 'on_leave');

-- -------------------------------------------------------------
-- 7. EMIS (Structured multi-instalment plans with front-loaded down payment)
-- CRITICAL REQUIREMENT 9:
-- - std_101 (Aarav Sharma): EMI due in 2 days (due) -> in Java batch with >=3 absences
-- - std_103 (Sneha Patil): EMI due 1 day ago (missed / overdue) -> in Java batch with >=3 absences
-- - Both return in benchmark query and in 'emis due this week'!
-- -------------------------------------------------------------
INSERT INTO public.emis (id, student_id, amount, installment_no, total_installments, due_date, status, paid_date) VALUES
-- Batch Java A (c_java: 47,200 -> 17,200 / 15,000 / 15,000)
-- Aarav Sharma: EMI 1 paid, EMI 2 DUE IN 2 DAYS
('emi_101_1', 'std_101', 17200.00, 1, 3, (CURRENT_DATE - INTERVAL '40 days'), 'paid', (CURRENT_DATE - INTERVAL '41 days')),
('emi_101_2', 'std_101', 15000.00, 2, 3, (CURRENT_DATE + INTERVAL '2 days'), 'due', NULL),
('emi_101_3', 'std_101', 15000.00, 3, 3, (CURRENT_DATE + INTERVAL '35 days'), 'due', NULL),

-- Sneha Patil: EMI 1 paid, EMI 2 MISSED / OVERDUE BY 1 DAY
('emi_103_1', 'std_103', 17200.00, 1, 3, (CURRENT_DATE - INTERVAL '40 days'), 'paid', (CURRENT_DATE - INTERVAL '39 days')),
('emi_103_2', 'std_103', 15000.00, 2, 3, (CURRENT_DATE - INTERVAL '1 day'), 'missed', NULL),
('emi_103_3', 'std_103', 15000.00, 3, 3, (CURRENT_DATE + INTERVAL '30 days'), 'due', NULL),

-- Rohan Gupta: EMI 1 paid, EMI 2 due in 4 days
('emi_102_1', 'std_102', 17200.00, 1, 3, (CURRENT_DATE - INTERVAL '42 days'), 'paid', (CURRENT_DATE - INTERVAL '42 days')),
('emi_102_2', 'std_102', 15000.00, 2, 3, (CURRENT_DATE + INTERVAL '4 days'), 'due', NULL),

-- Vikram Malhotra: EMI 1 paid, EMI 2 paid, EMI 3 due in 25 days
('emi_104_1', 'std_104', 17200.00, 1, 3, (CURRENT_DATE - INTERVAL '40 days'), 'paid', (CURRENT_DATE - INTERVAL '40 days')),
('emi_104_2', 'std_104', 15000.00, 2, 3, (CURRENT_DATE - INTERVAL '10 days'), 'paid', (CURRENT_DATE - INTERVAL '9 days')),
('emi_104_3', 'std_104', 15000.00, 3, 3, (CURRENT_DATE + INTERVAL '25 days'), 'due', NULL),

-- Karthik Ramanathan: EMI 1 paid, EMI 2 due in 5 days
('emi_105_1', 'std_105', 17200.00, 1, 3, (CURRENT_DATE - INTERVAL '38 days'), 'paid', (CURRENT_DATE - INTERVAL '38 days')),
('emi_105_2', 'std_105', 15000.00, 2, 3, (CURRENT_DATE + INTERVAL '5 days'), 'due', NULL),

-- Divya Nair: full fee paid upfront (1 instalment)
('emi_106_1', 'std_106', 47200.00, 1, 1, (CURRENT_DATE - INTERVAL '40 days'), 'paid', (CURRENT_DATE - INTERVAL '40 days')),

-- Chinmay Kulkarni: EMI 1 paid, EMI 2 due in 3 days
('emi_107_1', 'std_107', 17200.00, 1, 3, (CURRENT_DATE - INTERVAL '38 days'), 'paid', (CURRENT_DATE - INTERVAL '38 days')),
('emi_107_2', 'std_107', 15000.00, 2, 3, (CURRENT_DATE + INTERVAL '3 days'), 'due', NULL),

-- Siddharth Rao (Dropped): EMI 1 paid, EMI 2 missed 15 days ago
('emi_109_1', 'std_109', 17200.00, 1, 3, (CURRENT_DATE - INTERVAL '36 days'), 'paid', (CURRENT_DATE - INTERVAL '36 days')),
('emi_109_2', 'std_109', 15000.00, 2, 3, (CURRENT_DATE - INTERVAL '15 days'), 'missed', NULL),

-- Batch Java B (c_java: 47,200)
-- Pooja Hegde: EMI 1 paid, EMI 2 due in 3 days
('emi_113_1', 'std_113', 17200.00, 1, 3, (CURRENT_DATE - INTERVAL '28 days'), 'paid', (CURRENT_DATE - INTERVAL '28 days')),
('emi_113_2', 'std_113', 15000.00, 2, 3, (CURRENT_DATE + INTERVAL '3 days'), 'due', NULL),

-- Arjun Reddy: EMI 1 paid, EMI 2 missed 4 days ago (OVERDUE)
('emi_114_1', 'std_114', 17200.00, 1, 3, (CURRENT_DATE - INTERVAL '28 days'), 'paid', (CURRENT_DATE - INTERVAL '28 days')),
('emi_114_2', 'std_114', 15000.00, 2, 3, (CURRENT_DATE - INTERVAL '4 days'), 'missed', NULL),

-- Batch Python A (c_python: 38,500 -> 16,500 / 11,000 / 11,000)
-- Tanvi Deshmukh: EMI 1 paid, EMI 2 due in 2 days
('emi_123_1', 'std_123', 16500.00, 1, 3, (CURRENT_DATE - INTERVAL '40 days'), 'paid', (CURRENT_DATE - INTERVAL '40 days')),
('emi_123_2', 'std_123', 11000.00, 2, 3, (CURRENT_DATE + INTERVAL '2 days'), 'due', NULL),

-- Abhishek Banerjee: EMI 1 paid, EMI 2 paid, EMI 3 due in 15 days
('emi_124_1', 'std_124', 16500.00, 1, 3, (CURRENT_DATE - INTERVAL '40 days'), 'paid', (CURRENT_DATE - INTERVAL '39 days')),
('emi_124_2', 'std_124', 11000.00, 2, 3, (CURRENT_DATE - INTERVAL '10 days'), 'paid', (CURRENT_DATE - INTERVAL '10 days')),
('emi_124_3', 'std_124', 11000.00, 3, 3, (CURRENT_DATE + INTERVAL '15 days'), 'due', NULL),

-- Naveen Kumar: EMI 1 paid, EMI 2 due in 6 days
('emi_125_1', 'std_125', 16500.00, 1, 3, (CURRENT_DATE - INTERVAL '38 days'), 'paid', (CURRENT_DATE - INTERVAL '38 days')),
('emi_125_2', 'std_125', 11000.00, 2, 3, (CURRENT_DATE + INTERVAL '6 days'), 'due', NULL),

-- Batch Python B (Online, c_python: 38,500)
-- Harsh Vardhan: EMI 1 paid, EMI 2 due in 12 days
('emi_133_1', 'std_133', 16500.00, 1, 3, (CURRENT_DATE - INTERVAL '20 days'), 'paid', (CURRENT_DATE - INTERVAL '20 days')),
('emi_133_2', 'std_133', 11000.00, 2, 3, (CURRENT_DATE + INTERVAL '12 days'), 'due', NULL),

-- Kavita Sundar: EMI 1 paid, EMI 2 due in 12 days
('emi_134_1', 'std_134', 16500.00, 1, 3, (CURRENT_DATE - INTERVAL '20 days'), 'paid', (CURRENT_DATE - INTERVAL '20 days')),
('emi_134_2', 'std_134', 11000.00, 2, 3, (CURRENT_DATE + INTERVAL '12 days'), 'due', NULL),

-- Batch Data Science & GenAI (c_ds: 58,400 -> 28,400 / 15,000 / 15,000)
-- Manish Choudhury: EMI 1 paid, EMI 2 MISSED 12 DAYS AGO, EMI 3 due in 18 days (2 consecutive missed/due)
('emi_141_1', 'std_141', 28400.00, 1, 3, (CURRENT_DATE - INTERVAL '50 days'), 'paid', (CURRENT_DATE - INTERVAL '50 days')),
('emi_141_2', 'std_141', 15000.00, 2, 3, (CURRENT_DATE - INTERVAL '12 days'), 'missed', NULL),
('emi_141_3', 'std_141', 15000.00, 3, 3, (CURRENT_DATE - INTERVAL '1 day'), 'missed', NULL),

-- Ritu Saxena: EMI 1 paid, EMI 2 due in 5 days
('emi_142_1', 'std_142', 28400.00, 1, 3, (CURRENT_DATE - INTERVAL '50 days'), 'paid', (CURRENT_DATE - INTERVAL '50 days')),
('emi_142_2', 'std_142', 15000.00, 2, 3, (CURRENT_DATE + INTERVAL '5 days'), 'due', NULL),

-- Deepak Chawla: EMI 1 paid, EMI 2 missed 8 days ago
('emi_149_1', 'std_149', 28400.00, 1, 3, (CURRENT_DATE - INTERVAL '44 days'), 'paid', (CURRENT_DATE - INTERVAL '44 days')),
('emi_149_2', 'std_149', 15000.00, 2, 3, (CURRENT_DATE - INTERVAL '8 days'), 'missed', NULL),

-- Batch Full Stack MERN (c_webdev: 42,600 -> 18,600 / 12,000 / 12,000)
-- Aditya Roy Kapoor: EMI 1 paid, EMI 2 due in 14 days
('emi_152_1', 'std_152', 18600.00, 1, 3, (CURRENT_DATE - INTERVAL '15 days'), 'paid', (CURRENT_DATE - INTERVAL '15 days')),
('emi_152_2', 'std_152', 12000.00, 2, 3, (CURRENT_DATE + INTERVAL '14 days'), 'due', NULL),

-- Kriti Sanon: EMI 1 paid, EMI 2 due in 14 days
('emi_153_1', 'std_153', 18600.00, 1, 3, (CURRENT_DATE - INTERVAL '15 days'), 'paid', (CURRENT_DATE - INTERVAL '15 days')),
('emi_153_2', 'std_153', 12000.00, 2, 3, (CURRENT_DATE + INTERVAL '14 days'), 'due', NULL);

-- -------------------------------------------------------------
-- 8. PAYMENTS (Single source of truth for fee receipts)
-- -------------------------------------------------------------
INSERT INTO public.payments (id, student_id, emi_id, amount, paid_on, method, transaction_ref, notes) VALUES
('pay_101_1', 'std_101', 'emi_101_1', 17200.00, (CURRENT_DATE - INTERVAL '41 days'), 'upi', 'UPI/321876543210/HDFC', 'Installment 1 paid via GPay (Ref #482910)'),
('pay_102_1', 'std_102', 'emi_102_1', 17200.00, (CURRENT_DATE - INTERVAL '42 days'), 'upi', 'UPI/321987654321/ICIC', 'Installment 1 paid via PhonePe'),
('pay_103_1', 'std_103', 'emi_103_1', 17200.00, (CURRENT_DATE - INTERVAL '39 days'), 'card', 'POS/CARD/9876', 'Debit card swipe at front desk counter'),
('pay_104_1', 'std_104', 'emi_104_1', 17200.00, (CURRENT_DATE - INTERVAL '40 days'), 'upi', 'UPI/321456789012/SBIN', 'Installment 1 UPI'),
('pay_104_2', 'std_104', 'emi_104_2', 15000.00, (CURRENT_DATE - INTERVAL '9 days'), 'bank_transfer', 'NEFT/N1029384756', 'Installment 2 NetBanking NEFT'),
('pay_105_1', 'std_105', 'emi_105_1', 17200.00, (CURRENT_DATE - INTERVAL '38 days'), 'upi', 'UPI/321556789012/KKBK', 'Installment 1 UPI'),
('pay_106_1', 'std_106', 'emi_106_1', 47200.00, (CURRENT_DATE - INTERVAL '40 days'), 'bank_transfer', 'RTGS/R20261015099', 'Full course fee upfront via RTGS'),
('pay_107_1', 'std_107', 'emi_107_1', 17200.00, (CURRENT_DATE - INTERVAL '38 days'), 'upi', 'UPI/321656789012/AXIS', 'Installment 1 UPI'),
('pay_109_1', 'std_109', 'emi_109_1', 17200.00, (CURRENT_DATE - INTERVAL '36 days'), 'cheque', 'CHQ/771029/HDFC', 'Cheque cleared at Koramangala branch'),
('pay_113_1', 'std_113', 'emi_113_1', 17200.00, (CURRENT_DATE - INTERVAL '28 days'), 'upi', 'UPI/321756789012/ICIC', 'Term 1 UPI'),
('pay_114_1', 'std_114', 'emi_114_1', 17200.00, (CURRENT_DATE - INTERVAL '28 days'), 'upi', 'UPI/321856789012/HDFC', 'Term 1 UPI'),
('pay_123_1', 'std_123', 'emi_123_1', 16500.00, (CURRENT_DATE - INTERVAL '40 days'), 'upi', 'UPI/321956789012/SBIN', 'Term 1 UPI'),
('pay_124_1', 'std_124', 'emi_124_1', 16500.00, (CURRENT_DATE - INTERVAL '39 days'), 'upi', 'UPI/322056789012/AXIS', 'Term 1 UPI'),
('pay_124_2', 'std_124', 'emi_124_2', 11000.00, (CURRENT_DATE - INTERVAL '10 days'), 'bank_transfer', 'IMPS/322056789099/AXIS', 'Term 2 IMPS'),
('pay_125_1', 'std_125', 'emi_125_1', 16500.00, (CURRENT_DATE - INTERVAL '38 days'), 'upi', 'UPI/322156789012/HDFC', 'Term 1 UPI'),
('pay_133_1', 'std_133', 'emi_133_1', 16500.00, (CURRENT_DATE - INTERVAL '20 days'), 'upi', 'UPI/322256789012/SBIN', 'Online cohort admission fee UPI'),
('pay_134_1', 'std_134', 'emi_134_1', 16500.00, (CURRENT_DATE - INTERVAL '20 days'), 'upi', 'UPI/322356789012/ICIC', 'Online cohort admission fee UPI'),
('pay_141_1', 'std_141', 'emi_141_1', 28400.00, (CURRENT_DATE - INTERVAL '50 days'), 'bank_transfer', 'RTGS/R20261015887', 'Term 1 RTGS Transfer'),
('pay_142_1', 'std_142', 'emi_142_1', 28400.00, (CURRENT_DATE - INTERVAL '50 days'), 'upi', 'UPI/321776543211/AXIS', 'Term 1 UPI Payment'),
('pay_149_1', 'std_149', 'emi_149_1', 28400.00, (CURRENT_DATE - INTERVAL '44 days'), 'cheque', 'CHQ/887654/HDFC', 'Cheque cleared'),
('pay_152_1', 'std_152', 'emi_152_1', 18600.00, (CURRENT_DATE - INTERVAL '15 days'), 'upi', 'UPI/322456789012/HDFC', 'Admission token + Term 1 UPI'),
('pay_153_1', 'std_153', 'emi_153_1', 18600.00, (CURRENT_DATE - INTERVAL '15 days'), 'upi', 'UPI/322556789012/ICIC', 'Admission token + Term 1 UPI');

-- -------------------------------------------------------------
-- 9. TIMETABLE SESSIONS (Complete weekly timetable covering all days)
-- sess_11 to sess_15 cover Thursday and Friday
-- -------------------------------------------------------------
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
('sess_10', 'b_web_a', 'tr_4', 'rm_1', 'Wednesday', '14:00', '16:00', 'classroom', 'bg-amber-50 border-amber-200 text-amber-900'),
('sess_11', 'b_java_b', 'tr_1', 'rm_2', 'Thursday', '10:00', '12:00', 'hybrid', 'bg-indigo-50 border-indigo-200 text-indigo-900'),
('sess_12', 'b_py_b', 'tr_2', NULL, 'Thursday', '14:00', '16:30', 'online', 'bg-emerald-50 border-emerald-200 text-emerald-900'),
('sess_13', 'b_java_a', 'tr_1', 'rm_1', 'Friday', '09:00', '11:00', 'classroom', 'bg-indigo-50 border-indigo-200 text-indigo-900'),
('sess_14', 'b_py_a', 'tr_2', 'rm_3', 'Friday', '11:30', '13:30', 'classroom', 'bg-emerald-50 border-emerald-200 text-emerald-900'),
('sess_15', 'b_web_a', 'tr_4', 'rm_1', 'Friday', '14:00', '16:00', 'classroom', 'bg-amber-50 border-amber-200 text-amber-900'),
('sess_16', 'b_java_b', 'tr_1', 'rm_2', 'Saturday', '10:00', '12:00', 'hybrid', 'bg-indigo-50 border-indigo-200 text-indigo-900');

-- -------------------------------------------------------------
-- 10. ATTENDANCE RECORDS (past 30 days + today's started sessions)
-- Absences for the benchmark students are tied to their most recent class numbers,
-- not to fixed calendar dates, so the benchmark works on any weekday.
-- -------------------------------------------------------------
INSERT INTO public.attendance_records (id, student_id, batch_id, session_date, status, mode, duration_minutes, verified_by, ip_or_location)
WITH batch_schedule AS (
    SELECT 'b_java_a' AS b_id, ARRAY['Monday', 'Wednesday', 'Friday'] AS weekdays, 'classroom' AS mode, 120 AS dur
    UNION ALL SELECT 'b_java_b', ARRAY['Tuesday', 'Thursday', 'Saturday'], 'classroom', 120
    UNION ALL SELECT 'b_py_a', ARRAY['Monday', 'Wednesday', 'Friday'], 'classroom', 120
    UNION ALL SELECT 'b_py_b', ARRAY['Tuesday', 'Thursday'], 'online', 150
    UNION ALL SELECT 'b_ds_a', ARRAY['Monday', 'Wednesday'], 'classroom', 150
    UNION ALL SELECT 'b_web_a', ARRAY['Monday', 'Wednesday', 'Friday'], 'classroom', 120
),
past_session_dates AS (
    SELECT bs.b_id, bs.mode, bs.dur, d.dt::date AS s_date
    FROM batch_schedule bs
    CROSS JOIN generate_series((CURRENT_DATE - INTERVAL '30 days')::date, (CURRENT_DATE - INTERVAL '1 day')::date, INTERVAL '1 day') AS d(dt)
    WHERE TRIM(TO_CHAR(d.dt::date, 'Day')) = ANY(bs.weekdays)
),
all_student_past_sessions AS (
    SELECT s.id AS student_id, s.batch_id, sd.s_date, sd.mode, sd.dur,
        ('att_' || s.id || '_' || TO_CHAR(sd.s_date, 'YYYYMMDD')) AS att_id,
        (('x' || SUBSTRING(MD5(s.id || '_' || sd.s_date::text), 1, 8))::bit(32)::bigint % 100) AS h_val,
        ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY sd.s_date DESC) AS rn
    FROM public.students s
    JOIN past_session_dates sd ON s.batch_id = sd.b_id
    WHERE s.status IN ('active', 'on_leave', 'dropped') AND sd.s_date >= s.enrollment_date
),
with_status AS (
    SELECT *,
        CASE
            WHEN student_id = 'std_101' THEN CASE WHEN rn IN (2, 5, 8) THEN 'absent' ELSE 'present' END
            WHEN student_id = 'std_103' THEN CASE WHEN rn IN (2, 4, 6, 9) THEN 'absent' WHEN h_val < 20 THEN 'late' ELSE 'present' END
            WHEN student_id = 'std_141' THEN CASE WHEN rn IN (3, 5, 8, 10) THEN 'absent' ELSE 'present' END
            WHEN student_id IN ('std_109', 'std_116') THEN 'absent'
            WHEN h_val < 7 THEN 'absent'
            WHEN h_val < 15 THEN 'late'
            ELSE 'present'
        END AS status
    FROM all_student_past_sessions
)
SELECT att_id, student_id, batch_id, s_date, status, mode,
    CASE status WHEN 'absent' THEN 0 WHEN 'late' THEN dur - 15 ELSE dur END AS duration_minutes,
    CASE WHEN mode = 'online' THEN 'Zoom WebRTC Hook' ELSE 'Front Desk Biometrics' END AS verified_by,
    CASE WHEN mode = 'online' THEN 'IP 103.21.' || ((h_val % 70) + 10)::text || '.88' ELSE 'Turnstile RFID' END AS ip_or_location
FROM with_status;

-- ---------------- PART 1B: today's sessions that have already started ----------------
-- You can run just this statement again later in the day (for example just before
-- your presentation): it adds attendance for any session that has started since,
-- and skips rows that already exist.
INSERT INTO public.attendance_records (id, student_id, batch_id, session_date, status, mode, duration_minutes, verified_by, ip_or_location)
WITH todays_started_sessions AS (
    SELECT ts.batch_id,
           CASE WHEN ts.mode = 'online' THEN 'online' ELSE 'classroom' END AS mode,
           ROUND(EXTRACT(EPOCH FROM (ts.end_time - ts.start_time)) / 60.0)::int AS dur
    FROM public.timetable_sessions ts
    WHERE ts.weekday = TRIM(TO_CHAR((now() AT TIME ZONE 'Asia/Kolkata')::date, 'Day'))
      AND ts.start_time <= (now() AT TIME ZONE 'Asia/Kolkata')::time
),
todays_students AS (
    SELECT s.id AS student_id, s.batch_id, tss.mode, tss.dur,
        ('att_' || s.id || '_' || TO_CHAR((now() AT TIME ZONE 'Asia/Kolkata')::date, 'YYYYMMDD')) AS att_id,
        (('x' || SUBSTRING(MD5(s.id || '_today'), 1, 8))::bit(32)::bigint % 100) AS h_val
    FROM public.students s
    JOIN todays_started_sessions tss ON s.batch_id = tss.batch_id
    WHERE s.status = 'active'
)
SELECT att_id, student_id, batch_id, (now() AT TIME ZONE 'Asia/Kolkata')::date AS session_date,
    CASE WHEN h_val < 8 THEN 'absent' WHEN h_val < 16 THEN 'late' ELSE 'present' END AS status,
    mode,
    CASE WHEN h_val < 8 THEN 0 WHEN h_val < 16 THEN dur - 15 ELSE dur END AS duration_minutes,
    CASE WHEN mode = 'online' THEN 'Zoom WebRTC Hook' ELSE 'Front Desk Biometrics' END AS verified_by,
    CASE WHEN mode = 'online' THEN 'IP 103.21.44.12' ELSE 'Turnstile RFID Door 1' END AS ip_or_location
FROM todays_students
ON CONFLICT (id) DO NOTHING;


-- -------------------------------------------------------------
-- 11. ACTION ITEMS (Staged and sent reminder queue)
-- -------------------------------------------------------------
INSERT INTO public.action_items (id, student_id, type, message, due_date, status, requested_by, requested_at, approved_by, approved_at, outbox_reference) VALUES
('act_101', 'std_101', 'whatsapp_reminder', 'Hi Aarav, your fee installment of ₹15,000 is due on ' || TO_CHAR(CURRENT_DATE + INTERVAL '2 days', 'Mon DD, YYYY') || '. We also noticed 3 absences recently. Please connect with your mentor to clear dues and retain uninterrupted lab access.', (CURRENT_DATE + INTERVAL '2 days'), 'pending', 'Anjali Sharma (Counselor)', (NOW() - INTERVAL '4 hours'), NULL, NULL, NULL),
('act_102', 'std_103', 'whatsapp_reminder', 'Urgent Notice: Hi Sneha, your fee installment of ₹15,000 was due yesterday (' || TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'Mon DD, YYYY') || '). Your recent attendance is below 70%. Please meet the counselor desk.', (CURRENT_DATE - INTERVAL '1 day'), 'pending', 'Copilot AI (Risk Radar)', (NOW() - INTERVAL '1 day'), NULL, NULL, NULL),
('act_103', 'std_141', 'fee_notice', 'Immediate Action Required: Overdue installment of ₹15,000 for Data Science & GenAI is 12 days past due. Please clear before next module.', (CURRENT_DATE - INTERVAL '12 days'), 'pending', 'Suresh Iyer (Accounts)', (NOW() - INTERVAL '2 days'), NULL, NULL, NULL),
('act_104', 'std_104', 'whatsapp_reminder', 'Reminder: Upcoming fee installment of ₹15,000 is due next month. Early bird test series unlocked.', (CURRENT_DATE + INTERVAL '25 days'), 'sent', 'System Scheduler', (NOW() - INTERVAL '1 day'), 'Vikramaditya Mehta', (NOW() - INTERVAL '1 day'), 'MSG-WA-904812');

-- -------------------------------------------------------------
-- 12. PAYMENT RECONCILIATIONS
-- -------------------------------------------------------------
INSERT INTO public.payment_reconciliations (id, emi_id, utr_number, amount, payment_date, status, payer_name, receipt_url) VALUES
('rec_01', 'emi_101_1', 'UPI/321876543210/HDFC', 17200.00, (CURRENT_DATE - INTERVAL '41 days'), 'reconciled', 'Aarav Sharma', '/receipts/REC-2026-01.pdf'),
('rec_02', 'emi_141_1', 'RTGS/R20261015887', 28400.00, (CURRENT_DATE - INTERVAL '50 days'), 'reconciled', 'Manish Choudhury', '/receipts/REC-2026-02.pdf'),
('rec_03', NULL, 'UPI/998877665544/AXIS', 15000.00, (CURRENT_DATE - INTERVAL '2 days'), 'unmatched', 'Unknown Payer (Ref: Student Fee - UTR 998877)', NULL);

-- -------------------------------------------------------------
-- 13. CERTIFICATIONS
-- -------------------------------------------------------------
INSERT INTO public.certificates (id, student_id, course_id, verification_code, issue_date, status, signatory, certificate_url) VALUES
('cert_01', 'std_106', 'c_java', 'APEX-JFS-2026-001', (CURRENT_DATE - INTERVAL '5 days'), 'issued', 'Vikramaditya Mehta (Director)', 'https://verify.apextech.example.in/APEX-JFS-2026-001');

-- -------------------------------------------------------------
-- 14. CLASS RECORDINGS (Logical curriculum progression per batch)
-- -------------------------------------------------------------
INSERT INTO public.class_recordings (id, batch_id, topic, recording_date, duration_minutes, source, video_url, thumbnail_url, views_count, key_timestamps) VALUES
('rec_01', 'b_java_a', 'Spring Data JPA: One-to-Many Mappings & Lazy Loading Pitfalls', (CURRENT_DATE - INTERVAL '5 days'), 115, 'Lab 1 Recording Rig', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=480&auto=format&fit=crop&q=80', 34, '[{"time":"00:00","label":"JPA Entity Relationships"},{"time":"45:10","label":"N+1 Query Problem & Solutions"}]'::jsonb),
('rec_02', 'b_java_a', 'Microservices Architecture: Spring Cloud Gateway & Circuit Breakers', (CURRENT_DATE - INTERVAL '7 days'), 120, 'Lab 1 Recording Rig', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=480&auto=format&fit=crop&q=80', 41, '[{"time":"00:00","label":"Gateway Route Predicates"},{"time":"50:20","label":"Resilience4j Circuit Breaker"}]'::jsonb),
('rec_03', 'b_java_a', 'Spring Security 6: JWT Authentication Filters & Role Scopes', (CURRENT_DATE - INTERVAL '12 days'), 118, 'Lab 1 Recording Rig', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=480&auto=format&fit=crop&q=80', 29, '[{"time":"00:00","label":"SecurityFilterChain Configuration"},{"time":"42:15","label":"Bearer Token Interceptor"}]'::jsonb),

('rec_04', 'b_py_a', 'Pandas GroupBy, Window Functions & Efficient Chunk Processing', (CURRENT_DATE - INTERVAL '5 days'), 110, 'Studio 3 Pod', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=480&auto=format&fit=crop&q=80', 28, '[{"time":"00:00","label":"Multi-level Aggregations"},{"time":"38:00","label":"Rolling Windows & Expansions"}]'::jsonb),
('rec_05', 'b_py_a', 'FastAPI Production Setup: Async SQLAlchemy 2.0 & Connection Pools', (CURRENT_DATE - INTERVAL '7 days'), 115, 'Studio 3 Pod', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=480&auto=format&fit=crop&q=80', 35, '[{"time":"00:00","label":"Async Session Management"},{"time":"52:30","label":"Dependency Injection Pattern"}]'::jsonb),

('rec_06', 'b_ds_a', 'Fine-Tuning Llama 3 with QLoRA on Custom Technical Corpus', (CURRENT_DATE - INTERVAL '6 days'), 140, 'Hall 2 Studio Cam', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=480&auto=format&fit=crop&q=80', 48, '[{"time":"00:00","label":"bitsandbytes 4-bit Quantization"},{"time":"55:00","label":"PEFT Adapter Training Loss"}]'::jsonb),
('rec_07', 'b_ds_a', 'RAG Architecture: Hybrid Dense-Sparse Retrieval with Qdrant & BM25', (CURRENT_DATE - INTERVAL '8 days'), 135, 'Hall 2 Studio Cam', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=480&auto=format&fit=crop&q=80', 52, '[{"time":"00:00","label":"Embedding Pipeline"},{"time":"48:10","label":"Reciprocal Rank Fusion (RRF)"}]'::jsonb),

('rec_08', 'b_web_a', 'Docker Networking, Volumes & Multi-Stage Production Builds', (CURRENT_DATE - INTERVAL '5 days'), 110, 'Lab 1 Recording Rig', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://images.unsplash.com/photo-1605379399642-870262d3d051?w=480&auto=format&fit=crop&q=80', 22, '[{"time":"00:00","label":"Bridge vs Host Networks"},{"time":"40:00","label":"Multi-Stage Alpine Builds"}]'::jsonb),
('rec_09', 'b_web_a', 'Next.js 15 App Router: Server Actions, Suspense & Streaming SSR', (CURRENT_DATE - INTERVAL '7 days'), 115, 'Lab 1 Recording Rig', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=480&auto=format&fit=crop&q=80', 31, '[{"time":"00:00","label":"Server Component Boundaries"},{"time":"46:30","label":"Optimistic UI Mutations"}]'::jsonb);

-- -------------------------------------------------------------
-- 14b. NAMES AND PHONE NUMBERS CLEAN-UP
-- -------------------------------------------------------------
-- ---------------- PART 2A: replace names of well-known real people ----------------
UPDATE public.students AS s
SET name = v.new_name,
    email = lower(replace(v.new_name, ' ', '.')) || '@apextech.example.in'
FROM (VALUES
    ('std_118', 'Manoj Srivastava'),
    ('std_119', 'Saurabh Chatterjee'),
    ('std_127', 'Rahul Shenoy'),
    ('std_128', 'Jasdeep Grewal'),
    ('std_136', 'Shreya Bhowmick'),
    ('std_138', 'Devendra Kamat'),
    ('std_143', 'Gautam Soman'),
    ('std_150', 'Anuradha Mishra'),
    ('std_151', 'Varun Tandon'),
    ('std_152', 'Aditya Rao Kamath'),
    ('std_153', 'Kriti Wadhwa'),
    ('std_154', 'Ayush Khanduri'),
    ('std_155', 'Radhika Iyengar'),
    ('std_157', 'Amrita Dutta'),
    ('std_158', 'Jaspreet Randhawa'),
    ('std_162', 'Suraj Pathak')
) AS v(id, new_name)
WHERE s.id = v.id;

UPDATE public.trainers
SET name = 'Kavita Rangan', email = 'kavita.rangan@apextech.example.in'
WHERE id = 'tr_6';

-- ---------------- PART 2B: varied phone numbers (deterministic, no patterns) ----------------
UPDATE public.students
SET phone = ((6 + abs(hashtext(id)) % 4)::text) || lpad((abs(hashtext(id || '_ph')) % 1000000000)::text, 9, '0');


-- ====================================================================
-- 15. VERIFICATION BLOCK (Row counts & benchmark query verification)
-- ====================================================================

-- 1. Check Row Counts Across Core Tables
SELECT 'users' AS table_name, COUNT(*) AS count FROM public.users
UNION ALL SELECT 'courses', COUNT(*) FROM public.courses
UNION ALL SELECT 'trainers', COUNT(*) FROM public.trainers
UNION ALL SELECT 'rooms', COUNT(*) FROM public.rooms
UNION ALL SELECT 'batches', COUNT(*) FROM public.batches
UNION ALL SELECT 'students', COUNT(*) FROM public.students
UNION ALL SELECT 'emis', COUNT(*) FROM public.emis
UNION ALL SELECT 'payments', COUNT(*) FROM public.payments
UNION ALL SELECT 'attendance_records', COUNT(*) FROM public.attendance_records
UNION ALL SELECT 'timetable_sessions', COUNT(*) FROM public.timetable_sessions
UNION ALL SELECT 'class_recordings', COUNT(*) FROM public.class_recordings
ORDER BY table_name;

-- 2. Verify Benchmark Query:
-- Students in Java batch with >= 3 missed classes in the last 30 days AND an EMI due this week.
-- Must return at least 2 rows (std_101 Aarav Sharma and std_103 Sneha Patil).
SELECT
    e.student_name,
    e.batch_name,
    e.phone,
    a.missed_classes_last_30d,
    e.amount AS emi_amount,
    e.due_date,
    e.status AS emi_status
FROM public.student_attendance_30d a
JOIN public.emi_due_this_week e ON e.student_id = a.student_id
WHERE e.batch_name ILIKE '%Java%'
  AND a.missed_classes_last_30d >= 3
ORDER BY e.student_name;

-- 3. Verify Today & Tomorrow Timetable Sessions
SELECT
    t.id,
    b.name AS batch_name,
    tr.name AS trainer_name,
    t.weekday,
    t.start_time,
    t.end_time,
    t.mode
FROM public.timetable_sessions t
JOIN public.batches b ON t.batch_id = b.id
JOIN public.trainers tr ON t.trainer_id = tr.id
WHERE t.weekday IN (
    TRIM(TO_CHAR((now() AT TIME ZONE 'Asia/Kolkata')::date, 'Day')),
    TRIM(TO_CHAR(((now() AT TIME ZONE 'Asia/Kolkata')::date + 1), 'Day'))
)
ORDER BY t.weekday, t.start_time;

-- 4. Verify Overdue EMIs
SELECT
    student_name,
    batch_name,
    amount,
    due_date,
    status,
    days_overdue
FROM public.emi_due_this_week
WHERE days_overdue > 0;
