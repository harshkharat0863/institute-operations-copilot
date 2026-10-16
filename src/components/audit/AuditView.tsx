import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Terminal,
  Code,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { AuditLogEntry, QueryLogEntry } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';
import { Modal } from '../common/Modal';

export const AuditView: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'audit' | 'queries'>('queries');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [queryLogs, setQueryLogs] = useState<QueryLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedSql, setSelectedSql] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const [aud, ql] = await Promise.all([api.getAudit(), api.getQueryLog()]);
      setAuditLogs(aud);
      setQueryLogs(ql);
    } catch (err: any) {
      showToast(err.message || 'Failed to retrieve logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredQueries = useMemo(() => {
    return queryLogs.filter(q => {
      const matchRole = roleFilter === 'all' || q.role === roleFilter;
      const matchSearch =
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.sql.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.blocked_reason && q.blocked_reason.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchRole && matchSearch;
    });
  }, [queryLogs, roleFilter, searchQuery]);

  const filteredAudit = useMemo(() => {
    return auditLogs.filter(a => {
      const matchRole = roleFilter === 'all' || a.role === roleFilter;
      const matchSearch =
        a.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.details.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [auditLogs, roleFilter, searchQuery]);

  const handleCopySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    showToast('SQL copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Governance, Security & Query Audit
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Owner & Compliance clearance. Every natural-language inquiry, generated SQL, role clearance check, and outbox approval is immutably logged.
        </p>
      </div>

      {/* Tabs & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveTab('queries')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'queries'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Copilot Query Log ({queryLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'audit'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Platform Audit Trail ({auditLogs.length})
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search statements or users..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="counselor">Counselor</option>
            <option value="trainer">Trainer</option>
            <option value="accounts">Accounts</option>
          </select>
        </div>
      </div>

      {/* Tab 1: Copilot Query Log */}
      {activeTab === 'queries' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading query events...
            </div>
          ) : filteredQueries.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No queries match your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">Caller Role</th>
                    <th className="py-3 px-4 font-semibold">Question Asked</th>
                    <th className="py-3 px-4 font-semibold">Generated SQL</th>
                    <th className="py-3 px-4 font-semibold">Status & Layer</th>
                    <th className="py-3 px-4 font-semibold">Rows</th>
                    <th className="py-3 px-4 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueries.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {formatDateTime(q.timestamp)}
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            q.role === 'owner'
                              ? 'purple'
                              : q.role === 'trainer'
                              ? 'success'
                              : q.role === 'counselor'
                              ? 'info'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {q.role.toUpperCase()}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">
                        {q.question}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedSql(q.sql)}
                          className="flex items-center gap-1 font-mono text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                        >
                          <Code className="w-3 h-3" />
                          View SQL
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        {q.status === 'ok' ? (
                          <Badge variant="success" size="sm" dot>
                            OK
                          </Badge>
                        ) : q.status === 'blocked' ? (
                          <div className="space-y-0.5">
                            <Badge variant="danger" size="sm" dot>
                              BLOCKED
                            </Badge>
                            {q.blocked_layer && (
                              <div className="text-[10px] text-rose-600 font-mono">
                                {q.blocked_layer}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <Badge variant="warning" size="sm" dot>
                              PARTIAL
                            </Badge>
                            {q.blocked_layer && (
                              <div className="text-[10px] text-amber-600 font-mono">
                                {q.blocked_layer}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {q.row_count}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500">
                        {q.duration_ms}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Platform Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading audit records...
            </div>
          ) : filteredAudit.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No audit entries recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Action</th>
                    <th className="py-3 px-4 font-semibold">Target Resource</th>
                    <th className="py-3 px-4 font-semibold">Details</th>
                    <th className="py-3 px-4 font-semibold">Origin IP</th>
                    <th className="py-3 px-4 font-semibold">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAudit.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {formatDateTime(a.timestamp)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{a.user_name}</div>
                        <span className="text-[10px] text-slate-400 capitalize">{a.role}</span>
                      </td>

                      <td className="py-3 px-4 font-mono text-indigo-700 font-medium">
                        {a.action}
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {a.target}
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-sm">
                        {a.details}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {a.ip_address}
                      </td>

                      <td className="py-3 px-4">
                        {a.status === 'success' ? (
                          <Badge variant="success" size="sm">
                            SUCCESS
                          </Badge>
                        ) : a.status === 'blocked' ? (
                          <Badge variant="danger" size="sm">
                            BLOCKED
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            WARNING
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SQL Inspection Modal */}
      {selectedSql && (
        <Modal
          isOpen={!!selectedSql}
          onClose={() => setSelectedSql(null)}
          title="Generated SQL Statement"
          description="Raw AST synthesized by Copilot under role-restricted view schemas"
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="relative">
              <pre className="p-4 bg-slate-950 text-indigo-200 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {selectedSql}
              </pre>

              <button
                onClick={() => handleCopySql(selectedSql)}
                className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSql(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
