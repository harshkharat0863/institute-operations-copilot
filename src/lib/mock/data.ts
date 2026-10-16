import { Batch, Course, EMI, Student, Trainer, User, AttendanceRecord } from '../../types';

export const DEMO_USERS: Record<string, User> = {
  owner: {
    id: 'usr_owner_1',
    name: 'Vikramaditya Mehta',
    email: 'owner@institute.org',
    role: 'owner',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  counselor: {
    id: 'usr_counselor_1',
    name: 'Anjali Sharma',
    email: 'counselor@institute.org',
    role: 'counselor',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
  },
  trainer: {
    id: 'usr_trainer_1',
    name: 'Priya Sundaram',
    email: 'priya.trainer@institute.org',
    role: 'trainer',
    trainer_id: 'tr_1',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
  },
  accounts: {
    id: 'usr_accounts_1',
    name: 'Suresh Iyer',
    email: 'accounts@institute.org',
    role: 'accounts',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
};

export const COURSES: Course[] = [
  { id: 'c_java', name: 'Java Fullstack Masterclass', code: 'JAVA-FS', duration_weeks: 16, fee: 45000, category: 'Backend Engineering' },
  { id: 'c_python', name: 'Python Data Engineering & ML', code: 'PY-DATA', duration_weeks: 14, fee: 42000, category: 'Data & Analytics' },
  { id: 'c_ds', name: 'Data Science & Generative AI', code: 'DS-GENAI', duration_weeks: 20, fee: 55000, category: 'AI / Data Science' },
  { id: 'c_webdev', name: 'Full Stack MERN & Next.js', code: 'FS-WEB', duration_weeks: 16, fee: 40000, category: 'Web Development' },
  { id: 'c_devops', name: 'DevOps & Cloud Automation (AWS/K8s)', code: 'DEVOPS-CLD', duration_weeks: 12, fee: 48000, category: 'Cloud & Infrastructure' },
  { id: 'c_testing', name: 'Software Testing & Automation QA', code: 'QA-AUTO', duration_weeks: 10, fee: 32000, category: 'Quality Assurance' },
];

export const TRAINERS: Trainer[] = [
  { id: 'tr_1', name: 'Priya Sundaram', email: 'priya.sundaram@institute.org', specialization: ['Java', 'Spring Boot', 'Microservices', 'PostgreSQL'], max_hours_per_week: 25, allocated_hours: 20, status: 'available' },
  { id: 'tr_2', name: 'Rajesh Verma', email: 'rajesh.verma@institute.org', specialization: ['Python', 'FastAPI', 'Django', 'Data Pipelines'], max_hours_per_week: 25, allocated_hours: 22, status: 'available' },
  { id: 'tr_3', name: 'Dr. Amit Patel', email: 'amit.patel@institute.org', specialization: ['Data Science', 'PyTorch', 'TensorFlow', 'LLMs'], max_hours_per_week: 20, allocated_hours: 18, status: 'available' },
  { id: 'tr_4', name: 'Neha Sengupta', email: 'neha.sengupta@institute.org', specialization: ['React', 'Next.js', 'Node.js', 'TypeScript'], max_hours_per_week: 25, allocated_hours: 21, status: 'available' },
  { id: 'tr_5', name: 'Vikram Joshi', email: 'vikram.joshi@institute.org', specialization: ['Docker', 'Kubernetes', 'AWS', 'Terraform'], max_hours_per_week: 20, allocated_hours: 16, status: 'available' },
  { id: 'tr_6', name: 'Ananya Deshmukh', email: 'ananya.deshmukh@institute.org', specialization: ['Selenium', 'Cypress', 'Playwright', 'API Testing'], max_hours_per_week: 20, allocated_hours: 15, status: 'available' },
  { id: 'tr_7', name: 'Sunil Rao', email: 'sunil.rao@institute.org', specialization: ['Java', 'Distributed Systems', 'Kafka'], max_hours_per_week: 25, allocated_hours: 18, status: 'available' },
  { id: 'tr_8', name: 'Divya Menon', email: 'divya.menon@institute.org', specialization: ['UI/UX Systems', 'Frontend Performance', 'React Native'], max_hours_per_week: 20, allocated_hours: 14, status: 'partially_available' },
];

export const ROOMS = [
  { id: 'rm_1', name: 'Lab 1 - Alpha (High-spec PCs)', capacity: 40 },
  { id: 'rm_2', name: 'Hall 2 - Beta (Lecture Theatre)', capacity: 55 },
  { id: 'rm_3', name: 'Studio 3 - Gamma (Hybrid Audio/Cam)', capacity: 32 },
  { id: 'rm_4', name: 'Seminar Hall 4 - Delta', capacity: 60 },
  { id: 'rm_5', name: 'Room 5 - Tech Lab Epsilon', capacity: 30 },
];

export const BATCHES: Batch[] = [
  {
    id: 'b_java_a',
    name: 'Java Fullstack - Batch A',
    course_id: 'c_java',
    course_name: 'Java Fullstack Masterclass',
    trainer_id: 'tr_1',
    trainer_name: 'Priya Sundaram',
    mode: 'classroom',
    room_id: 'rm_1',
    room_name: 'Lab 1 - Alpha',
    enrolled_count: 24,
    max_capacity: 35,
    start_date: '2026-08-15',
    schedule: 'Mon, Wed, Fri 09:00 - 11:00',
    status: 'ongoing',
  },
  {
    id: 'b_java_b',
    name: 'Java Fullstack - Batch B',
    course_id: 'c_java',
    course_name: 'Java Fullstack Masterclass',
    trainer_id: 'tr_1',
    trainer_name: 'Priya Sundaram',
    mode: 'hybrid',
    room_id: 'rm_2',
    room_name: 'Hall 2 - Beta',
    online_seat_limit: 25,
    enrolled_count: 28,
    max_capacity: 45,
    start_date: '2026-09-01',
    schedule: 'Tue, Thu, Sat 10:00 - 12:00',
    status: 'ongoing',
  },
  {
    id: 'b_py_a',
    name: 'Python Data Eng - Batch A',
    course_id: 'c_python',
    course_name: 'Python Data Engineering & ML',
    trainer_id: 'tr_2',
    trainer_name: 'Rajesh Verma',
    mode: 'classroom',
    room_id: 'rm_3',
    room_name: 'Studio 3 - Gamma',
    enrolled_count: 20,
    max_capacity: 30,
    start_date: '2026-08-20',
    schedule: 'Mon, Wed, Fri 11:30 - 13:30',
    status: 'ongoing',
  },
  {
    id: 'b_py_b',
    name: 'Python Data Eng - Batch B',
    course_id: 'c_python',
    course_name: 'Python Data Engineering & ML',
    trainer_id: 'tr_2',
    trainer_name: 'Rajesh Verma',
    mode: 'online',
    online_seat_limit: 40,
    enrolled_count: 32,
    max_capacity: 40,
    start_date: '2026-09-10',
    schedule: 'Tue, Thu 14:00 - 16:30',
    status: 'ongoing',
  },
  {
    id: 'b_ds_a',
    name: 'Data Science & GenAI - Batch A',
    course_id: 'c_ds',
    course_name: 'Data Science & Generative AI',
    trainer_id: 'tr_3',
    trainer_name: 'Dr. Amit Patel',
    mode: 'hybrid',
    room_id: 'rm_2',
    room_name: 'Hall 2 - Beta',
    online_seat_limit: 30,
    enrolled_count: 22,
    max_capacity: 40,
    start_date: '2026-07-20',
    schedule: 'Mon, Wed 14:00 - 16:30',
    status: 'ongoing',
  },
  {
    id: 'b_ds_b',
    name: 'Data Science & GenAI - Batch B',
    course_id: 'c_ds',
    course_name: 'Data Science & Generative AI',
    trainer_id: 'tr_3',
    trainer_name: 'Dr. Amit Patel',
    mode: 'online',
    online_seat_limit: 45,
    enrolled_count: 26,
    max_capacity: 45,
    start_date: '2026-09-15',
    schedule: 'Sat, Sun 10:00 - 13:00',
    status: 'ongoing',
  },
  {
    id: 'b_web_a',
    name: 'Full Stack MERN - Batch A',
    course_id: 'c_webdev',
    course_name: 'Full Stack MERN & Next.js',
    trainer_id: 'tr_4',
    trainer_name: 'Neha Sengupta',
    mode: 'classroom',
    room_id: 'rm_1',
    room_name: 'Lab 1 - Alpha',
    enrolled_count: 25,
    max_capacity: 35,
    start_date: '2026-08-05',
    schedule: 'Mon, Wed, Fri 14:00 - 16:00',
    status: 'ongoing',
  },
  {
    id: 'b_web_b',
    name: 'Full Stack MERN - Batch B',
    course_id: 'c_webdev',
    course_name: 'Full Stack MERN & Next.js',
    trainer_id: 'tr_4',
    trainer_name: 'Neha Sengupta',
    mode: 'hybrid',
    room_id: 'rm_4',
    room_name: 'Seminar Hall 4 - Delta',
    online_seat_limit: 25,
    enrolled_count: 21,
    max_capacity: 35,
    start_date: '2026-09-12',
    schedule: 'Tue, Thu, Sat 16:30 - 18:30',
    status: 'ongoing',
  },
  {
    id: 'b_devops_a',
    name: 'DevOps & Cloud - Batch A',
    course_id: 'c_devops',
    course_name: 'DevOps & Cloud Automation',
    trainer_id: 'tr_5',
    trainer_name: 'Vikram Joshi',
    mode: 'classroom',
    room_id: 'rm_5',
    room_name: 'Room 5 - Tech Lab',
    enrolled_count: 18,
    max_capacity: 25,
    start_date: '2026-08-25',
    schedule: 'Tue, Thu 09:30 - 12:00',
    status: 'ongoing',
  },
  {
    id: 'b_devops_b',
    name: 'DevOps & Cloud - Batch B',
    course_id: 'c_devops',
    course_name: 'DevOps & Cloud Automation',
    trainer_id: 'tr_5',
    trainer_name: 'Vikram Joshi',
    mode: 'online',
    online_seat_limit: 35,
    enrolled_count: 20,
    max_capacity: 35,
    start_date: '2026-10-01',
    schedule: 'Mon, Wed 16:30 - 18:30',
    status: 'ongoing',
  },
  {
    id: 'b_qa_a',
    name: 'QA Automation - Batch A',
    course_id: 'c_testing',
    course_name: 'Software Testing & Automation QA',
    trainer_id: 'tr_6',
    trainer_name: 'Ananya Deshmukh',
    mode: 'classroom',
    room_id: 'rm_3',
    room_name: 'Studio 3 - Gamma',
    enrolled_count: 16,
    max_capacity: 25,
    start_date: '2026-09-05',
    schedule: 'Mon, Wed, Fri 09:00 - 10:30',
    status: 'ongoing',
  },
  {
    id: 'b_qa_b',
    name: 'QA Automation - Batch B',
    course_id: 'c_testing',
    course_name: 'Software Testing & Automation QA',
    trainer_id: 'tr_6',
    trainer_name: 'Ananya Deshmukh',
    mode: 'online',
    online_seat_limit: 30,
    enrolled_count: 19,
    max_capacity: 30,
    start_date: '2026-10-05',
    schedule: 'Tue, Thu, Sat 14:00 - 15:30',
    status: 'upcoming',
  },
];

// Helper to generate 120 realistic Indian students with authentic patterns
const FIRST_NAMES = [
  'Aarav', 'Rohan', 'Sneha', 'Vikram', 'Aditya', 'Pooja', 'Rahul', 'Ananya',
  'Kavita', 'Siddharth', 'Ishaan', 'Tanvi', 'Varun', 'Meera', 'Arjun', 'Rhea',
  'Dev', 'Kiran', 'Nikhil', 'Priyanka', 'Gaurav', 'Shweta', 'Abhishek', 'Divya',
  'Harsh', 'Deepika', 'Manish', 'Neha', 'Sachin', 'Sonali', 'Kunal', 'Rashmi',
  'Vivek', 'Shruti', 'Kartik', 'Ritu', 'Pranav', 'Payal', 'Alok', 'Pallavi',
];

const LAST_NAMES = [
  'Sharma', 'Gupta', 'Patil', 'Malhotra', 'Verma', 'Deshmukh', 'Chopra', 'Nair',
  'Iyer', 'Reddy', 'Mehta', 'Kulkarni', 'Joshi', 'Bhat', 'Agarwal', 'Banerjee',
  'Mukherjee', 'Saxena', 'Kapoor', 'Singh', 'Choudhury', 'Pandey', 'Mishra', 'Gowda',
];

export function generateInitialStudents(): Student[] {
  const students: Student[] = [];

  // Key four students for the Java batch Copilot scenario:
  // "Which students in the Java batch have missed three or more classes and have an EMI due this week?"
  students.push({
    id: 'std_java_001',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.in',
    phone_masked: '98******21',
    course_id: 'c_java',
    course_name: 'Java Fullstack Masterclass',
    batch_id: 'b_java_a',
    batch_name: 'Java Fullstack - Batch A',
    enrollment_date: '2026-08-15',
    status: 'active',
    attendance_rate: 68,
    missed_classes_last_30d: 4,
    total_fee: 45000,
    fee_paid: 25000,
    fee_pending: 20000,
  });

  students.push({
    id: 'std_java_002',
    name: 'Rohan Gupta',
    email: 'rohan.gupta@example.in',
    phone_masked: '91******44',
    course_id: 'c_java',
    course_name: 'Java Fullstack Masterclass',
    batch_id: 'b_java_a',
    batch_name: 'Java Fullstack - Batch A',
    enrollment_date: '2026-08-16',
    status: 'active',
    attendance_rate: 72,
    missed_classes_last_30d: 3,
    total_fee: 45000,
    fee_paid: 22000,
    fee_pending: 23000,
  });

  students.push({
    id: 'std_java_003',
    name: 'Sneha Patil',
    email: 'sneha.patil@example.in',
    phone_masked: '97******83',
    course_id: 'c_java',
    course_name: 'Java Fullstack Masterclass',
    batch_id: 'b_java_b',
    batch_name: 'Java Fullstack - Batch B',
    enrollment_date: '2026-09-01',
    status: 'active',
    attendance_rate: 61,
    missed_classes_last_30d: 5,
    total_fee: 45000,
    fee_paid: 18000,
    fee_pending: 27000,
  });

  students.push({
    id: 'std_java_004',
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@example.in',
    phone_masked: '99******19',
    course_id: 'c_java',
    course_name: 'Java Fullstack Masterclass',
    batch_id: 'b_java_b',
    batch_name: 'Java Fullstack - Batch B',
    enrollment_date: '2026-09-02',
    status: 'active',
    attendance_rate: 70,
    missed_classes_last_30d: 3,
    total_fee: 45000,
    fee_paid: 20000,
    fee_pending: 25000,
  });

  // Generate the remaining 116 students across batches
  let count = 5;
  for (let i = 0; i < 116; i++) {
    const fName = FIRST_NAMES[(i * 3 + 7) % FIRST_NAMES.length];
    const lName = LAST_NAMES[(i * 5 + 11) % LAST_NAMES.length];
    const batch = BATCHES[i % BATCHES.length];
    const course = COURSES.find(c => c.id === batch.course_id)!;
    
    // Masked phone format with random last 2 digits
    const pPrefix = ['98', '97', '99', '96', '91', '88', '70'][i % 7];
    const pSuffix = String(10 + ((i * 17) % 90));
    const phoneMasked = `${pPrefix}******${pSuffix}`;

    const missed = (i % 6 === 0) ? 2 : (i % 9 === 0) ? 3 : (i % 4);
    const attendance = Math.max(55, Math.min(98, 92 - (missed * 7) + (i % 9)));
    const feePaid = Math.floor(course.fee * (0.3 + (i % 5) * 0.15));
    const feePending = Math.max(0, course.fee - feePaid);

    students.push({
      id: `std_${String(count).padStart(3, '0')}`,
      name: `${fName} ${lName}`,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@example.in`,
      phone_masked: phoneMasked,
      course_id: course.id,
      course_name: course.name,
      batch_id: batch.id,
      batch_name: batch.name,
      enrollment_date: `2026-0${7 + (i % 3)}-${String(1 + (i % 26)).padStart(2, '0')}`,
      status: i % 25 === 0 ? 'on_leave' : i % 35 === 0 ? 'dropped' : 'active',
      attendance_rate: attendance,
      missed_classes_last_30d: missed,
      total_fee: course.fee,
      fee_paid: feePaid,
      fee_pending: feePending,
    });
    count++;
  }

  return students;
}

export function generateInitialEMIs(students: Student[]): EMI[] {
  const emis: EMI[] = [];

  // Specifically configure EMIs for the 4 Java batch target students (due this week: Oct 16 - Oct 22, 2026)
  emis.push({
    id: 'emi_java_1',
    student_id: 'std_java_001',
    student_name: 'Aarav Sharma',
    batch_name: 'Java Fullstack - Batch A',
    amount: 6500,
    installment_no: 3,
    total_installments: 6,
    due_date: '2026-10-18',
    status: 'due',
  });

  emis.push({
    id: 'emi_java_2',
    student_id: 'std_java_002',
    student_name: 'Rohan Gupta',
    batch_name: 'Java Fullstack - Batch A',
    amount: 7000,
    installment_no: 3,
    total_installments: 6,
    due_date: '2026-10-19',
    status: 'due',
  });

  emis.push({
    id: 'emi_java_3',
    student_id: 'std_java_003',
    student_name: 'Sneha Patil',
    batch_name: 'Java Fullstack - Batch B',
    amount: 6500,
    installment_no: 2,
    total_installments: 6,
    due_date: '2026-10-16',
    status: 'due',
  });

  emis.push({
    id: 'emi_java_4',
    student_id: 'std_java_004',
    student_name: 'Vikram Malhotra',
    batch_name: 'Java Fullstack - Batch B',
    amount: 8000,
    installment_no: 2,
    total_installments: 6,
    due_date: '2026-10-20',
    status: 'due',
  });

  // Populate remaining EMIs (mix of due, paid, missed)
  students.slice(4).forEach((std, idx) => {
    if (std.fee_pending > 0) {
      const emiStatus: 'due' | 'paid' | 'missed' =
        idx % 7 === 0 ? 'missed' : idx % 3 === 0 ? 'paid' : 'due';
      
      const dueDay = 10 + (idx % 20);
      const dueDate = `2026-10-${String(dueDay).padStart(2, '0')}`;
      
      emis.push({
        id: `emi_gen_${idx}`,
        student_id: std.id,
        student_name: std.name,
        batch_name: std.batch_name,
        amount: Math.round(std.total_fee / 6),
        installment_no: 2 + (idx % 3),
        total_installments: 6,
        due_date: dueDate,
        paid_date: emiStatus === 'paid' ? '2026-10-05' : undefined,
        status: emiStatus,
        payment_method: emiStatus === 'paid' ? 'UPI / NetBanking' : undefined,
      });
    }
  });

  return emis;
}

export function generateInitialAttendance(students: Student[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = '2026-10-16';
  
  // Today's check-ins & online joins
  students.slice(0, 45).forEach((std, i) => {
    const isOnline = i % 2 === 0;
    records.push({
      id: `att_${i}`,
      student_id: std.id,
      student_name: std.name,
      batch_id: std.batch_id,
      batch_name: std.batch_name,
      type: isOnline ? 'online' : 'classroom',
      date: today,
      timestamp: `2026-10-16T09:${String(10 + (i % 45)).padStart(2, '0')}:00Z`,
      status: i % 11 === 0 ? 'late' : i % 23 === 0 ? 'absent' : 'present',
      ip_or_location: isOnline ? `103.21.${10 + (i % 80)}.${100 + (i % 90)}` : 'Campus Biometric Kiosk #1',
      duration_minutes: isOnline ? 95 - (i % 20) : 110,
      verified_by: isOnline ? 'Zoom SDK Bridge' : 'Biometric Terminal',
    });
  });

  return records;
}
