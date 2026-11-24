import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Batch, BatchMode, Course, Trainer } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';
import { PageHeader } from '../common/PageHeader';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Drawer } from '../common/Drawer';
import { Skeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';

export const BatchesView: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [modeFilter, setModeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    course_id: '',
    trainer_id: '',
    mode: 'classroom' as BatchMode,
    room_name: 'Lab 1 - Alpha',
    online_seat_limit: 30,
    max_capacity: 40,
    start_date: new Date().toISOString().split('T')[0],
    schedule: 'Mon, Wed, Fri 10:00 - 12:00',
    status: 'ongoing' as Batch['status'],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load batches';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredBatches = batches.filter(b => {
    const matchesMode = modeFilter === 'all' || b.mode === modeFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.name.toLowerCase().includes(q) ||
      b.course_name.toLowerCase().includes(q) ||
      b.trainer_name.toLowerCase().includes(q);
    return matchesMode && matchesSearch;
  });

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
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

      showToast(`Batch "${formData.name}" created`, 'success');
      setIsAddModalOpen(false);
      setFormData(prev => ({ ...prev, name: '' }));
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create batch';
      showToast(msg, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const getModeBadge = (mode: BatchMode) => {
    if (mode === 'classroom') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted bg-surface-muted px-2 py-0.5 rounded-[4px] border border-border">
          <Building2 className="w-3 h-3 text-text-muted" strokeWidth={1.5} />
          Classroom
        </span>
      );
    }
    if (mode === 'hybrid') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent bg-accent-subtle px-2 py-0.5 rounded-[4px] border border-accent/20">
          <Monitor className="w-3 h-3 text-accent" strokeWidth={1.5} />
          Hybrid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-status-green bg-status-green-bg px-2 py-0.5 rounded-[4px] border border-status-green/30">
        <Video className="w-3 h-3 text-status-green" strokeWidth={1.5} />
        Online
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Batches"
        description="Active cohorts, classroom schedules, and capacity limits."
        badge={<Badge variant="neutral" dot>{filteredBatches.length} Batches</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadData}
              icon={<RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />}
            >
              Refresh
            </Button>
            {role === 'owner' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}
              >
                Create batch
              </Button>
            )}
          </div>
        }
      />

      {/* Error State with Retry Button */}
      {error && (
        <div className="p-4 rounded-[6px] border border-status-red/30 bg-status-red-bg text-status-red flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>{error}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            icon={<RefreshCw className="w-3 h-3" strokeWidth={1.5} />}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Search and Mode Filter Bar */}
      <div className="bg-surface p-3 sm:p-3.5 rounded-[8px] border border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-[6px] border border-border overflow-x-auto">
          {(['all', 'classroom', 'hybrid', 'online'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setModeFilter(mode)}
              className={`flex-1 sm:flex-initial px-3 py-1.5 sm:py-1 rounded-[4px] text-xs font-medium capitalize transition-colors cursor-pointer min-h-[38px] sm:min-h-0 ${
                modeFilter === mode
                  ? 'bg-surface text-text border border-border shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search batch, course, or trainer..."
            className="w-full pl-9 pr-3 py-2 sm:py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text focus:border-accent"
          />
        </div>
      </div>

      {/* Batch Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton variant="card" className="h-44" />
          <Skeleton variant="card" className="h-44" />
          <Skeleton variant="card" className="h-44" />
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="bg-surface rounded-[8px] border border-border p-8">
          <EmptyState
            title="No batches found"
            description="No cohorts match your selected mode filter or search query."
            action={
              role === 'owner' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}
                >
                  Create batch
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.map(batch => {
            const occupancy = Math.round(
              ((batch.enrolled_count || 0) / (batch.max_capacity || 40)) * 100
            );

            return (
              <div
                key={batch.id}
                onClick={() => setSelectedBatch(batch)}
                className="bg-surface rounded-[8px] border border-border p-4 flex flex-col justify-between hover:border-accent/40 transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-serif text-sm font-medium text-text truncate">
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

                  <div className="text-xs text-text-muted mb-2">
                    {batch.course_name}
                  </div>

                  <div className="mb-3">{getModeBadge(batch.mode)}</div>

                  <div className="space-y-1.5 text-xs text-text-muted py-2.5 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-text-subtle">Trainer:</span>
                      <span className="font-medium text-text">{batch.trainer_name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-text-subtle">Room:</span>
                      <span className="font-medium text-text-muted">{batch.room_name || 'Online'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-text-subtle">Schedule:</span>
                      <span className="font-medium text-text-muted text-[11px] truncate max-w-[150px]">{batch.schedule}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-text-subtle">Occupancy:</span>
                    <span className="font-medium text-text text-[11px] tabular-nums">
                      {batch.enrolled_count} / {batch.max_capacity} ({occupancy}%)
                    </span>
                  </div>
                  <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${
                        occupancy > 90
                          ? 'bg-status-red'
                          : occupancy > 70
                          ? 'bg-status-amber'
                          : 'bg-status-green'
                      }`}
                      style={{ width: `${Math.min(occupancy, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Side Drawer with Full Batch Details */}
      <Drawer
        isOpen={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        title={selectedBatch?.name}
        description={selectedBatch?.course_name}
        footer={
          <div className="flex justify-end w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedBatch(null)}
            >
              Close
            </Button>
          </div>
        }
      >
        {selectedBatch && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-surface-subtle rounded-[6px] border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-text-subtle uppercase">Batch ID</span>
                <div className="font-mono font-medium text-text">{selectedBatch.id}</div>
              </div>
              <Badge
                variant={
                  selectedBatch.status === 'ongoing'
                    ? 'success'
                    : selectedBatch.status === 'upcoming'
                    ? 'warning'
                    : 'neutral'
                }
                size="sm"
                dot
              >
                {selectedBatch.status.toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-text uppercase tracking-wider">
                Schedule & Location
              </h4>
              <div className="p-3 bg-surface-subtle rounded-[6px] border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Delivery mode</span>
                  <span>{getModeBadge(selectedBatch.mode)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Primary room</span>
                  <span className="font-medium text-text">{selectedBatch.room_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Assigned trainer</span>
                  <span className="font-medium text-text">{selectedBatch.trainer_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Weekly timetable</span>
                  <span className="font-medium text-text text-[11px]">{selectedBatch.schedule}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Commenced on</span>
                  <span className="font-medium text-text tabular-nums">{formatDate(selectedBatch.start_date)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-text uppercase tracking-wider">
                Capacity & Occupancy
              </h4>
              <div className="p-3 bg-surface-subtle rounded-[6px] border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Enrolled candidates</span>
                  <span className="font-semibold text-text tabular-nums">{selectedBatch.enrolled_count} students</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Seat capacity</span>
                  <span className="font-medium text-text tabular-nums">{selectedBatch.max_capacity} total</span>
                </div>
                {selectedBatch.online_seat_limit && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Online stream seats</span>
                    <span className="font-mono text-status-green">{selectedBatch.online_seat_limit} remote seats</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Batch Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create batch"
        description="Add a new coaching cohort with schedule and trainer assignment."
      >
        <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-text mb-1">Batch name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
              placeholder="e.g. Java Fullstack — Batch C"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-text mb-1">Course track</label>
              <select
                value={formData.course_id}
                onChange={e => setFormData({ ...formData, course_id: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-text mb-1">Trainer</label>
              <select
                value={formData.trainer_id}
                onChange={e => setFormData({ ...formData, trainer_id: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
              >
                {trainers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-text mb-1">Delivery mode</label>
              <select
                value={formData.mode}
                onChange={e => setFormData({ ...formData, mode: e.target.value as BatchMode })}
                className="w-full px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
              >
                <option value="classroom">Classroom</option>
                <option value="hybrid">Hybrid</option>
                <option value="online">Online</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-text mb-1">Room name</label>
              <input
                type="text"
                value={formData.room_name}
                onChange={e => setFormData({ ...formData, room_name: e.target.value })}
                className="w-full px-3 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-text mb-1">Max capacity</label>
              <input
                type="number"
                value={formData.max_capacity}
                onChange={e => setFormData({ ...formData, max_capacity: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
              />
            </div>

            <div>
              <label className="block font-medium text-text mb-1">Start date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-text mb-1">Schedule timing</label>
            <input
              type="text"
              value={formData.schedule}
              onChange={e => setFormData({ ...formData, schedule: e.target.value })}
              className="w-full px-3 py-1.5 rounded-[6px] border border-border bg-surface text-text focus:border-accent"
              placeholder="e.g. Mon, Wed, Fri 10:00 - 12:00"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isCreating}
            >
              Create batch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
