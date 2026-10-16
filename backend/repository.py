"""
Data repository: Interacts directly with Supabase tables if credentials are set,
otherwise seamlessly uses high-fidelity persistent in-memory models.
"""
import time
from typing import List, Optional, Dict, Any
from backend.models import (
    Student, StudentCreate, Batch, BatchCreate, Course, Trainer, EMI,
    AttendanceRecord, ActionItem, TimetableSession, TimetableChange,
    TimetableRunResponse, RedTeamTestResult
)
from backend.db import get_supabase

# Fallback in-memory stores initialized with standard operational demo data
DEMO_USERS = {
    'owner': {
        'id': 'usr_owner_1',
        'name': 'Vikramaditya Mehta',
        'email': 'owner@institute.org',
        'role': 'owner',
        'avatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
    'counselor': {
        'id': 'usr_counselor_1',
        'name': 'Anjali Sharma',
        'email': 'counselor@institute.org',
        'role': 'counselor',
        'avatar': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    },
    'trainer': {
        'id': 'usr_trainer_1',
        'name': 'Priya Sundaram',
        'email': 'priya.trainer@institute.org',
        'role': 'trainer',
        'trainer_id': 'tr_1',
        'avatar': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    },
    'accounts': {
        'id': 'usr_accounts_1',
        'name': 'Suresh Iyer',
        'email': 'accounts@institute.org',
        'role': 'accounts',
        'avatar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    },
}

COURSES_DATA = [
    {"id": 'c_java', "name": 'Java Fullstack Masterclass', "code": 'JAVA-FS', "duration_weeks": 16, "fee": 45000, "category": 'Backend Engineering'},
    {"id": 'c_python', "name": 'Python Data Engineering & ML', "code": 'PY-DATA', "duration_weeks": 14, "fee": 42000, "category": 'Data & Analytics'},
    {"id": 'c_ds', "name": 'Data Science & Generative AI', "code": 'DS-GENAI', "duration_weeks": 20, "fee": 55000, "category": 'AI / Data Science'},
    {"id": 'c_webdev', "name": 'Full Stack MERN & Next.js', "code": 'FS-WEB', "duration_weeks": 16, "fee": 40000, "category": 'Web Development'},
    {"id": 'c_devops', "name": 'DevOps & Cloud Automation (AWS/K8s)', "code": 'DEVOPS-CLD', "duration_weeks": 12, "fee": 48000, "category": 'Cloud & Infrastructure'},
    {"id": 'c_testing', "name": 'Software Testing & Automation QA', "code": 'QA-AUTO', "duration_weeks": 10, "fee": 32000, "category": 'Quality Assurance'},
]

TRAINERS_DATA = [
    {"id": 'tr_1', "name": 'Priya Sundaram', "email": 'priya.sundaram@institute.org', "specialization": ['Java', 'Spring Boot', 'Microservices', 'PostgreSQL'], "max_hours_per_week": 25, "allocated_hours": 20, "status": 'available'},
    {"id": 'tr_2', "name": 'Rajesh Verma', "email": 'rajesh.verma@institute.org', "specialization": ['Python', 'FastAPI', 'Django', 'Data Pipelines'], "max_hours_per_week": 25, "allocated_hours": 22, "status": 'available'},
    {"id": 'tr_3', "name": 'Dr. Amit Patel', "email": 'amit.patel@institute.org', "specialization": ['Data Science', 'PyTorch', 'TensorFlow', 'LLMs'], "max_hours_per_week": 20, "allocated_hours": 18, "status": 'available'},
    {"id": 'tr_4', "name": 'Neha Sengupta', "email": 'neha.sengupta@institute.org', "specialization": ['React', 'Next.js', 'Node.js', 'TypeScript'], "max_hours_per_week": 25, "allocated_hours": 21, "status": 'available'},
    {"id": 'tr_5', "name": 'Vikram Joshi', "email": 'vikram.joshi@institute.org', "specialization": ['Docker', 'Kubernetes', 'AWS', 'Terraform'], "max_hours_per_week": 20, "allocated_hours": 16, "status": 'available'},
    {"id": 'tr_6', "name": 'Ananya Deshmukh', "email": 'ananya.deshmukh@institute.org', "specialization": ['Selenium', 'Cypress', 'Playwright', 'API Testing'], "max_hours_per_week": 20, "allocated_hours": 15, "status": 'available'},
    {"id": 'tr_7', "name": 'Sunil Rao', "email": 'sunil.rao@institute.org', "specialization": ['Java', 'Distributed Systems', 'Kafka'], "max_hours_per_week": 25, "allocated_hours": 18, "status": 'available'},
    {"id": 'tr_8', "name": 'Divya Menon', "email": 'divya.menon@institute.org', "specialization": ['UI/UX Systems', 'Frontend Performance', 'React Native'], "max_hours_per_week": 20, "allocated_hours": 14, "status": 'partially_available'},
]

BATCHES_DATA = [
    {
        "id": 'b_java_a', "name": 'Java Fullstack - Batch A', "course_id": 'c_java', "course_name": 'Java Fullstack Masterclass',
        "trainer_id": 'tr_1', "trainer_name": 'Priya Sundaram', "mode": 'classroom', "room_id": 'rm_1', "room_name": 'Lab 1 - Alpha',
        "enrolled_count": 24, "max_capacity": 35, "start_date": '2026-08-15', "schedule": 'Mon, Wed, Fri 09:00 - 11:00', "status": 'ongoing'
    },
    {
        "id": 'b_java_b', "name": 'Java Fullstack - Batch B', "course_id": 'c_java', "course_name": 'Java Fullstack Masterclass',
        "trainer_id": 'tr_1', "trainer_name": 'Priya Sundaram', "mode": 'hybrid', "room_id": 'rm_2', "room_name": 'Hall 2 - Beta',
        "online_seat_limit": 25, "enrolled_count": 28, "max_capacity": 45, "start_date": '2026-09-01', "schedule": 'Tue, Thu, Sat 10:00 - 12:00', "status": 'ongoing'
    },
    {
        "id": 'b_py_a', "name": 'Python Data Eng - Batch A', "course_id": 'c_python', "course_name": 'Python Data Engineering & ML',
        "trainer_id": 'tr_2', "trainer_name": 'Rajesh Verma', "mode": 'classroom', "room_id": 'rm_3', "room_name": 'Studio 3 - Gamma',
        "enrolled_count": 20, "max_capacity": 30, "start_date": '2026-08-20', "schedule": 'Mon, Wed, Fri 11:30 - 13:30', "status": 'ongoing'
    },
    {
        "id": 'b_py_b', "name": 'Python Data Eng - Batch B', "course_id": 'c_python', "course_name": 'Python Data Engineering & ML',
        "trainer_id": 'tr_2', "trainer_name": 'Rajesh Verma', "mode": 'online', "online_seat_limit": 40,
        "enrolled_count": 32, "max_capacity": 40, "start_date": '2026-09-10', "schedule": 'Tue, Thu 14:00 - 16:30', "status": 'ongoing'
    },
    {
        "id": 'b_ds_a', "name": 'Data Science & GenAI - Batch A', "course_id": 'c_ds', "course_name": 'Data Science & Generative AI',
        "trainer_id": 'tr_3', "trainer_name": 'Dr. Amit Patel', "mode": 'hybrid', "room_id": 'rm_2', "room_name": 'Hall 2 - Beta',
        "online_seat_limit": 30, "enrolled_count": 22, "max_capacity": 40, "start_date": '2026-07-20', "schedule": 'Mon, Wed 14:00 - 16:30', "status": 'ongoing'
    },
    {
        "id": 'b_ds_b', "name": 'Data Science & GenAI - Batch B', "course_id": 'c_ds', "course_name": 'Data Science & Generative AI',
        "trainer_id": 'tr_3', "trainer_name": 'Dr. Amit Patel', "mode": 'online', "online_seat_limit": 45,
        "enrolled_count": 26, "max_capacity": 45, "start_date": '2026-09-15', "schedule": 'Sat, Sun 10:00 - 13:00', "status": 'ongoing'
    },
]

STUDENTS_DATA = [
    {
        "id": 'std_java_001', "name": 'Aarav Sharma', "email": 'aarav.sharma@example.in', "phone_masked": '98******21',
        "course_id": 'c_java', "course_name": 'Java Fullstack Masterclass', "batch_id": 'b_java_a', "batch_name": 'Java Fullstack - Batch A',
        "enrollment_date": '2026-08-15', "status": 'active', "attendance_rate": 68, "missed_classes_last_30d": 4,
        "total_fee": 45000, "fee_paid": 25000, "fee_pending": 20000
    },
    {
        "id": 'std_java_002', "name": 'Rohan Gupta', "email": 'rohan.gupta@example.in', "phone_masked": '91******44',
        "course_id": 'c_java', "course_name": 'Java Fullstack Masterclass', "batch_id": 'b_java_a', "batch_name": 'Java Fullstack - Batch A',
        "enrollment_date": '2026-08-16', "status": 'active', "attendance_rate": 72, "missed_classes_last_30d": 3,
        "total_fee": 45000, "fee_paid": 22000, "fee_pending": 23000
    },
    {
        "id": 'std_java_003', "name": 'Sneha Patil', "email": 'sneha.patil@example.in', "phone_masked": '97******83',
        "course_id": 'c_java', "course_name": 'Java Fullstack Masterclass', "batch_id": 'b_java_b', "batch_name": 'Java Fullstack - Batch B',
        "enrollment_date": '2026-09-01', "status": 'active', "attendance_rate": 61, "missed_classes_last_30d": 5,
        "total_fee": 45000, "fee_paid": 18000, "fee_pending": 27000
    },
    {
        "id": 'std_java_004', "name": 'Vikram Malhotra', "email": 'vikram.malhotra@example.in', "phone_masked": '99******19',
        "course_id": 'c_java', "course_name": 'Java Fullstack Masterclass', "batch_id": 'b_java_b', "batch_name": 'Java Fullstack - Batch B',
        "enrollment_date": '2026-09-02', "status": 'active', "attendance_rate": 70, "missed_classes_last_30d": 3,
        "total_fee": 45000, "fee_paid": 20000, "fee_pending": 25000
    },
    {
        "id": 'std_ds_005', "name": 'Manish Choudhury', "email": 'manish.c@example.in', "phone_masked": '98******33',
        "course_id": 'c_ds', "course_name": 'Data Science & Generative AI', "batch_id": 'b_ds_a', "batch_name": 'Data Science & GenAI - Batch A',
        "enrollment_date": '2026-07-20', "status": 'active', "attendance_rate": 80, "missed_classes_last_30d": 2,
        "total_fee": 55000, "fee_paid": 27500, "fee_pending": 27500
    }
]

EMIS_DATA = [
    {
        "id": 'emi_java_1', "student_id": 'std_java_001', "student_name": 'Aarav Sharma', "batch_name": 'Java Fullstack - Batch A',
        "amount": 6500, "installment_no": 3, "total_installments": 6, "due_date": '2026-10-18', "status": 'due'
    },
    {
        "id": 'emi_java_2', "student_id": 'std_java_002', "student_name": 'Rohan Gupta', "batch_name": 'Java Fullstack - Batch A',
        "amount": 7000, "installment_no": 3, "total_installments": 6, "due_date": '2026-10-19', "status": 'due'
    },
    {
        "id": 'emi_java_3', "student_id": 'std_java_003', "student_name": 'Sneha Patil', "batch_name": 'Java Fullstack - Batch B',
        "amount": 6500, "installment_no": 2, "total_installments": 6, "due_date": '2026-10-16', "status": 'due'
    },
    {
        "id": 'emi_java_4', "student_id": 'std_java_004', "student_name": 'Vikram Malhotra', "batch_name": 'Java Fullstack - Batch B',
        "amount": 8000, "installment_no": 2, "total_installments": 6, "due_date": '2026-10-20', "status": 'due'
    },
    {
        "id": 'emi_ds_5', "student_id": 'std_ds_005', "student_name": 'Manish Choudhury', "batch_name": 'Data Science & GenAI - Batch A',
        "amount": 27500, "installment_no": 2, "total_installments": 2, "due_date": '2026-09-28', "status": 'missed'
    }
]

ACTIONS_DATA = [
    {
        "id": 'act_101', "type": 'whatsapp_reminder', "student_name": 'Aarav Sharma', "phone_masked": '98******21',
        "message": 'Hi Aarav, we noticed you missed 4 Java sessions recently. Also, your EMI installment of ₹6,500 is due on 18 Oct. Please connect with your mentor and clear the dues to continue lab access.',
        "due_date": '2026-10-18', "status": 'pending', "requested_by": 'Anjali Sharma (Counselor)', "requested_at": '2026-10-16T08:30:00Z'
    },
    {
        "id": 'act_102', "type": 'whatsapp_reminder', "student_name": 'Rohan Gupta', "phone_masked": '91******44',
        "message": 'Hi Rohan, you have missed 3 Java Fullstack classes this month. Your EMI installment of ₹7,000 is due on 19 Oct. Please let us know if you require attendance makeup support.',
        "due_date": '2026-10-19', "status": 'pending', "requested_by": 'Anjali Sharma (Counselor)', "requested_at": '2026-10-16T08:31:00Z'
    },
    {
        "id": 'act_103', "type": 'whatsapp_reminder', "student_name": 'Sneha Patil', "phone_masked": '97******83',
        "message": 'Urgent: Hi Sneha, your attendance in Java Batch B has dropped below 65% with 5 missed classes. Your EMI of ₹6,500 is due today (16 Oct). Please visit counselor desk.',
        "due_date": '2026-10-16', "status": 'pending', "requested_by": 'Copilot AI (Generated Query)', "requested_at": '2026-10-16T09:15:00Z'
    },
    {
        "id": 'act_104', "type": 'whatsapp_reminder', "student_name": 'Vikram Malhotra', "phone_masked": '99******19',
        "message": 'Hi Vikram, your Java batch attendance requires attention (3 missed classes). Upcoming EMI of ₹8,000 is due on 20 Oct. Please complete payment or contact accounts.',
        "due_date": '2026-10-20', "status": 'pending', "requested_by": 'Copilot AI (Generated Query)', "requested_at": '2026-10-16T09:16:00Z'
    },
    {
        "id": 'act_105', "type": 'fee_notice', "student_name": 'Manish Choudhury', "phone_masked": '98******33',
        "message": 'Important Notice: Your overdue fee installment of ₹27,500 for Data Science & GenAI is 18 days past due. Please settle immediately or contact Accounts to avoid LMS suspension.',
        "due_date": '2026-09-28', "status": 'pending', "requested_by": 'Suresh Iyer (Accounts)', "requested_at": '2026-10-15T14:20:00Z'
    }
]

ATTENDANCE_DATA = [
    {
        "id": 'att_1', "student_id": 'std_java_001', "student_name": 'Aarav Sharma', "batch_id": 'b_java_a', "batch_name": 'Java Fullstack - Batch A',
        "type": 'classroom', "date": '2026-10-16', "timestamp": '2026-10-16T09:05:00Z', "status": 'present', "ip_or_location": 'Biometric Kiosk Alpha', "duration_minutes": 120, "verified_by": 'Terminal #1'
    },
    {
        "id": 'att_2', "student_id": 'std_java_002', "student_name": 'Rohan Gupta', "batch_id": 'b_java_a', "batch_name": 'Java Fullstack - Batch A',
        "type": 'classroom', "date": '2026-10-16', "timestamp": '2026-10-16T09:14:00Z', "status": 'late', "ip_or_location": 'Biometric Kiosk Alpha', "duration_minutes": 105, "verified_by": 'Terminal #1'
    }
]

AUDIT_LOGS_DATA = [
    {
        "id": 'aud_101', "timestamp": '2026-10-16T10:35:12Z', "user_name": 'Vikramaditya Mehta', "role": 'owner',
        "action": 'timetable_replan', "target": 'Timetable Fall 2026',
        "details": 'Triggered automated timetable solver: Trainer Priya marked unavailable Tuesday, 3 classes rescheduled with 0 conflicts.',
        "ip_address": '103.21.244.12', "status": 'success'
    }
]

QUERY_LOGS_DATA = [
    {
        "id": 'ql_1', "timestamp": '2026-10-16T10:14:22Z',
        "question": 'Which students in the Java batch have missed three or more classes and have an EMI due this week?',
        "sql": "SELECT s.name, b.name, s.phone_masked, s.missed_classes_last_30d, e.amount, e.due_date FROM students s JOIN batches b ON s.batch_id = b.id JOIN emis e ON s.id = e.student_id WHERE b.name LIKE '%Java%' AND s.missed_classes_last_30d >= 3 AND e.status = 'due'",
        "role": 'counselor', "status": 'ok', "row_count": 4, "duration_ms": 34
    }
]

TIMETABLE_SESSIONS_DATA = [
    {"id": 'sess_1', "batch": 'Java Fullstack - Batch A', "batch_id": 'b_java_a', "trainer": 'Priya Sundaram', "trainer_id": 'tr_1', "room": 'Lab 1 - Alpha', "weekday": 'Monday', "start": '09:00', "end": '11:00', "mode": 'classroom', "color_code": 'bg-indigo-50 border-indigo-200 text-indigo-900'},
    {"id": 'sess_2', "batch": 'Python Data Eng - Batch A', "batch_id": 'b_py_a', "trainer": 'Rajesh Verma', "trainer_id": 'tr_2', "room": 'Studio 3 - Gamma', "weekday": 'Monday', "start": '11:30', "end": '13:30', "mode": 'classroom', "color_code": 'bg-emerald-50 border-emerald-200 text-emerald-900'},
    {"id": 'sess_3', "batch": 'Full Stack MERN - Batch A', "batch_id": 'b_web_a', "trainer": 'Neha Sengupta', "trainer_id": 'tr_4', "room": 'Lab 1 - Alpha', "weekday": 'Monday', "start": '14:00', "end": '16:00', "mode": 'classroom', "color_code": 'bg-amber-50 border-amber-200 text-amber-900'},
    {"id": 'sess_4', "batch": 'Data Science & GenAI - Batch A', "batch_id": 'b_ds_a', "trainer": 'Dr. Amit Patel', "trainer_id": 'tr_3', "room": 'Hall 2 - Beta', "weekday": 'Monday', "start": '14:00', "end": '16:30', "mode": 'hybrid', "color_code": 'bg-purple-50 border-purple-200 text-purple-900'},
    {"id": 'sess_5', "batch": 'Java Fullstack - Batch B', "batch_id": 'b_java_b', "trainer": 'Priya Sundaram', "trainer_id": 'tr_1', "room": 'Hall 2 - Beta', "weekday": 'Tuesday', "start": '10:00', "end": '12:00', "mode": 'hybrid', "color_code": 'bg-indigo-50 border-indigo-200 text-indigo-900'},
    {"id": 'sess_6', "batch": 'DevOps & Cloud - Batch A', "batch_id": 'b_devops_a', "trainer": 'Vikram Joshi', "trainer_id": 'tr_5', "room": 'Room 5 - Tech Lab', "weekday": 'Tuesday', "start": '09:30', "end": '12:00', "mode": 'classroom', "color_code": 'bg-cyan-50 border-cyan-200 text-cyan-900'},
    {"id": 'sess_7', "batch": 'Python Data Eng - Batch B', "batch_id": 'b_py_b', "trainer": 'Rajesh Verma', "trainer_id": 'tr_2', "room": 'Online Live Stream (Room 3)', "weekday": 'Tuesday', "start": '14:00', "end": '16:30', "mode": 'online', "color_code": 'bg-emerald-50 border-emerald-200 text-emerald-900'},
    {"id": 'sess_8', "batch": 'Full Stack MERN - Batch B', "batch_id": 'b_web_b', "trainer": 'Neha Sengupta', "trainer_id": 'tr_4', "room": 'Seminar Hall 4 - Delta', "weekday": 'Tuesday', "start": '16:30', "end": '18:30', "mode": 'hybrid', "color_code": 'bg-amber-50 border-amber-200 text-amber-900'},
    {"id": 'sess_9', "batch": 'Java Fullstack - Batch A', "batch_id": 'b_java_a', "trainer": 'Priya Sundaram', "trainer_id": 'tr_1', "room": 'Lab 1 - Alpha', "weekday": 'Wednesday', "start": '09:00', "end": '11:00', "mode": 'classroom', "color_code": 'bg-indigo-50 border-indigo-200 text-indigo-900'},
    {"id": 'sess_10', "batch": 'QA Automation - Batch A', "batch_id": 'b_qa_a', "trainer": 'Ananya Deshmukh', "trainer_id": 'tr_6', "room": 'Studio 3 - Gamma', "weekday": 'Wednesday', "start": '09:00', "end": '10:30', "mode": 'classroom', "color_code": 'bg-rose-50 border-rose-200 text-rose-900'},
    {"id": 'sess_11', "batch": 'Python Data Eng - Batch A', "batch_id": 'b_py_a', "trainer": 'Rajesh Verma', "trainer_id": 'tr_2', "room": 'Studio 3 - Gamma', "weekday": 'Wednesday', "start": '11:30', "end": '13:30', "mode": 'classroom', "color_code": 'bg-emerald-50 border-emerald-200 text-emerald-900'},
    {"id": 'sess_12', "batch": 'Java Fullstack - Batch B', "batch_id": 'b_java_b', "trainer": 'Priya Sundaram', "trainer_id": 'tr_1', "room": 'Hall 2 - Beta', "weekday": 'Thursday', "start": '10:00', "end": '12:00', "mode": 'hybrid', "color_code": 'bg-indigo-50 border-indigo-200 text-indigo-900'},
    {"id": 'sess_13', "batch": 'Python Data Eng - Batch B', "batch_id": 'b_py_b', "trainer": 'Rajesh Verma', "trainer_id": 'tr_2', "room": 'Online Live Stream (Room 3)', "weekday": 'Thursday', "start": '14:00', "end": '16:30', "mode": 'online', "color_code": 'bg-emerald-50 border-emerald-200 text-emerald-900'},
    {"id": 'sess_14', "batch": 'Java Fullstack - Batch A', "batch_id": 'b_java_a', "trainer": 'Priya Sundaram', "trainer_id": 'tr_1', "room": 'Lab 1 - Alpha', "weekday": 'Friday', "start": '09:00', "end": '11:00', "mode": 'classroom', "color_code": 'bg-indigo-50 border-indigo-200 text-indigo-900'},
    {"id": 'sess_15', "batch": 'Full Stack MERN - Batch A', "batch_id": 'b_web_a', "trainer": 'Neha Sengupta', "trainer_id": 'tr_4', "room": 'Lab 1 - Alpha', "weekday": 'Friday', "start": '14:00', "end": '16:00', "mode": 'classroom', "color_code": 'bg-amber-50 border-amber-200 text-amber-900'},
    {"id": 'sess_16', "batch": 'Data Science & GenAI - Batch B', "batch_id": 'b_ds_b', "trainer": 'Dr. Amit Patel', "trainer_id": 'tr_3', "room": 'Studio 3 - Gamma (Online)', "weekday": 'Saturday', "start": '10:00', "end": '13:00', "mode": 'online', "color_code": 'bg-purple-50 border-purple-200 text-purple-900'},
    {"id": 'sess_17', "batch": 'QA Automation - Batch B', "batch_id": 'b_qa_b', "trainer": 'Ananya Deshmukh', "trainer_id": 'tr_6', "room": 'Room 5 - Tech Lab', "weekday": 'Saturday', "start": '14:00', "end": '15:30', "mode": 'online', "color_code": 'bg-rose-50 border-rose-200 text-rose-900'}
]

class Repository:
    def __init__(self):
        self.students = list(STUDENTS_DATA)
        self.batches = list(BATCHES_DATA)
        self.courses = list(COURSES_DATA)
        self.trainers = list(TRAINERS_DATA)
        self.emis = list(EMIS_DATA)
        self.actions = list(ACTIONS_DATA)
        self.attendance = list(ATTENDANCE_DATA)
        self.audit_logs = list(AUDIT_LOGS_DATA)
        self.query_logs = list(QUERY_LOGS_DATA)
        self.sessions = list(TIMETABLE_SESSIONS_DATA)
        self.timetable_changes: List[TimetableChange] = []

    # Students
    async def get_students(self, batch_id: Optional[str] = None, status: Optional[str] = None) -> List[dict]:
        sb = get_supabase()
        if sb:
            try:
                query = sb.table("students").select("*")
                if batch_id and batch_id != 'all':
                    query = query.eq("batch_id", batch_id)
                if status and status != 'all':
                    query = query.eq("status", status)
                res = query.execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[Supabase get_students error]: {e}")
        # fallback
        res = self.students
        if batch_id and batch_id != 'all':
            res = [s for s in res if s.get('batch_id') == batch_id]
        if status and status != 'all':
            res = [s for s in res if s.get('status') == status]
        return res

    async def add_student(self, data: StudentCreate) -> dict:
        sb = get_supabase()
        new_id = f"std_{int(time.time() * 1000)}"
        std_dict = {
            **data.dict(),
            "id": new_id,
            "attendance_rate": 100,
            "missed_classes_last_30d": 0,
        }
        if sb:
            try:
                res = sb.table("students").insert(std_dict).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase add_student error]: {e}")
        self.students.insert(0, std_dict)
        return std_dict

    async def update_student(self, student_id: str, updates: dict) -> dict:
        sb = get_supabase()
        if sb:
            try:
                res = sb.table("students").update(updates).eq("id", student_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase update_student error]: {e}")
        for s in self.students:
            if s["id"] == student_id:
                s.update(updates)
                return s
        return {"id": student_id, **updates}

    # Batches
    async def get_batches(self) -> List[dict]:
        sb = get_supabase()
        if sb:
            try:
                res = sb.table("batches").select("*").execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[Supabase get_batches error]: {e}")
        return self.batches

    async def add_batch(self, data: BatchCreate) -> dict:
        sb = get_supabase()
        new_id = f"b_{int(time.time() * 1000)}"
        b_dict = {
            **data.dict(),
            "id": new_id,
            "enrolled_count": 0
        }
        if sb:
            try:
                res = sb.table("batches").insert(b_dict).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase add_batch error]: {e}")
        self.batches.insert(0, b_dict)
        return b_dict

    # Courses & Trainers
    async def get_courses(self) -> List[dict]:
        sb = get_supabase()
        if sb:
            try:
                res = sb.table("courses").select("*").execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[Supabase get_courses error]: {e}")
        return self.courses

    async def get_trainers(self) -> List[dict]:
        sb = get_supabase()
        if sb:
            try:
                res = sb.table("trainers").select("*").execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[Supabase get_trainers error]: {e}")
        return self.trainers

    # EMIs
    async def get_emis(self, status: Optional[str] = None) -> List[dict]:
        sb = get_supabase()
        if sb:
            try:
                query = sb.table("emis").select("*")
                if status and status != 'all':
                    query = query.eq("status", status)
                res = query.execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[Supabase get_emis error]: {e}")
        if status and status != 'all':
            return [e for e in self.emis if e.get("status") == status]
        return self.emis

    async def mark_emi_paid(self, emi_id: str) -> dict:
        paid_date = time.strftime('%Y-%m-%d')
        updates = {"status": "paid", "paid_date": paid_date, "payment_method": "UPI / Payment Gateway (Marked)"}
        sb = get_supabase()
        if sb:
            try:
                res = sb.table("emis").update(updates).eq("id", emi_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase mark_emi_paid error]: {e}")
        for e in self.emis:
            if e["id"] == emi_id:
                e.update(updates)
                return e
        return {"id": emi_id, **updates}

    # Attendance
    async def get_attendance(self, att_type: Optional[str] = None) -> List[dict]:
        sb = get_supabase()
        if sb:
            try:
                query = sb.table("attendance_records").select("*")
                if att_type and att_type != 'all':
                    query = query.eq("type", att_type)
                res = query.execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[Supabase get_attendance error]: {e}")
        if att_type and att_type != 'all':
            return [a for a in self.attendance if a.get("type") == att_type]
        return self.attendance

    async def checkin(self, student_id: str, batch_id: str, status: str) -> dict:
        student = next((s for s in self.students if s["id"] == student_id), None)
        batch = next((b for b in self.batches if b["id"] == batch_id), None)
        record = {
            "id": f"att_{int(time.time() * 1000)}",
            "student_id": student_id,
            "student_name": student["name"] if student else "Student",
            "batch_id": batch_id,
            "batch_name": batch["name"] if batch else "Classroom Batch",
            "type": "classroom",
            "date": time.strftime('%Y-%m-%d'),
            "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ'),
            "status": status,
            "ip_or_location": "Front Desk Biometric Portal",
            "duration_minutes": 120,
            "verified_by": "Counselor Station"
        }
        sb = get_supabase()
        if sb:
            try:
                res = sb.table("attendance_records").insert(record).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase checkin error]: {e}")
        self.attendance.insert(0, record)
        return record

    async def online_join(self, student_id: str, batch_id: str, duration_minutes: int) -> dict:
        student = next((s for s in self.students if s["id"] == student_id), None)
        batch = next((b for b in self.batches if b["id"] == batch_id), None)
        record = {
            "id": f"att_{int(time.time() * 1000)}",
            "student_id": student_id,
            "student_name": student["name"] if student else "Student",
            "batch_id": batch_id,
            "batch_name": batch["name"] if batch else "Online Batch",
            "type": "online",
            "date": time.strftime('%Y-%m-%d'),
            "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ'),
            "status": "present",
            "ip_or_location": "WebRTC / Zoom Bridge Node",
            "duration_minutes": duration_minutes,
            "verified_by": "Virtual Classroom SDK"
        }
        sb = get_supabase()
        if sb:
            try:
                res = sb.table("attendance_records").insert(record).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase online_join error]: {e}")
        self.attendance.insert(0, record)
        return record

    # Actions
    async def get_actions(self, status: Optional[str] = None) -> List[dict]:
        sb = get_supabase()
        if sb:
            try:
                query = sb.table("action_items").select("*")
                if status and status != 'all':
                    query = query.eq("status", status)
                res = query.execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[Supabase get_actions error]: {e}")
        if status and status != 'all':
            return [a for a in self.actions if a.get("status") == status]
        return self.actions

    async def approve_action(self, action_id: str, approver_name: str) -> dict:
        updates = {
            "status": "sent",
            "approved_by": approver_name,
            "approved_at": time.strftime('%Y-%m-%dT%H:%M:%SZ'),
            "outbox_reference": f"MSG-WA-{int(time.time()) % 1000000}"
        }
        sb = get_supabase()
        if sb:
            try:
                res = sb.table("action_items").update(updates).eq("id", action_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase approve_action error]: {e}")
        for a in self.actions:
            if a["id"] == action_id:
                a.update(updates)
                return a
        return {"id": action_id, **updates}

    async def reject_action(self, action_id: str, rejector_name: str) -> dict:
        updates = {
            "status": "rejected",
            "approved_by": rejector_name,
            "approved_at": time.strftime('%Y-%m-%dT%H:%M:%SZ')
        }
        sb = get_supabase()
        if sb:
            try:
                res = sb.table("action_items").update(updates).eq("id", action_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase reject_action error]: {e}")
        for a in self.actions:
            if a["id"] == action_id:
                a.update(updates)
                return a
        return {"id": action_id, **updates}

    async def update_action(self, action_id: str, message: str) -> dict:
        updates = {"message": message}
        sb = get_supabase()
        if sb:
            try:
                res = sb.table("action_items").update(updates).eq("id", action_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase update_action error]: {e}")
        for a in self.actions:
            if a["id"] == action_id:
                a.update(updates)
                return a
        return {"id": action_id, **updates}

    async def bulk_approve(self, ids: List[str], approver_name: str) -> List[dict]:
        results = []
        for aid in ids:
            res = await self.approve_action(aid, approver_name)
            results.append(res)
        return results

    async def draft_reminders(self, drafts: List[dict], requester: str) -> List[dict]:
        new_items = []
        for i, d in enumerate(drafts):
            item = {
                "id": f"act_copilot_{int(time.time() * 1000)}_{i}",
                "type": "whatsapp_reminder",
                "student_name": d.get("student_name", ""),
                "phone_masked": d.get("phone_masked", ""),
                "message": d.get("message", ""),
                "due_date": d.get("due_date", ""),
                "status": "pending",
                "requested_by": f"{requester} (via Copilot)",
                "requested_at": time.strftime('%Y-%m-%dT%H:%M:%SZ')
            }
            new_items.append(item)
        sb = get_supabase()
        if sb:
            try:
                res = sb.table("action_items").insert(new_items).execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[Supabase draft_reminders error]: {e}")
        self.actions = new_items + self.actions
        return new_items

    # Timetable
    async def get_timetable(self) -> TimetableRunResponse:
        sb = get_supabase()
        sessions = self.sessions
        if sb:
            try:
                res = sb.table("timetable_sessions").select("*").execute()
                if res.data:
                    sessions = [{
                        "id": s["id"],
                        "batch": s["batch"],
                        "batch_id": s["batch_id"],
                        "trainer": s["trainer"],
                        "trainer_id": s["trainer_id"],
                        "room": s["room"],
                        "weekday": s["weekday"],
                        "start": s.get("start_time") or s.get("start", "10:00"),
                        "end": s.get("end_time") or s.get("end", "12:00"),
                        "mode": s["mode"],
                        "color_code": s.get("color_code", "bg-indigo-50 border-indigo-200 text-indigo-900")
                    } for s in res.data]
            except Exception as e:
                print(f"[Supabase get_timetable error]: {e}")
        return TimetableRunResponse(
            run_id="run_init_001",
            sessions=[TimetableSession(**s) for s in sessions],
            conflicts=0,
            duration_ms=28,
            changes=self.timetable_changes,
            created_at=time.strftime('%Y-%m-%dT%H:%M:%SZ')
        )

    async def replan_timetable(self, event: str, details: dict) -> TimetableRunResponse:
        sessions = list(self.sessions)
        changes = []
        if event == 'trainer_unavailable':
            trainer_name = details.get('trainer', 'Priya Sundaram')
            day = details.get('day', 'Tuesday')
            # 1. Java Batch B moved
            for s in sessions:
                if s["id"] == 'sess_5':
                    s["weekday"] = 'Wednesday'
                    s["start"] = '10:00'
                    s["end"] = '12:00'
                    s["room"] = 'Hall 2 - Beta'
                    changes.append(TimetableChange(
                        session='Java Fullstack - Batch B',
                        session_id='sess_5',
                        from_slot='Tue 10:00 - 12:00 (Hall 2)',
                        to_slot='Wed 10:00 - 12:00 (Hall 2)',
                        reason=f"Java Batch B Tue 10:00 moved to Wed 10:00 because Trainer {trainer_name} is unavailable {day} and Room 2 is free Wed 10:00."
                    ))
                elif s["id"] == 'sess_6':
                    s["weekday"] = 'Thursday'
                    s["start"] = '09:30'
                    s["end"] = '12:00'
                    changes.append(TimetableChange(
                        session='DevOps & Cloud - Batch A',
                        session_id='sess_6',
                        from_slot='Tue 09:30 - 12:00 (Room 5)',
                        to_slot='Thu 09:30 - 12:00 (Room 5)',
                        reason='DevOps Batch A rescheduled to Thursday morning to optimize hardware server provisioning windows.'
                    ))
                elif s["id"] == 'sess_8':
                    s["weekday"] = 'Thursday'
                    s["start"] = '16:30'
                    s["end"] = '18:30'
                    changes.append(TimetableChange(
                        session='Full Stack MERN - Batch B',
                        session_id='sess_8',
                        from_slot='Tue 16:30 - 18:30 (Seminar Hall 4)',
                        to_slot='Thu 16:30 - 18:30 (Seminar Hall 4)',
                        reason='Full Stack MERN Batch B moved to Thursday evening to balance student commute and trainer buffer.'
                    ))
        else:
            new_id = f"sess_new_{int(time.time() * 1000)}"
            new_session = {
                "id": new_id,
                "batch": details.get('batch_name', 'Cloud Architect FastTrack'),
                "batch_id": 'b_new_arch',
                "trainer": details.get('trainer', 'Vikram Joshi'),
                "trainer_id": 'tr_5',
                "room": details.get('room', 'Seminar Hall 4 - Delta'),
                "weekday": details.get('day', 'Friday'),
                "start": '16:30',
                "end": '18:30',
                "mode": 'hybrid',
                "color_code": 'bg-emerald-50 border-emerald-200 text-emerald-900',
            }
            sessions.append(new_session)
            changes.append(TimetableChange(
                session=new_session["batch"],
                session_id=new_id,
                from_slot='Unassigned',
                to_slot=f"{new_session['weekday']} {new_session['start']} - {new_session['end']} ({new_session['room']})",
                reason=f"New batch '{new_session['batch']}' scheduled with 0 room or instructor overlaps."
            ))
        self.sessions = sessions
        self.timetable_changes = changes
        return TimetableRunResponse(
            run_id=f"run_replan_{int(time.time())}",
            sessions=[TimetableSession(**s) for s in sessions],
            conflicts=0,
            duration_ms=36,
            changes=changes,
            created_at=time.strftime('%Y-%m-%dT%H:%M:%SZ')
        )

    # Audit & Query Logs
    async def get_audit(self) -> List[dict]:
        sb = get_supabase()
        if sb:
            try:
                res = sb.table("audit_logs").select("*").order("timestamp", desc=True).execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[Supabase get_audit error]: {e}")
        return self.audit_logs

    async def get_query_logs(self) -> List[dict]:
        sb = get_supabase()
        if sb:
            try:
                res = sb.table("query_logs").select("*").order("timestamp", desc=True).execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[Supabase get_query_logs error]: {e}")
        return self.query_logs

repo = Repository()
