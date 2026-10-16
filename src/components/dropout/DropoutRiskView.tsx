import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  TrendingDown,
  ShieldAlert,
  UserCheck,
  Send,
  Calendar,
  IndianRupee,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatINR } from '../../lib/utils';
import { DropoutRiskStudent } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';

export const DropoutRiskView: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [students, setStudents] = useState<DropoutRiskStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tierFilter, setTierFilter] = useState<'all' | 'critical' | 'high' | 'moderate'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getDropoutRiskStudents();
      setStudents(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load dropout risk radar', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIntervention = async (
    student: DropoutRiskStudent,
    action: 'counseling_scheduled' | 'whatsapp_sent' | 'plan_restructured'
  ) => {
    try {
      const updated = await api.triggerDropoutIntervention(student.id, action);
      setStudents(prev => prev.map(s => (s.id === student.id ? updated : s)));
      const actionLabels = {
        counseling_scheduled: '1-on-1 counseling session scheduled',
        whatsapp_sent: 'WhatsApp retention message dispatched',
        plan_restructured: 'EMI installment plan restructured',
      };
      showToast(`${actionLabels[action]} for ${student.student_name}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Intervention trigger failed', 'error');
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesTier = tierFilter === 'all' || s.risk_tier === tierFilter;
    const matchesSearch =
      s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.batch_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const criticalCount = students.filter(s => s.risk_tier === 'critical').length;
  const highCount = students.filter(s => s.risk_tier === 'high').length;
  const totalOverdueRisk = students.reduce((sum, s) => sum + s.total_overdue_amount, 0);

  const tierBadgeVariants: Record<string, BadgeVariant> = {
    critical: 'danger',
    high: 'warning',
    moderate: 'info',
    safe: 'success',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Student Retention & Dropout Risk Radar
            </h1>
            <Badge variant="danger" size="sm" dot>
              Early Warning AI
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Predictive intelligence analyzing multi-factor signals: attendance deceleration, consecutive absences, and payment friction.
          </p>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Critical Risk Students
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-600">{criticalCount} Students</div>
          <div className="mt-1 text-xs text-slate-400">&gt;85% dropout probability if unassisted</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Moderate / High Risk
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{highCount} Students</div>
          <div className="mt-1 text-xs text-slate-400">Attendance dropped below 75% target</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Revenue at Risk
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{formatINR(totalOverdueRisk)}</div>
          <div className="mt-1 text-xs text-slate-400">Uncollected installments across at-risk cohort</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
          {(['all', 'critical', 'high', 'moderate'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setTierFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                tierFilter === tab
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search student or cohort..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Risk Student Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Running multi-factor risk diagnostics...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
          No students matching selected risk tier.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStudents.map(student => (
            <div
              key={student.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all ${
                student.risk_tier === 'critical'
                  ? 'border-rose-300 hover:border-rose-400 bg-rose-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Left Profile Info */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-sm">
                    {student.student_name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {student.student_name}
                      </span>
                      <Badge variant={tierBadgeVariants[student.risk_tier]} size="sm">
                        {student.risk_tier.toUpperCase()} RISK ({student.risk_score}%)
                      </Badge>
                      {student.intervention_status !== 'none' && (
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          ✓ {student.intervention_status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {student.batch_name} • {student.course_name}
                    </div>
                  </div>
                </div>

                {/* Risk Reasons List */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Diagnostic Signals
                  </span>
                  <ul className="text-xs text-slate-700 space-y-0.5 list-disc list-inside">
                    {student.reasons.map((r, idx) => (
                      <li key={idx} className="leading-snug">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Side Metrics & Interventions */}
              <div className="w-full lg:w-80 shrink-0 space-y-3 pt-3 lg:pt-0 lg:border-l lg:border-slate-100 lg:pl-5">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">ATTENDANCE</span>
                    <span className="font-bold text-slate-900">{student.attendance_rate}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">OVERDUE EMIS</span>
                    <span className="font-bold text-rose-600">{formatINR(student.total_overdue_amount)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Intervention Actions
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleIntervention(student, 'counseling_scheduled')}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      Book Counseling
                    </button>

                    <button
                      onClick={() => handleIntervention(student, 'whatsapp_sent')}
                      className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-700" />
                      WhatsApp Alert
                    </button>
                  </div>

                  <button
                    onClick={() => handleIntervention(student, 'plan_restructured')}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                  >
                    Restructure EMI Plan (Installment Split)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
