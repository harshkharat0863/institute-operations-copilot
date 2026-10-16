import React, { useState, useEffect, useMemo } from 'react';
import {
  IndianRupee,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Check,
  Calendar,
  Send,
  ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatDate, formatINR } from '../../lib/utils';
import { EMI } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';

export const FeesView: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [emis, setEmis] = useState<EMI[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'paid' | 'missed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadEmis = async () => {
    setLoading(true);
    try {
      const data = await api.getEmis(statusFilter === 'all' ? undefined : statusFilter);
      setEmis(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load fee ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmis();
  }, [statusFilter]);

  const filteredEmis = useMemo(() => {
    return emis.filter(e => {
      const matchSearch =
        e.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.batch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [emis, searchQuery]);

  // Aggregate metrics
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

    const totalTracked = totalCollected + dueAmount + missedAmount;
    const recoveryRate = totalTracked > 0 ? Math.round((totalCollected / totalTracked) * 100) : 0;

    return { totalCollected, dueAmount, missedAmount, recoveryRate };
  }, [emis]);

  const handleMarkPaid = async (emi: EMI) => {
    try {
      await api.markEmiPaid(emi.id);
      showToast(`Installment marked as paid for ${emi.student_name}`, 'success');
      loadEmis();
    } catch (err: any) {
      showToast(err.message || 'Payment mark failed', 'error');
    }
  };

  const getStatusBadge = (status: EMI['status']) => {
    if (status === 'paid') return <Badge variant="success" size="sm" dot>PAID</Badge>;
    if (status === 'due') return <Badge variant="warning" size="sm" dot>DUE</Badge>;
    return <Badge variant="danger" size="sm" dot>MISSED</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Fees & EMI Collections Desk
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Authorized Accounts & Ownership view. Real-time installment tracking and payment settlement.
        </p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Realized
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {formatINR(summary.totalCollected)}
          </div>
          <div className="mt-1 text-xs text-slate-400">Month-to-date collections</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Dues
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {formatINR(summary.dueAmount)}
          </div>
          <div className="mt-1 text-xs text-slate-400">Scheduled in current billing window</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Missed / Overdue
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {formatINR(summary.missedAmount)}
          </div>
          <div className="mt-1 text-xs text-slate-400">Requires counseling / follow-up</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recovery Health
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{summary.recoveryRate}%</div>
          <div className="mt-1 text-xs text-slate-400">Above benchmark rate of 78%</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
          {(['all', 'due', 'paid', 'missed'] as const).map(tab => (
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

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidate, cohort, EMI ID..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* EMI Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading installment ledger...
          </div>
        ) : filteredEmis.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No EMI installments found for current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Cohort Batch</th>
                  <th className="py-3 px-4 font-semibold">Installment</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Due Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmis.map(emi => (
                  <tr key={emi.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{emi.student_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{emi.id}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {emi.batch_name}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-600">
                        #{emi.installment_no} of {emi.total_installments}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatINR(emi.amount)}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {formatDate(emi.due_date)}
                    </td>

                    <td className="py-3 px-4">
                      {getStatusBadge(emi.status)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {emi.status !== 'paid' ? (
                        <button
                          onClick={() => handleMarkPaid(emi)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Settled ({formatDate(emi.paid_date)})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
