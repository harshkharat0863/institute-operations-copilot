import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  Database,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  Clock,
  Table as TableIcon,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { CopilotAskResponse, PendingActionDraft } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';

interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text?: string;
  response?: CopilotAskResponse;
  isLoading?: boolean;
}

const EXAMPLE_QUESTIONS = [
  'Which students in the Java batch have missed three or more classes and have an EMI due this week?',
  'Show me attendance summary for Python batch over the last 14 days',
  'List all overdue EMIs exceeding ₹15,000 grouped by course',
  'Which classrooms are free on Thursday between 2 PM and 5 PM?',
];

interface CopilotViewProps {
  onNavigateToApprovals: () => void;
}

export const CopilotView: React.FC<CopilotViewProps> = ({ onNavigateToApprovals }) => {
  const { role, user } = useAuth();
  const { showToast } = useToast();

  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome_msg',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: `Hello ${user?.name}! I am the Institute Operations Copilot. You can ask me operational questions in natural language. I translate your question into secure, role-restricted SQL queries with strict privacy guardrails.`,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [expandedQueries, setExpandedQueries] = useState<Record<string, boolean>>({});
  const [copiedSqlId, setCopiedSqlId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  const toggleQuery = (msgId: string) => {
    setExpandedQueries(prev => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const copySqlToClipboard = (sql: string, id: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSqlId(id);
    showToast('SQL statement copied to clipboard', 'info');
    setTimeout(() => {
      setCopiedSqlId(null);
    }, 2500);
  };

  const handleAsk = async (questionToAsk?: string) => {
    const q = (questionToAsk || inputQuestion).trim();
    if (!q || isSubmitting) return;

    const userMsgId = `msg_user_${Date.now()}`;
    const assistantMsgId = `msg_asst_${Date.now()}`;

    // Append user message and loading skeleton
    setMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        timestamp: new Date().toISOString(),
        text: q,
      },
      {
        id: assistantMsgId,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        isLoading: true,
      },
    ]);

    setInputQuestion('');
    setIsSubmitting(true);

    try {
      const resp = await api.askCopilot(q, role || 'counselor');

      // Update the assistant message with final result
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? {
                ...m,
                isLoading: false,
                response: resp,
              }
            : m
        )
      );

      // Auto expand the query inspector for rich inspection
      setExpandedQueries(prev => ({
        ...prev,
        [assistantMsgId]: true,
      }));
    } catch (err: any) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? {
                ...m,
                isLoading: false,
                text: `An error occurred while compiling your request: ${err.message || 'Server error'}`,
              }
            : m
        )
      );
      showToast(err.message || 'Copilot query execution failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDraftReminders = async (actions?: PendingActionDraft[]) => {
    if (!actions || actions.length === 0) return;
    try {
      await api.draftRemindersFromCopilot(
        actions.map(a => ({
          student_name: a.student_name,
          phone_masked: a.phone_masked,
          message: a.message,
          due_date: a.due_date,
        })),
        user?.name || 'Staff'
      );
      showToast(
        `Drafted ${actions.length} WhatsApp reminders. Added to Approvals Queue for verification.`,
        'success',
        'Outbox Prepared'
      );
      onNavigateToApprovals();
    } catch (err: any) {
      showToast(err.message || 'Could not draft reminders', 'error');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                Operational Copilot Engine
              </h2>
              <Badge variant="purple" size="sm">
                SafeQuery™ v1.4
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Natural Language → Safe SQL • Role Enforcement: <strong className="capitalize text-slate-700">{role}</strong>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <Database className="w-3.5 h-3.5 text-indigo-600" />
          <span>AST Sanitization Active</span>
        </div>
      </div>

      {/* Example Question Chips Bar */}
      <div className="px-6 py-2.5 bg-indigo-50/40 border-b border-indigo-100 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-600" />
          Suggested:
        </span>
        {EXAMPLE_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(q)}
            disabled={isSubmitting}
            className="text-xs text-indigo-900 bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/80 px-3 py-1.5 rounded-full whitespace-nowrap shadow-2xs transition-all disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Thread Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          const resp = msg.response;
          const isBlocked = resp?.status === 'blocked';
          const isPartial = resp?.status === 'partial';
          const isQueryExpanded = !!expandedQueries[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-indigo-700 border border-slate-200'
                }`}
              >
                {isUser ? user?.name?.charAt(0) || 'U' : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`flex-1 rounded-2xl p-4 transition-all ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs text-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs space-y-4'
                }`}
              >
                {/* User Message Text */}
                {isUser && <div>{msg.text}</div>}

                {/* Loading Skeleton */}
                {!isUser && msg.isLoading && (
                  <div className="space-y-3 py-2 animate-pulse">
                    <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Parsing query intent & validating AST against role permissions...
                    </div>
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-20 bg-slate-100 rounded-xl w-full" />
                  </div>
                )}

                {/* Assistant Plain Text Answer (e.g. Welcome msg or generic text) */}
                {!isUser && !msg.isLoading && msg.text && (
                  <p className="text-sm leading-relaxed text-slate-700">{msg.text}</p>
                )}

                {/* Assistant Response Package (SafeQuery Results) */}
                {!isUser && !msg.isLoading && resp && (
                  <div className="space-y-4">
                    {/* Short Answer Summary */}
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-relaxed font-medium text-slate-800">
                        {resp.answer}
                      </p>
                      {resp.status === 'ok' && (
                        <Badge variant="success" size="sm" dot>
                          {resp.row_count} rows resolved
                        </Badge>
                      )}
                    </div>

                    {/* BLOCKED REFUSAL CARD */}
                    {isBlocked && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                          <span className="font-bold text-sm">Security Guardrail Triggered</span>
                          <Badge variant="danger" size="sm" className="ml-auto">
                            Layer: {resp.blocked_layer || 'Role View'}
                          </Badge>
                        </div>
                        <p className="text-xs text-rose-800 leading-relaxed">
                          <strong>Reason:</strong> {resp.blocked_reason}
                        </p>
                        <div className="text-[11px] text-rose-700/80 bg-rose-100/50 p-2 rounded-lg font-mono">
                          Zero-trust rule: Role '{role}' queries on financial and unmasked contact schemas are intercepted prior to database execution.
                        </div>
                      </div>
                    )}

                    {/* PARTIAL REFUSAL NOTE */}
                    {isPartial && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Partial Security Redaction:</span>{' '}
                          {resp.partial_explanation}
                          <div className="text-[11px] text-amber-700 mt-0.5">
                            Blocking layer: <code className="font-mono">{resp.blocked_layer}</code>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* RESULTS TABLE (If columns and rows exist) */}
                    {resp.rows && resp.rows.length > 0 && (
                      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                              <tr>
                                {resp.columns.map((col, idx) => (
                                  <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-normal">
                              {resp.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50/70">
                                  {row.map((cell: any, cIdx: number) => (
                                    <td key={cIdx} className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                                      {String(cell)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* DRAFT WHATSAPP REMINDERS BUTTON */}
                    {resp.can_draft_reminders && resp.generated_actions && (
                      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="text-xs text-emerald-900">
                          <span className="font-bold">Automated Follow-up Ready:</span>{' '}
                          {resp.generated_actions.length} WhatsApp reminder messages can be staged for counselor approval.
                        </div>
                        <button
                          onClick={() => handleDraftReminders(resp.generated_actions)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Draft WhatsApp Reminders
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* COLLAPSIBLE "SHOW QUERY" PANEL */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                      <button
                        onClick={() => toggleQuery(msg.id)}
                        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <TableIcon className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Generated SQL & Query Execution Metrics</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-mono text-slate-500">
                            {resp.duration_ms}ms • {resp.row_count} rows
                          </span>
                          {isQueryExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isQueryExpanded && (
                        <div className="p-4 border-t border-slate-200 bg-slate-900 text-slate-200 text-xs font-mono space-y-3">
                          {/* Query telemetry metadata */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                              <span>Tables Touched:</span>
                              <div className="flex gap-1.5 flex-wrap">
                                {resp.tables_used.map((tbl, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 font-mono text-[10px]"
                                  >
                                    {tbl}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={() => copySqlToClipboard(resp.sql, msg.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="Copy SQL"
                            >
                              {copiedSqlId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy SQL</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Monospace Code Block */}
                          <pre className="overflow-x-auto text-xs text-indigo-200 leading-relaxed whitespace-pre-wrap p-2 rounded bg-slate-950/60 border border-slate-800/80">
                            {resp.sql}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Footer */}
      <div className="p-4 border-t border-slate-200 bg-white shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputQuestion}
              onChange={e => setInputQuestion(e.target.value)}
              placeholder="Ask anything (e.g. Which students missed 3+ classes and have EMIs due?)"
              disabled={isSubmitting}
              className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 pr-12 transition-all disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={!inputQuestion.trim() || isSubmitting}
            className="flex items-center justify-center p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors shadow-xs"
            title="Ask Copilot"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>Queries execute safely under PostgreSQL Read-Only session tokens.</span>
          <span>Role view policies restrict PII exposure.</span>
        </div>
      </div>
    </div>
  );
};
