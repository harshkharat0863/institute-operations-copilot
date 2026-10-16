import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  Edit2,
  CheckCircle2,
  Send,
  Phone,
  Calendar,
  User,
  Clock,
  Filter,
  CheckCheck,
  Save,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatDate, formatDateTime, maskPhone } from '../../lib/utils';
import { ActionItem } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';

export const ApprovalsView: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState<string>('');

  const loadActions = async () => {
    setLoading(true);
    try {
      const data = await api.getActions(statusFilter === 'all' ? undefined : statusFilter);
      setActions(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load approvals queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, [statusFilter]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const pendingIds = actions.filter(a => a.status === 'pending').map(a => a.id);
    if (selectedIds.length === pendingIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const updated = await api.approveAction(id, user?.name || 'Authorized Staff');
      showToast(`Reminder for ${updated.student_name} approved and sent to outbox`, 'success');
      loadActions();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve action', 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const updated = await api.rejectAction(id, user?.name || 'Authorized Staff');
      showToast(`Action for ${updated.student_name} rejected`, 'warning');
      loadActions();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject action', 'error');
    }
  };

  const handleStartEdit = (action: ActionItem) => {
    setEditingId(action.id);
    setEditMessageText(action.message);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await api.updateAction(id, editMessageText);
      showToast('Notification message updated', 'success');
      setEditingId(null);
      loadActions();
    } catch (err: any) {
      showToast(err.message || 'Failed to update message', 'error');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      await api.bulkApproveActions(selectedIds, user?.name || 'Staff Lead');
      showToast(`Bulk approved ${selectedIds.length} actions! Dispatched via outbox.`, 'success');
      setSelectedIds([]);
      loadActions();
    } catch (err: any) {
      showToast(err.message || 'Bulk approval failed', 'error');
    }
  };

  const getStatusBadge = (status: ActionItem['status']) => {
    if (status === 'sent' || status === 'approved') {
      return (
        <Badge variant="success" size="sm" dot>
          SENT
        </Badge>
      );
    }
    if (status === 'rejected') {
      return (
        <Badge variant="danger" size="sm" dot>
          REJECTED
        </Badge>
      );
    }
    return (
      <Badge variant="warning" size="sm" dot>
        PENDING
      </Badge>
    );
  };

  const pendingItems = actions.filter(a => a.status === 'pending');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Approvals Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Human-in-the-loop review for outgoing WhatsApp reminders and operational escalations.
          </p>
        </div>

        {statusFilter === 'pending' && pendingItems.length > 0 && (
          <button
            onClick={handleBulkApprove}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shrink-0 disabled:opacity-40 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            Approve Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Filter and Selection Row */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
          {(['pending', 'sent', 'rejected', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {statusFilter === 'pending' && pendingItems.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              id="selectAll"
              checked={selectedIds.length > 0 && selectedIds.length === pendingItems.length}
              onChange={handleSelectAll}
              className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
            />
            <label htmlFor="selectAll" className="cursor-pointer font-medium select-none">
              Select all pending ({pendingItems.length})
            </label>
          </div>
        )}
      </div>

      {/* Items List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading approvals queue...
        </div>
      ) : actions.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
          No items found in the {statusFilter} queue.
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map(action => {
            const isEditing = editingId === action.id;
            const isPending = action.status === 'pending';
            const isSelected = selectedIds.includes(action.id);

            return (
              <div
                key={action.id}
                className={`bg-white rounded-xl border p-4 transition-all shadow-2xs ${
                  isSelected
                    ? 'border-indigo-400 ring-1 ring-indigo-300'
                    : isPending
                    ? 'border-slate-200 hover:border-slate-300'
                    : 'border-slate-200 opacity-90'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  {/* Left Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(action.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-3.5 h-3.5 mt-0.5"
                      />
                    )}

                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {action.student_name}
                        </span>

                        <span className="font-mono text-xs text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {maskPhone(action.phone_masked)}
                        </span>

                        {getStatusBadge(action.status)}

                        {action.due_date && (
                          <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            Due: {formatDate(action.due_date)}
                          </span>
                        )}
                      </div>

                      {/* Message Content */}
                      {isEditing ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            value={editMessageText}
                            onChange={e => setEditMessageText(e.target.value)}
                            rows={3}
                            className="w-full p-2.5 rounded-lg border border-indigo-300 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-300 font-sans"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 rounded border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(action.id)}
                              className="px-3 py-1 rounded bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
                          {action.message}
                        </div>
                      )}

                      {/* Meta Trace */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Requested by: <span className="text-slate-600 font-medium">{action.requested_by}</span>
                        </span>
                        <span>·</span>
                        <span>{formatDateTime(action.requested_at)}</span>

                        {action.approved_by && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-700 font-medium">
                              Approved by {action.approved_by}
                            </span>
                          </>
                        )}

                        {action.outbox_reference && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-1 rounded text-[10px]">
                              Ref: {action.outbox_reference}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {isPending && !isEditing && (
                    <div className="flex items-center gap-1.5 shrink-0 self-end md:self-start pt-1 md:pt-0">
                      <button
                        onClick={() => handleStartEdit(action)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        title="Edit text"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>

                      <button
                        onClick={() => handleReject(action.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        title="Reject action"
                      >
                        <X className="w-3 h-3" />
                        Reject
                      </button>

                      <button
                        onClick={() => handleApprove(action.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Approve and send"
                      >
                        <Check className="w-3 h-3" />
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
