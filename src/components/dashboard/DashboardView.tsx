import React, { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle2,
  IndianRupee,
  Activity,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  DollarSign,
  Download,
  Bot,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { formatINR } from '../../lib/utils';
import { Badge } from '../common/Badge';

interface DashboardViewProps {
  onNavigate: (screen: string) => void;
}

const ATTENDANCE_TREND_DATA = [
  { day: 'Mon', overall: 89, classroom: 91, online: 86 },
  { day: 'Tue', overall: 86, classroom: 88, online: 83 },
  { day: 'Wed', overall: 91, classroom: 93, online: 88 },
  { day: 'Thu', overall: 84, classroom: 87, online: 80 },
  { day: 'Fri', overall: 88, classroom: 90, online: 85 },
  { day: 'Sat', overall: 92, classroom: 94, online: 90 },
];

const BATCH_ATTENDANCE_DATA = [
  { batch: 'Java A', rate: 74, target: 85 },
  { batch: 'Java B', rate: 69, target: 85 },
  { batch: 'Python A', rate: 91, target: 85 },
  { batch: 'Python B', rate: 86, target: 85 },
  { batch: 'DS & AI', rate: 88, target: 85 },
  { batch: 'WebDev', rate: 92, target: 85 },
  { batch: 'DevOps', rate: 85, target: 85 },
  { batch: 'QA Auto', rate: 89, target: 85 },
];

const FEE_FORECAST_DATA = [
  { week: 'W1 (Oct 1-7)', collected: 320000, projected: 300000 },
  { week: 'W2 (Oct 8-14)', collected: 450000, projected: 410000 },
  { week: 'W3 (Oct 15-21)', collected: 510000, projected: 480000 },
  { week: 'W4 (Oct 22-28)', collected: 390000, projected: 540000 },
  { week: 'W5 (Oct 29-31)', collected: 175000, projected: 250000 },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { role, user } = useAuth();
  const [stats, setStats] = useState({
    activeStudents: 118,
    attendanceRate: 87.4,
    emisDueAmount: 148000,
    emisDueCount: 18,
    trainerUtilization: 84,
  });

  const isTrainer = role === 'trainer';

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-700/60 text-indigo-200 text-xs font-medium mb-2 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Operational Intelligence Active
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-indigo-200 mt-1 max-w-xl">
            {isTrainer
              ? 'Your training schedule is fully optimized with 0 timetable conflicts. View batch attendance and ask Copilot questions safely.'
              : 'Real-time overview of active cohorts, attendance anomalies, fee collection velocity, and automated timetable health.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {role !== 'accounts' && (
            <button
              onClick={() => onNavigate('copilot')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-950 font-semibold text-xs sm:text-sm hover:bg-indigo-50 transition-colors shadow-xs"
            >
              <Bot className="w-4 h-4 text-indigo-600" />
              Ask Copilot
            </button>
          )}
          {(role === 'owner' || role === 'counselor' || role === 'accounts') && (
            <button
              onClick={() => onNavigate('approvals')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700/80 text-white font-semibold text-xs sm:text-sm hover:bg-indigo-600 border border-indigo-500/30 transition-colors"
            >
              Approvals Queue
            </button>
          )}
        </div>
      </div>

      {/* 4 KPI CARDS (Trainer sees NO EMI Card per strict requirement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Students
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.activeStudents}</span>
            <span className="text-xs font-medium text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +12 this mo
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">Across 12 active cohorts</div>
        </div>

        {/* KPI 2: Attendance Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Attendance Rate
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.attendanceRate}%</span>
            <Badge variant="warning" size="sm">
              Java Batches Flagged
            </Badge>
          </div>
          <div className="mt-2 text-xs text-slate-400">Classroom 89.2% • Online 85.1%</div>
        </div>

        {/* KPI 3: EMIs Due this Week OR Active Cohorts for Trainer */}
        {!isTrainer ? (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                EMIs Due This Week
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {formatINR(stats.emisDueAmount)}
              </span>
              <span className="text-xs font-medium text-amber-700">
                {stats.emisDueCount} installments
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400">Oct 16 – Oct 22 window</div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Assigned Batches
              </span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">2 Active</span>
              <span className="text-xs font-medium text-emerald-600">Java A & B</span>
            </div>
            <div className="mt-2 text-xs text-slate-400">52 students mentored</div>
          </div>
        )}

        {/* KPI 4: Trainer Utilisation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Trainer Utilisation
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.trainerUtilization}%</span>
            <Badge variant="success" size="sm">
              0 Conflicts
            </Badge>
          </div>
          <div className="mt-2 text-xs text-slate-400">147 / 175 weekly hours booked</div>
        </div>
      </div>

      {/* 2 RECHARTS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Weekly Attendance Trend Line */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Weekly Attendance Velocity Trend
              </h3>
              <p className="text-xs text-slate-400">
                Comparing overall, physical classroom, and online participation
              </p>
            </div>
            <Badge variant="info" size="sm">
              Past 6 Days
            </Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ATTENDANCE_TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  domain={[70, 100]}
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="overall"
                  name="Combined Avg"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="classroom"
                  name="Classroom"
                  stroke="#059669"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                />
                <Line
                  type="monotone"
                  dataKey="online"
                  name="Online Join"
                  stroke="#0284c7"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Batch-wise Attendance Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cohort Attendance vs Institute Benchmark
              </h3>
              <p className="text-xs text-slate-400">
                Target threshold: 85% attendance. Red indicates intervention required
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Under 75% Alert</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BATCH_ATTENDANCE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="batch" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  domain={[50, 100]}
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Attendance Rate']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="rate"
                  name="Attendance %"
                  radius={[6, 6, 0, 0]}
                  fill="#4f46e5"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: Financial Velocity & Forecasting (Non-Trainer) */}
      {!isTrainer && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Monthly Fee Collection Velocity & Projection (₹ INR)
              </h3>
              <p className="text-xs text-slate-400">
                Weekly realized revenue vs projected recovery target across all active enrollments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="success" size="sm">
                +12.4% vs Target
              </Badge>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={FEE_FORECAST_DATA}>
                <defs>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={val => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatINR(val), '']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="collected"
                  name="Collected Revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCollected)"
                />
                <Area
                  type="monotone"
                  dataKey="projected"
                  name="Projected Target"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorProjected)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Operations Quick Callout */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-amber-950">
              Low Attendance & Outstanding Dues Detected in Java Cohorts
            </div>
            <div className="text-xs text-amber-800 mt-0.5">
              4 students have missed 3+ classes and have imminent EMIs due. You can use Copilot to query and draft WhatsApp reminder dispatches.
            </div>
          </div>
        </div>
        {role !== 'trainer' && (
          <button
            onClick={() => onNavigate('copilot')}
            className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition-colors"
          >
            Run Java Copilot Analysis
          </button>
        )}
      </div>
    </div>
  );
};
