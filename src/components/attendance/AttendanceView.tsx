import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Building,
  Video,
  Clock,
  Search,
  Plus,
  MapPin,
  Laptop,
  Calendar,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { AttendanceRecord, Batch, Student } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';
import { Modal } from '../common/Modal';

export const AttendanceView: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewType, setViewType] = useState<'classroom' | 'online'>('classroom');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [checkInStatus, setCheckInStatus] = useState<'present' | 'late'>('present');

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const [recs, stdList, batchList] = await Promise.all([
        api.getAttendanceRecords(viewType),
        api.getStudents(),
        api.getBatches(),
      ]);
      setRecords(recs);
      setStudents(stdList);
      setBatches(batchList);
      if (stdList.length && batchList.length) {
        setSelectedStudentId(stdList[0].id);
        setSelectedBatchId(batchList[0].id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch attendance logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [viewType]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch =
        r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.batch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.ip_or_location && r.ip_or_location.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSearch;
    });
  }, [records, searchQuery]);

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (viewType === 'classroom') {
        await api.checkInClassroom({
          student_id: selectedStudentId,
          batch_id: selectedBatchId,
          status: checkInStatus,
        });
        showToast('Classroom check-in verified via biometric kiosk', 'success');
      } else {
        await api.recordOnlineJoin({
          student_id: selectedStudentId,
          batch_id: selectedBatchId,
          duration_minutes: 105,
        });
        showToast('Online session join packet recorded via WebRTC bridge', 'success');
      }
      setIsCheckInModalOpen(false);
      loadAttendance();
    } catch (err: any) {
      showToast(err.message || 'Check-in failed', 'error');
    }
  };

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    if (status === 'present') return <Badge variant="success" size="sm" dot>PRESENT</Badge>;
    if (status === 'late') return <Badge variant="warning" size="sm" dot>LATE</Badge>;
    return <Badge variant="danger" size="sm" dot>ABSENT</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Attendance & Join Verification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time biometric terminal telemetry vs WebRTC classroom join logs.
          </p>
        </div>

        <button
          onClick={() => setIsCheckInModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          {viewType === 'classroom' ? 'Biometric Check-in' : 'Record Online Join'}
        </button>
      </div>

      {/* View Toggle & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* VIEW TOGGLE */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setViewType('classroom')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              viewType === 'classroom'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            Classroom Check-ins
          </button>

          <button
            onClick={() => setViewType('online')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              viewType === 'online'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-4 h-4" />
            Online Join Logs
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidate, cohort, IP/location..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading attendance logs...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No {viewType} attendance records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">Cohort Batch</th>
                  <th className="py-3 px-4 font-semibold">Verification Channel</th>
                  <th className="py-3 px-4 font-semibold">Location / Node IP</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Session Duration</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{rec.student_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{rec.student_id}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {rec.batch_name}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        {rec.type === 'classroom' ? (
                          <Building className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Laptop className="w-3.5 h-3.5 text-cyan-600" />
                        )}
                        <span>{rec.verified_by || 'Station Terminal'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {rec.ip_or_location || 'Campus Gate'}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {formatDateTime(rec.timestamp)}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-700">
                      {rec.duration_minutes ? `${rec.duration_minutes} mins` : 'Full Session'}
                    </td>

                    <td className="py-3 px-4">
                      {getStatusBadge(rec.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Check-in Modal */}
      <Modal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        title={viewType === 'classroom' ? 'Classroom Biometric Check-In' : 'Simulate Online Join'}
        description="Record session attendance for a student directly"
      >
        <form onSubmit={handleManualCheckIn} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Student</label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
            >
              {students.slice(0, 30).map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.batch_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Cohort Batch</label>
            <select
              value={selectedBatchId}
              onChange={e => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
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
              <label className="block font-semibold text-slate-700 uppercase mb-1">Arrival Status</label>
              <select
                value={checkInStatus}
                onChange={e => setCheckInStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
              >
                <option value="present">Present (On Time)</option>
                <option value="late">Late Arrival</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCheckInModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              Confirm Log
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
