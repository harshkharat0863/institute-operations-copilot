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
          SENT VIA OUTBOX
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
        PENDING REVIEW
      </Badge>
    );
  };

  const pendingItems = actions.filter(a => a.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Outbox Approvals Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Human-in-the-loop review for automated WhatsApp follow-ups, fee recovery notices, and attendance escalations.
          </p>
        </div>

        {statusFilter === 'pending' && pendingItems.length > 0 && (
          <button
            onClick={handleBulkApprove}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs transition-colors shrink-0 disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            Approve Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Filter Tabs and Bulk Select Control */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
          {(['pending', 'sent', 'rejected', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
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
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <label htmlFor="selectAll" className="cursor-pointer font-medium">
              Select all pending ({pendingItems.length})
            </label>
          </div>
        )}
      </div>

      {/* Action Cards List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading queue...
        </div>
      ) : actions.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          No items waiting in the {statusFilter} approvals queue.
        </div>
      ) : (
        <div className="space-y-4">
          {actions.map(action => {
            const isEditing = editingId === action.id;
            const isPending = action.status === 'pending';
            const isSelected = selectedIds.includes(action.id);

            return (
              <div
                key={action.id}
                className={`bg-white rounded-2xl border p-5 transition-all shadow-2xs hover:shadow-xs ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Info */}
                  <div className="flex items-start gap-3 flex-1">
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(action.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-1"
                      />
                    )}

                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">
                          {action.student_name}
                        </span>

                        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {maskPhone(action.phone_masked)}
                        </span>

                        {getStatusBadge(action.status)}

                        {action.due_date && (
                          <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            Due: {formatDate(action.due_date)}
                          </span>
                        )}
                      </div>

                      {/* Message Box (Inline editable) */}
                      {isEditing ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            value={editMessageText}
                            onChange={e => setEditMessageText(e.target.value)}
                            rows={3}
                            className="w-full p-3 rounded-xl border border-indigo-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-200 font-sans"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(action.id)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Save Text
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
                          {action.message}
                        </div>
                      )}

                      {/* Audit Trace info */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Requested by: <strong className="text-slate-600">{action.requested_by}</strong>
                        </span>
                        <span>•</span>
                        <span>{formatDateTime(action.requested_at)}</span>

                        {action.approved_by && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-medium">
                              Approved by: {action.approved_by}
                            </span>
                          </>
                        )}

                        {action.outbox_reference && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
                              Outbox: {action.outbox_reference}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  {isPending && !isEditing && (
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                      <button
                        onClick={() => handleStartEdit(action)}
                        className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Edit Message"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>

                      <button
                        onClick={() => handleReject(action.id)}
                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Reject"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>

                      <button
                        onClick={() => handleApprove(action.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                        title="Approve & Send"
                      >
                        <Check className="w-3.5 h-3.5" />
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
