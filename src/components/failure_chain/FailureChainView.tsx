import React, { useState, useEffect } from 'react';
import {
  Link2,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  User,
  GraduationCap,
  IndianRupee,
  Activity,
  Layers,
  ChevronRight,
  ChevronDown,
  Info,
  Calendar,
  MessageSquare,
  Search,
  Filter,
  Check,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { FailureChainStudent, FailureChainEvidence } from '../../types';
import { Badge, BadgeVariant } from '../common/Badge';
import { Modal } from '../common/Modal';

export const FailureChainView: React.FC = () => {
  const { role, user } = useAuth();
  const { showToast } = useToast();

  const [chains, setChains] = useState<FailureChainStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedChain, setSelectedChain] = useState<FailureChainStudent | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical_cascade' | 'compound_risk' | 'early_friction'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePlanModal, setActivePlanModal] = useState<FailureChainStudent | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getFailureChains();
      setChains(data || []);
      if (data && data.length > 0) {
        setSelectedChain(data[0]);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load failure chains', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdatePlan = async (
    chain: FailureChainStudent,
    newStatus: 'plan_staged' | 'in_progress' | 'stabilized'
  ) => {
    try {
      const updated = await api.updateFailureChainPlan(chain.id, newStatus);
      setChains(prev => prev.map(c => (c.id === chain.id ? { ...c, resolution_status: newStatus } : c)));
      if (selectedChain?.id === chain.id) {
        setSelectedChain(prev => (prev ? { ...prev, resolution_status: newStatus } : null));
      }
      showToast(
        `Coordinated Support Plan for ${chain.student_name} marked as '${newStatus.replace('_', ' ')}'!`,
        'success',
        'Multi-Dept Support Synchronized'
      );
      setActivePlanModal(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update coordinated plan', 'error');
    }
  };

  const filteredChains = chains.filter(c => {
    const matchesSev = severityFilter === 'all' || c.chain_severity === severityFilter;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      c.student_name.toLowerCase().includes(q) ||
      c.batch_name.toLowerCase().includes(q) ||
      c.course_name.toLowerCase().includes(q);
    return matchesSev && matchesSearch;
  });

  const getDimensionIcon = (dim: FailureChainEvidence['dimension']) => {
    switch (dim) {
      case 'attendance':
        return <Clock className="w-3.5 h-3.5 text-blue-500" />;
      case 'assessment':
        return <GraduationCap className="w-3.5 h-3.5 text-purple-500" />;
      case 'fees':
        return <IndianRupee className="w-3.5 h-3.5 text-amber-500" />;
      case 'academic':
        return <Activity className="w-3.5 h-3.5 text-rose-500" />;
    }
  };

  const getSeverityBadge = (sev: FailureChainStudent['chain_severity']) => {
    if (sev === 'critical_cascade') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-status-red" />
          Critical Cascade (4 Depts)
        </span>
      );
    }
    if (sev === 'compound_risk') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Compound Risk (3 Depts)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Early Friction (2 Depts)
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
              The Hidden Student Failure Chain
            </h1>
            <span className="text-[10px] font-semibold font-mono bg-accent-subtle text-accent border border-indigo-200 px-2 py-0.5 rounded">
              Cross-Department Correlation Engine
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5 max-w-3xl">
            Combines student attendance, test results, fee installments, and lab submissions.
            Uncovers compound student friction that isolated single-department alerts fail to detect.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-medium bg-surface px-2.5 py-1 rounded-[6px] border border-border ">
            Multi-Signal Coincidence Filter: <strong className="text-emerald-600">Active (Zero False Alarms)</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-3 rounded-[6px] border border-border  flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-surface-muted p-0.5 rounded-[6px] border border-border/60">
          {(['all', 'critical_cascade', 'compound_risk', 'early_friction'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSeverityFilter(tab)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium capitalize transition-all cursor-pointer ${
                severityFilter === tab
                  ? 'bg-surface text-text  font-semibold'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-text-subtle absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search student, batch, course..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[6px] border border-border focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Two Column Layout: Student Correlation Roster + Evidence Chain Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: List of Detected Failure Chains (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider px-1">
            Correlated High-Risk Chains ({filteredChains.length})
          </div>

          {loading ? (
            <div className="p-12 text-center text-text-subtle text-sm bg-surface rounded-[6px] border border-border">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Correlating multi-department signals...
            </div>
          ) : filteredChains.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-xs bg-surface rounded-[6px] border border-border">
              No compound failure chains detected for current filter.
            </div>
          ) : (
            filteredChains.map(chain => {
              const isSelected = selectedChain?.id === chain.id;

              return (
                <div
                  key={chain.id}
                  onClick={() => setSelectedChain(chain)}
                  className={`bg-surface rounded-[6px] border p-4  transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                      : 'border-border hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text text-sm">
                          {chain.student_name}
                        </span>
                        <span className="font-mono text-[10px] text-text-subtle bg-surface-subtle border border-border px-1 rounded">
                          {chain.phone_masked}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted">
                        {chain.batch_name}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-rose-600">
                        {chain.correlation_score}%
                      </span>
                      <span className="text-[10px] text-text-subtle block">correlation</span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-border text-xs">
                    <div>{getSeverityBadge(chain.chain_severity)}</div>
                    
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${
                        chain.resolution_status === 'stabilized'
                          ? 'bg-emerald-50 text-emerald-700'
                          : chain.resolution_status === 'in_progress'
                          ? 'bg-accent-subtle text-accent'
                          : chain.resolution_status === 'plan_staged'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-surface-muted text-text-muted'
                      }`}
                    >
                      {chain.resolution_status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Exact Chain of Evidence & Coordinated Support Plan (7 cols) */}
        <div className="lg:col-span-7">
          {selectedChain ? (
            <div className="bg-surface rounded-[6px] border border-border  p-5 space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-text">
                      {selectedChain.student_name}
                    </h2>
                    <span className="text-xs text-text-muted font-mono">
                      (ID: {selectedChain.student_id})
                    </span>
                    {getSeverityBadge(selectedChain.chain_severity)}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {selectedChain.batch_name} Â· {selectedChain.course_name}
                  </p>
                </div>

                <button
                  onClick={() => setActivePlanModal(selectedChain)}
                  className="px-3.5 py-1.5 rounded-[6px] bg-accent hover:bg-indigo-700 text-white font-medium text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer "
                >
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  View Coordinated Plan
                </button>
              </div>

              {/* The Isolated Alert Flaw (Why Single Department Alerts Fail) */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-[6px] text-xs text-amber-950 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  The Single-Department Alert Blindspot:
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {selectedChain.isolated_alert_flaw}
                </p>
              </div>

              {/* Verified Chain of Evidence Timeline */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-subtle">
                    Exact Chain of Evidence (Correlated Across Departments)
                  </span>
                  <span className="text-[10px] text-text-subtle font-mono">
                    {selectedChain.evidence_chain.length} activity records
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedChain.evidence_chain.map((evidence, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-[6px] border border-border bg-surface-subtle/50 hover:bg-surface transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-1 rounded bg-surface border border-border shrink-0 mt-0.5">
                          {getDimensionIcon(evidence.dimension)}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text truncate">
                              {evidence.indicator}
                            </span>
                            <span className="text-[10px] font-mono text-text-muted bg-surface-muted px-1.5 py-0.2 rounded border border-border shrink-0">
                              {evidence.department}
                            </span>
                          </div>
                          <div className="text-[11px] text-text-muted font-medium">
                            {evidence.metric}
                          </div>
                          <div className="text-[10px] text-text-subtle flex items-center gap-1">
                            <span>Source: {evidence.verified_source}</span>
                            <span>Â·</span>
                            <span>{evidence.timestamp}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 self-start sm:self-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                            evidence.severity === 'critical'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : evidence.severity === 'warning'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-surface-muted text-text-muted border border-border'
                          }`}
                        >
                          {evidence.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integrated Support Plan Preview */}
              <div className="p-4 bg-slate-900 text-white rounded-[6px] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-accent" strokeWidth={1.5} />
                    <span className="font-semibold text-xs text-white">
                      Coordinated Support Action Plan (Unified Response)
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-300 font-mono">
                    Follow-up: {selectedChain.coordinated_plan.follow_up_date}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-2.5 rounded-[6px] bg-surface/5 border border-white/10 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                      1. Academic Counselor
                    </span>
                    <p className="text-slate-300 leading-snug">
                      {selectedChain.coordinated_plan.counselor_action}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-[6px] bg-surface/5 border border-white/10 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                      2. Batch Trainer
                    </span>
                    <p className="text-slate-300 leading-snug">
                      {selectedChain.coordinated_plan.trainer_action}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-[6px] bg-surface/5 border border-white/10 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                      3. Accounts & Fees
                    </span>
                    <p className="text-slate-300 leading-snug">
                      {selectedChain.coordinated_plan.accounts_action}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-[6px] bg-indigo-950/60 border border-indigo-800/40 space-y-1">
                  <span className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wide block">
                    Synthesized Non-Threatening Student Outreach:
                  </span>
                  <p className="text-xs text-slate-200 italic font-sans leading-relaxed">
                    "{selectedChain.coordinated_plan.unified_message}"
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-text-subtle">
                    Replaces 3 fragmented robotic notices with 1 coordinated human outreach.
                  </span>

                  <button
                    onClick={() => handleUpdatePlan(selectedChain, 'in_progress')}
                    disabled={selectedChain.resolution_status === 'in_progress' || selectedChain.resolution_status === 'stabilized'}
                    className="px-3 py-1 rounded bg-accent hover:bg-indigo-700 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {selectedChain.resolution_status === 'in_progress'
                      ? 'Plan In Motion'
                      : selectedChain.resolution_status === 'stabilized'
                      ? 'Stabilized'
                      : 'Authorize Coordinated Plan'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-text-subtle text-sm bg-surface rounded-[6px] border border-border">
              Select a student failure chain on the left to inspect the evidence.
            </div>
          )}
        </div>
      </div>

      {/* Coordinated Plan Orchestration Modal */}
      {activePlanModal && (
        <Modal
          isOpen={!!activePlanModal}
          onClose={() => setActivePlanModal(null)}
          title={`Coordinated Support Plan: ${activePlanModal.student_name}`}
          description={`Unified cross-department intervention addressing attendance, assignments, and fees`}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs text-text-muted">
            <div className="p-3 bg-surface-subtle rounded-[6px] border border-border space-y-2">
              <div className="font-semibold text-text text-sm">
                Student: {activePlanModal.student_name} ({activePlanModal.batch_name})
              </div>
              <p className="text-text-muted leading-relaxed text-xs">
                Instead of sending separate, conflicting alerts (e.g. Accounts sending an overdue EMI notice while the student is struggling with family distress and missing assignments), this plan coordinates all three touchpoints into a unified resolution.
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-[6px] border border-indigo-100 bg-accent-subtle/50 space-y-1">
                <span className="font-bold text-indigo-950 uppercase tracking-wide text-[10px]">
                  Counselor Protocol:
                </span>
                <p className="text-text text-xs">
                  {activePlanModal.coordinated_plan.counselor_action}
                </p>
              </div>

              <div className="p-3 rounded-[6px] border border-purple-100 bg-purple-50/50 space-y-1">
                <span className="font-bold text-purple-950 uppercase tracking-wide text-[10px]">
                  Trainer Academic Protocol:
                </span>
                <p className="text-text text-xs">
                  {activePlanModal.coordinated_plan.trainer_action}
                </p>
              </div>

              <div className="p-3 rounded-[6px] border border-emerald-100 bg-emerald-50/50 space-y-1">
                <span className="font-bold text-emerald-950 uppercase tracking-wide text-[10px]">
                  Accounts & Billing Protocol:
                </span>
                <p className="text-text text-xs">
                  {activePlanModal.coordinated_plan.accounts_action}
                </p>
              </div>
            </div>

            <div className="p-3 bg-surface-muted rounded-[6px] border border-border space-y-1">
              <span className="font-semibold text-text-muted uppercase tracking-wide text-[10px]">
                Drafted WhatsApp / SMS Dispatch:
              </span>
              <p className="text-xs text-text italic font-sans leading-relaxed bg-surface p-2.5 rounded border border-border">
                "{activePlanModal.coordinated_plan.unified_message}"
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setActivePlanModal(null)}
                className="px-3 py-1.5 rounded-[6px] border border-border text-text-muted hover:bg-surface-subtle cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleUpdatePlan(activePlanModal, 'stabilized')}
                className="px-3.5 py-1.5 rounded-[6px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
              >
                Mark Stabilized & Resolved
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};




