"""
Data models and initial seed data for the backend API.
"""
from typing import List, Optional, Literal
from pydantic import BaseModel

UserRole = Literal['owner', 'counselor', 'trainer', 'accounts']

class User(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    trainer_id: Optional[str] = None
    avatar: Optional[str] = None

class Student(BaseModel):
    id: str
    name: str
    email: str
    phone_masked: str
    course_id: Optional[str] = None
    course_name: str
    batch_id: Optional[str] = None
    batch_name: str
    enrollment_date: str
    status: Literal['active', 'graduated', 'dropped', 'on_leave'] = 'active'
    attendance_rate: int = 100
    missed_classes_last_30d: int = 0
    total_fee: float = 0
    fee_paid: float = 0
    fee_pending: float = 0

class StudentCreate(BaseModel):
    name: str
    email: str
    phone_masked: str
    course_id: Optional[str] = None
    course_name: str
    batch_id: Optional[str] = None
    batch_name: str
    enrollment_date: str
    status: Literal['active', 'graduated', 'dropped', 'on_leave'] = 'active'
    total_fee: float = 0
    fee_paid: float = 0
    fee_pending: float = 0

class Batch(BaseModel):
    id: str
    name: str
    course_id: str
    course_name: str
    trainer_id: str
    trainer_name: str
    mode: Literal['classroom', 'hybrid', 'online']
    room_id: Optional[str] = None
    room_name: Optional[str] = None
    online_seat_limit: Optional[int] = None
    enrolled_count: int = 0
    max_capacity: int = 35
    start_date: str
    schedule: str
    status: Literal['upcoming', 'ongoing', 'completed'] = 'ongoing'

class BatchCreate(BaseModel):
    name: str
    course_id: str
    course_name: str
    trainer_id: str
    trainer_name: str
    mode: Literal['classroom', 'hybrid', 'online']
    room_id: Optional[str] = None
    room_name: Optional[str] = None
    online_seat_limit: Optional[int] = None
    max_capacity: int = 35
    start_date: str
    schedule: str
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
    allocated_hours: int
    status: Literal['available', 'partially_available', 'on_leave']

class EMI(BaseModel):
    id: str
    student_id: str
    student_name: str
    batch_name: str
    amount: float
    installment_no: int
    total_installments: int
    due_date: str
    paid_date: Optional[str] = None
    status: Literal['due', 'paid', 'missed']
    payment_method: Optional[str] = None

class AttendanceRecord(BaseModel):
    id: str
    student_id: str
    student_name: str
    batch_id: str
    batch_name: str
    type: Literal['classroom', 'online']
    date: str
    timestamp: str
    status: Literal['present', 'late', 'absent']
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
    status: Literal['pending', 'approved', 'rejected', 'sent'] = 'pending'
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
