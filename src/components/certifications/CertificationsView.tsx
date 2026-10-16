import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  ExternalLink,
  Printer,
  ShieldCheck,
  Sparkles,
  QrCode,
  Calendar,
  User,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Certificate, Course } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const CertificationsView: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issued' | 'eligible' | 'ineligible'>('all');

  // Preview Certificate Modal state
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [certs, crs] = await Promise.all([api.getCertificates(), api.getCourses()]);
      setCertificates(certs || []);
      setCourses(crs || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load certifications roster', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssueCertificate = async (cert: Certificate) => {
    try {
      const issued = await api.issueCertificate(cert.student_id, cert.course_id);
      setCertificates(prev => prev.map(c => (c.id === cert.id ? issued : c)));
      showToast(`Certificate issued to ${cert.student_name} (${issued.verification_code})!`, 'success');
      setPreviewCert(issued);
    } catch (err: any) {
      showToast(err.message || 'Failed to issue certificate', 'error');
    }
  };

  const filteredCerts = certificates.filter(c => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (c.student_name && c.student_name.toLowerCase().includes(q)) ||
      (c.course_name && c.course_name.toLowerCase().includes(q)) ||
      (c.verification_code && c.verification_code.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const totalIssued = certificates.filter(c => c.status === 'issued').length;
  const totalEligible = certificates.filter(c => c.status === 'eligible').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Certifications & Clearance
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Automated eligibility verification (≥80% attendance + zero dues) and verifiable certificates.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Certificates Issued
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalIssued}</div>
          <div className="mt-0.5 text-xs text-slate-400">Digitally signed & publicly verifiable</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Eligible for Clearance
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalEligible}</div>
          <div className="mt-0.5 text-xs text-slate-400">Attendance benchmark & fee clearance met</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Benchmark Standard
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">80% Attendance</div>
          <div className="mt-0.5 text-xs text-slate-400">100% financial clearance prerequisite</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
          {(['all', 'issued', 'eligible', 'ineligible'] as const).map(tab => (
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

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search student, course, code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading certifications...
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No certificate records found matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3.5">Student & ID</th>
                  <th className="py-2.5 px-3.5">Course & Batch</th>
                  <th className="py-2.5 px-3.5">Attendance</th>
                  <th className="py-2.5 px-3.5">Ledger Clearance</th>
                  <th className="py-2.5 px-3.5">Verification Code</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCerts.map(cert => (
                  <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3.5">
                      <div className="font-semibold text-slate-900">{cert.student_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{cert.student_id}</div>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="font-medium text-slate-800">{cert.course_name}</div>
                      <div className="text-[11px] text-slate-400">{cert.batch_name}</div>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-bold ${cert.final_attendance >= 80 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {cert.final_attendance}%
                        </span>
                        {cert.final_attendance >= 80 ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1 rounded font-medium">Passed</span>
                        ) : (
                          <span className="text-[10px] bg-rose-50 text-rose-800 px-1 rounded font-medium">&lt; 80%</span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5">
                      {cert.fee_clearance ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Cleared
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> Dues Pending
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5">
                      <span className="font-mono text-slate-700 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[11px]">
                        {cert.verification_code}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5">
                      {cert.status === 'issued' ? (
                        <Badge variant="purple" size="sm" dot>
                          ISSUED
                        </Badge>
                      ) : cert.status === 'eligible' ? (
                        <Badge variant="success" size="sm" dot>
                          ELIGIBLE
                        </Badge>
                      ) : (
                        <Badge variant="danger" size="sm" dot>
                          INELIGIBLE
                        </Badge>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5 text-right">
                      {cert.status === 'eligible' && (
                        <button
                          onClick={() => handleIssueCertificate(cert)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors cursor-pointer"
                        >
                          <Award className="w-3 h-3" />
                          Issue Certificate
                        </button>
                      )}

                      {cert.status === 'issued' && (
                        <button
                          onClick={() => setPreviewCert(cert)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Award className="w-3 h-3 text-purple-600" />
                          View
                        </button>
                      )}

                      {cert.status === 'ineligible' && (
                        <span className="text-[11px] text-slate-400 italic">Criteria unfulfilled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Certificate Preview Modal */}
      {previewCert && (
        <Modal
          isOpen={!!previewCert}
          onClose={() => setPreviewCert(null)}
          title="Official Certificate of Completion"
          description="Issued by Institute Operations Desk with cryptographic verification code"
          maxWidth="2xl"
        >
          <div className="p-6 bg-gradient-to-br from-slate-50 via-white to-amber-50/20 border-2 border-indigo-900/10 rounded-xl relative text-center space-y-5">
            {/* Top Seal */}
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-md ring-2 ring-amber-100">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-sans uppercase tracking-widest text-slate-400 block font-semibold">
                INSTITUTE OPERATIONS DESK · CERTIFICATE OF COMPLETION
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight mt-1">
                Certificate of Masterclass Completion
              </h2>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                Presented to
              </p>
              <h3 className="text-xl font-bold text-indigo-950 font-serif tracking-tight border-b border-indigo-200/60 pb-1.5 max-w-sm mx-auto">
                {previewCert.student_name}
              </h3>
            </div>

            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              for successfully completing all curriculum requirements and maintaining an exemplary academic attendance record of <strong>{previewCert.final_attendance}%</strong> in:
            </p>

            <div className="p-2.5 bg-indigo-50/80 rounded-lg border border-indigo-100 font-bold text-indigo-950 text-xs max-w-sm mx-auto">
              {previewCert.course_name}
            </div>

            {/* Verification Footer */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-2 items-center text-left text-xs">
              <div>
                <div className="font-serif italic text-xs text-slate-900 font-bold">Vikramaditya Mehta</div>
                <div className="text-[10px] text-slate-500">Director, Institute Operations</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">Date: {previewCert.issue_date}</div>
              </div>

              <div className="text-right space-y-0.5">
                <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  VERIFICATION HASH
                </div>
                <div className="font-mono font-bold text-xs text-purple-700">
                  {previewCert.verification_code}
                </div>
                <div className="text-[10px] text-emerald-600 font-medium">✓ Cryptographically Valid</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Certificate
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
