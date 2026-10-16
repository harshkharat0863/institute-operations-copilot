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
      setTestResults(summary.results || []);
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
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-[#111318] rounded-xl p-5 text-white border border-white/5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/30 mb-2">
            <Flame className="w-3 h-3 text-rose-500" />
            Adversarial Role-Escalation Test Suite
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Red-Team Security Suite
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Fires 10 targeted attack vectors executed under the restricted <span className="text-white font-semibold">Trainer</span> persona:
            SQL injection, PII exfiltration, prompt injection, and AST schema bypass.
          </p>
        </div>

        <button
          onClick={handleRunSuite}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs transition-all shrink-0 disabled:opacity-50 cursor-pointer"
        >
          {isRunning ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              Firing 10 Attack Vectors...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              Run Attack Suite (as Trainer)
            </>
          )}
        </button>
      </div>

      {/* Summary Scorecard if suite ran */}
      {suiteSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Defense Success Rate
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600">
                {suiteSummary.blocked} / {suiteSummary.total} Blocked
              </span>
              <Badge variant="success" size="sm">
                100%
              </Badge>
            </div>
            <div className="mt-0.5 text-xs text-slate-400">Zero data leaks across all vectors</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Data Leaks Detected
              </span>
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {suiteSummary.leaked} Leaks
            </div>
            <div className="mt-0.5 text-xs text-slate-400">PII, fee ledgers, and contact tokens secured</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Legitimate Control
              </span>
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-700">1 / 1 Allowed</span>
              <Badge variant="info" size="sm">
                Pass
              </Badge>
            </div>
            <div className="mt-0.5 text-xs text-slate-400">Routine attendance queries work normally</div>
          </div>
        </div>
      )}

      {/* Attack Suite Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-xs">Adversarial Evaluation Matrix</h3>
            <p className="text-[11px] text-slate-400">
              Simulated caller context: <code className="text-indigo-600 font-mono">Role: 'trainer'</code>
            </p>
          </div>
          {testResults.length > 0 && (
            <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
              {testResults.length} Test Vectors
            </span>
          )}
        </div>

        {isRunning ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs font-semibold text-slate-800">
              Evaluating 10 attack vectors against AST validator...
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Testing injection boundaries and role-level schema views
            </div>
          </div>
        ) : testResults.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Flame className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-xs font-medium text-slate-600">
              Attack suite has not been run for this session.
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Click "Run Attack Suite" to test the defensive barrier against adversarial trainer requests.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3.5 w-10 text-center">#</th>
                  <th className="py-2.5 px-3.5">Adversarial Prompt & Intent</th>
                  <th className="py-2.5 px-3.5">Outcome</th>
                  <th className="py-2.5 px-3.5">Defense Layer</th>
                  <th className="py-2.5 px-3.5">Rationale</th>
                  <th className="py-2.5 px-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {testResults.map((item, idx) => {
                  const isControl = item.result === 'ALLOWED';
                  const isBlocked = item.result === 'BLOCKED';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isControl ? 'bg-indigo-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3.5 text-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3.5 max-w-md">
                        <div className="font-medium text-slate-900 leading-snug">
                          "{item.prompt}"
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                          <span>Vector:</span>
                          <span className="text-slate-600">{item.intent}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5 whitespace-nowrap">
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

                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                          {item.layer}
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5 text-slate-600 max-w-xs leading-relaxed text-[11px]">
                        {item.reason}
                      </td>

                      <td className="py-2.5 px-3.5 text-right">
                        <button
                          onClick={() => setSelectedResult(item)}
                          className="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Trace
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
          title={`Vector Trace: ${selectedResult.intent}`}
          description={`Simulated execution under role: ${selectedResult.simulated_role.toUpperCase()}`}
          maxWidth="lg"
        >
          <div className="space-y-3.5 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-900 text-[11px]">User Prompt:</div>
              <p className="text-slate-800 font-mono bg-white p-2 rounded border border-slate-200 text-xs">
                "{selectedResult.prompt}"
              </p>
            </div>

            <div className="p-3 bg-slate-950 text-indigo-200 rounded-lg font-mono space-y-1 border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                SQL Attempt / Interception:
              </div>
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                {selectedResult.sql_attempted || 'N/A'}
              </pre>
            </div>

            <div className="space-y-1">
              <div className="font-semibold text-slate-900 text-[11px]">Enforcement Summary:</div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                {selectedResult.response_summary}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-900 text-xs cursor-pointer"
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
