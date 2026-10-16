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
  Calendar,
  IndianRupee,
  Users,
  CheckCircle2,
  FileCheck,
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

interface PromptCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  queries: string[];
}

const CATEGORIZED_PROMPTS: PromptCategory[] = [
  {
    id: 'benchmark',
    label: '⭐ Benchmark Query',
    icon: Sparkles,
    queries: [
      'Which students in the Java batch have missed three or more classes and have an EMI due this week? Draft a WhatsApp reminder for each.',
    ],
  },
  {
    id: 'attendance',
    label: 'A. Attendance',
    icon: CheckCircle2,
    queries: [
      'Show students who missed three or more classes this month.',
      "How many students attended today's Python class?",
      'Which students have poor attendance in the Java batch?',
    ],
  },
  {
    id: 'fees',
    label: 'B. Fees & EMIs',
    icon: IndianRupee,
    queries: [
      'Which EMIs are due this week?',
      'Show overdue instalments for the Java batch.',
      'Which students have missed two consecutive payments?',
    ],
  },
  {
    id: 'timetable',
    label: 'C. Timetable & Clashes',
    icon: Calendar,
    queries: [
      "Show tomorrow's timetable.",
      'Find a free trainer for the Java batch on Monday.',
      'Our Python trainer is unavailable tomorrow. Reschedule affected classes.',
    ],
  },
  {
    id: 'risk',
    label: 'D. Risk Detection',
    icon: Users,
    queries: [
      'Which students may be falling behind?',
      'Find students with low attendance and incomplete assignments.',
      "Show students who need a counselor's attention.",
    ],
  },
  {
    id: 'comms',
    label: 'E. Communication & Drafts',
    icon: MessageSquare,
    queries: [
      'Draft a WhatsApp reminder for students whose fees are due.',
      'Prepare a message for students who missed three classes.',
      'Generate a completion certificate for this student.',
    ],
  },
];

interface CopilotViewProps {
  onNavigateToApprovals: () => void;
}

export const CopilotView: React.FC<CopilotViewProps> = ({ onNavigateToApprovals }) => {
  const { role, user } = useAuth();
  const { showToast } = useToast();

  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('benchmark');
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome_msg',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: `Hello ${user?.name}! I am your Institute Operations Copilot — a real database bridge connected to students, cohorts, attendance logs, fee installments, trainers, and timetable slots. Ask any operational question in natural language below.`,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [expandedQueries, setExpandedQueries] = useState<Record<string, boolean>>({});
  const [expandedDrafts, setExpandedDrafts] = useState<Record<string, boolean>>({});
  const [copiedSqlId, setCopiedSqlId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  const toggleQuery = (msgId: string) => {
    setExpandedQueries(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const toggleDrafts = (msgId: string) => {
    setExpandedDrafts(prev => ({ ...prev, [msgId]: !prev[msgId] }));
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

      // Auto expand query inspector
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
        user?.name || 'Staff Member'
      );
      showToast(
        `Drafted ${actions.length} WhatsApp reminders. Staged in Approvals Queue for human verification.`,
        'success',
        'Staged for Approval'
      );
      onNavigateToApprovals();
    } catch (err: any) {
      showToast(err.message || 'Could not draft reminders', 'error');
    }
  };

  const activeCategoryObj = CATEGORIZED_PROMPTS.find(c => c.id === selectedCategory) || CATEGORIZED_PROMPTS[0];

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-900 text-sm">
                Operations Copilot
              </h2>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                SafeQuery™ AST
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Role-verified access · Context: <span className="font-semibold capitalize text-slate-700">{role}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Read-Only Guard
          </span>
        </div>
      </div>

      {/* Suggested Prompts & Tabs */}
      <div className="bg-slate-50/70 border-b border-slate-200 px-4 py-2 shrink-0 space-y-2">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {CATEGORIZED_PROMPTS.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Quick Queries */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 text-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 shrink-0">
            Quick Prompts:
          </span>
          {activeCategoryObj.queries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(q)}
              disabled={isSubmitting}
              className="text-xs text-slate-700 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 px-2.5 py-1 rounded-md whitespace-nowrap transition-colors disabled:opacity-50 cursor-pointer text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/30">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          const resp = msg.response;
          const isBlocked = resp?.status === 'blocked';
          const isPartial = resp?.status === 'partial';
          const isQueryExpanded = !!expandedQueries[msg.id];
          const isDraftsExpanded = !!expandedDrafts[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                {isUser ? user?.name?.charAt(0) || 'U' : <Bot className="w-3.5 h-3.5" />}
              </div>

              {/* Message Body */}
              <div
                className={`flex-1 rounded-xl p-4 text-xs ${
                  isUser
                    ? 'bg-indigo-600 text-white leading-relaxed text-sm'
                    : 'bg-white border border-slate-200 text-slate-800 space-y-3 shadow-2xs'
                }`}
              >
                {/* User Message */}
                {isUser && <div>{msg.text}</div>}

                {/* Loading Indicator */}
                {!isUser && msg.isLoading && (
                  <div className="space-y-2 py-1">
                    <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Analyzing request, verifying role schema boundaries...
                    </div>
                    <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse" />
                  </div>
                )}

                {/* Plain Text Reply */}
                {!isUser && !msg.isLoading && msg.text && (
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-700">{msg.text}</p>
                )}

                {/* Structured Copilot Response */}
                {!isUser && !msg.isLoading && resp && (
                  <div className="space-y-3 text-xs">
                    
                    {/* Operation Pill */}
                    {resp.operation && (
                      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-md bg-slate-50 border border-slate-200">
                        <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                          Approved Function:
                        </span>
                        <code className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-indigo-700 font-mono text-[11px] font-semibold">
                          {resp.operation}
                        </code>
                        {resp.category && (
                          <Badge variant="info" size="sm">
                            {resp.category}
                          </Badge>
                        )}
                        {resp.operation_payload && (
                          <span className="text-[10px] font-mono text-slate-400 ml-auto truncate max-w-[240px]">
                            {JSON.stringify(resp.operation_payload)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Summary Answer */}
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs sm:text-sm font-medium text-slate-900 leading-relaxed">
                        {resp.answer}
                      </p>
                      {resp.status === 'ok' && resp.row_count > 0 && (
                        <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                          {resp.row_count} rows
                        </span>
                      )}
                    </div>

                    {/* Blocked Alert */}
                    {isBlocked && (
                      <div className="p-3.5 rounded-lg bg-rose-50 border-l-4 border-l-rose-500 border border-rose-200 text-rose-900 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="font-semibold text-xs">Role Permission Refusal</span>
                          <span className="ml-auto text-[10px] font-mono text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                            {resp.blocked_layer || 'Role View'}
                          </span>
                        </div>
                        <p className="text-xs text-rose-800 leading-relaxed">
                          {resp.blocked_reason}
                        </p>
                      </div>
                    )}

                    {/* Partial Refusal */}
                    {isPartial && (
                      <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2 text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold">Security Redaction:</strong> {resp.partial_explanation}
                        </div>
                      </div>
                    )}

                    {/* Verifiable Table */}
                    {resp.rows && resp.rows.length > 0 && (
                      <div className="rounded-lg border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto max-h-64">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                              <tr>
                                {resp.columns.map((col, idx) => (
                                  <th key={idx} className="py-2 px-3 whitespace-nowrap">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {resp.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50/70">
                                  {row.map((cell: any, cIdx: number) => (
                                    <td key={cIdx} className="py-2 px-3 text-slate-800 whitespace-nowrap">
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

                    {/* Human Approval Message Drafts */}
                    {resp.can_draft_reminders && resp.generated_actions && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold text-xs text-emerald-950 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                              WhatsApp Action Staging
                            </div>
                            <div className="text-[11px] text-emerald-800">
                              {resp.generated_actions.length} message drafts prepared. Requires review before dispatch.
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleDrafts(msg.id)}
                              className="px-2.5 py-1 rounded border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 text-xs font-medium cursor-pointer"
                            >
                              {isDraftsExpanded ? 'Hide Previews' : 'Preview'}
                            </button>
                            <button
                              onClick={() => handleDraftReminders(resp.generated_actions)}
                              className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer shadow-2xs"
                            >
                              <span>Stage to Approvals</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {isDraftsExpanded && (
                          <div className="pt-2 border-t border-emerald-200 space-y-1.5">
                            {resp.generated_actions.map((act, aIdx) => (
                              <div
                                key={aIdx}
                                className="p-2 rounded bg-white border border-emerald-100 text-xs text-slate-700 space-y-0.5"
                              >
                                <div className="flex items-center justify-between font-semibold text-emerald-950 text-[11px]">
                                  <span>{act.student_name} ({act.phone_masked})</span>
                                  {act.amount && <span className="font-mono">EMI: ₹{act.amount.toLocaleString()}</span>}
                                </div>
                                <p className="text-[11px] text-slate-600 italic">
                                  "{act.message}"
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Query Transparency */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/60">
                      <button
                        onClick={() => toggleQuery(msg.id)}
                        className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <TableIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span>Generated SQL & Execution Log</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono">
                          <span>{resp.duration_ms}ms</span>
                          {isQueryExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </button>

                      {isQueryExpanded && (
                        <div className="p-3 border-t border-slate-200 bg-slate-900 text-slate-200 text-xs font-mono space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <span>Tables:</span>
                              {resp.tables_used.map((tbl, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 font-mono text-[10px]"
                                >
                                  {tbl}
                                </span>
                              ))}
                            </div>

                            <button
                              onClick={() => copySqlToClipboard(resp.sql, msg.id)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer text-[11px]"
                            >
                              {copiedSqlId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>

                          <pre className="overflow-x-auto text-xs text-indigo-200 leading-relaxed whitespace-pre-wrap p-2 rounded bg-slate-950/80 border border-slate-800">
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

      {/* Input Form */}
      <div className="p-3 border-t border-slate-200 bg-white shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={e => setInputQuestion(e.target.value)}
            placeholder="Ask Copilot (e.g. Which Java students missed 3+ classes and have EMIs due?)"
            disabled={isSubmitting}
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!inputQuestion.trim() || isSubmitting}
            className="flex items-center justify-center p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors cursor-pointer shrink-0"
            title="Ask Copilot"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
          <span>Read-only queries strictly verified against role permissions.</span>
          <span>Zero automated messaging without human sign-off.</span>
        </div>
      </div>
    </div>
  );
};
