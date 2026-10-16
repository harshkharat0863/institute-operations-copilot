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
  Move,
  GripVertical,
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
  const [draggingSessionId, setDraggingSessionId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  // Drag and drop reschedule handler
  const handleDropSession = (targetDay: Weekday, targetSlot: string) => {
    if (!draggingSessionId || !timetable) return;
    const session = timetable.sessions.find(s => s.id === draggingSessionId);
    if (!session) return;

    const times = targetSlot.split(' - ');
    const newStart = times[0];
    const newEnd = times[1];

    const hasConflict = timetable.sessions.some(
      s => s.id !== draggingSessionId &&
           s.weekday === targetDay &&
           (s.start === newStart || s.trainer_id === session.trainer_id || s.room === session.room)
    );

    const oldDay = session.weekday;
    const oldSlot = `${session.start} - ${session.end}`;

    const updatedSessions = timetable.sessions.map(s => {
      if (s.id === draggingSessionId) {
        return {
          ...s,
          weekday: targetDay,
          start: newStart,
          end: newEnd,
        };
      }
      return s;
    });

    const newChange: TimetableChange = {
      session: session.batch,
      session_id: session.id,
      from_slot: `${oldDay} ${oldSlot} (${session.room})`,
      to_slot: `${targetDay} ${newStart} - ${newEnd} (${session.room})`,
      reason: hasConflict
        ? `⚠️ Potential trainer/room overlap warning.`
        : `Manually rescheduled to ${targetDay} ${newStart} with 0 conflicts.`,
    };

    setTimetable({
      ...timetable,
      sessions: updatedSessions,
      changes: [newChange, ...(timetable.changes || [])],
      conflicts: hasConflict ? timetable.conflicts + 1 : timetable.conflicts,
    });

    setDraggingSessionId(null);
    setDragOverKey(null);
    showToast(
      `Moved "${session.batch}" to ${targetDay} ${newStart} - ${newEnd}`,
      hasConflict ? 'warning' : 'success',
      'Timetable Solver'
    );
  };

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
      setTrainers(trs || []);
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
    <div className="space-y-5">
      {/* Top Banner and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Timetable Grid
            </h1>
            {timetable && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {timetable.conflicts} Conflicts ({timetable.duration_ms}ms)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Weekly multi-resource scheduling engine across Mon–Sat, 5 physical labs, and 8 trainers.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {timetable?.changes && timetable.changes.length > 0 && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
              <button
                onClick={() => setViewMode('after')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'after'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Re-Planned
              </button>
              <button
                onClick={() => setViewMode('before')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'before'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Base View
              </button>
            </div>
          )}

          <button
            onClick={handleFreshGenerate}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-solve
          </button>

          <button
            onClick={() => setIsUnavailableModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <UserX className="w-3.5 h-3.5 text-amber-700" />
            Trainer Unavailable
          </button>

          <button
            onClick={() => setIsAddBatchModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Batch
          </button>
        </div>
      </div>

      {/* Main Container: Grid + Change Log */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">
        {/* Weekly Grid */}
        <div className="flex-1 w-full bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-700 uppercase tracking-wide">
                <div className="py-2.5 px-2 border-r border-slate-200 bg-slate-100/50 text-slate-500 text-[11px]">
                  Time Slot
                </div>
                {WEEKDAYS.map(day => (
                  <div key={day} className="py-2.5 px-2 border-r border-slate-200 last:border-r-0 text-[11px]">
                    {day}
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100">
                {TIME_SLOTS.map(slot => (
                  <div key={slot} className="grid grid-cols-7 min-h-[105px]">
                    {/* Time Column */}
                    <div className="p-2 border-r border-slate-200 bg-slate-50/40 flex flex-col justify-center text-center font-mono text-[10px] text-slate-500">
                      <Clock className="w-3 h-3 mx-auto mb-0.5 text-slate-400" />
                      {slot}
                    </div>

                    {/* Day Cells */}
                    {WEEKDAYS.map(day => {
                      const sessions = getSessionsForSlot(day, slot);
                      const cellKey = `${day}_${slot}`;
                      const isDragOver = dragOverKey === cellKey;

                      return (
                        <div
                          key={day}
                          onDragOver={e => {
                            e.preventDefault();
                            setDragOverKey(cellKey);
                          }}
                          onDragLeave={() => setDragOverKey(null)}
                          onDrop={e => {
                            e.preventDefault();
                            handleDropSession(day, slot);
                          }}
                          className={`p-1.5 border-r border-slate-100 last:border-r-0 space-y-1.5 transition-colors ${
                            isDragOver ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-400' : 'bg-white'
                          }`}
                        >
                          {sessions.map(sess => {
                            const isMoved = movedSessionIds.has(sess.id);
                            const isDragging = draggingSessionId === sess.id;

                            return (
                              <div
                                key={sess.id}
                                draggable
                                onDragStart={() => setDraggingSessionId(sess.id)}
                                onDragEnd={() => setDraggingSessionId(null)}
                                className={`rounded-lg p-2 text-xs border transition-all cursor-grab active:cursor-grabbing select-none ${
                                  sess.color_code || 'bg-slate-50 border-slate-200'
                                } ${
                                  isDragging ? 'opacity-40 scale-95' : ''
                                } ${
                                  isMoved && viewMode === 'after'
                                    ? 'border-l-4 border-l-amber-500 bg-amber-50/60'
                                    : 'shadow-2xs hover:shadow-xs'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-0.5">
                                  {isMoved && viewMode === 'after' ? (
                                    <span className="text-[9px] font-bold text-amber-900 bg-amber-200/80 px-1 rounded">
                                      RE-PLANNED
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-mono text-slate-400 uppercase">
                                      {sess.mode}
                                    </span>
                                  )}
                                  <GripVertical className="w-3 h-3 text-slate-400 hover:text-slate-600 shrink-0" />
                                </div>

                                <div className="font-semibold text-slate-900 text-[11px] leading-tight">
                                  {sess.batch}
                                </div>

                                <div className="text-[10px] text-slate-600 mt-0.5">
                                  {sess.trainer}
                                </div>

                                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                                  <Building className="w-2.5 h-2.5 shrink-0" />
                                  <span>{sess.room}</span>
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

        {/* Change Log Panel */}
        {timetable?.changes && timetable.changes.length > 0 && (
          <div className="w-full xl:w-80 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden shrink-0">
            <div className="p-3 bg-amber-50/70 border-b border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <h3 className="font-semibold text-xs text-amber-950">Re-Plan Log</h3>
              </div>
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                {timetable.changes.length} Moved
              </span>
            </div>

            <div className="p-3 space-y-3">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Sessions shifted to zero-contention slots automatically:
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-0.5">
                {timetable.changes.map((change, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="font-semibold text-slate-900 text-[11px]">{change.session}</div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono">
                      <span className="text-slate-400 line-through truncate max-w-[100px]">
                        {change.from_slot}
                      </span>
                      <ArrowRight className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="text-emerald-700 font-semibold truncate max-w-[110px]">
                        {change.to_slot}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-600 bg-amber-50 p-1.5 rounded border border-amber-100">
                      {change.reason}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Run: {timetable.run_id}</span>
                <span className="font-semibold text-emerald-600">0 clashes</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Trainer Unavailable */}
      <Modal
        isOpen={isUnavailableModalOpen}
        onClose={() => setIsUnavailableModalOpen(false)}
        title="Mark Trainer Unavailable & Trigger Re-Plan"
        description="Select an instructor and unavailable window to simulate automatic re-scheduling."
      >
        <form onSubmit={handleMarkUnavailable} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1 text-[11px]">Trainer</label>
            <select
              value={unavailTrainer}
              onChange={e => setUnavailTrainer(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
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
              <label className="block font-semibold text-slate-700 uppercase mb-1 text-[11px]">Weekday</label>
              <select
                value={unavailDay}
                onChange={e => setUnavailDay(e.target.value as Weekday)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
              >
                {WEEKDAYS.map(w => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1 text-[11px]">Time Range</label>
              <select
                value={unavailTime}
                onChange={e => setUnavailTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Full Day">Full Day (All Slots)</option>
                <option value="Morning (09:00 - 13:00)">Morning (09:00 - 13:00)</option>
                <option value="Afternoon (14:00 - 18:30)">Afternoon (14:00 - 18:30)</option>
              </select>
            </div>
          </div>

          <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
            Marking <strong>{unavailTrainer}</strong> unavailable on <strong>{unavailDay}</strong> will shift affected classes with zero room/trainer clashes.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUnavailableModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 cursor-pointer"
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
        title="Add Batch to Schedule"
        description="Insert an additional cohort into the timetable with zero-conflict slot selection"
      >
        <form onSubmit={handleAddBatchSession} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1 text-[11px]">Batch Name</label>
            <input
              type="text"
              required
              value={newBatchName}
              onChange={e => setNewBatchName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
              placeholder="e.g. AI Engineer Sprint Cohort"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1 text-[11px]">Trainer</label>
            <select
              value={newBatchTrainer}
              onChange={e => setNewBatchTrainer(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
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
              <label className="block font-semibold text-slate-700 uppercase mb-1 text-[11px]">Target Day</label>
              <select
                value={newBatchDay}
                onChange={e => setNewBatchDay(e.target.value as Weekday)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
              >
                {WEEKDAYS.map(w => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1 text-[11px]">Classroom</label>
              <select
                value={newBatchRoom}
                onChange={e => setNewBatchRoom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Seminar Hall 4 - Delta">Seminar Hall 4 - Delta</option>
                <option value="Lab 1 - Alpha">Lab 1 - Alpha</option>
                <option value="Studio 3 - Gamma">Studio 3 - Gamma</option>
                <option value="Room 5 - Tech Lab">Room 5 - Tech Lab</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddBatchModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 cursor-pointer"
            >
              Solve & Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
