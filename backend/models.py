"""
Data models and schemas for the backend API (3NF Architecture).
"""
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel

UserRole = Literal['owner', 'counselor', 'trainer', 'accounts']

class User(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    trainer_id: Optional[str] = None
    avatar: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole
    phone: Optional[str] = None
    specialization: Optional[str] = None

# Student model reflects public.student_fee_summary view (with computed fee & attendance)
class Student(BaseModel):
    id: str
    name: str
    email: str
    phone_masked: str
    batch_id: str
    batch_name: str
    course_id: Optional[str] = None
    course_name: str
    enrollment_date: str
    status: Literal['active', 'graduated', 'dropped', 'on_leave'] = 'active'
    attendance_rate: float = 100.0
    missed_classes_last_30d: int = 0
    total_fee: float = 0.0
    fee_paid: float = 0.0
    fee_pending: float = 0.0
    overdue_emis_count: int = 0
    total_overdue_amount: float = 0.0

class TrainerSafeStudent(BaseModel):
    student_id: str
    name: str
    batch_id: str
    batch_name: str
    course_name: str
    enrollment_date: str
    status: str
    attendance_rate: float
    missed_classes_last_30d: int

class StudentCreate(BaseModel):
    name: str
    email: str
    phone: str
    batch_id: str
    enrollment_date: Optional[str] = None

class Batch(BaseModel):
    id: str
    name: str
    course_id: str
    course_name: str
    trainer_id: str
    trainer_name: str
    room_id: Optional[str] = None
    room_name: Optional[str] = None
    mode: Literal['classroom', 'hybrid', 'online']
    max_capacity: int = 35
    enrolled_count: int = 0
    active_students_count: int = 0
    seats_remaining: int = 35
    start_date: str
    schedule: str
    status: Literal['upcoming', 'ongoing', 'completed', 'cancelled'] = 'ongoing'
    batch_attendance_rate: float = 85.0

class BatchCreate(BaseModel):
    name: str
    course_id: str
    trainer_id: str
    mode: Literal['classroom', 'hybrid', 'online']
    max_capacity: int = 35
    start_date: str
    schedule: str
    room_id: Optional[str] = None
    status: Literal['upcoming', 'ongoing', 'completed'] = 'ongoing'

class Course(BaseModel):
    id: str
    name: str
    code: str
    duration_weeks: int
    fee: float
    category: str

class Trainer(BaseModel):
    id: str
    name: str
    email: str
    specialization: List[str]
    max_hours_per_week: int
    allocated_hours: float = 0.0
    utilization_pct: float = 0.0
    status: Literal['available', 'partially_available', 'on_leave', 'inactive'] = 'available'

class EMI(BaseModel):
    id: str
    student_id: str
    student_name: str
    phone: Optional[str] = None
    batch_name: str
    amount: float
    installment_no: int
    total_installments: int
    due_date: str
    paid_date: Optional[str] = None
    status: Literal['due', 'paid', 'missed', 'waived']
    days_overdue: int = 0

class Payment(BaseModel):
    id: str
    student_id: str
    emi_id: Optional[str] = None
    amount: float
    paid_on: str
    method: Literal['upi', 'card', 'bank_transfer', 'cash', 'cheque']
    transaction_ref: Optional[str] = None
    notes: Optional[str] = None

class PaymentCreate(BaseModel):
    student_id: str
    emi_id: Optional[str] = None
    amount: float
    method: Literal['upi', 'card', 'bank_transfer', 'cash', 'cheque'] = 'upi'
    transaction_ref: Optional[str] = None
    notes: Optional[str] = None

class AttendanceRecord(BaseModel):
    id: str
    student_id: str
    student_name: str
    batch_id: str
    batch_name: str
    type: Literal['classroom', 'online']
    date: str
    timestamp: str
    status: Literal['present', 'late', 'absent', 'excused']
    ip_or_location: Optional[str] = None
    duration_minutes: Optional[int] = None
    verified_by: Optional[str] = None

class CheckInRequest(BaseModel):
    student_id: str
    batch_id: str
    status: Literal['present', 'late']

class OnlineJoinRequest(BaseModel):
    student_id: str
    batch_id: str
    duration_minutes: int

class ActionItem(BaseModel):
    id: str
    type: str = 'whatsapp_reminder'
    student_name: str
    phone_masked: str
    message: str
    due_date: str
    status: Literal['pending', 'approved', 'rejected', 'sent', 'failed'] = 'pending'
    requested_by: str
    requested_at: str
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    outbox_reference: Optional[str] = None

class DraftReminder(BaseModel):
    student_name: str
    phone_masked: str
    message: str
    due_date: str

class DraftRemindersRequest(BaseModel):
    drafts: List[DraftReminder]
    requester: str

class BulkApproveRequest(BaseModel):
    ids: List[str]

class TimetableSession(BaseModel):
    id: str
    batch: str
    batch_id: str
    trainer: str
    trainer_id: str
    room: str
    weekday: str
    start: str
    end: str
    mode: str
    color_code: Optional[str] = None

class TimetableChange(BaseModel):
    session: str
    session_id: str
    from_slot: str
    to_slot: str
    reason: str

class TimetableRunResponse(BaseModel):
    run_id: str
    sessions: List[TimetableSession]
    conflicts: int
    duration_ms: int
    changes: Optional[List[TimetableChange]] = []
    created_at: str

class ReplanRequest(BaseModel):
    event: Literal['trainer_unavailable', 'batch_added']
    details: dict

class RedTeamTestResult(BaseModel):
    id: str
    prompt: str
    intent: str
    result: Literal['BLOCKED', 'LEAKED', 'ALLOWED']
    layer: str
    reason: str
    simulated_role: UserRole
    sql_attempted: Optional[str] = None
    response_summary: str

class PaymentReconciliation(BaseModel):
    id: str
    utr_number: str
    payer_name: str
    amount: float
    payment_mode: Literal['UPI', 'NEFT', 'NetBanking', 'Card', 'Cheque']
    timestamp: str
    matched_student_id: Optional[str] = None
    matched_student_name: Optional[str] = None
    matched_emi_id: Optional[str] = None
    confidence_score: int
    status: Literal['matched', 'unmatched', 'reconciled']
    bank_reference: str
    receipt_url: Optional[str] = None

class Certificate(BaseModel):
    id: str
    student_id: str
    student_name: str
    course_id: str
    course_name: str
    batch_name: str
    issue_date: str
    verification_code: str
    final_attendance: float
    fee_clearance: bool
    status: Literal['issued', 'eligible', 'ineligible']
    signatory: str
    certificate_url: Optional[str] = None

class IssueCertificateRequest(BaseModel):
    student_id: str
    course_id: str

class ClassRecording(BaseModel):
    id: str
    batch_id: str
    batch_name: str
    course_name: str
    topic: str
    trainer_name: str
    date: str
    duration_minutes: int
    source: str
    video_url: str
    thumbnail_url: str
    views_count: int
    notes_download_url: Optional[str] = None
    code_repo_url: Optional[str] = None
    key_timestamps: List[dict] = []

class DropoutRiskStudent(BaseModel):
    id: str
    student_id: str
    student_name: str
    batch_name: str
    course_name: str
    risk_score: int
    risk_tier: Literal['critical', 'high', 'moderate', 'safe']
    attendance_rate: float
    missed_classes: int
    consecutive_absences: int
    overdue_emis_count: int
    total_overdue_amount: float
    last_login_days_ago: int
    reasons: List[str]
    recommended_intervention: str
    intervention_status: Literal['none', 'counseling_scheduled', 'whatsapp_sent', 'plan_restructured']

class DropoutInterventionRequest(BaseModel):
    action_type: Literal['counseling_scheduled', 'whatsapp_sent', 'plan_restructured']

class FailureChainEvidence(BaseModel):
    dimension: Literal['attendance', 'assessment', 'fees', 'academic']
    department: str
    indicator: str
    metric: str
    severity: Literal['critical', 'warning', 'normal']
    timestamp: str
    verified_source: str

class CoordinatedSupportPlan(BaseModel):
    counselor_action: str
    trainer_action: str
    accounts_action: str
    unified_message: str
    follow_up_date: str

class FailureChainStudent(BaseModel):
    id: str
    student_id: str
    student_name: str
    phone_masked: str
    batch_name: str
    course_name: str
    chain_severity: Literal['critical_cascade', 'compound_risk', 'early_friction']
    correlation_score: int
    isolated_alert_flaw: str
    evidence_chain: List[FailureChainEvidence]
    coordinated_plan: CoordinatedSupportPlan
    resolution_status: Literal['unaddressed', 'plan_staged', 'in_progress', 'stabilized']

class FailureChainInterventionRequest(BaseModel):
    plan_status: Literal['plan_staged', 'in_progress', 'stabilized']
    notes: Optional[str] = None

class DashboardStats(BaseModel):
    activeStudents: int
    attendanceRate: float
    emisDueAmount: float
    emisDueCount: int
    trainerUtilization: float
    activeBatches: int

class DashboardAnalytics(BaseModel):
    stats: DashboardStats
    attendance_trend: List[Dict[str, Any]]
    batch_attendance: List[Dict[str, Any]]
    fee_forecast: List[Dict[str, Any]]
