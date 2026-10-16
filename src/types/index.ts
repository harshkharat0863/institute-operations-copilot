export type UserRole = 'owner' | 'counselor' | 'trainer' | 'accounts';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  trainer_id?: string;
  avatar?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone_masked: string; // e.g. "98******21"
  course_id: string;
  course_name: string;
  batch_id: string;
  batch_name: string;
  enrollment_date: string;
  status: 'active' | 'graduated' | 'dropped' | 'on_leave';
  attendance_rate: number; // percentage, e.g. 84
  missed_classes_last_30d: number;
  total_fee: number;
  fee_paid: number;
  fee_pending: number;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  duration_weeks: number;
  fee: number;
  category: string;
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
  specialization: string[];
  max_hours_per_week: number;
  allocated_hours: number;
  status: 'available' | 'partially_available' | 'on_leave';
}

export type BatchMode = 'classroom' | 'hybrid' | 'online';

export interface Batch {
  id: string;
  name: string;
  course_id: string;
  course_name: string;
  trainer_id: string;
  trainer_name: string;
  mode: BatchMode;
  room_id?: string;
  room_name?: string;
  online_seat_limit?: number;
  enrolled_count: number;
  max_capacity: number;
  start_date: string;
  schedule: string; // e.g. "Mon, Wed, Fri 10:00 - 12:00"
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface EMI {
  id: string;
  student_id: string;
  student_name: string;
  batch_name: string;
  amount: number;
  installment_no: number;
  total_installments: number;
  due_date: string;
  paid_date?: string;
  status: 'due' | 'paid' | 'missed';
  payment_method?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  batch_id: string;
  batch_name: string;
  type: 'classroom' | 'online';
  date: string;
  timestamp: string;
  status: 'present' | 'late' | 'absent';
  ip_or_location?: string;
  duration_minutes?: number;
  verified_by?: string;
}

export interface CopilotAskResponse {
  answer: string;
  columns: string[];
  rows: any[][];
  sql: string;
  tables_used: string[];
  row_count: number;
  duration_ms: number;
  status: 'ok' | 'blocked' | 'partial';
  blocked_reason?: string;
  blocked_layer?: 'validator' | 'role view' | 'database security' | 'input guardrail';
  partial_explanation?: string;
  can_draft_reminders: boolean;
  generated_actions?: PendingActionDraft[];
  operation?: string;
  operation_payload?: Record<string, any>;
  category?: 'attendance' | 'fees' | 'timetable' | 'risk_detection' | 'communication' | 'unsupported';
  explanation_note?: string;
}

export interface PendingActionDraft {
  student_id: string;
  student_name: string;
  phone_masked: string;
  message: string;
  due_date: string;
  amount?: number;
}

export interface ActionItem {
  id: string;
  type: 'whatsapp_reminder' | 'batch_alert' | 'fee_notice' | 'attendance_escalation';
  student_name: string;
  phone_masked: string;
  message: string;
  due_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'sent';
  requested_by: string;
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  outbox_reference?: string;
}

export type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface TimetableSession {
  id: string;
  batch: string;
  batch_id: string;
  trainer: string;
  trainer_id: string;
  room: string;
  weekday: Weekday;
  start: string; // e.g. "10:00"
  end: string;   // e.g. "12:00"
  mode: BatchMode;
  color_code?: string;
}

export interface TimetableChange {
  session: string;
  session_id: string;
  from_slot: string; // e.g. "Tue 10:00 - 12:00 (Room 2)"
  to_slot: string;   // e.g. "Wed 10:00 - 12:00 (Room 2)"
  reason: string;
}

export interface TimetableRunResponse {
  run_id: string;
  sessions: TimetableSession[];
  conflicts: number;
  duration_ms: number;
  changes?: TimetableChange[];
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_name: string;
  role: UserRole;
  action: string;
  target: string;
  details: string;
  ip_address: string;
  status: 'success' | 'blocked' | 'warning';
}

export interface QueryLogEntry {
  id: string;
  timestamp: string;
  question: string;
  sql: string;
  role: UserRole;
  status: 'ok' | 'blocked' | 'partial';
  blocked_reason?: string;
  blocked_layer?: string;
  row_count: number;
  duration_ms: number;
}

export interface RedTeamTestResult {
  id: string;
  prompt: string;
  intent: string;
  result: 'BLOCKED' | 'LEAKED' | 'ALLOWED';
  layer: string;
  reason: string;
  simulated_role: UserRole;
  sql_attempted?: string;
  response_summary: string;
}

export interface PaymentReconciliation {
  id: string;
  utr_number: string;
  payer_name: string;
  amount: number;
  payment_mode: 'UPI' | 'NEFT' | 'NetBanking' | 'Card' | 'Cheque';
  timestamp: string;
  matched_student_id?: string;
  matched_student_name?: string;
  matched_emi_id?: string;
  confidence_score: number; // 0 - 100
  status: 'matched' | 'unmatched' | 'reconciled';
  bank_reference: string;
  receipt_url?: string;
}

export interface Certificate {
  id: string;
  student_id: string;
  student_name: string;
  course_id: string;
  course_name: string;
  batch_name: string;
  issue_date: string;
  verification_code: string;
  final_attendance: number;
  fee_clearance: boolean;
  status: 'issued' | 'eligible' | 'ineligible';
  signatory: string;
  certificate_url?: string;
}

export interface ClassRecording {
  id: string;
  batch_id: string;
  batch_name: string;
  course_name: string;
  topic: string;
  trainer_name: string;
  date: string;
  duration_minutes: number;
  source: 'Lab 1 Recording Rig' | 'Zoom Cloud' | 'Studio 3 Hybrid';
  video_url: string;
  thumbnail_url: string;
  views_count: number;
  notes_download_url?: string;
  code_repo_url?: string;
  key_timestamps: { time: string; label: string }[];
}

export interface DropoutRiskStudent {
  id: string;
  student_id: string;
  student_name: string;
  batch_name: string;
  course_name: string;
  risk_score: number; // 0 to 100
  risk_tier: 'critical' | 'high' | 'moderate' | 'safe';
  attendance_rate: number;
  missed_classes: number;
  consecutive_absences: number;
  overdue_emis_count: number;
  total_overdue_amount: number;
  last_login_days_ago: number;
  reasons: string[];
  recommended_intervention: string;
}

export interface FailureChainEvidence {
  dimension: 'attendance' | 'assessment' | 'fees' | 'academic';
  department: 'Academic Operations' | 'Instructional Staff' | 'Accounts & Finance' | 'LMS / Lab Telemetry';
  indicator: string;
  metric: string;
  severity: 'critical' | 'warning' | 'normal';
  timestamp: string;
  verified_source: string;
}

export interface CoordinatedSupportPlan {
  counselor_action: string;
  trainer_action: string;
  accounts_action: string;
  unified_message: string;
  follow_up_date: string;
}

export interface FailureChainStudent {
  id: string;
  student_id: string;
  student_name: string;
  phone_masked: string;
  batch_name: string;
  course_name: string;
  chain_severity: 'critical_cascade' | 'compound_risk' | 'early_friction';
  correlation_score: number; // 0 to 100
  isolated_alert_flaw: string; // Explains what single-department alert would have missed
  evidence_chain: FailureChainEvidence[];
  coordinated_plan: CoordinatedSupportPlan;
  resolution_status: 'unaddressed' | 'plan_staged' | 'in_progress' | 'stabilized';
}

