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
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Dropout Risk Radar
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Predictive operational intelligence identifying attendance deceleration and payment distress.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Critical Risk
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600">{criticalCount} Students</div>
          <div className="mt-0.5 text-xs text-slate-400">Needs immediate 1-on-1 counselor outreach</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Moderate / High
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{highCount} Students</div>
          <div className="mt-0.5 text-xs text-slate-400">Attendance trend dropped below 75% threshold</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Revenue at Risk
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{formatINR(totalOverdueRisk)}</div>
          <div className="mt-0.5 text-xs text-slate-400">Outstanding installments across risk cohort</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
          {(['all', 'critical', 'high', 'moderate'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setTierFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all cursor-pointer ${
                tierFilter === tab
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search student or cohort..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Risk Student Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Running risk model diagnostics...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
          No students matching selected risk filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map(student => (
            <div
              key={student.id}
              className={`bg-white rounded-xl border p-4 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all ${
                student.risk_tier === 'critical'
                  ? 'border-l-4 border-l-rose-500 border-slate-200'
                  : 'border-l-4 border-l-amber-500 border-slate-200'
              }`}
            >
              {/* Profile and Signals */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center text-xs shrink-0">
                    {student.student_name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">
                        {student.student_name}
                      </span>
                      <Badge variant={tierBadgeVariants[student.risk_tier]} size="sm">
                        {student.risk_tier.toUpperCase()} ({student.risk_score}%)
                      </Badge>
                      {student.intervention_status !== 'none' && (
                        <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                          ✓ {student.intervention_status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {student.batch_name} · {student.course_name}
                    </div>
                  </div>
                </div>

                {/* Signals */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Diagnostic Signals:
                  </span>
                  <ul className="space-y-0.5 list-disc list-inside text-[11px] text-slate-600">
                    {student.reasons.map((r, idx) => (
                      <li key={idx} className="leading-snug">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Metrics & Actions */}
              <div className="w-full lg:w-72 shrink-0 space-y-2.5 pt-2 lg:pt-0 lg:border-l lg:border-slate-100 lg:pl-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-medium">ATTENDANCE</span>
                    <span className="font-semibold text-slate-900">{student.attendance_rate}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-medium">OVERDUE</span>
                    <span className="font-semibold text-rose-600">{formatINR(student.total_overdue_amount)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleIntervention(student, 'counseling_scheduled')}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <PhoneCall className="w-3 h-3" />
                      Counseling
                    </button>

                    <button
                      onClick={() => handleIntervention(student, 'whatsapp_sent')}
                      className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-medium text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Send className="w-3 h-3 text-emerald-700" />
                      WhatsApp
                    </button>
                  </div>

                  <button
                    onClick={() => handleIntervention(student, 'plan_restructured')}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs cursor-pointer transition-colors"
                  >
                    Restructure Installment Schedule
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
