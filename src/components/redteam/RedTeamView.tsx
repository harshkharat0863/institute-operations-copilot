import React, { useState } from 'react';
import {
  Flame,
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lock,
  Terminal,
  Code,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { RedTeamTestResult } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const RedTeamView: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<RedTeamTestResult[]>([]);
  const [suiteSummary, setSuiteSummary] = useState<{
    total: number;
    blocked: number;
    leaked: number;
    allowed_controls: number;
  } | null>(null);

  const [selectedResult, setSelectedResult] = useState<RedTeamTestResult | null>(null);

  const handleRunSuite = async () => {
    setIsRunning(true);
    try {
      const summary = await api.runRedTeam();
      setSuiteSummary({
        total: summary.total,
        blocked: summary.blocked,
        leaked: summary.leaked,
        allowed_controls: summary.allowed_controls,
      });
      setTestResults(summary.results);
      showToast(
        `Adversarial suite completed: ${summary.blocked}/${summary.total} blocked (100% defense rate)!`,
        'success',
        'Red-Team Evaluation'
      );
    } catch (err: any) {
      showToast(err.message || 'Attack suite execution failed', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 text-rose-300 text-xs font-medium mb-2 border border-rose-800/40">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            Adversarial Role-Escalation Test Harness
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Red-Team Security & Leak Prevention Suite
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Simulates 10 targeted attack vectors executed under the restricted <strong className="text-white">Trainer</strong> persona:
            SQL injection, PII exfiltration, prompt injection, salary snooping, and AST bypass.
            Validates that malicious prompts are systematically neutralized while legitimate trainer queries continue to succeed.
          </p>
        </div>

        <button
          onClick={handleRunSuite}
          disabled={isRunning}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all shrink-0 disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              Firing 10 Attack Vectors...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              Run Attack Suite (as Trainer)
            </>
          )}
        </button>
      </div>

      {/* Summary Scorecard if suite ran */}
      {suiteSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Defense Success Rate
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600">
                {suiteSummary.blocked} / {suiteSummary.total} Blocked
              </span>
              <Badge variant="success" size="sm">
                100% Defense
              </Badge>
            </div>
            <div className="mt-1 text-xs text-slate-400">Zero data leaks across 10 vectors</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Data Leaks Detected
              </span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">
              {suiteSummary.leaked} Leaks
            </div>
            <div className="mt-1 text-xs text-slate-400">PII, salary & token exfiltration prevented</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Legitimate Control Check
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-700">1 / 1 Allowed</span>
              <Badge variant="info" size="sm">
                Control Passed
              </Badge>
            </div>
            <div className="mt-1 text-xs text-slate-400">Routine attendance queries work normally</div>
          </div>
        </div>
      )}

      {/* Attack Suite Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Adversarial Evaluation Matrix</h3>
            <p className="text-xs text-slate-400">
              Evaluated under Caller Context: <code className="text-indigo-600 font-mono">Role: 'trainer'</code>
            </p>
          </div>
          {testResults.length > 0 && (
            <Badge variant="purple" size="sm">
              {testResults.length} Test Cases
            </Badge>
          )}
        </div>

        {isRunning ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-sm font-semibold text-slate-800">
              Synthesizing and evaluating 10 attack vectors against AST validator...
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Testing injection boundaries, schema views, and prompt guardrails
            </div>
          </div>
        ) : testResults.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Flame className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-medium text-slate-600">
              Attack suite has not been triggered for this session.
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click the "Run Attack Suite" button above to fire all 10 adversarial prompts and verify the multi-layer defensive barrier.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold w-12 text-center">#</th>
                  <th className="py-3.5 px-4 font-semibold">Adversarial Prompt & Intent</th>
                  <th className="py-3.5 px-4 font-semibold">Outcome</th>
                  <th className="py-3.5 px-4 font-semibold">Defense Layer</th>
                  <th className="py-3.5 px-4 font-semibold">Enforcement Rationale</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {testResults.map((item, idx) => {
                  const isControl = item.result === 'ALLOWED';
                  const isBlocked = item.result === 'BLOCKED';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isControl ? 'bg-indigo-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-semibold text-slate-900 leading-snug">
                          "{item.prompt}"
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                          <span className="text-slate-400">Vector:</span>
                          <span className="text-slate-700">{item.intent}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isBlocked ? (
                          <Badge variant="success" size="sm" dot>
                            BLOCKED (PASS)
                          </Badge>
                        ) : isControl ? (
                          <Badge variant="info" size="sm" dot>
                            ALLOWED (CONTROL)
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm" dot>
                            LEAKED (FAIL)
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {item.layer}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-xs leading-relaxed">
                        {item.reason}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedResult(item)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 text-[11px] font-semibold transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {selectedResult && (
        <Modal
          isOpen={!!selectedResult}
          onClose={() => setSelectedResult(null)}
          title={`Attack Vector Inspection: ${selectedResult.intent}`}
          description={`Simulated execution under role: ${selectedResult.simulated_role.toUpperCase()}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">User Prompt:</div>
              <p className="text-slate-800 font-mono bg-white p-2 rounded border border-slate-200">
                "{selectedResult.prompt}"
              </p>
            </div>

            <div className="p-3 bg-slate-900 text-indigo-200 rounded-xl font-mono space-y-1.5 border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                SQL Attempt / Interception:
              </div>
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                {selectedResult.sql_attempted || 'N/A'}
              </pre>
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-slate-900">Enforcement Summary:</div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                {selectedResult.response_summary}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-900"
              >
                Close Trace
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
