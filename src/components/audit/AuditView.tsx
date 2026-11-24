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
      setAuditLogs(aud || []);
      setQueryLogs(ql || []);
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
    const q = (searchQuery || '').toLowerCase();
    return queryLogs.filter(item => {
      const matchRole = roleFilter === 'all' || item.role === roleFilter;
      const matchSearch =
        (item.question && item.question.toLowerCase().includes(q)) ||
        (item.sql && item.sql.toLowerCase().includes(q)) ||
        (item.blocked_reason && item.blocked_reason.toLowerCase().includes(q));
      return matchRole && matchSearch;
    });
  }, [queryLogs, roleFilter, searchQuery]);

  const filteredAudit = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    return auditLogs.filter(a => {
      const matchRole = roleFilter === 'all' || a.role === roleFilter;
      const matchSearch =
        (a.action && a.action.toLowerCase().includes(q)) ||
        (a.user_name && a.user_name.toLowerCase().includes(q)) ||
        (a.details && a.details.toLowerCase().includes(q));
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
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
          Audit & Query Log
        </h1>
        <p className="text-xs text-text-muted mt-0.5">
          Immutable governance record. Every natural-language inquiry, generated SQL, and role access check is tracked.
        </p>
      </div>

      {/* Tabs & Controls */}
      <div className="bg-surface p-3 rounded-[6px] border border-border  flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-0.5 rounded-[6px] bg-surface-muted border border-border/60">
          <button
            onClick={() => setActiveTab('queries')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'queries'
                ? 'bg-surface text-text  font-semibold'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Copilot Queries ({queryLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-surface text-text  font-semibold'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Audit Trail ({auditLogs.length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-text-subtle absolute left-3 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search statements or users..."
              className="w-full pl-9 pr-3 py-1 text-xs rounded-[6px] border border-border focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-[6px] border border-border bg-surface font-medium text-text-muted"
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
        <div className="bg-surface rounded-[6px] border border-border  overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-text-subtle text-sm">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading query log...
            </div>
          ) : filteredQueries.length === 0 ? (
            <div className="p-12 text-center text-text-muted text-sm">
              No queries match criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-surface-subtle border-b border-border text-text-muted font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3.5">Timestamp</th>
                    <th className="py-2.5 px-3.5">Role</th>
                    <th className="py-2.5 px-3.5">Question Asked</th>
                    <th className="py-2.5 px-3.5">Generated SQL</th>
                    <th className="py-2.5 px-3.5">Status & Guard</th>
                    <th className="py-2.5 px-3.5">Rows</th>
                    <th className="py-2.5 px-3.5">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueries.map(q => (
                    <tr key={q.id} className="hover:bg-surface-subtle/70 transition-colors">
                      <td className="py-2.5 px-3.5 text-text-muted font-mono text-[11px] whitespace-nowrap">
                        {formatDateTime(q.timestamp)}
                      </td>

                      <td className="py-2.5 px-3.5">
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

                      <td className="py-2.5 px-3.5 font-medium text-text max-w-xs truncate">
                        {q.question}
                      </td>

                      <td className="py-2.5 px-3.5">
                        <button
                          onClick={() => setSelectedSql(q.sql)}
                          className="flex items-center gap-1 font-mono text-[11px] text-accent bg-accent-subtle border border-indigo-100 px-2 py-0.5 rounded hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                          <Code className="w-3 h-3" />
                          SQL
                        </button>
                      </td>

                      <td className="py-2.5 px-3.5">
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

                      <td className="py-2.5 px-3.5 font-mono text-text-muted">
                        {q.row_count}
                      </td>

                      <td className="py-2.5 px-3.5 font-mono text-text-muted">
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
        <div className="bg-surface rounded-[6px] border border-border  overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-text-subtle text-sm">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading audit records...
            </div>
          ) : filteredAudit.length === 0 ? (
            <div className="p-12 text-center text-text-muted text-sm">
              No audit entries recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-surface-subtle border-b border-border text-text-muted font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3.5">Timestamp</th>
                    <th className="py-2.5 px-3.5">User</th>
                    <th className="py-2.5 px-3.5">Action</th>
                    <th className="py-2.5 px-3.5">Target</th>
                    <th className="py-2.5 px-3.5">Details</th>
                    <th className="py-2.5 px-3.5">Origin IP</th>
                    <th className="py-2.5 px-3.5">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAudit.map(a => (
                    <tr key={a.id} className="hover:bg-surface-subtle/70 transition-colors">
                      <td className="py-2.5 px-3.5 text-text-muted font-mono text-[11px] whitespace-nowrap">
                        {formatDateTime(a.timestamp)}
                      </td>

                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-text">{a.user_name}</div>
                        <span className="text-[10px] text-text-subtle capitalize">{a.role}</span>
                      </td>

                      <td className="py-2.5 px-3.5 font-mono text-accent font-medium text-[11px]">
                        {a.action}
                      </td>

                      <td className="py-2.5 px-3.5 text-text-muted font-medium">
                        {a.target}
                      </td>

                      <td className="py-2.5 px-3.5 text-text-muted max-w-sm">
                        {a.details}
                      </td>

                      <td className="py-2.5 px-3.5 font-mono text-text-subtle text-[11px]">
                        {a.ip_address}
                      </td>

                      <td className="py-2.5 px-3.5">
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
          description="Synthesized AST query checked against active role schema views"
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="relative">
              <pre className="p-3.5 bg-slate-950 text-indigo-200 rounded-[6px] text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {selectedSql}
              </pre>

              <button
                onClick={() => handleCopySql(selectedSql)}
                className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedSql(null)}
                className="px-3.5 py-1.5 rounded-[6px] bg-slate-800 text-white text-xs font-medium hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};


