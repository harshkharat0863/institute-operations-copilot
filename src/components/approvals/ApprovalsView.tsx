import React, { useState, useEffect, useCallback } from 'react';
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
  AlertTriangle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatDate, maskPhone } from '../../lib/utils';
import { ActionItem } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';
import { PageHeader } from '../common/PageHeader';
import { Button } from '../common/Button';
import { Skeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { AuditView } from '../audit/AuditView';

interface ApprovalsViewProps {
  initialTab?: 'queue' | 'audit';
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({ initialTab = 'queue' }) => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'queue' | 'audit'>(initialTab);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const loadActions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getActions(statusFilter === 'all' ? undefined : statusFilter);
      setActions(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load approvals queue';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    if (activeTab === 'queue') {
      loadActions();
    }
  }, [activeTab, loadActions]);

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
      const updated = await api.approveAction(id, user?.name || 'Staff Member');
      showToast(`Reminder for ${updated.student_name} approved and queued`, 'success');
      loadActions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve action';
      showToast(msg, 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const updated = await api.rejectAction(id, user?.name || 'Staff Member');
      showToast(`Reminder for ${updated.student_name} rejected`, 'warning');
      loadActions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject action';
      showToast(msg, 'error');
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update message';
      showToast(msg, 'error');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      await api.bulkApproveActions(selectedIds, user?.name || 'Staff Lead');
      showToast(`Approved ${selectedIds.length} reminders`, 'success');
      setSelectedIds([]);
      loadActions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bulk approval failed';
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals & Audit"
        description="Review student reminders, verify message drafts, and review query logs."
        badge={
          <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-[6px] border border-border">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-surface text-text border border-border shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Approval Queue
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-surface text-text border border-border shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Audit Trail
            </button>
          </div>
        }
      />

      {/* TAB 2: AUDIT TRAIL */}
      {activeTab === 'audit' ? (
        <AuditView />
      ) : (
        /* TAB 1: APPROVAL QUEUE */
        <div className="space-y-5">
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
                onClick={loadActions}
                icon={<RefreshCw className="w-3 h-3" strokeWidth={1.5} />}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Filter and Bulk Action Bar */}
          <div className="bg-surface p-3 sm:p-3.5 rounded-[8px] border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-[6px] border border-border overflow-x-auto">
              {(['pending', 'sent', 'rejected', 'all'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 sm:py-1 rounded-[4px] text-xs font-medium capitalize transition-colors cursor-pointer min-h-[38px] sm:min-h-0 ${
                    statusFilter === tab
                      ? 'bg-surface text-text border border-border shadow-xs'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {statusFilter === 'pending' && actions.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedIds.length === actions.filter(a => a.status === 'pending').length
                    ? 'Deselect all'
                    : 'Select all'}
                </Button>

                {selectedIds.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleBulkApprove}
                    isLoading={isProcessing}
                    icon={<CheckCheck className="w-3.5 h-3.5" strokeWidth={1.5} />}
                  >
                    Approve selected ({selectedIds.length})
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Action List Container */}
          {loading ? (
            <div className="space-y-3">
              <Skeleton variant="card" className="h-28" />
              <Skeleton variant="card" className="h-28" />
              <Skeleton variant="card" className="h-28" />
            </div>
          ) : actions.length === 0 ? (
            <div className="bg-surface rounded-[8px] border border-border p-8">
              <EmptyState
                title="Queue is empty"
                description={`No ${statusFilter === 'all' ? '' : statusFilter} reminder drafts found.`}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {actions.map(action => {
                const isSelected = selectedIds.includes(action.id);
                const isEditing = editingId === action.id;

                return (
                  <div
                    key={action.id}
                    className={`bg-surface rounded-[8px] border p-4 transition-colors ${
                      isSelected ? 'border-accent bg-accent-subtle/20' : 'border-border'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        {action.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(action.id)}
                            className="w-4 h-4 rounded text-accent focus:ring-accent border-border mt-0.5 cursor-pointer"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text text-sm">
                              {action.student_name}
                            </span>
                            <span className="text-xs text-text-muted font-mono">
                              ({maskPhone(action.phone_masked)})
                            </span>
                            {getStatusBadge(action.status)}
                          </div>
                          <div className="text-[11px] text-text-subtle mt-0.5 flex items-center gap-2">
                            <span>Requested by {action.requested_by}</span>
                            <span>•</span>
                            <span className="tabular-nums">Due: {formatDate(action.due_date)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        {action.status === 'pending' && (
                          <>
                            {!isEditing && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleStartEdit(action)}
                                icon={<Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />}
                              >
                                Edit
                              </Button>
                            )}
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleReject(action.id)}
                              icon={<X className="w-3.5 h-3.5" strokeWidth={1.5} />}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApprove(action.id)}
                              icon={<Check className="w-3.5 h-3.5" strokeWidth={1.5} />}
                            >
                              Approve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Message Body or Edit Box */}
                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={editMessageText}
                          onChange={e => setEditMessageText(e.target.value)}
                          rows={3}
                          className="w-full p-2.5 rounded-[6px] border border-border bg-surface text-text text-xs focus:border-accent"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSaveEdit(action.id)}
                            icon={<Save className="w-3.5 h-3.5" strokeWidth={1.5} />}
                          >
                            Save message
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-surface-subtle rounded-[6px] border border-border text-xs text-text leading-relaxed font-mono">
                        {action.message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
