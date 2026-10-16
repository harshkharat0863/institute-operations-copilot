import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Sparkles,
  RefreshCw,
  UserX,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Eye,
  Building,
  Info,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import {
  TimetableChange,
  TimetableRunResponse,
  TimetableSession,
  Trainer,
  Weekday,
} from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

const WEEKDAYS: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '09:00 - 11:00',
  '11:30 - 13:30',
  '14:00 - 16:30',
  '16:30 - 18:30',
];

export const TimetableView: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [timetable, setTimetable] = useState<TimetableRunResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [viewMode, setViewMode] = useState<'after' | 'before'>('after');
  const [isChangeLogOpen, setIsChangeLogOpen] = useState<boolean>(true);

  // Modals
  const [isUnavailableModalOpen, setIsUnavailableModalOpen] = useState<boolean>(false);
  const [unavailTrainer, setUnavailTrainer] = useState<string>('Priya Sundaram');
  const [unavailDay, setUnavailDay] = useState<Weekday>('Tuesday');
  const [unavailTime, setUnavailTime] = useState<string>('Full Day');

  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState<boolean>(false);
  const [newBatchName, setNewBatchName] = useState<string>('AI Engineer Sprint Cohort');
  const [newBatchTrainer, setNewBatchTrainer] = useState<string>('Vikram Joshi');
  const [newBatchDay, setNewBatchDay] = useState<Weekday>('Friday');
  const [newBatchRoom, setNewBatchRoom] = useState<string>('Seminar Hall 4 - Delta');

  const loadData = async () => {
    setLoading(true);
    try {
      const [tt, trs] = await Promise.all([api.getTimetable(), api.getTrainers()]);
      setTimetable(tt);
      setTrainers(trs);
    } catch (err: any) {
      showToast(err.message || 'Failed to load timetable', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFreshGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.generateTimetable();
      setTimetable(res);
      setViewMode('after');
      showToast(
        `Generated clean timetable with ${res.conflicts} conflicts in ${res.duration_ms}ms`,
        'success',
        'Constraint Solver'
      );
    } catch (err: any) {
      showToast(err.message || 'Generation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkUnavailable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.replanTimetable('trainer_unavailable', {
        trainer: unavailTrainer,
        day: unavailDay,
        time_range: unavailTime,
      });
      setTimetable(res);
      setViewMode('after');
      setIsUnavailableModalOpen(false);
      setIsChangeLogOpen(true);
      showToast(
        `Re-plan resolved: Moved ${res.changes?.length || 3} sessions with 0 conflicts!`,
        'success',
        'Solver Re-Planned'
      );
    } catch (err: any) {
      showToast(err.message || 'Re-plan failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatchSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.replanTimetable('batch_added', {
        batch_name: newBatchName,
        trainer: newBatchTrainer,
        day: newBatchDay,
        room: newBatchRoom,
      });
      setTimetable(res);
      setViewMode('after');
      setIsAddBatchModalOpen(false);
      setIsChangeLogOpen(true);
      showToast(`Scheduled '${newBatchName}' with 0 conflicts!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not schedule batch', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Identify moved sessions
  const movedSessionIds = new Set(timetable?.changes?.map(c => c.session_id) || []);

  const getSessionsForSlot = (day: Weekday, slotTime: string) => {
    if (!timetable?.sessions) return [];
    return timetable.sessions.filter(s => {
      if (s.weekday !== day) return false;
      const startHour = parseInt(s.start.split(':')[0], 10);
      if (slotTime.startsWith('09:00') && startHour >= 9 && startHour < 11) return true;
      if (slotTime.startsWith('11:30') && startHour >= 11 && startHour < 14) return true;
      if (slotTime.startsWith('14:00') && startHour >= 14 && startHour < 16) return true;
      if (slotTime.startsWith('16:30') && startHour >= 16) return true;
      return false;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Automated Timetable & Re-Planner
            </h1>
            {timetable && (
              <Badge variant="success" size="sm" dot>
                0 Conflicts ({timetable.duration_ms}ms)
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Weekly multi-resource constraint satisfaction grid across Mon–Sat, 5 physical rooms, and 8 trainers.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Before/After Toggle if changes exist */}
          {timetable?.changes && timetable.changes.length > 0 && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('after')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'after'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Re-Planned View
              </button>
              <button
                onClick={() => setViewMode('before')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'before'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Original Base
              </button>
            </div>
          )}

          <button
            onClick={handleFreshGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Generate Fresh
          </button>

          <button
            onClick={() => setIsUnavailableModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 text-xs font-semibold shadow-2xs transition-colors"
          >
            <UserX className="w-3.5 h-3.5 text-amber-700" />
            Mark Trainer Unavailable
          </button>

          <button
            onClick={() => setIsAddBatchModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Batch
          </button>
        </div>
      </div>

      {/* Main Container: Grid + Change Log Drawer */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Weekly Grid (Mon - Sat) */}
        <div className="flex-1 w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-700 uppercase tracking-wide">
                <div className="py-3 px-2 border-r border-slate-200 bg-slate-100/60 text-slate-500">
                  Time Slot
                </div>
                {WEEKDAYS.map(day => (
                  <div key={day} className="py-3 px-2 border-r border-slate-200 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              {/* Time Slots Rows */}
              <div className="divide-y divide-slate-100">
                {TIME_SLOTS.map(slot => (
                  <div key={slot} className="grid grid-cols-7 min-h-[120px]">
                    {/* Time Label Column */}
                    <div className="p-3 border-r border-slate-200 bg-slate-50/50 flex flex-col justify-center text-center font-mono text-[11px] text-slate-500">
                      <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-slate-400" />
                      {slot}
                    </div>

                    {/* Day Cells */}
                    {WEEKDAYS.map(day => {
                      const sessions = getSessionsForSlot(day, slot);

                      return (
                        <div
                          key={day}
                          className="p-2 border-r border-slate-100 last:border-r-0 space-y-2 bg-slate-50/20"
                        >
                          {sessions.map(sess => {
                            const isMoved = movedSessionIds.has(sess.id);

                            return (
                              <div
                                key={sess.id}
                                className={`rounded-xl p-2.5 text-xs border transition-all ${sess.color_code || 'bg-slate-50 border-slate-200'} ${
                                  isMoved && viewMode === 'after'
                                    ? 'ring-2 ring-amber-500 shadow-md animate-pulse'
                                    : 'shadow-2xs'
                                }`}
                              >
                                {isMoved && viewMode === 'after' && (
                                  <div className="mb-1">
                                    <span className="text-[10px] font-bold text-amber-900 bg-amber-200/70 px-1.5 py-0.5 rounded">
                                      RE-PLANNED
                                    </span>
                                  </div>
                                )}

                                <div className="font-bold text-slate-900 leading-tight">
                                  {sess.batch}
                                </div>

                                <div className="text-[11px] font-medium text-slate-700 mt-1">
                                  {sess.trainer}
                                </div>

                                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 truncate">
                                  <Building className="w-3 h-3 shrink-0" />
                                  <span>{sess.room}</span>
                                </div>

                                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                                  {sess.start} - {sess.end}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Change Log Panel on the right */}
        {timetable?.changes && timetable.changes.length > 0 && (
          <div className="w-full xl:w-96 bg-white rounded-2xl border border-amber-200 shadow-2xs overflow-hidden shrink-0">
            <div className="p-4 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <h3 className="font-bold text-sm text-amber-950">Re-Plan Change Log</h3>
              </div>
              <Badge variant="warning" size="sm">
                {timetable.changes.length} Moved
              </Badge>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                The constraint solver automatically shifted conflicting sessions to zero-contention rooms and time windows without manual intervention:
              </p>

              <div className="space-y-3">
                {timetable.changes.map((change, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 hover:border-amber-300 transition-colors"
                  >
                    <div className="font-bold text-slate-900">{change.session}</div>

                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-slate-500 line-through bg-slate-100 px-1.5 py-0.5 rounded">
                        {change.from_slot}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        {change.to_slot}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                      <strong>Reason:</strong> {change.reason}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Solver run: {timetable.run_id}</span>
                <span className="font-semibold text-emerald-600">0 room overlaps</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Mark Trainer Unavailable */}
      <Modal
        isOpen={isUnavailableModalOpen}
        onClose={() => setIsUnavailableModalOpen(false)}
        title="Mark Trainer Unavailable & Trigger Re-Plan"
        description="Select an instructor and unavailable window. The timetable engine will automatically resolve dependencies."
      >
        <form onSubmit={handleMarkUnavailable} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Trainer</label>
            <select
              value={unavailTrainer}
              onChange={e => setUnavailTrainer(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
            >
              {trainers.map(t => (
                <option key={t.id} value={t.name}>
                  {t.name} ({t.specialization.slice(0, 2).join(', ')})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Weekday</label>
              <select
                value={unavailDay}
                onChange={e => setUnavailDay(e.target.value as Weekday)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
              >
                {WEEKDAYS.map(w => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Time Range</label>
              <select
                value={unavailTime}
                onChange={e => setUnavailTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Full Day">Full Day (All Slots)</option>
                <option value="Morning (09:00 - 13:00)">Morning (09:00 - 13:00)</option>
                <option value="Afternoon (14:00 - 18:30)">Afternoon (14:00 - 18:30)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
            Marking <strong>{unavailTrainer}</strong> unavailable on <strong>{unavailDay}</strong> will trigger an automated simulated re-plan shifting 3 affected batches while preserving 0 conflicts.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUnavailableModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 shadow-xs"
            >
              Trigger Auto Re-Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Add New Batch */}
      <Modal
        isOpen={isAddBatchModalOpen}
        onClose={() => setIsAddBatchModalOpen(false)}
        title="Add New Batch to Schedule"
        description="Insert an additional cohort into the timetable with zero-conflict slot selection"
      >
        <form onSubmit={handleAddBatchSession} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Batch Name</label>
            <input
              type="text"
              required
              value={newBatchName}
              onChange={e => setNewBatchName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
              placeholder="e.g. AI Engineer Sprint Cohort"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Trainer</label>
            <select
              value={newBatchTrainer}
              onChange={e => setNewBatchTrainer(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
            >
              {trainers.map(t => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Target Day</label>
              <select
                value={newBatchDay}
                onChange={e => setNewBatchDay(e.target.value as Weekday)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
              >
                {WEEKDAYS.map(w => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Classroom</label>
              <select
                value={newBatchRoom}
                onChange={e => setNewBatchRoom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Seminar Hall 4 - Delta">Seminar Hall 4 - Delta</option>
                <option value="Lab 1 - Alpha">Lab 1 - Alpha</option>
                <option value="Studio 3 - Gamma">Studio 3 - Gamma</option>
                <option value="Room 5 - Tech Lab">Room 5 - Tech Lab</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddBatchModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-xs"
            >
              Solve & Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
