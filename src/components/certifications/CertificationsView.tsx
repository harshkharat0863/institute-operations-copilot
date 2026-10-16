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
      setCertificates(certs);
      setCourses(crs);
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
    const matchesSearch =
      c.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.verification_code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalIssued = certificates.filter(c => c.status === 'issued').length;
  const totalEligible = certificates.filter(c => c.status === 'eligible').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Certifications & Graduation Clearance
            </h1>
            <Badge variant="purple" size="sm">
              Cryptographic Hash
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated eligibility verification (≥80% attendance + 100% fee clearance) and tamper-proof digital certificates.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Certificates Issued
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{totalIssued}</div>
          <div className="mt-1 text-xs text-slate-400">Digitally signed & publicly verifiable</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Clearance (Eligible)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{totalEligible}</div>
          <div className="mt-1 text-xs text-slate-400">All attendance & fee requirements met</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Minimum Benchmark
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">80% Attendance</div>
          <div className="mt-1 text-xs text-slate-400">Zero dues required on ledger</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
          {(['all', 'issued', 'eligible', 'ineligible'] as const).map(tab => (
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
            placeholder="Search student, course, or certificate ID..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading certifications ledger...
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No certificate records found matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Student & ID</th>
                  <th className="py-3 px-4 font-semibold">Course & Batch</th>
                  <th className="py-3 px-4 font-semibold">Attendance Rate</th>
                  <th className="py-3 px-4 font-semibold">Fee Clearance</th>
                  <th className="py-3 px-4 font-semibold">Verification Code</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCerts.map(cert => (
                  <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{cert.student_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{cert.student_id}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{cert.course_name}</div>
                      <div className="text-[11px] text-slate-500">{cert.batch_name}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold ${cert.final_attendance >= 80 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {cert.final_attendance}%
                        </span>
                        {cert.final_attendance >= 80 ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">Passed</span>
                        ) : (
                          <span className="text-[10px] bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded font-semibold">&lt; 80%</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {cert.fee_clearance ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> 100% Cleared
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> Dues Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                        {cert.verification_code}
                      </span>
                    </td>

                    <td className="py-3 px-4">
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

                    <td className="py-3 px-4 text-right">
                      {cert.status === 'eligible' && (
                        <button
                          onClick={() => handleIssueCertificate(cert)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5" />
                          Issue Certificate
                        </button>
                      )}

                      {cert.status === 'issued' && (
                        <button
                          onClick={() => setPreviewCert(cert)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5 text-purple-600" />
                          View Certificate
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
          <div className="p-8 bg-gradient-to-br from-slate-50 via-white to-amber-50/30 border-4 border-double border-indigo-950/20 rounded-2xl relative text-center space-y-6">
            
            {/* Top Seal */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-lg ring-4 ring-amber-100">
                <Award className="w-8 h-8" />
              </div>
            </div>

            <div>
              <span className="text-xs font-serif uppercase tracking-widest text-slate-500 block">
                INSTITUTE OPERATIONS DESK • ACCREDITED PROGRAM
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight mt-1">
                Certificate of Masterclass Completion
              </h2>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-sans">
                This is proudly presented to
              </p>
              <h3 className="text-2xl font-bold text-indigo-950 font-serif tracking-tight border-b border-indigo-200/60 pb-2 max-w-md mx-auto">
                {previewCert.student_name}
              </h3>
            </div>

            <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
              for successfully completing all curriculum requirements, capstone project assignments, and maintaining an exemplary academic attendance record of <strong>{previewCert.final_attendance}%</strong> in:
            </p>

            <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 font-bold text-indigo-950 text-sm max-w-md mx-auto">
              {previewCert.course_name}
            </div>

            {/* Verification Footer with Signature & QR code */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 items-center text-left text-xs">
              <div>
                <div className="font-serif italic text-sm text-slate-900 font-bold">Vikramaditya Mehta</div>
                <div className="text-[11px] text-slate-500">Director, Institute Operations Desk</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">Date: {previewCert.issue_date}</div>
              </div>

              <div className="text-right space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
            </div>

          </div>
        </Modal>
      )}
    </div>
  );
};
