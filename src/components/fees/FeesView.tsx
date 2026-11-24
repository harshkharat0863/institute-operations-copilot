import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  IndianRupee,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Check,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  CreditCard,
  FileText,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatINR, formatDate } from '../../lib/utils';
import { EMI } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Drawer } from '../common/Drawer';
import { Skeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { FeeRecognitionView } from './FeeRecognitionView';

interface FeesViewProps {
  initialTab?: 'installments' | 'reconciliation';
}

export const FeesView: React.FC<FeesViewProps> = ({ initialTab = 'installments' }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'installments' | 'reconciliation'>(initialTab);
  const [emis, setEmis] = useState<EMI[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'paid' | 'missed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const pageSize = 25;

  // Drawer & Settle Confirmation
  const [selectedEmi, setSelectedEmi] = useState<EMI | null>(null);
  const [emiToSettle, setEmiToSettle] = useState<EMI | null>(null);
  const [isSettling, setIsSettling] = useState<boolean>(false);

  const loadEmis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEmis();
      setEmis(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load EMI records';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab === 'installments') {
      loadEmis();
    }
  }, [activeTab, loadEmis]);

  const summary = useMemo(() => {
    const totalCollected = emis
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0);

    const dueAmount = emis
      .filter(e => e.status === 'due')
      .reduce((sum, e) => sum + e.amount, 0);

    const missedAmount = emis
      .filter(e => e.status === 'missed')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpected = totalCollected + dueAmount + missedAmount;
    const recoveryRate = totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : '0';

    return { totalCollected, dueAmount, missedAmount, recoveryRate };
  }, [emis]);

  const filteredEmis = useMemo(() => {
    return emis.filter(emi => {
      const matchesStatus = statusFilter === 'all' || emi.status === statusFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        emi.student_name.toLowerCase().includes(query) ||
        emi.batch_name.toLowerCase().includes(query) ||
        emi.id.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [emis, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredEmis.length / pageSize) || 1;
  const paginatedEmis = filteredEmis.slice(page * pageSize, (page + 1) * pageSize);

  const handleConfirmSettle = async () => {
    if (!emiToSettle) return;
    setIsSettling(true);
    try {
      await api.markEmiPaid(emiToSettle.id);
      showToast(
        `Payment of ${formatINR(emiToSettle.amount)} recorded for ${emiToSettle.student_name}`,
        'success'
      );
      setEmiToSettle(null);
      if (selectedEmi?.id === emiToSettle.id) {
        setSelectedEmi(prev => (prev ? { ...prev, status: 'paid', paid_date: new Date().toISOString() } : null));
      }
      loadEmis();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record payment';
      showToast(msg, 'error');
    } finally {
      setIsSettling(false);
    }
  };

  const getStatusBadge = (status: EMI['status']) => {
    if (status === 'paid') return <Badge variant="success" size="sm" dot>PAID</Badge>;
    if (status === 'due') return <Badge variant="warning" size="sm" dot>DUE</Badge>;
    return <Badge variant="danger" size="sm" dot>MISSED</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fees & Payments"
        description="Student installment schedules, settlement records, and payment reconciliation."
        badge={
          <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-[6px] border border-border">
            <button
              onClick={() => setActiveTab('installments')}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'installments'
                  ? 'bg-surface text-text border border-border shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Installments
            </button>
            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'reconciliation'
                  ? 'bg-surface text-text border border-border shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Reconciliation
            </button>
          </div>
        }
      />

      {/* TAB 2: RECONCILIATION */}
      {activeTab === 'reconciliation' ? (
        <FeeRecognitionView />
      ) : (
        /* TAB 1: INSTALLMENTS */
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
                onClick={loadEmis}
                icon={<RefreshCw className="w-3 h-3" strokeWidth={1.5} />}
              >
                Retry
              </Button>
            </div>
          )}

          {/* 4 Summary Cards */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Skeleton variant="card" className="h-24" />
              <Skeleton variant="card" className="h-24" />
              <Skeleton variant="card" className="h-24" />
              <Skeleton variant="card" className="h-24" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                label="Total Collected"
                value={formatINR(summary.totalCollected)}
                subtext="Realized payments"
                trend={{ value: 'Realized', positive: true }}
                icon={<CheckCircle className="w-4 h-4 text-status-green" strokeWidth={1.5} />}
              />

              <StatCard
                label="Upcoming Dues"
                value={formatINR(summary.dueAmount)}
                subtext="Current payment window"
                trend={{ value: 'Active schedule', neutral: true }}
                icon={<Clock className="w-4 h-4 text-status-amber" strokeWidth={1.5} />}
              />

              <StatCard
                label="Overdue"
                value={formatINR(summary.missedAmount)}
                subtext="Requires follow-up"
                trend={{ value: 'Needs attention', positive: false }}
                icon={<AlertTriangle className="w-4 h-4 text-status-red" strokeWidth={1.5} />}
              />

              <StatCard
                label="Collection Rate"
                value={`${summary.recoveryRate}%`}
                subtext="Target recovery: 80%"
                trend={{ value: `${summary.recoveryRate}%`, positive: Number(summary.recoveryRate) >= 80 }}
                icon={<TrendingUp className="w-4 h-4 text-accent" strokeWidth={1.5} />}
              />
            </div>
          )}

          {/* Filter and Search Bar */}
          <div className="bg-surface p-3 sm:p-3.5 rounded-[8px] border border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-[6px] border border-border overflow-x-auto">
              {(['all', 'due', 'paid', 'missed'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setStatusFilter(tab);
                    setPage(0);
                  }}
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

            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 text-text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Search candidate, batch, EMI ID..."
                className="w-full pl-9 pr-3 py-2 sm:py-1.5 text-xs rounded-[6px] border border-border bg-surface text-text focus:border-accent"
              />
            </div>
          </div>

          {/* EMI Ledger Container */}
          <div className="bg-surface rounded-[8px] border border-border overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                <Skeleton variant="text" className="h-10" />
                <Skeleton variant="text" className="h-10" />
                <Skeleton variant="text" className="h-10" />
              </div>
            ) : filteredEmis.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No installments found"
                  description="No installment records match your current status filter or search parameters."
                />
              </div>
            ) : (
              <>
                {/* 1. MOBILE VIEW (< 640px): Stacked Cards */}
                <div className="sm:hidden divide-y divide-border">
                  {paginatedEmis.map(emi => (
                    <div
                      key={emi.id}
                      onClick={() => setSelectedEmi(emi)}
                      className="p-3.5 space-y-2 text-xs cursor-pointer hover:bg-surface-subtle/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-text text-sm">{emi.student_name}</div>
                          <div className="text-[11px] text-text-muted mt-0.5">{emi.batch_name}</div>
                        </div>
                        {getStatusBadge(emi.status)}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                        <div>
                          <span className="text-[10px] text-text-subtle uppercase">Amount: </span>
                          <span className="font-semibold text-text tabular-nums">{formatINR(emi.amount)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-text-subtle uppercase">Due: </span>
                          <span className="text-text-muted tabular-nums">{formatDate(emi.due_date)}</span>
                        </div>
                      </div>

                      {emi.status !== 'paid' && (
                        <div className="pt-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            onClick={e => {
                              e.stopPropagation();
                              setEmiToSettle(emi);
                            }}
                            icon={<Check className="w-3.5 h-3.5 text-status-green" strokeWidth={1.5} />}
                          >
                            Mark as paid
                          </Button>
                        </div>
                      )}
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
                        <th className="py-2.5 px-3.5 font-medium">Batch</th>
                        <th className="py-2.5 px-3.5 font-medium">Installment</th>
                        <th className="py-2.5 px-3.5 font-medium">Amount</th>
                        <th className="py-2.5 px-3.5 font-medium">Due Date</th>
                        <th className="py-2.5 px-3.5 font-medium">Status</th>
                        <th className="py-2.5 px-3.5 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedEmis.map(emi => (
                        <tr key={emi.id} className="hover:bg-surface-subtle/50 transition-colors text-text">
                          <td
                            onClick={() => setSelectedEmi(emi)}
                            className="py-2.5 px-3.5 sticky left-0 bg-surface z-10 border-r border-border cursor-pointer group"
                          >
                            <div className="font-medium text-text group-hover:text-accent transition-colors">
                              {emi.student_name}
                            </div>
                            <div className="text-[10px] text-text-subtle font-mono">{emi.id}</div>
                          </td>

                          <td className="py-2.5 px-3.5 text-text-muted">
                            {emi.batch_name}
                          </td>

                          <td className="py-2.5 px-3.5 font-mono text-text-muted">
                            #{emi.installment_no} of {emi.total_installments}
                          </td>

                          <td className="py-2.5 px-3.5 font-medium text-text">
                            {formatINR(emi.amount)}
                          </td>

                          <td className="py-2.5 px-3.5 text-text-muted">
                            {formatDate(emi.due_date)}
                          </td>

                          <td className="py-2.5 px-3.5">
                            {getStatusBadge(emi.status)}
                          </td>

                          <td className="py-2.5 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setSelectedEmi(emi)}
                                className="p-1.5 rounded-[4px] text-text-muted hover:text-text hover:bg-surface-subtle cursor-pointer"
                                title="View details"
                              >
                                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                              </button>
                              {emi.status !== 'paid' ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setEmiToSettle(emi)}
                                  icon={<Check className="w-3 h-3 text-status-green" strokeWidth={1.5} />}
                                >
                                  Mark as paid
                                </Button>
                              ) : (
                                <span className="text-[11px] text-text-subtle font-mono px-2">
                                  Settled
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Pagination (25 per page) */}
            {!loading && filteredEmis.length > 0 && (
              <div className="p-3 border-t border-border bg-surface-subtle/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
                <div>
                  Showing{' '}
                  <span className="font-semibold text-text tabular-nums">{page * pageSize + 1}</span> to{' '}
                  <span className="font-semibold text-text tabular-nums">
                    {Math.min((page + 1) * pageSize, filteredEmis.length)}
                  </span>{' '}
                  of <span className="font-semibold text-text tabular-nums">{filteredEmis.length}</span> installments
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-2.5 py-1 rounded-[4px] border border-border bg-surface text-text disabled:opacity-40 hover:bg-surface-subtle font-medium cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-mono text-[11px] text-text-subtle">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-2.5 py-1 rounded-[4px] border border-border bg-surface text-text disabled:opacity-40 hover:bg-surface-subtle font-medium cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Drawer for Installment Details */}
          <Drawer
            isOpen={!!selectedEmi}
            onClose={() => setSelectedEmi(null)}
            title={selectedEmi?.student_name}
            description={selectedEmi?.batch_name}
            footer={
              selectedEmi && selectedEmi.status !== 'paid' ? (
                <div className="flex justify-end w-full">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const e = selectedEmi;
                      setSelectedEmi(null);
                      setEmiToSettle(e);
                    }}
                    icon={<Check className="w-3.5 h-3.5" strokeWidth={1.5} />}
                  >
                    Mark as paid
                  </Button>
                </div>
              ) : undefined
            }
          >
            {selectedEmi && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-surface-subtle rounded-[6px] border border-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-subtle uppercase">Installment ID</span>
                    <div className="font-mono font-medium text-text">{selectedEmi.id}</div>
                  </div>
                  {getStatusBadge(selectedEmi.status)}
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-text uppercase tracking-wider">
                    Installment details
                  </h4>
                  <div className="p-3 bg-surface-subtle rounded-[6px] border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Student name</span>
                      <span className="font-medium text-text">{selectedEmi.student_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Batch cohort</span>
                      <span className="text-text">{selectedEmi.batch_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Installment sequence</span>
                      <span className="font-mono text-text">
                        #{selectedEmi.installment_no} of {selectedEmi.total_installments}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Due date</span>
                      <span className="text-text tabular-nums">{formatDate(selectedEmi.due_date)}</span>
                    </div>
                    {selectedEmi.paid_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Paid on</span>
                        <span className="text-status-green tabular-nums">{formatDate(selectedEmi.paid_date)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-text uppercase tracking-wider">
                    Amount & Settlement
                  </h4>
                  <div className="p-3 bg-surface-subtle rounded-[6px] border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Installment amount</span>
                      <span className="font-semibold text-text text-sm tabular-nums">
                        {formatINR(selectedEmi.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Payment status</span>
                      <span>{getStatusBadge(selectedEmi.status)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Drawer>

          {/* Settle Payment Confirmation Modal */}
          <Modal
            isOpen={!!emiToSettle}
            onClose={() => setEmiToSettle(null)}
            title="Mark installment as paid"
            description="Record a settlement receipt for this candidate's installment."
          >
            <div className="space-y-4 pt-1">
              <div className="p-3 bg-surface-subtle border border-border rounded-[6px] text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-text-muted">Candidate:</span>
                  <span className="font-semibold text-text">{emiToSettle?.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Batch:</span>
                  <span className="text-text">{emiToSettle?.batch_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Amount:</span>
                  <span className="font-semibold text-text tabular-nums">{emiToSettle && formatINR(emiToSettle.amount)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEmiToSettle(null)}
                  disabled={isSettling}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isSettling}
                  onClick={handleConfirmSettle}
                  icon={<Check className="w-3.5 h-3.5" strokeWidth={1.5} />}
                >
                  Confirm payment
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
};
