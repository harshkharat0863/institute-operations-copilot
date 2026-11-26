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
  DashboardAnalytics,
} from '../types';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // When deployed on cloud or served directly from unified FastAPI server,
    // use relative path (empty string) so API requests target the current origin.
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return '';
    }
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:8000';
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
    ...((options.headers as Record<string, string>) || {}),
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
      const errBody = await res.json().catch(() => null);
      throw new Error(
        errBody?.detail || (res.status === 401 ? 'Unauthorized session' : 'Forbidden for role')
      );
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

export const api = {
  // Health & Cold Start Detection (triggers 'server_cold_start' ONLY if /health takes > 3s)
  async checkHealth(): Promise<{ status: string; database?: string }> {
    let coldStartTimer: any = null;
    let didTriggerNotice = false;

    if (typeof window !== 'undefined') {
      coldStartTimer = setTimeout(() => {
        didTriggerNotice = true;
        window.dispatchEvent(new CustomEvent('server_cold_start', { detail: { isWaking: true } }));
      }, 3000);
    }

    try {
      const baseUrl = getApiBaseUrl().replace(/\/$/, '');
      const url = `${baseUrl}/health`;
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) {
        throw new Error(`Health probe returned ${res.status}`);
      }
      return await res.json();
    } finally {
      if (coldStartTimer) {
        clearTimeout(coldStartTimer);
        coldStartTimer = null;
      }
      if (didTriggerNotice && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('server_cold_start', { detail: { isWaking: false } }));
      }
    }
  },

  // Public live statistics for landing screen
  async getPublicStats(): Promise<{
    classes_today: number;
    active_students: number;
    attendance_rate_30d: number;
    emis_due_this_week: number;
  }> {
    const baseUrl = getApiBaseUrl().replace(/\/$/, '');
    const res = await fetch(`${baseUrl}/public/stats`, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`Failed to load public stats (${res.status})`);
    }
    return await res.json();
  },

  // 1. Authentication
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const data = await apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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
    const res = await apiFetch<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem('copilot_jwt_token', res.token);
    return res;
  },

  // 2. Students CRUD
  async getStudents(params?: { batch_id?: string; status?: string }): Promise<Student[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch<Student[]>(`/students${query ? `?${query}` : ''}`);
  },

  async addStudent(
    studentData: Omit<Student, 'id' | 'attendance_rate' | 'missed_classes_last_30d'>
  ): Promise<Student> {
    return apiFetch<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    return apiFetch<Student>(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteStudent(id: string): Promise<{ success: boolean; id: string }> {
    return apiFetch<{ success: boolean; id: string }>(`/students/${id}`, {
      method: 'DELETE',
    });
  },

  // 3. Batches
  async getBatches(): Promise<Batch[]> {
    return apiFetch<Batch[]>('/batches');
  },

  async addBatch(batchData: Omit<Batch, 'id' | 'enrolled_count'>): Promise<Batch> {
    return apiFetch<Batch>('/batches', {
      method: 'POST',
      body: JSON.stringify(batchData),
    });
  },

  // 4. Courses & Trainers
  async getCourses(): Promise<Course[]> {
    return apiFetch<Course[]>('/courses');
  },

  async getTrainers(): Promise<Trainer[]> {
    return apiFetch<Trainer[]>('/trainers');
  },

  // 5. Fees & EMIs (Owner/Accounts only)
  async getEmis(status?: 'due' | 'paid' | 'missed' | 'all'): Promise<EMI[]> {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    return apiFetch<EMI[]>(`/fees/emis${query}`);
  },

  async markEmiPaid(emiId: string): Promise<EMI> {
    return apiFetch<EMI>(`/fees/emis/${emiId}/pay`, { method: 'POST' });
  },

  // 6. Attendance (Classroom vs Online)
  async getAttendanceRecords(type?: 'classroom' | 'online' | 'all'): Promise<AttendanceRecord[]> {
    const query = type && type !== 'all' ? `?type=${type}` : '';
    return apiFetch<AttendanceRecord[]>(`/attendance${query}`);
  },

  async checkInClassroom(data: {
    student_id: string;
    batch_id: string;
    status: 'present' | 'late';
  }): Promise<AttendanceRecord> {
    return apiFetch<AttendanceRecord>('/attendance/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async recordOnlineJoin(data: {
    student_id: string;
    batch_id: string;
    duration_minutes: number;
  }): Promise<AttendanceRecord> {
    return apiFetch<AttendanceRecord>('/attendance/online-join', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 7. Copilot Ask
  async askCopilot(question: string, _userRole: UserRole): Promise<CopilotAskResponse> {
    return apiFetch<CopilotAskResponse>('/copilot/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  },

  // 8. Approvals & Actions
  async getActions(statusFilter?: string): Promise<ActionItem[]> {
    const query = statusFilter ? `?status=${statusFilter}` : '';
    return apiFetch<ActionItem[]>(`/actions${query}`);
  },

  async approveAction(id: string, _approverName: string): Promise<ActionItem> {
    return apiFetch<ActionItem>(`/actions/${id}/approve`, { method: 'POST' });
  },

  async rejectAction(id: string, _rejectorName: string): Promise<ActionItem> {
    return apiFetch<ActionItem>(`/actions/${id}/reject`, { method: 'POST' });
  },

  async updateAction(id: string, message: string): Promise<ActionItem> {
    return apiFetch<ActionItem>(`/actions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ message }),
    });
  },

  async bulkApproveActions(ids: string[], _approverName: string): Promise<ActionItem[]> {
    return apiFetch<ActionItem[]>('/actions/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },

  async draftRemindersFromCopilot(
    drafts: Array<{ student_name: string; phone_masked: string; message: string; due_date: string }>,
    requesterName: string
  ): Promise<ActionItem[]> {
    return apiFetch<ActionItem[]>('/actions/draft-reminders', {
      method: 'POST',
      body: JSON.stringify({ drafts, requester: requesterName }),
    });
  },

  // 9. Timetable
  async getTimetable(): Promise<TimetableRunResponse> {
    return apiFetch<TimetableRunResponse>('/timetable/generate', { method: 'POST' });
  },

  async generateTimetable(): Promise<TimetableRunResponse> {
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
    return apiFetch<TimetableRunResponse>('/timetable/replan', {
      method: 'POST',
      body: JSON.stringify({ event, details }),
    });
  },

  // 10. Audit & Query Log (Owner only)
  async getAudit(): Promise<any[]> {
    return apiFetch<any[]>('/audit');
  },

  async getQueryLog(): Promise<any[]> {
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
    return apiFetch<PaymentReconciliation[]>('/fees/reconciliations');
  },

  async reconcilePayment(id: string): Promise<PaymentReconciliation> {
    return apiFetch<PaymentReconciliation>(`/fees/reconciliations/${id}/settle`, { method: 'POST' });
  },

  async uploadReceiptOcr(_file: File): Promise<{
    utr_number: string;
    payer_name: string;
    amount: number;
    payment_mode: 'UPI';
    confidence: number;
    matched_student: string;
  }> {
    await new Promise(r => setTimeout(r, 600));
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
    return apiFetch<Certificate[]>('/certifications');
  },

  async issueCertificate(studentId: string, courseId: string): Promise<Certificate> {
    return apiFetch<Certificate>('/certifications/issue', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, course_id: courseId }),
    });
  },

  // 14. Class Recordings Library
  async getRecordings(): Promise<ClassRecording[]> {
    return apiFetch<ClassRecording[]>('/recordings');
  },

  async addRecording(rec: Partial<ClassRecording>): Promise<ClassRecording> {
    return apiFetch<ClassRecording>('/recordings', {
      method: 'POST',
      body: JSON.stringify(rec),
    });
  },

  // 15. Dropout Risk Radar & Interventions
  async getDropoutRiskStudents(): Promise<DropoutRiskStudent[]> {
    return apiFetch<DropoutRiskStudent[]>('/students/dropout-risk');
  },

  async triggerDropoutIntervention(
    id: string,
    actionType: 'counseling_scheduled' | 'whatsapp_sent' | 'plan_restructured'
  ): Promise<DropoutRiskStudent> {
    return apiFetch<DropoutRiskStudent>(`/students/dropout-risk/${id}/intervene`, {
      method: 'POST',
      body: JSON.stringify({ action_type: actionType }),
    });
  },

  // 16. The Hidden Student Failure Chain
  async getFailureChains(): Promise<FailureChainStudent[]> {
    return apiFetch<FailureChainStudent[]>('/students/failure-chains');
  },

  async updateFailureChainPlan(
    id: string,
    planStatus: 'plan_staged' | 'in_progress' | 'stabilized',
    notes?: string
  ): Promise<FailureChainStudent> {
    return apiFetch<FailureChainStudent>(`/students/failure-chains/${id}/plan`, {
      method: 'POST',
      body: JSON.stringify({ plan_status: planStatus, notes }),
    });
  },

  // 17. Dashboard Analytics
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    return apiFetch<DashboardAnalytics>('/dashboard/analytics');
  },
};
