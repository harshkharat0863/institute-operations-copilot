import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building,
  Laptop,
  Search,
  Plus,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { AttendanceRecord, Batch, Student } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';
import { PageHeader } from '../common/PageHeader';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Skeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';

export const AttendanceView: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'classroom' | 'online'>('classroom');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [checkInStatus, setCheckInStatus] = useState<'present' | 'late'>('present');

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recs, stdList, batchList] = await Promise.all([
        api.getAttendanceRecords(viewType),
        api.getStudents(),
        api.getBatches(),
      ]);
      setRecords(recs || []);
      setStudents(stdList || []);
      setBatches(batchList || []);
      if (stdList?.length && batchList?.length) {
        setSelectedStudentId(stdList[0].id);
        setSelectedBatchId(batchList[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch attendance logs';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [viewType, showToast]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        r.student_name.toLowerCase().includes(q) ||
        r.batch_name.toLowerCase().includes(q) ||
        (r.ip_or_location && r.ip_or_location.toLowerCase().includes(q));
      return matchSearch;
    });
  }, [records, searchQuery]);

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (viewType === 'classroom') {
        await api.checkInClassroom({
          student_id: selectedStudentId,
          batch_id: selectedBatchId,
          status: checkInStatus,
        });
        showToast('Classroom check-in recorded', 'success');
      } else {
        await api.recordOnlineJoin({
          student_id: selectedStudentId,
          batch_id: selectedBatchId,
          duration_minutes: 105,
        });
        showToast('Online attendance session recorded', 'success');
      }
      setIsCheckInModalOpen(false);
      loadAttendance();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check-in failed';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    if (status === 'present') return <Badge variant="success" size="sm" dot>PRESENT</Badge>;
    if (status === 'late') return <Badge variant="warning" size="sm" dot>LATE</Badge>;
    return <Badge variant="danger" size="sm" dot>ABSENT</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Daily session attendance logs across classroom and online batches."
        badge={<Badge variant="neutral" dot>{filteredRecords.length} Records</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadAttendance}
              icon={<RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCheckInModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}
            >
              Record check-in
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
            onClick={loadAttendance}
            icon={<RefreshCw className="w-3 h-3" strokeWidth={1.5} />}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Controls Bar: Mode tabs + search */}
      <div className="bg-surface p-3 sm:p-3.5 rounded-[8px] border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-[6px] border border-border">
          <button
            onClick={() => setViewType('classroom')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 sm:py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer min-h-[38px] sm:min-h-0 flex items-center justify-center gap-1.5 ${
              viewType === 'classroom'
                ? 'bg-surface text-text border border-border shadow-xs'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <Building className="w-3.5 h-3.5" strokeWidth={1.5} />
            Classroom
          </button>
          <button
            onClick={() => setViewType('online')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 sm:py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer min-h-[38px] sm:min-h-0 flex items-center justify-center gap-1.5 ${
              viewType === 'online'
                ? 'bg-surface text-text border border-border shadow-xs'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" strokeWidth={1.5} />
            Online
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search student, batch..."
            className="w-full pl-9 pr-3 py-2 sm:py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text focus:border-accent"
          />
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="bg-surface rounded-[8px] border border-border overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton variant="text" className="h-10" />
            <Skeleton variant="text" className="h-10" />
            <Skeleton variant="text" className="h-10" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No attendance records found"
              description={`No ${viewType} attendance entries match your current search.`}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCheckInModalOpen(true)}
                  icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}
                >
                  Record check-in
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {/* 1. MOBILE VIEW (< 640px): Stacked Cards */}
            <div className="sm:hidden divide-y divide-border">
              {filteredRecords.map(rec => (
                <div key={rec.id} className="p-3.5 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-text text-sm">{rec.student_name}</div>
                      <div className="text-[11px] text-text-muted mt-0.5">{rec.batch_name}</div>
                    </div>
                    {getStatusBadge(rec.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                    <div>
                      <span className="text-[10px] text-text-subtle uppercase">Verified by: </span>
                      <span className="text-text-muted">{rec.verified_by || 'Terminal'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-subtle uppercase">Time: </span>
                      <span className="text-text-muted tabular-nums">{formatDateTime(rec.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. TABLET & DESKTOP (>= 640px): Horizontal scroll with sticky first column */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs tabular-nums">
                <thead className="bg-surface-subtle/80 border-b border-border text-text-muted uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3.5 font-medium sticky left-0 bg-surface-subtle z-10 border-r border-border">
                      Student Name
                    </th>
                    <th className="py-2.5 px-3.5 font-medium">Cohort Batch</th>
                    <th className="py-2.5 px-3.5 font-medium">Channel</th>
                    <th className="py-2.5 px-3.5 font-medium">Location / IP</th>
                    <th className="py-2.5 px-3.5 font-medium">Timestamp</th>
                    <th className="py-2.5 px-3.5 font-medium">Duration</th>
                    <th className="py-2.5 px-3.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-surface-subtle/50 transition-colors text-text">
                      <td className="py-2.5 px-3.5 sticky left-0 bg-surface z-10 border-r border-border">
                        <div className="font-medium text-text">{rec.student_name}</div>
                        <div className="text-[10px] text-text-subtle font-mono">{rec.student_id}</div>
                      </td>

                      <td className="py-2.5 px-3.5 text-text-muted">
                        {rec.batch_name}
                      </td>

                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-1.5 text-text-muted">
                          {rec.type === 'classroom' ? (
                            <Building className="w-3.5 h-3.5 text-status-green" strokeWidth={1.5} />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                          )}
                          <span>{rec.verified_by || 'Terminal'}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5 text-text-muted font-mono text-[11px]">
                        {rec.ip_or_location || 'Campus'}
                      </td>

                      <td className="py-2.5 px-3.5 text-text-muted">
                        {formatDateTime(rec.timestamp)}
                      </td>

                      <td className="py-2.5 px-3.5 text-text-muted">
                        {rec.duration_minutes ? `${rec.duration_minutes} mins` : '120 mins'}
                      </td>

                      <td className="py-2.5 px-3.5">
                        {getStatusBadge(rec.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Manual Check-in Modal */}
      <Modal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        title={viewType === 'classroom' ? 'Record classroom check-in' : 'Record online attendance'}
        description="Verify and log attendance for a student session."
      >
        <form onSubmit={handleManualCheckIn} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-text mb-1">Student</label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
            >
              {students.slice(0, 40).map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.batch_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-text mb-1">Cohort batch</label>
            <select
              value={selectedBatchId}
              onChange={e => setSelectedBatchId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
            >
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {viewType === 'classroom' && (
            <div>
              <label className="block font-medium text-text mb-1">Status</label>
              <select
                value={checkInStatus}
                onChange={e => setCheckInStatus(e.target.value as 'present' | 'late')}
                className="w-full px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
              >
                <option value="present">Present (On Time)</option>
                <option value="late">Late Arrival</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCheckInModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Record check-in
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
