import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  ShieldAlert,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  Table as TableIcon,
  RefreshCw,
  Calendar,
  IndianRupee,
  Users,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { CopilotAskResponse, PendingActionDraft } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

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
    label: 'Benchmark Scenario',
    icon: Award,
    queries: [
      'Which students in the Java batch have missed three or more classes and have an EMI due this week? Draft a WhatsApp reminder for each.',
    ],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: CheckCircle2,
    queries: [
      'Show students who missed three or more classes this month.',
      "How many students attended today's Python class?",
      'Which students have poor attendance in the Java batch?',
    ],
  },
  {
    id: 'fees',
    label: 'Fees & EMIs',
    icon: IndianRupee,
    queries: [
      'Which EMIs are due this week?',
      'Show overdue instalments for the Java batch.',
      'Which students have missed two consecutive payments?',
    ],
  },
  {
    id: 'timetable',
    label: 'Timetable',
    icon: Calendar,
    queries: [
      "Show tomorrow's timetable.",
      'Find a free trainer for the Java batch on Monday.',
      'Our Python trainer is unavailable tomorrow. Reschedule affected classes.',
    ],
  },
  {
    id: 'risk',
    label: 'Risk Detection',
    icon: Users,
    queries: [
      'Which students may be falling behind?',
      'Find students with low attendance and incomplete assignments.',
      "Show students who need a counselor's attention.",
    ],
  },
  {
    id: 'comms',
    label: 'Communication Drafts',
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
      text: `Ask any question about students, batches, attendance, fee installments, or timetable schedules.`,
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

      setExpandedQueries(prev => ({
        ...prev,
        [assistantMsgId]: true,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Server error';
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? {
                ...m,
                isLoading: false,
                text: `An error occurred while compiling your request: ${msg}`,
              }
            : m
        )
      );
      showToast(msg, 'error');
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
        `Drafted ${actions.length} WhatsApp reminders. Staged in Approvals Queue for verification.`,
        'success',
        'Staged for Approval'
      );
      onNavigateToApprovals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not draft reminders';
      showToast(msg, 'error');
    }
  };

  const activeCategoryObj = CATEGORIZED_PROMPTS.find(c => c.id === selectedCategory) || CATEGORIZED_PROMPTS[0];

  return (
    <div className="flex flex-col h-[calc(100dvh-11rem)] lg:h-[calc(100dvh-7rem)] bg-surface rounded-[8px] border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-accent flex items-center justify-center text-white shrink-0">
            <Bot className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-sm font-medium text-text">
                Copilot
              </h2>
            </div>
            <p className="text-[11px] text-text-muted">
              Role: <span className="font-medium capitalize text-text">{role}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-status-green font-medium bg-status-green-bg border border-status-green/20 px-2 py-0.5 rounded-[4px]">
            <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
            Readonly Role (3s timeout)
          </span>
        </div>
      </div>

      {/* Suggested Prompts & Tabs */}
      <div className="bg-surface-subtle border-b border-border px-4 py-2 shrink-0 space-y-2">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {CATEGORIZED_PROMPTS.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-text hover:bg-surface'
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Quick Queries */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 text-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-subtle shrink-0">
            Suggested:
          </span>
          {activeCategoryObj.queries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(q)}
              disabled={isSubmitting}
              className="text-xs text-text-muted hover:text-text bg-surface border border-border hover:border-accent px-2.5 py-1 rounded-[6px] whitespace-nowrap transition-colors disabled:opacity-50 cursor-pointer text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg">
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
              className={`flex gap-3 max-w-[90vw] sm:max-w-2xl lg:max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-6 h-6 rounded-[4px] flex items-center justify-center shrink-0 text-xs font-medium ${
                  isUser
                    ? 'bg-accent text-white'
                    : 'bg-surface text-text border border-border'
                }`}
              >
                {isUser ? user?.name?.charAt(0) || 'U' : <Bot className="w-3.5 h-3.5" strokeWidth={1.5} />}
              </div>

              {/* Message Body */}
              <div
                className={`flex-1 rounded-[8px] p-3.5 text-xs ${
                  isUser
                    ? 'bg-accent text-white leading-relaxed'
                    : 'bg-surface border border-border text-text space-y-3'
                }`}
              >
                {/* User Message */}
                {isUser && <div>{msg.text}</div>}

                {/* Loading Indicator */}
                {!isUser && msg.isLoading && (
                  <div className="space-y-2 py-1">
                    <div className="flex items-center gap-2 text-xs text-accent font-medium">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                      Analyzing request and generating verified SQL AST...
                    </div>
                    <div className="h-3 bg-surface-muted rounded-[4px] w-2/3 animate-pulse" />
                  </div>
                )}

                {/* Plain Text Reply */}
                {!isUser && !msg.isLoading && msg.text && (
                  <p className="text-xs leading-relaxed text-text-muted">{msg.text}</p>
                )}

                {/* Structured Copilot Response */}
                {!isUser && !msg.isLoading && resp && (
                  <div className="space-y-3 text-xs">
                    {/* Operation Pill */}
                    {resp.operation && (
                      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-[6px] bg-surface-subtle border border-border">
                        <span className="font-semibold text-text-subtle uppercase tracking-wider text-[10px]">
                          Operation:
                        </span>
                        <code className="px-1.5 py-0.5 rounded-[4px] bg-surface border border-border text-accent font-mono text-[11px] font-semibold">
                          {resp.operation}
                        </code>
                        {resp.category && (
                          <Badge variant="accent" size="sm">
                            {resp.category}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Summary Answer */}
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-medium text-text leading-relaxed">
                        {resp.answer}
                      </p>
                      {resp.status === 'ok' && resp.row_count > 0 && (
                        <span className="shrink-0 px-2 py-0.5 text-[10px] font-medium bg-status-green-bg text-status-green border border-status-green/20 rounded-[4px] tabular-nums">
                          {resp.row_count} rows
                        </span>
                      )}
                    </div>

                    {/* Blocked Alert */}
                    {isBlocked && (
                      <div className="p-3 rounded-[6px] bg-status-red-bg border border-status-red/20 text-status-red space-y-1">
                        <div className="flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                          <span className="font-semibold text-xs">Access Refusal</span>
                          <span className="ml-auto text-[10px] font-mono bg-surface px-1.5 py-0.5 rounded-[4px] border border-status-red/20">
                            {resp.blocked_layer || 'Role View'}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">
                          {resp.blocked_reason}
                        </p>
                      </div>
                    )}

                    {/* Partial Refusal */}
                    {isPartial && (
                      <div className="p-2.5 rounded-[6px] bg-status-amber-bg border border-status-amber/20 text-status-amber flex items-start gap-2 text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={1.5} />
                        <div>
                          <strong className="font-semibold">Redaction:</strong> {resp.partial_explanation}
                        </div>
                      </div>
                    )}

                    {/* Verifiable Table */}
                    {resp.rows && resp.rows.length > 0 && (
                      <div className="rounded-[6px] border border-border overflow-hidden">
                        <div className="overflow-x-auto max-h-64">
                          <table className="w-full text-left border-collapse text-xs tabular-nums">
                            <thead className="bg-surface-subtle sticky top-0 border-b border-border text-text-muted font-medium text-[11px] uppercase tracking-wider">
                              <tr>
                                {resp.columns.map((col, idx) => (
                                  <th key={idx} className="py-2 px-3 whitespace-nowrap">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {resp.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-surface-subtle/50 text-text">
                                  {row.map((cell: unknown, cIdx: number) => (
                                    <td key={cIdx} className="py-2 px-3 whitespace-nowrap">
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
                      <div className="p-3 bg-surface-subtle border border-border rounded-[6px] space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold text-xs text-text flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                              WhatsApp Action Staging
                            </div>
                            <div className="text-[11px] text-text-muted">
                              {resp.generated_actions.length} message drafts prepared from query results.
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => toggleDrafts(msg.id)}
                            >
                              {isDraftsExpanded ? 'Hide' : 'Preview'}
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleDraftReminders(resp.generated_actions)}
                              icon={<ArrowRight className="w-3 h-3" strokeWidth={1.5} />}
                            >
                              Stage to Approvals
                            </Button>
                          </div>
                        </div>

                        {isDraftsExpanded && (
                          <div className="pt-2 border-t border-border space-y-1.5">
                            {resp.generated_actions.map((act, aIdx) => (
                              <div
                                key={aIdx}
                                className="p-2 rounded-[4px] bg-surface border border-border text-xs text-text space-y-0.5"
                              >
                                <div className="flex items-center justify-between font-medium text-text text-[11px]">
                                  <span>{act.student_name} ({act.phone_masked})</span>
                                  {act.amount && <span className="font-mono tabular-nums">EMI: â‚¹{act.amount.toLocaleString()}</span>}
                                </div>
                                <p className="text-[11px] text-text-muted italic">
                                  "{act.message}"
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* How I Got This (Collapsible SQL) */}
                    <div className="border border-border rounded-[6px] overflow-hidden bg-surface">
                      <button
                        onClick={() => toggleQuery(msg.id)}
                        className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-text-muted hover:text-text hover:bg-surface-subtle cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <TableIcon className="w-3.5 h-3.5 text-text-subtle" strokeWidth={1.5} />
                          <span>How I got this (Generated SQL & Execution Log)</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-subtle text-[11px] font-mono tabular-nums">
                          <span>{resp.duration_ms}ms</span>
                          {isQueryExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.5} />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                          )}
                        </div>
                      </button>

                      {isQueryExpanded && (
                        <div className="p-3 border-t border-border bg-surface-subtle text-text text-xs font-mono space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-text-muted">
                            <div className="flex items-center gap-1.5">
                              <span>Tables:</span>
                              {resp.tables_used.map((tbl, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.2 rounded-[3px] bg-surface border border-border text-accent font-mono text-[10px]"
                                >
                                  {tbl}
                                </span>
                              ))}
                            </div>

                            <button
                              onClick={() => copySqlToClipboard(resp.sql, msg.id)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-surface border border-border hover:bg-surface-subtle text-text transition-colors cursor-pointer text-[11px]"
                            >
                              {copiedSqlId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-status-green" strokeWidth={1.5} />
                                  <span className="text-status-green">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" strokeWidth={1.5} />
                                  <span>Copy SQL</span>
                                </>
                              )}
                            </button>
                          </div>

                          <pre className="overflow-x-auto text-xs text-text leading-relaxed whitespace-pre-wrap p-2.5 rounded-[4px] bg-surface border border-border tabular-nums font-mono">
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
      <div className="p-3 border-t border-border bg-surface shrink-0">
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
            placeholder="Ask Copilot in plain English (e.g. Which Java students missed 3+ classes and have EMIs due?)"
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 text-xs rounded-[6px] border border-border bg-surface text-text focus:border-accent disabled:opacity-60"
          />

          <Button
            type="submit"
            variant="primary"
            disabled={!inputQuestion.trim() || isSubmitting}
            icon={<Send className="w-3.5 h-3.5" strokeWidth={1.5} />}
          >
            Ask
          </Button>
        </form>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-text-subtle">
          <span>Single-statement read-only SQL verified against role views.</span>
          <span>WhatsApp reminders staged for approval before delivery.</span>
        </div>
      </div>
    </div>
  );
};

