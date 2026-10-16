import { AuditLogEntry, QueryLogEntry } from '../../types';

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud_101',
    timestamp: '2026-10-16T10:35:12Z',
    user_name: 'Vikramaditya Mehta',
    role: 'owner',
    action: 'timetable_replan',
    target: 'Timetable Fall 2026',
    details: 'Triggered automated timetable solver: Trainer Priya marked unavailable Tuesday, 3 classes rescheduled with 0 conflicts.',
    ip_address: '103.21.244.12',
    status: 'success',
  },
  {
    id: 'aud_102',
    timestamp: '2026-10-16T09:42:00Z',
    user_name: 'Suresh Iyer',
    role: 'accounts',
    action: 'approve_reminder',
    target: 'Action #act_101',
    details: 'Approved WhatsApp EMI & attendance reminder for student Aarav Sharma (masked: 98******21).',
    ip_address: '103.21.244.18',
    status: 'success',
  },
  {
    id: 'aud_103',
    timestamp: '2026-10-16T09:12:30Z',
    user_name: 'Priya Sundaram',
    role: 'trainer',
    action: 'copilot_restricted_query',
    target: 'emis, fee_payments',
    details: 'Security block: Role trainer queried fee recovery data. Request denied by Role View filter.',
    ip_address: '103.21.244.45',
    status: 'blocked',
  },
  {
    id: 'aud_104',
    timestamp: '2026-10-16T08:50:11Z',
    user_name: 'Anjali Sharma',
    role: 'counselor',
    action: 'attendance_checkin',
    target: 'Batch Java-A',
    details: 'Manual biometric override check-in logged for 3 students.',
    ip_address: '103.21.244.22',
    status: 'success',
  },
  {
    id: 'aud_105',
    timestamp: '2026-10-16T08:00:04Z',
    user_name: 'Vikramaditya Mehta',
    role: 'owner',
    action: 'user_login',
    target: 'System Session',
    details: 'Interactive authentication verified via secure JWT token.',
    ip_address: '103.21.244.12',
    status: 'success',
  },
];

export const INITIAL_QUERY_LOGS: QueryLogEntry[] = [
  {
    id: 'ql_1',
    timestamp: '2026-10-16T10:14:22Z',
    question: 'Which students in the Java batch have missed three or more classes and have an EMI due this week?',
    sql: `SELECT s.name, b.name, s.phone_masked, s.missed_classes_last_30d, e.amount, e.due_date\nFROM students s JOIN batches b ON s.batch_id = b.id JOIN emis e ON s.id = e.student_id\nWHERE b.name LIKE '%Java%' AND s.missed_classes_last_30d >= 3 AND e.status = 'due'`,
    role: 'counselor',
    status: 'ok',
    row_count: 4,
    duration_ms: 34,
  },
  {
    id: 'ql_2',
    timestamp: '2026-10-16T09:12:30Z',
    question: 'Show all pending fee collections and trainer salary disbursements for this month',
    sql: `-- BLOCKED QUERY ATTEMPT\nSELECT * FROM fees WHERE trainer_id = 'tr_1'`,
    role: 'trainer',
    status: 'blocked',
    blocked_reason: "Role 'trainer' does not have access to fee, payment, or financial records.",
    blocked_layer: 'role view',
    row_count: 0,
    duration_ms: 12,
  },
  {
    id: 'ql_3',
    timestamp: '2026-10-16T09:05:14Z',
    question: 'Show me attendance summary for Python batch over the last 14 days',
    sql: `SELECT b.name, AVG(s.attendance_rate) FROM batches b JOIN students s ON s.batch_id = b.id WHERE b.course_id = 'c_python' GROUP BY b.name`,
    role: 'trainer',
    status: 'ok',
    row_count: 2,
    duration_ms: 22,
  },
  {
    id: 'ql_4',
    timestamp: '2026-10-16T08:45:00Z',
    question: 'List all overdue EMIs exceeding ₹15,000 grouped by course',
    sql: `SELECT c.name, COUNT(e.id), SUM(e.amount) FROM emis e JOIN students s ON e.student_id = s.id JOIN courses c ON s.course_id = c.id GROUP BY c.name HAVING SUM(e.amount) >= 15000`,
    role: 'accounts',
    status: 'ok',
    row_count: 4,
    duration_ms: 41,
  },
  {
    id: 'ql_5',
    timestamp: '2026-10-16T08:20:19Z',
    question: 'Show Java batch attendance along with fee pending status',
    sql: `SELECT s.name, s.attendance_rate FROM students s WHERE batch_id = 'b_java_a'`,
    role: 'trainer',
    status: 'partial',
    blocked_reason: 'Fee columns stripped from response by role policy.',
    blocked_layer: 'role view',
    row_count: 4,
    duration_ms: 28,
  },
];

let auditLogsStore = [...INITIAL_AUDIT_LOGS];
let queryLogsStore = [...INITIAL_QUERY_LOGS];

export function getAuditLogs(): AuditLogEntry[] {
  return auditLogsStore;
}

export function getQueryLogs(): QueryLogEntry[] {
  return queryLogsStore;
}

export function recordAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  auditLogsStore = [
    {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...entry,
    },
    ...auditLogsStore,
  ];
}

export function recordQueryLog(entry: Omit<QueryLogEntry, 'id' | 'timestamp'>): void {
  queryLogsStore = [
    {
      id: `ql_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...entry,
    },
    ...queryLogsStore,
  ];
}
