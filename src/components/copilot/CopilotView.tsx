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
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
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
              Natural Language → Safe SQL • Active Persona: <strong className="capitalize text-slate-700">{role}</strong>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Read-Only Verification</span>
          </div>
        </div>
      </div>

      {/* Category Tabs & Quick Prompts Bar */}
      <div className="bg-slate-50/90 border-b border-slate-200 shrink-0">
        {/* Category Pill Tabs */}
        <div className="px-6 pt-2.5 pb-1 flex items-center gap-1.5 overflow-x-auto">
          {CATEGORIZED_PROMPTS.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Suggested Queries for Active Category */}
        <div className="px-6 py-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Click to Ask:
          </span>
          {activeCategoryObj.queries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(q)}
              disabled={isSubmitting}
              className="text-xs text-indigo-950 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/70 px-3 py-1.5 rounded-full whitespace-nowrap shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Thread Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs space-y-3.5'
                }`}
              >
                {/* User Message Text */}
                {isUser && <div>{msg.text}</div>}

                {/* Loading Skeleton */}
                {!isUser && msg.isLoading && (
                  <div className="space-y-3 py-2 animate-pulse">
                    <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Interpreting intent, verifying role boundaries & synthesizing safe query...
                    </div>
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-20 bg-slate-100 rounded-xl w-full" />
                  </div>
                )}

                {/* Assistant Plain Text Answer */}
                {!isUser && !msg.isLoading && msg.text && (
                  <p className="text-sm leading-relaxed text-slate-700">{msg.text}</p>
                )}

                {/* Assistant Response Package */}
                {!isUser && !msg.isLoading && resp && (
                  <div className="space-y-3.5">
                    
                    {/* 1. Structured Operation Pill (Bridge between intent and DB) */}
                    {resp.operation && (
                      <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <span className="font-bold text-slate-600 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          Approved Operation:
                        </span>
                        <code className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[11px] font-bold">
                          {resp.operation}
                        </code>
                        {resp.category && (
                          <Badge
                            variant={
                              resp.category === 'fees'
                                ? 'warning'
                                : resp.category === 'attendance'
                                ? 'info'
                                : resp.category === 'timetable'
                                ? 'success'
                                : 'purple'
                            }
                            size="sm"
                          >
                            {resp.category.toUpperCase()}
                          </Badge>
                        )}
                        {resp.operation_payload && (
                          <span className="text-[10px] font-mono text-slate-400 ml-auto truncate max-w-[280px]">
                            {JSON.stringify(resp.operation_payload)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 2. Short Natural Language Answer Summary */}
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-relaxed font-medium text-slate-900">
                        {resp.answer}
                      </p>
                      {resp.status === 'ok' && resp.row_count > 0 && (
                        <Badge variant="success" size="sm" dot>
                          {resp.row_count} records
                        </Badge>
                      )}
                    </div>

                    {/* 3. BLOCKED REFUSAL CARD (e.g. Trainer asking for fees) */}
                    {isBlocked && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                          <span className="font-bold text-sm">Role-Based Access Control Refusal</span>
                          <Badge variant="danger" size="sm" className="ml-auto">
                            Layer: {resp.blocked_layer || 'Role View'}
                          </Badge>
                        </div>
                        <p className="text-xs text-rose-800 leading-relaxed font-medium">
                          {resp.blocked_reason}
                        </p>
                        <div className="text-[11px] text-rose-700 bg-rose-100/60 p-2.5 rounded-lg">
                          <strong>Rule Enforced:</strong> Trainers are restricted to academic rosters and attendance. Financial ledgers, fee payments, and unmasked contacts are strictly protected.
                        </div>
                      </div>
                    )}

                    {/* 4. PARTIAL REFUSAL NOTE */}
                    {isPartial && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Partial Security Redaction:</span>{' '}
                          {resp.partial_explanation}
                        </div>
                      </div>
                    )}

                    {/* 5. VERIFIABLE DATA RESULTS TABLE */}
                    {resp.rows && resp.rows.length > 0 && (
                      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                              <tr>
                                {resp.columns.map((col, idx) => (
                                  <th key={idx} className="py-2.5 px-3.5 whitespace-nowrap">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-normal">
                              {resp.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50/70">
                                  {row.map((cell: any, cIdx: number) => (
                                    <td key={cIdx} className="py-2.5 px-3.5 text-slate-800 whitespace-nowrap">
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

                    {/* 6. DRAFT WHATSAPP REMINDERS & HUMAN-IN-THE-LOOP SECTION */}
                    {resp.can_draft_reminders && resp.generated_actions && (
                      <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-xs text-emerald-950">
                            <div className="font-bold flex items-center gap-1.5">
                              <MessageSquare className="w-4 h-4 text-emerald-700" />
                              Human-in-the-Loop Action Ready
                            </div>
                            <div className="text-[11px] text-emerald-800 mt-0.5">
                              {resp.generated_actions.length} personalized WhatsApp reminder drafts staged. Staff review is required before sending.
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => toggleDrafts(msg.id)}
                              className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-900 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              {isDraftsExpanded ? 'Hide Drafts' : 'Preview Messages'}
                            </button>
                            <button
                              onClick={() => handleDraftReminders(resp.generated_actions)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Stage to Approvals Queue
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Message Previews */}
                        {isDraftsExpanded && (
                          <div className="pt-2 border-t border-emerald-200 space-y-2">
                            {resp.generated_actions.map((act, aIdx) => (
                              <div
                                key={aIdx}
                                className="p-2.5 rounded-lg bg-white border border-emerald-200 text-xs text-slate-700 space-y-1"
                              >
                                <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-900">
                                  <span>To: {act.student_name} ({act.phone_masked})</span>
                                  {act.amount && <span className="font-mono">EMI: ₹{act.amount.toLocaleString()}</span>}
                                </div>
                                <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100">
                                  "{act.message}"
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 7. QUERY TRANSPARENCY & SQL INSPECTOR */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                      <button
                        onClick={() => toggleQuery(msg.id)}
                        className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-100/70 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <TableIcon className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Query Transparency & Execution Log</span>
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
                        <div className="p-4 border-t border-slate-200 bg-slate-900 text-slate-200 text-xs font-mono space-y-2.5">
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
                              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
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

                          <pre className="overflow-x-auto text-xs text-indigo-200 leading-relaxed whitespace-pre-wrap p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
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
              placeholder="Ask anything (e.g. Which Java students missed 3+ classes and have EMIs due?)"
              disabled={isSubmitting}
              className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 pr-12 transition-all disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={!inputQuestion.trim() || isSubmitting}
            className="flex items-center justify-center p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
            title="Ask Copilot"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>Read-only queries verified against active role schema boundaries.</span>
          <span>Drafted messages require human approval before sending.</span>
        </div>
      </div>
    </div>
  );
};
