import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Users,
  Video,
  Monitor,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { Batch, BatchMode, Course, Trainer } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';
import { Modal } from '../common/Modal';

export const BatchesView: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    course_id: '',
    trainer_id: '',
    mode: 'classroom' as BatchMode,
    room_name: 'Lab 1 - Alpha',
    online_seat_limit: 30,
    max_capacity: 40,
    start_date: '2026-11-01',
    schedule: 'Mon, Wed, Fri 10:00 - 12:00',
    status: 'upcoming' as Batch['status'],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchList, courseList, trainerList] = await Promise.all([
        api.getBatches(),
        api.getCourses(),
        api.getTrainers(),
      ]);
      setBatches(batchList || []);
      setCourses(courseList || []);
      setTrainers(trainerList || []);
      if (courseList?.length && trainerList?.length) {
        setFormData(prev => ({
          ...prev,
          course_id: courseList[0].id,
          trainer_id: trainerList[0].id,
        }));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load cohorts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBatches = batches.filter(b => {
    if (modeFilter === 'all') return true;
    return b.mode === modeFilter;
  });

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedCourse = courses.find(c => c.id === formData.course_id);
      const selectedTrainer = trainers.find(t => t.id === formData.trainer_id);

      await api.addBatch({
        name: formData.name,
        course_id: formData.course_id,
        course_name: selectedCourse?.name || 'Technical Course',
        trainer_id: formData.trainer_id,
        trainer_name: selectedTrainer?.name || 'Trainer',
        mode: formData.mode,
        room_name: formData.mode === 'online' ? 'Online Live Stream' : formData.room_name,
        online_seat_limit: formData.mode !== 'classroom' ? Number(formData.online_seat_limit) : undefined,
        max_capacity: Number(formData.max_capacity),
        start_date: formData.start_date,
        schedule: formData.schedule,
        status: formData.status,
      });

      showToast(`Batch "${formData.name}" created successfully`, 'success');
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Could not create cohort', 'error');
    }
  };

  const getModeBadge = (mode: BatchMode) => {
    if (mode === 'classroom') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          <Building2 className="w-3 h-3 text-slate-500" />
          Classroom
        </span>
      );
    }
    if (mode === 'hybrid') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
          <Monitor className="w-3 h-3 text-purple-600" />
          Hybrid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
        <Video className="w-3 h-3 text-cyan-600" />
        Online
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Batches & Courses
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active cohorts across physical labs, hybrid rooms, and online live sessions.
          </p>
        </div>

        {role === 'owner' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Batch
          </button>
        )}
      </div>

      {/* Mode Filter Bar */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs w-fit">
        <button
          onClick={() => setModeFilter('all')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            modeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          All Batches ({batches.length})
        </button>
        <button
          onClick={() => setModeFilter('classroom')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            modeFilter === 'classroom'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Classroom ({batches.filter(b => b.mode === 'classroom').length})
        </button>
        <button
          onClick={() => setModeFilter('hybrid')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            modeFilter === 'hybrid'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Hybrid ({batches.filter(b => b.mode === 'hybrid').length})
        </button>
        <button
          onClick={() => setModeFilter('online')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            modeFilter === 'online'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Online ({batches.filter(b => b.mode === 'online').length})
        </button>
      </div>

      {/* Batches Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading cohorts...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.map(batch => {
            const occupancy = Math.round((batch.enrolled_count / batch.max_capacity) * 100);

            return (
              <div
                key={batch.id}
                onClick={() => setSelectedBatch(batch)}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-indigo-300 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug">
                      {batch.name}
                    </h3>
                    <Badge
                      variant={
                        batch.status === 'ongoing'
                          ? 'success'
                          : batch.status === 'upcoming'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                      dot
                    >
                      {batch.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-500 mb-2.5">
                    {batch.course_name}
                  </div>

                  <div className="mb-3">{getModeBadge(batch.mode)}</div>

                  <div className="space-y-1.5 text-xs text-slate-600 py-2.5 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Trainer:</span>
                      <span className="font-medium text-slate-800">{batch.trainer_name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Room:</span>
                      <span className="font-medium text-slate-700">{batch.room_name || 'Online'}</span>
                    </div>

                    {batch.online_seat_limit && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Online Seats:</span>
                        <span className="font-mono text-cyan-700 font-semibold text-[11px]">
                          {batch.online_seat_limit} max
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Schedule:</span>
                      <span className="font-medium text-slate-700 text-[11px] truncate max-w-[150px]">{batch.schedule}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Occupancy:</span>
                    <span className="font-medium text-slate-800 text-[11px]">
                      {batch.enrolled_count} / {batch.max_capacity} ({occupancy}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-full ${
                        occupancy > 90
                          ? 'bg-rose-500'
                          : occupancy > 70
                          ? 'bg-indigo-600'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${occupancy}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Batch Detail Modal */}
      {selectedBatch && (
        <Modal
          isOpen={!!selectedBatch}
          onClose={() => setSelectedBatch(null)}
          title={selectedBatch.name}
          description={selectedBatch.course_name}
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Cohort ID:</span>
                <span className="font-mono font-bold text-slate-800">{selectedBatch.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Mode:</span>
                <span>{getModeBadge(selectedBatch.mode)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Primary Room:</span>
                <span className="font-semibold text-slate-800">{selectedBatch.room_name}</span>
              </div>
              {selectedBatch.online_seat_limit && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Online Bandwidth Limit:</span>
                  <span className="font-semibold text-cyan-700">
                    {selectedBatch.online_seat_limit} remote seats
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Mentor:</span>
                <span className="font-semibold text-indigo-700">{selectedBatch.trainer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Session Timing:</span>
                <span className="font-medium text-slate-800">{selectedBatch.schedule}</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-indigo-950">
                  {selectedBatch.enrolled_count} Students Enrolled
                </div>
                <div className="text-[11px] text-indigo-700">
                  Capacity: {selectedBatch.max_capacity} total slots
                </div>
              </div>
              <Badge variant="info" size="sm">
                Active
              </Badge>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedBatch(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-900 transition-colors cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Batch Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule New Cohort Batch"
        description="Configure trainer, delivery mode, and physical or virtual classroom allocations"
      >
        <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1 text-[11px]">Batch Title</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
              placeholder="e.g. Java Fullstack - Batch C"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1 text-[11px]">Target Course</label>
            <select
              value={formData.course_id}
              onChange={e => setFormData({ ...formData, course_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1 text-[11px]">Assigned Trainer</label>
            <select
              value={formData.trainer_id}
              onChange={e => setFormData({ ...formData, trainer_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
            >
              {trainers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} (Max {t.max_hours_per_week}h/wk)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1 text-[11px]">Mode</label>
              <select
                value={formData.mode}
                onChange={e => setFormData({ ...formData, mode: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
              >
                <option value="classroom">Classroom</option>
                <option value="hybrid">Hybrid</option>
                <option value="online">Online</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1 text-[11px]">Max Capacity</label>
              <input
                type="number"
                min="10"
                max="80"
                value={formData.max_capacity}
                onChange={e => setFormData({ ...formData, max_capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {formData.mode !== 'online' && (
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1 text-[11px]">Classroom Room</label>
              <select
                value={formData.room_name}
                onChange={e => setFormData({ ...formData, room_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Lab 1 - Alpha">Lab 1 - Alpha (40 seats)</option>
                <option value="Hall 2 - Beta">Hall 2 - Beta (55 seats)</option>
                <option value="Studio 3 - Gamma">Studio 3 - Gamma (32 seats)</option>
                <option value="Seminar Hall 4 - Delta">Seminar Hall 4 - Delta (60 seats)</option>
                <option value="Room 5 - Tech Lab">Room 5 - Tech Lab (30 seats)</option>
              </select>
            </div>
          )}

          {formData.mode !== 'classroom' && (
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1 text-[11px]">
                Online Seat Limit
              </label>
              <input
                type="number"
                value={formData.online_seat_limit}
                onChange={e => setFormData({ ...formData, online_seat_limit: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1 text-[11px]">Weekly Schedule</label>
            <input
              type="text"
              required
              value={formData.schedule}
              onChange={e => setFormData({ ...formData, schedule: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
              placeholder="e.g. Mon, Wed, Fri 11:30 - 13:30"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 cursor-pointer"
            >
              Launch Batch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
