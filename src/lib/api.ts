import {
  ActionItem,
  AttendanceRecord,
  Batch,
  CopilotAskResponse,
  Course,
  EMI,
  RedTeamTestResult,
  Student,
  TimetableRunResponse,
  Trainer,
  User,
  UserRole,
  Weekday,
  PaymentReconciliation,
  Certificate,
  ClassRecording,
  DropoutRiskStudent,
  FailureChainStudent,
} from '../types';
import { decodeJwt, generateMockJwt } from './jwt';
import {
  addDraftActions,
  approveAction,
  bulkApproveActions,
  getActions,
  rejectAction,
  updateActionMessage,
} from './mock/actions';
import { getAuditLogs, getQueryLogs, recordAuditLog, recordQueryLog } from './mock/audit';
import { processCopilotQuery } from './mock/copilot';
import {
  BATCHES,
  COURSES,
  DEMO_USERS,
  generateInitialAttendance,
  generateInitialEMIs,
  generateInitialStudents,
  TRAINERS,
  RECONCILIATIONS_DATA,
  CERTIFICATES_DATA,
  RECORDINGS_DATA,
  DROPOUT_RISK_DATA,
  FAILURE_CHAINS_DATA,
} from './mock/data';
import { runRedTeamSuite } from './mock/redteam';
import { generateTimetableFresh, getTimetable, replanTimetable } from './mock/timetable';

// State caches for mock environment
let mockStudentsStore: Student[] = generateInitialStudents();
let mockBatchesStore: Batch[] = JSON.parse(JSON.stringify(BATCHES));
let mockEmisStore: EMI[] = generateInitialEMIs(mockStudentsStore);
let mockAttendanceStore: AttendanceRecord[] = generateInitialAttendance(mockStudentsStore);
let mockReconciliationsStore: PaymentReconciliation[] = JSON.parse(JSON.stringify(RECONCILIATIONS_DATA));
let mockCertificatesStore: Certificate[] = JSON.parse(JSON.stringify(CERTIFICATES_DATA));
let mockRecordingsStore: ClassRecording[] = JSON.parse(JSON.stringify(RECORDINGS_DATA));
let mockDropoutRiskStore: DropoutRiskStudent[] = JSON.parse(JSON.stringify(DROPOUT_RISK_DATA));
let mockFailureChainsStore: FailureChainStudent[] = JSON.parse(JSON.stringify(FAILURE_CHAINS_DATA));

// Persistent registered users store in mock mode
const getSavedMockUsers = (): Record<string, User> => {
  const base: Record<string, User> = {
    [DEMO_USERS.owner.email.toLowerCase()]: DEMO_USERS.owner,
    [DEMO_USERS.counselor.email.toLowerCase()]: DEMO_USERS.counselor,
    [DEMO_USERS.trainer.email.toLowerCase()]: DEMO_USERS.trainer,
    [DEMO_USERS.accounts.email.toLowerCase()]: DEMO_USERS.accounts,
  };
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('registered_institute_users');
      if (saved) {
        Object.assign(base, JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse saved users', e);
    }
  }
  return base;
};

let mockUsersStore = getSavedMockUsers();

/**
 * Determine if mock mode is active.
 * Checks localStorage first (runtime toggle), then Vite/Next environment variables.
 */
export function isMockMode(): boolean {
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('copilot_use_mock');
    if (override !== null) {
      return override === 'true';
    }
  }

  // Check Vite env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_USE_MOCK !== undefined) {
      return import.meta.env.VITE_USE_MOCK !== 'false';
    }
  }

  // Fallback default: true (Mock first per spec)
  return true;
}

export function setMockMode(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('copilot_use_mock', enabled ? 'true' : 'false');
    window.dispatchEvent(new Event('mock_mode_changed'));
  }
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('copilot_api_url');
    if (customUrl) return customUrl;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:8000';
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('copilot_api_url', url);
  }
}

/**
 * Global response handler for 401 & 403 status codes.
 */
function handleAuthStatus(status: number) {
  if (typeof window === 'undefined') return;
  if (status === 401) {
    localStorage.removeItem('copilot_jwt_token');
    window.dispatchEvent(new CustomEvent('auth_unauthorized'));
  } else if (status === 403) {
    window.dispatchEvent(new CustomEvent('auth_forbidden'));
  }
}

/**
 * Generic fetch wrapper for FastAPI backend
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('copilot_jwt_token') : null;
  const baseUrl = getApiBaseUrl().replace(/\/$/, '');
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401 || res.status === 403) {
      handleAuthStatus(res.status);
      throw new Error(res.status === 401 ? 'Unauthorized session' : 'Forbidden for role');
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errBody.detail || `API error ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (err: any) {
    console.error(`API fetch failed on ${endpoint}:`, err);
    throw err;
  }
}

// -------------------------------------------------------------
// UNIFIED API METHODS (SWITCHING AUTOMATICALLY BETWEEN MOCK & REAL)
// -------------------------------------------------------------

export const api = {
  // 1. Authentication
  async login(email: string, roleHint?: UserRole): Promise<{ token: string; user: User }> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 200)); // simulate network latency
      const normalized = email.toLowerCase().trim();
      let user: User | undefined = mockUsersStore[normalized];

      if (!user) {
        if (normalized.includes('owner') || roleHint === 'owner') user = DEMO_USERS.owner;
        else if (normalized.includes('counselor') || roleHint === 'counselor') user = DEMO_USERS.counselor;
        else if (normalized.includes('trainer') || roleHint === 'trainer') user = DEMO_USERS.trainer;
        else if (normalized.includes('accounts') || roleHint === 'accounts') user = DEMO_USERS.accounts;
        else user = {
          id: `usr_custom_${Date.now()}`,
          name: email.split('@')[0],
          email: normalized,
          role: roleHint || 'counselor',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
        };
      }

      const token = generateMockJwt(user);
      localStorage.setItem('copilot_jwt_token', token);
      recordAuditLog({
        user_name: user.name,
        role: user.role,
        action: 'login',
        target: 'Web Console',
        details: `Successful authentication as ${user.role}`,
        ip_address: '127.0.0.1 (Local)',
        status: 'success',
      });
      return { token, user };
    }

    const data = await apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    localStorage.setItem('copilot_jwt_token', data.token);
    return data;
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    specialization?: string;
  }): Promise<{ token: string; user: User }> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 250));
      const norm = data.email.toLowerCase().trim();
      const newUser: User = {
        id: `usr_${data.role}_${Date.now()}`,
        name: data.name,
        email: norm,
        role: data.role,
        trainer_id: data.role === 'trainer' ? `tr_${Date.now() % 1000}` : undefined,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      };

      mockUsersStore[norm] = newUser;
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('registered_institute_users');
          const current = saved ? JSON.parse(saved) : {};
          current[norm] = newUser;
          localStorage.setItem('registered_institute_users', JSON.stringify(current));
        } catch (e) {
          console.error(e);
        }
      }

      const token = generateMockJwt(newUser);
      localStorage.setItem('copilot_jwt_token', token);
      recordAuditLog({
        user_name: newUser.name,
        role: newUser.role,
        action: 'user_registered',
        target: 'Operations Auth Roster',
        details: `Registered new account as ${newUser.role} with ${data.email}`,
        ip_address: '127.0.0.1 (Local)',
        status: 'success',
      });
      return { token, user: newUser };
    }

    const res = await apiFetch<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem('copilot_jwt_token', res.token);
    return res;
  },

  // 2. Students CRUD
  async getStudents(params?: { batch_id?: string; status?: string }): Promise<Student[]> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 120));
      let filtered = [...mockStudentsStore];
      if (params?.batch_id && params.batch_id !== 'all') {
        filtered = filtered.filter(s => s.batch_id === params.batch_id);
      }
      if (params?.status && params.status !== 'all') {
        filtered = filtered.filter(s => s.status === params.status);
      }
      return filtered;
    }
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<Student[]>(`/students${query ? `?${query}` : ''}`);
  },

  async addStudent(studentData: Omit<Student, 'id' | 'attendance_rate' | 'missed_classes_last_30d'>): Promise<Student> {
    if (isMockMode()) {
      const newStudent: Student = {
        ...studentData,
        id: `std_${Date.now()}`,
        attendance_rate: 100,
        missed_classes_last_30d: 0,
      };
      mockStudentsStore = [newStudent, ...mockStudentsStore];
      recordAuditLog({
        user_name: 'Current User',
        role: 'counselor',
        action: 'student_created',
        target: newStudent.name,
        details: `Enrolled in ${newStudent.batch_name}`,
        ip_address: '127.0.0.1',
        status: 'success',
      });
      return newStudent;
    }
    return apiFetch<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    if (isMockMode()) {
      const idx = mockStudentsStore.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Student not found');
      mockStudentsStore[idx] = { ...mockStudentsStore[idx], ...updates };
      recordAuditLog({
        user_name: 'Current User',
        role: 'owner',
        action: 'student_updated',
        target: mockStudentsStore[idx].name,
        details: `Updated details: ${Object.keys(updates).join(', ')}`,
        ip_address: '127.0.0.1',
        status: 'success',
      });
      return mockStudentsStore[idx];
    }
    return apiFetch<Student>(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteStudent(id: string): Promise<{ success: boolean; id: string }> {
    if (isMockMode()) {
      mockStudentsStore = mockStudentsStore.filter(s => s.id !== id);
      return { success: true, id };
    }
    return apiFetch<{ success: boolean; id: string }>(`/students/${id}`, {
      method: 'DELETE',
    });
  },

  // 3. Batches
  async getBatches(): Promise<Batch[]> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 100));
      return mockBatchesStore;
    }
    return apiFetch<Batch[]>('/batches');
  },

  async addBatch(batchData: Omit<Batch, 'id' | 'enrolled_count'>): Promise<Batch> {
    if (isMockMode()) {
      const newBatch: Batch = {
        ...batchData,
        id: `b_${Date.now()}`,
        enrolled_count: 0,
      };
      mockBatchesStore = [newBatch, ...mockBatchesStore];
      recordAuditLog({
        user_name: 'Current User',
        role: 'owner',
        action: 'batch_created',
        target: newBatch.name,
        details: `Trainer: ${newBatch.trainer_name}, Mode: ${newBatch.mode}`,
        ip_address: '127.0.0.1',
        status: 'success',
      });
      return newBatch;
    }
    return apiFetch<Batch>('/batches', {
      method: 'POST',
      body: JSON.stringify(batchData),
    });
  },

  // 4. Courses & Trainers
  async getCourses(): Promise<Course[]> {
    if (isMockMode()) return COURSES;
    return apiFetch<Course[]>('/courses');
  },

  async getTrainers(): Promise<Trainer[]> {
    if (isMockMode()) return TRAINERS;
    return apiFetch<Trainer[]>('/trainers');
  },

  // 5. Fees & EMIs (Owner/Accounts only)
  async getEmis(status?: 'due' | 'paid' | 'missed' | 'all'): Promise<EMI[]> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 120));
      if (!status || status === 'all') return mockEmisStore;
      return mockEmisStore.filter(e => e.status === status);
    }
    const query = status && status !== 'all' ? `?status=${status}` : '';
    return apiFetch<EMI[]>(`/fees/emis${query}`);
  },

  async markEmiPaid(emiId: string): Promise<EMI> {
    if (isMockMode()) {
      const emi = mockEmisStore.find(e => e.id === emiId);
      if (!emi) throw new Error('EMI record not found');
      emi.status = 'paid';
      emi.paid_date = new Date().toISOString().split('T')[0];
      emi.payment_method = 'UPI / Payment Gateway (Marked)';
      recordAuditLog({
        user_name: 'Current Accounts User',
        role: 'accounts',
        action: 'fee_marked_paid',
        target: `EMI #${emi.id}`,
        details: `₹${emi.amount} collected for ${emi.student_name}`,
        ip_address: '127.0.0.1',
        status: 'success',
      });
      return emi;
    }
    return apiFetch<EMI>(`/fees/emis/${emiId}/pay`, { method: 'POST' });
  },

  // 6. Attendance (Classroom vs Online)
  async getAttendanceRecords(type?: 'classroom' | 'online' | 'all'): Promise<AttendanceRecord[]> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 100));
      if (!type || type === 'all') return mockAttendanceStore;
      return mockAttendanceStore.filter(a => a.type === type);
    }
    const query = type && type !== 'all' ? `?type=${type}` : '';
    return apiFetch<AttendanceRecord[]>(`/attendance${query}`);
  },

  async checkInClassroom(data: { student_id: string; batch_id: string; status: 'present' | 'late' }): Promise<AttendanceRecord> {
    if (isMockMode()) {
      const student = mockStudentsStore.find(s => s.id === data.student_id);
      const batch = mockBatchesStore.find(b => b.id === data.batch_id);
      const rec: AttendanceRecord = {
        id: `att_${Date.now()}`,
        student_id: data.student_id,
        student_name: student?.name || 'Student',
        batch_id: data.batch_id,
        batch_name: batch?.name || 'Classroom Batch',
        type: 'classroom',
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        status: data.status,
        ip_or_location: 'Front Desk Biometric Portal',
        duration_minutes: 120,
        verified_by: 'Counselor Station',
      };
      mockAttendanceStore = [rec, ...mockAttendanceStore];
      return rec;
    }
    return apiFetch<AttendanceRecord>('/attendance/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async recordOnlineJoin(data: { student_id: string; batch_id: string; duration_minutes: number }): Promise<AttendanceRecord> {
    if (isMockMode()) {
      const student = mockStudentsStore.find(s => s.id === data.student_id);
      const batch = mockBatchesStore.find(b => b.id === data.batch_id);
      const rec: AttendanceRecord = {
        id: `att_${Date.now()}`,
        student_id: data.student_id,
        student_name: student?.name || 'Student',
        batch_id: data.batch_id,
        batch_name: batch?.name || 'Online Batch',
        type: 'online',
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        status: 'present',
        ip_or_location: 'WebRTC / Zoom Bridge Node',
        duration_minutes: data.duration_minutes,
        verified_by: 'Virtual Classroom SDK',
      };
      mockAttendanceStore = [rec, ...mockAttendanceStore];
      return rec;
    }
    return apiFetch<AttendanceRecord>('/attendance/online-join', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 7. Copilot Ask
  async askCopilot(question: string, userRole: UserRole): Promise<CopilotAskResponse> {
    if (isMockMode()) {
      // simulate natural LLM thinking time
      await new Promise(r => setTimeout(r, 380));
      const res = processCopilotQuery(question, userRole);

      // Record in query log
      recordQueryLog({
        question,
        sql: res.sql,
        role: userRole,
        status: res.status,
        blocked_reason: res.blocked_reason,
        blocked_layer: res.blocked_layer,
        row_count: res.row_count,
        duration_ms: res.duration_ms,
      });

      return res;
    }
    return apiFetch<CopilotAskResponse>('/copilot/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  },

  // 8. Approvals & Actions
  async getActions(statusFilter?: string): Promise<ActionItem[]> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 120));
      return getActions(statusFilter);
    }
    const query = statusFilter ? `?status=${statusFilter}` : '';
    return apiFetch<ActionItem[]>(`/actions${query}`);
  },

  async approveAction(id: string, approverName: string): Promise<ActionItem> {
    if (isMockMode()) {
      const res = approveAction(id, approverName);
      if (!res) throw new Error('Action not found');
      recordAuditLog({
        user_name: approverName,
        role: 'accounts',
        action: 'approve_reminder',
        target: `Action #${id}`,
        details: `Approved notification for student ${res.student_name} (${res.phone_masked})`,
        ip_address: '127.0.0.1',
        status: 'success',
      });
      return res;
    }
    return apiFetch<ActionItem>(`/actions/${id}/approve`, { method: 'POST' });
  },

  async rejectAction(id: string, rejectorName: string): Promise<ActionItem> {
    if (isMockMode()) {
      const res = rejectAction(id, rejectorName);
      if (!res) throw new Error('Action not found');
      recordAuditLog({
        user_name: rejectorName,
        role: 'counselor',
        action: 'reject_action',
        target: `Action #${id}`,
        details: `Rejected notification for student ${res.student_name}`,
        ip_address: '127.0.0.1',
        status: 'warning',
      });
      return res;
    }
    return apiFetch<ActionItem>(`/actions/${id}/reject`, { method: 'POST' });
  },

  async updateAction(id: string, message: string): Promise<ActionItem> {
    if (isMockMode()) {
      const res = updateActionMessage(id, message);
      if (!res) throw new Error('Action not found');
      return res;
    }
    return apiFetch<ActionItem>(`/actions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ message }),
    });
  },

  async bulkApproveActions(ids: string[], approverName: string): Promise<ActionItem[]> {
    if (isMockMode()) {
      const res = bulkApproveActions(ids, approverName);
      recordAuditLog({
        user_name: approverName,
        role: 'owner',
        action: 'bulk_approve_actions',
        target: `${ids.length} Reminders`,
        details: `Approved ${ids.length} WhatsApp notifications dispatched via outbox.`,
        ip_address: '127.0.0.1',
        status: 'success',
      });
      return res;
    }
    return apiFetch<ActionItem[]>('/actions/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },

  async draftRemindersFromCopilot(
    drafts: Array<{ student_name: string; phone_masked: string; message: string; due_date: string }>,
    requesterName: string
  ): Promise<ActionItem[]> {
    if (isMockMode()) {
      return addDraftActions(drafts, requesterName);
    }
    return apiFetch<ActionItem[]>('/actions/draft-reminders', {
      method: 'POST',
      body: JSON.stringify({ drafts, requester: requesterName }),
    });
  },

  // 9. Timetable
  async getTimetable(): Promise<TimetableRunResponse> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 100));
      return getTimetable();
    }
    return apiFetch<TimetableRunResponse>('/timetable/generate', { method: 'POST' });
  },

  async generateTimetable(): Promise<TimetableRunResponse> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 220));
      return generateTimetableFresh();
    }
    return apiFetch<TimetableRunResponse>('/timetable/generate', { method: 'POST' });
  },

  async replanTimetable(
    event: 'trainer_unavailable' | 'batch_added',
    details: {
      trainer?: string;
      trainer_id?: string;
      day?: Weekday;
      time_range?: string;
      batch_name?: string;
      course_name?: string;
      room?: string;
    }
  ): Promise<TimetableRunResponse> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 250));
      const res = replanTimetable(event, details);
      recordAuditLog({
        user_name: 'Timetable Dispatcher',
        role: 'owner',
        action: 'timetable_replan',
        target: event,
        details: `Re-planned timetable: ${res.changes?.length || 0} classes adjusted with 0 conflicts.`,
        ip_address: '127.0.0.1',
        status: 'success',
      });
      return res;
    }
    return apiFetch<TimetableRunResponse>('/timetable/replan', {
      method: 'POST',
      body: JSON.stringify({ event, details }),
    });
  },

  // 10. Audit & Query Log (Owner only)
  async getAudit(): Promise<any[]> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 90));
      return getAuditLogs();
    }
    return apiFetch<any[]>('/audit');
  },

  async getQueryLog(): Promise<any[]> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 90));
      return getQueryLogs();
    }
    return apiFetch<any[]>('/query-log');
  },

  // 11. Red-Team Suite (Owner only)
  async runRedTeam(): Promise<{
    total: number;
    blocked: number;
    leaked: number;
    allowed_controls: number;
    results: RedTeamTestResult[];
  }> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 650));
      return runRedTeamSuite();
    }
    const results = await apiFetch<RedTeamTestResult[]>('/redteam/run', { method: 'POST' });
    const blocked = results.filter(r => r.result === 'BLOCKED').length;
    const leaked = results.filter(r => r.result === 'LEAKED').length;
    return {
      total: results.length,
      blocked,
      leaked,
      allowed_controls: results.filter(r => r.result === 'ALLOWED').length,
      results,
    };
  },

  // 12. Fee Recognition & Payment Reconciliation (Accounts & Owner)
  async getReconciliations(): Promise<PaymentReconciliation[]> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 120));
      return [...mockReconciliationsStore];
    }
    return apiFetch<PaymentReconciliation[]>('/fees/reconciliations');
  },

  async reconcilePayment(id: string): Promise<PaymentReconciliation> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 200));
      const item = mockReconciliationsStore.find(r => r.id === id);
      if (!item) throw new Error('Reconciliation record not found');
      item.status = 'reconciled';
      item.receipt_url = `/receipts/REC-2026-${id}.pdf`;
      // Also mark the matched student's EMI as paid
      if (item.matched_emi_id) {
        const emi = mockEmisStore.find(e => e.id === item.matched_emi_id);
        if (emi) {
          emi.status = 'paid';
          emi.paid_date = new Date().toISOString().split('T')[0];
        }
      }
      recordAuditLog({
        user_name: 'Accounts Reconciler',
        role: 'accounts',
        action: 'fee_reconciliation',
        target: item.utr_number,
        details: `Reconciled payment of ₹${item.amount} from ${item.payer_name} (UTR: ${item.utr_number}) to student ${item.matched_student_name}.`,
        ip_address: '127.0.0.1',
        status: 'success',
      });
      return { ...item };
    }
    return apiFetch<PaymentReconciliation>(`/fees/reconciliations/${id}/settle`, { method: 'POST' });
  },

  async uploadReceiptOcr(file: File): Promise<{
    utr_number: string;
    payer_name: string;
    amount: number;
    payment_mode: 'UPI';
    confidence: number;
    matched_student: string;
  }> {
    await new Promise(r => setTimeout(r, 600)); // simulate OCR processing
    return {
      utr_number: `UPI/${Math.floor(100000000000 + Math.random() * 900000000000)}/HDFC`,
      payer_name: 'Aarav Sharma',
      amount: 6500,
      payment_mode: 'UPI',
      confidence: 96,
      matched_student: 'Aarav Sharma (std_java_001)',
    };
  },

  // 13. Certifications (Course Completion)
  async getCertificates(): Promise<Certificate[]> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 120));
      return [...mockCertificatesStore];
    }
    return apiFetch<Certificate[]>('/certifications');
  },

  async issueCertificate(studentId: string, courseId: string): Promise<Certificate> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 250));
      const std = mockStudentsStore.find(s => s.id === studentId);
      const course = COURSES.find(c => c.id === courseId);
      const newCert: Certificate = {
        id: `cert_${Date.now()}`,
        student_id: studentId,
        student_name: std?.name || 'Student',
        course_id: courseId,
        course_name: course?.name || 'Masterclass',
        batch_name: std?.batch_name || 'Assigned Cohort',
        issue_date: new Date().toISOString().split('T')[0],
        verification_code: `CERT-2026-${course?.code || 'INST'}-${Math.floor(1000 + Math.random() * 9000)}`,
        final_attendance: std?.attendance_rate || 90.0,
        fee_clearance: (std?.fee_pending || 0) === 0,
        status: 'issued',
        signatory: 'Vikramaditya Mehta (Director)',
        certificate_url: `https://credentials.institute.org/verify/CERT-2026-${course?.code || 'INST'}`,
      };
      mockCertificatesStore.unshift(newCert);
      recordAuditLog({
        user_name: 'Director Vikramaditya Mehta',
        role: 'owner',
        action: 'issue_certificate',
        target: newCert.verification_code,
        details: `Issued course completion certificate to ${newCert.student_name} for ${newCert.course_name}.`,
        ip_address: '127.0.0.1',
        status: 'success',
      });
      return newCert;
    }
    return apiFetch<Certificate>('/certifications/issue', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, course_id: courseId }),
    });
  },

  // 14. Class Recordings Library
  async getRecordings(): Promise<ClassRecording[]> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 100));
      return [...mockRecordingsStore];
    }
    return apiFetch<ClassRecording[]>('/recordings');
  },

  async addRecording(rec: Partial<ClassRecording>): Promise<ClassRecording> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 200));
      const newRec: ClassRecording = {
        id: `rec_sess_${Date.now()}`,
        batch_id: rec.batch_id || 'b_java_a',
        batch_name: rec.batch_name || 'Java Fullstack - Batch A',
        course_name: rec.course_name || 'Java Fullstack Masterclass',
        topic: rec.topic || 'Class Lecture & Lab Demo',
        trainer_name: rec.trainer_name || 'Priya Sundaram',
        date: new Date().toISOString().split('T')[0],
        duration_minutes: rec.duration_minutes || 110,
        source: rec.source || 'Lab 1 Recording Rig',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=480&auto=format&fit=crop&q=80',
        views_count: 1,
        key_timestamps: [
          { time: '00:00', label: 'Lecture Intro' },
          { time: '45:00', label: 'Hands-on Lab demo' },
        ],
      };
      mockRecordingsStore.unshift(newRec);
      return newRec;
    }
    return apiFetch<ClassRecording>('/recordings', {
      method: 'POST',
      body: JSON.stringify(rec),
    });
  },

  // 15. Dropout Risk Radar & Interventions
  async getDropoutRiskStudents(): Promise<DropoutRiskStudent[]> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 120));
      return [...mockDropoutRiskStore];
    }
    return apiFetch<DropoutRiskStudent[]>('/students/dropout-risk');
  },

  async triggerDropoutIntervention(
    id: string,
    actionType: 'counseling_scheduled' | 'whatsapp_sent' | 'plan_restructured'
  ): Promise<DropoutRiskStudent> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 200));
      const student = mockDropoutRiskStore.find(s => s.id === id);
      if (!student) throw new Error('Student risk profile not found');
      student.intervention_status = actionType;
      recordAuditLog({
        user_name: 'Academic Counselor',
        role: 'counselor',
        action: 'dropout_intervention',
        target: student.student_name,
        details: `Triggered ${actionType.replace('_', ' ')} for high-risk student ${student.student_name} (${student.risk_score}% risk score).`,
        ip_address: '127.0.0.1',
        status: 'success',
      });
      return { ...student };
    }
    return apiFetch<DropoutRiskStudent>(`/students/dropout-risk/${id}/intervene`, {
      method: 'POST',
      body: JSON.stringify({ action_type: actionType }),
    });
  },

  // 16. The Hidden Student Failure Chain
  async getFailureChains(): Promise<FailureChainStudent[]> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 150));
      return [...mockFailureChainsStore];
    }
    return apiFetch<FailureChainStudent[]>('/students/failure-chains');
  },

  async updateFailureChainPlan(
    id: string,
    planStatus: 'plan_staged' | 'in_progress' | 'stabilized',
    notes?: string
  ): Promise<FailureChainStudent> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 200));
      const chain = mockFailureChainsStore.find(c => c.id === id);
      if (!chain) throw new Error('Failure chain correlation profile not found');
      chain.resolution_status = planStatus;
      recordAuditLog({
        user_name: 'Operations Copilot',
        role: 'counselor',
        action: 'failure_chain_orchestration',
        target: chain.student_name,
        details: `Updated coordinated multi-department plan to '${planStatus}' for ${chain.student_name} (Correlation score: ${chain.correlation_score}%).`,
        ip_address: '127.0.0.1',
        status: 'success',
      });
      return { ...chain };
    }
    return apiFetch<FailureChainStudent>(`/students/failure-chains/${id}/plan`, {
      method: 'POST',
      body: JSON.stringify({ plan_status: planStatus, notes }),
    });
  },
};

