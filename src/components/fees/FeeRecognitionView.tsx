import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Search,
  Filter,
  Check,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  Printer,
  ShieldCheck,
  QrCode,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatINR, formatDate } from '../../lib/utils';
import { PaymentReconciliation } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const FeeRecognitionView: React.FC = () => {
  const { role, user } = useAuth();
  const { showToast } = useToast();

  const [records, setRecords] = useState<PaymentReconciliation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'unmatched' | 'reconciled'>('all');

  // OCR Upload simulation state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedReceiptPreview, setUploadedReceiptPreview] = useState<string | null>(null);

  // Receipt Modal state
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReconciliation | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getReconciliations();
      setRecords(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load payment reconciliations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReconcile = async (id: string) => {
    try {
      const updated = await api.reconcilePayment(id);
      setRecords(prev => prev.map(r => (r.id === id ? updated : r)));
      showToast(`Payment of ${formatINR(updated.amount)} reconciled & credited to ${updated.matched_student_name}!`, 'success');
      setSelectedReceipt(updated);
    } catch (err: any) {
      showToast(err.message || 'Reconciliation failed', 'error');
    }
  };

  const handleSimulateOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await api.uploadReceiptOcr(file);
      const newRec: PaymentReconciliation = {
        id: `rec_${Date.now()}`,
        utr_number: res.utr_number,
        payer_name: res.payer_name,
        amount: res.amount,
        payment_mode: 'UPI',
        timestamp: new Date().toISOString(),
        matched_student_id: 'std_java_001',
        matched_student_name: 'Aarav Sharma',
        matched_emi_id: 'emi_java_1',
        confidence_score: res.confidence,
        status: 'matched',
        bank_reference: 'HDFC-OCR-DETECTED',
      };
      setRecords(prev => [newRec, ...prev]);
      showToast(`OCR Scan Complete: Matched UTR ${res.utr_number} with ${res.confidence}% confidence`, 'success');
    } catch (err: any) {
      showToast('OCR scan failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch =
      r.payer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.utr_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.matched_student_name && r.matched_student_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalMatched = records.filter(r => r.status === 'matched').reduce((s, r) => s + r.amount, 0);
  const totalReconciled = records.filter(r => r.status === 'reconciled').reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Fee Recognition & UPI Reconciliation
            </h1>
            <Badge variant="purple" size="sm">
              AI Match Engine
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic OCR & bank statement reconciliation against student fee installments with 95%+ confidence match.
          </p>
        </div>

        {/* OCR Upload Button */}
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer shrink-0">
          <Upload className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
          <span>{isUploading ? 'Scanning Receipt...' : 'Upload UPI Receipt / OCR'}</span>
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleSimulateOcrUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Auto-Matched (Pending Settlement)
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{formatINR(totalMatched)}</div>
          <div className="mt-1 text-xs text-slate-400">Ready for 1-click ledger credit</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Reconciled & Settled
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{formatINR(totalReconciled)}</div>
          <div className="mt-1 text-xs text-slate-400">Credited to student ledgers</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Matching Precision
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">97.4%</div>
          <div className="mt-1 text-xs text-slate-400">Payer name + UTR + exact installment match</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
          {(['all', 'matched', 'reconciled', 'unmatched'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
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
            placeholder="Search UTR, payer name, or student..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading payment feeds...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No reconciliation records found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Payment / UTR</th>
                  <th className="py-3 px-4 font-semibold">Payer & Mode</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">AI Matched Student</th>
                  <th className="py-3 px-4 font-semibold">Confidence</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-slate-900">{rec.utr_number}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{rec.bank_reference}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{rec.payer_name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatINR(rec.amount)}
                    </td>

                    <td className="py-3 px-4">
                      {rec.matched_student_name ? (
                        <div>
                          <div className="font-semibold text-indigo-950 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {rec.matched_student_name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            ID: {rec.matched_student_id} • EMI #{rec.matched_emi_id?.slice(-1) || '1'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No exact student found</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              rec.confidence_score >= 90
                                ? 'bg-emerald-500'
                                : rec.confidence_score >= 70
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${rec.confidence_score}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-[11px] text-slate-700">
                          {rec.confidence_score}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {rec.status === 'reconciled' ? (
                        <Badge variant="success" size="sm" dot>
                          RECONCILED
                        </Badge>
                      ) : rec.status === 'matched' ? (
                        <Badge variant="info" size="sm" dot>
                          MATCHED
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm" dot>
                          UNMATCHED
                        </Badge>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {rec.status === 'matched' && (
                        <button
                          onClick={() => handleReconcile(rec.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Reconcile & Settle
                        </button>
                      )}

                      {rec.status === 'reconciled' && (
                        <button
                          onClick={() => setSelectedReceipt(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          View Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Branded Receipt Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title="Official Fee Settlement Receipt"
          description="Generated by Institute Operations Accounts Desk"
          maxWidth="lg"
        >
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-5 text-slate-800">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                    I
                  </div>
                  <span className="font-bold text-base text-slate-900">Institute Operations Desk</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  100% Tax Compliant • Automated UPI Reconciliation
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 font-bold">
                  PAID & VERIFIED
                </span>
                <div className="text-xs font-mono text-slate-400 mt-1">
                  Receipt: REC-2026-{selectedReceipt.id.slice(-4)}
                </div>
              </div>
            </div>

            {/* Receipt Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">STUDENT NAME</span>
                <span className="font-bold text-slate-900 text-sm">{selectedReceipt.matched_student_name}</span>
                <span className="text-slate-500 block font-mono text-[11px]">ID: {selectedReceipt.matched_student_id}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">AMOUNT RECEIVED</span>
                <span className="font-bold text-emerald-700 text-lg">{formatINR(selectedReceipt.amount)}</span>
                <span className="text-slate-500 block text-[11px]">Mode: {selectedReceipt.payment_mode}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">UTR / TRANSACTION HASH</span>
                <span className="font-mono font-semibold text-slate-800 break-all">{selectedReceipt.utr_number}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">PAYMENT DATE</span>
                <span className="font-medium text-slate-800">{new Date(selectedReceipt.timestamp).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Verification Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Audited by Accounts Officer Suresh Iyer</span>
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
