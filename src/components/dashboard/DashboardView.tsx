import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  CheckCircle2,
  IndianRupee,
  Activity,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
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
import { Badge, BadgeVariant } from '../common/Badge';
import { Card } from '../common/Card';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { Button } from '../common/Button';
import { Skeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';

interface DashboardViewProps {
  onNavigate: (screen: string) => void;
}

interface AttentionItem {
  id: string;
  name: string;
  detail: string;
  issue: string;
  badge: string;
  badgeVariant: BadgeVariant;
  actionText: string;
  actionTarget: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { role, user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    activeStudents: 33,
    attendanceRate: 87.4,
    emisDueAmount: 75000,
    emisDueCount: 6,
    trainerUtilization: 84.0,
    activeBatches: 6,
  });

  const [attendanceTrend, setAttendanceTrend] = useState<
    Array<{ day: string; overall: number; classroom: number; online: number }>
  >([]);

  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);

  const isTrainer = role === 'trainer';

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, studentsRes, emisRes] = await Promise.allSettled([
        api.getDashboardAnalytics(),
        api.getStudents(),
        api.getEmis(),
      ]);

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
        const res = analyticsRes.value;
        if (res.stats) {
          setStats(res.stats);
        }
        if (res.attendance_trend && res.attendance_trend.length > 0) {
          setAttendanceTrend(res.attendance_trend);
        }
      }

      // Build "Needs attention today" list from real student & EMI records
      const items: AttentionItem[] = [];

      if (studentsRes.status === 'fulfilled' && studentsRes.value) {
        const students = studentsRes.value;
        // 1. Students with attendance under 75% or 3+ missed classes
        const flaggedStudents = students
          .filter(s => s.status === 'active' && (s.attendance_rate < 75 || s.missed_classes_last_30d >= 3))
          .slice(0, 4);

        flaggedStudents.forEach(s => {
          items.push({
            id: `std_${s.id}`,
            name: s.name,
            detail: `${s.batch_name} (${s.course_name})`,
            issue: `Attendance at ${s.attendance_rate}% (${s.missed_classes_last_30d} missed in last 30 days)`,
            badge: 'Low Attendance',
            badgeVariant: 'danger',
            actionText: 'View student',
            actionTarget: 'students',
          });
        });
      }

      if (!isTrainer && emisRes.status === 'fulfilled' && emisRes.value) {
        const emis = emisRes.value;
        // 2. Overdue or due EMIs
        const flaggedEmis = emis
          .filter(e => e.status === 'missed' || e.status === 'due')
          .slice(0, 3);

        flaggedEmis.forEach(e => {
          items.push({
            id: `emi_${e.id}`,
            name: e.student_name,
            detail: `${e.batch_name} — Installment #${e.installment_no}`,
            issue: `${formatINR(e.amount)} due on ${e.due_date}`,
            badge: e.status === 'missed' ? 'Overdue EMI' : 'Payment Due',
            badgeVariant: e.status === 'missed' ? 'danger' : 'warning',
            actionText: 'View fees',
            actionTarget: 'fees',
          });
        });
      }

      setAttentionItems(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load dashboard data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isTrainer]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="space-y-6">
      {/* Editorial Page Header without buzzwords or welcome banner */}
      <PageHeader
        title={`Dashboard`}
        description={
          isTrainer
            ? 'Class attendance velocity, assigned batch schedules, and student attendance logs.'
            : 'Enrolled students, 30-day attendance rates, fee collection run rate, and faculty utilization.'
        }
        badge={
          <Badge variant="neutral" dot>
            Current Term
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadDashboardData}
              icon={<RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Error State with Retry Button */}
      {error && (
        <div className="p-4 rounded-[6px] border border-status-red/30 bg-status-red-bg text-status-red flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>{error}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadDashboardData}
            icon={<RefreshCw className="w-3 h-3" strokeWidth={1.5} />}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Row of 4 Key Numbers */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton variant="card" className="h-28" />
          <Skeleton variant="card" className="h-28" />
          <Skeleton variant="card" className="h-28" />
          <Skeleton variant="card" className="h-28" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Active Students */}
          <StatCard
            label="Active Students"
            value={stats.activeStudents}
            subtext={`Across ${stats.activeBatches} active batches`}
            icon={<Users className="w-4 h-4 text-accent" strokeWidth={1.5} />}
          />

          {/* KPI 2: Overall Attendance */}
          <StatCard
            label="Attendance Rate"
            value={`${stats.attendanceRate}%`}
            subtext="Last 30 days average"
            trend={{
              value: stats.attendanceRate >= 85 ? 'On target (85%)' : 'Below target',
              positive: stats.attendanceRate >= 85,
            }}
            icon={<CheckCircle2 className="w-4 h-4 text-status-green" strokeWidth={1.5} />}
          />

          {/* KPI 3: Overdue Fees (For non-trainers) or Active Batches (For trainers) */}
          {!isTrainer ? (
            <StatCard
              label="Fees Due This Week"
              value={formatINR(stats.emisDueAmount)}
              subtext={`${stats.emisDueCount} pending installments`}
              trend={{
                value: `${stats.emisDueCount} pending`,
                neutral: true,
              }}
              icon={<IndianRupee className="w-4 h-4 text-status-amber" strokeWidth={1.5} />}
            />
          ) : (
            <StatCard
              label="Active Batches"
              value={stats.activeBatches}
              subtext="Current cohort schedules"
              icon={<BookOpen className="w-4 h-4 text-accent" strokeWidth={1.5} />}
            />
          )}

          {/* KPI 4: Faculty Utilization */}
          <StatCard
            label="Trainer Capacity"
            value={`${stats.trainerUtilization}%`}
            subtext="Classroom and lab schedule load"
            icon={<Activity className="w-4 h-4 text-text-muted" strokeWidth={1.5} />}
          />
        </div>
      )}

      {/* ONE Main Chart */}
      <Card
        title="Attendance Velocity"
        description="Daily student attendance rate across classroom and online sessions over the last 6 days"
        action={<Badge variant="neutral" size="sm">Daily Rate</Badge>}
      >
        {loading ? (
          <Skeleton variant="rect" className="h-56 sm:h-64 mt-2" />
        ) : (
          <div className="h-56 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={
                  attendanceTrend.length > 0
                    ? attendanceTrend
                    : [
                        { day: 'Mon', overall: 88, classroom: 90, online: 85 },
                        { day: 'Tue', overall: 86, classroom: 88, online: 83 },
                        { day: 'Wed', overall: 91, classroom: 93, online: 88 },
                        { day: 'Thu', overall: 85, classroom: 87, online: 81 },
                        { day: 'Fri', overall: 87, classroom: 89, online: 84 },
                        { day: 'Sat', overall: 90, classroom: 92, online: 87 },
                      ]
                }
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="2 2" stroke="var(--border-subtle)" />
                <XAxis
                  dataKey="day"
                  stroke="var(--text-subtle)"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  domain={[60, 100]}
                  stroke="var(--text-subtle)"
                  fontSize={11}
                  tickLine={false}
                  tickCount={4}
                  width={38}
                  tickFormatter={val => `${val}%`}
                />
                <Tooltip
                  formatter={(val: unknown) => [`${val}%`, '']}
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: 'var(--text)',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="overall"
                  name="Combined %"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  dot={{ r: 2.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="classroom"
                  name="Classroom"
                  stroke="#15803D"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="online"
                  name="Online"
                  stroke="#0284C7"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* "Needs attention today" Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-base font-medium text-text">
              Needs attention today
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Students and installments requiring immediate staff action
            </p>
          </div>
          {attentionItems.length > 0 && (
            <Badge variant="warning" size="sm" dot>
              {attentionItems.length} items
            </Badge>
          )}
        </div>

        <div className="bg-surface rounded-[8px] border border-border overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              <Skeleton variant="text" className="h-10" />
              <Skeleton variant="text" className="h-10" />
              <Skeleton variant="text" className="h-10" />
            </div>
          ) : attentionItems.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="All clear for today"
                description="No students with critical attendance drops or overdue installments."
              />
            </div>
          ) : (
            <>
              {/* Mobile View (< 640px) */}
              <div className="sm:hidden divide-y divide-border">
                {attentionItems.map(item => (
                  <div key={item.id} className="p-3.5 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-text text-sm">{item.name}</div>
                        <div className="text-[11px] text-text-muted mt-0.5">{item.detail}</div>
                      </div>
                      <Badge variant={item.badgeVariant} size="sm" dot>
                        {item.badge}
                      </Badge>
                    </div>

                    <div className="text-xs text-text-muted pt-1">
                      {item.issue}
                    </div>

                    <div className="pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={() => onNavigate(item.actionTarget)}
                        icon={<ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />}
                      >
                        {item.actionText}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tablet & Desktop View (>= 640px) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs tabular-nums">
                  <thead className="bg-surface-subtle/80 border-b border-border text-text-muted uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3.5 font-medium">Student / Cohort</th>
                      <th className="py-2.5 px-3.5 font-medium">Issue</th>
                      <th className="py-2.5 px-3.5 font-medium">Status</th>
                      <th className="py-2.5 px-3.5 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attentionItems.map(item => (
                      <tr key={item.id} className="hover:bg-surface-subtle/50 transition-colors text-text">
                        <td className="py-3 px-3.5">
                          <div className="font-medium text-text">{item.name}</div>
                          <div className="text-[11px] text-text-muted">{item.detail}</div>
                        </td>
                        <td className="py-3 px-3.5 text-text-muted">
                          {item.issue}
                        </td>
                        <td className="py-3 px-3.5">
                          <Badge variant={item.badgeVariant} size="sm" dot>
                            {item.badge}
                          </Badge>
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onNavigate(item.actionTarget)}
                            icon={<ArrowRight className="w-3 h-3" strokeWidth={1.5} />}
                          >
                            {item.actionText}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
