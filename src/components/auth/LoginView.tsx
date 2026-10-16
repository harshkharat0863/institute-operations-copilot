import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  Building,
  GraduationCap,
  Calculator,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEMO_USERS } from '../../lib/mock/data';
import { UserRole } from '../../types';
import { Badge } from '../common/Badge';

export const LoginView: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('owner@institute.org');
  const [password, setPassword] = useState('••••••••••');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email);
      showToast('Authenticated successfully via decoded JWT', 'success', 'Welcome');
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'error');
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    const demo = DEMO_USERS[role];
    if (demo) {
      setEmail(demo.email);
      await login(demo.email, role);
      showToast(`Logged in as ${demo.name} (${role.toUpperCase()})`, 'success', 'Quick-Login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden relative z-10">
        
        {/* Left Side: Modern Brand & Feature Showcase */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">InstituteOps</h1>
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest">Enterprise Copilot</span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                AI Operations Desk with Strict Role Governance.
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Empowering coaching institutes to resolve operational bottlenecks, protect PII, automate timetables, and safely query student metrics via natural language.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="mt-8 space-y-3.5">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-200">SafeQuery™ AST Defense</div>
                  <div className="text-[11px] text-slate-400">Protects PII, masked contacts & financial tables from unauthorized roles.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Automated Timetable Solver</div>
                  <div className="text-[11px] text-slate-400">Dynamic drag-and-drop conflict resolution across Mon-Sat schedules.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <UserCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Human-In-The-Loop Approvals</div>
                  <div className="text-[11px] text-slate-400">Review, edit, and bulk-dispatch WhatsApp follow-ups with one click.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>PostgreSQL & Supabase Connected</span>
            <span className="font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              API Online
            </span>
          </div>
        </div>

        {/* Right Side: Interactive Quick Personas & Login Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 bg-white flex flex-col justify-center">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Select Demo Persona</h3>
                <p className="text-xs text-slate-500">One-click instant authentication to explore different access tiers</p>
              </div>
              <Badge variant="purple" size="sm">
                4 RBAC Roles
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('owner')}
                className="group p-3.5 rounded-2xl border border-purple-200 bg-purple-50/40 hover:bg-purple-100/70 hover:border-purple-300 transition-all text-left shadow-xs hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-purple-950">1. Owner</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[11px] text-purple-800 font-medium">Vikramaditya Mehta</div>
                <div className="text-[10px] text-purple-600/80 mt-0.5">Full control + Red-Team Suite</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('counselor')}
                className="group p-3.5 rounded-2xl border border-blue-200 bg-blue-50/40 hover:bg-blue-100/70 hover:border-blue-300 transition-all text-left shadow-xs hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-950">2. Counselor</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[11px] text-blue-800 font-medium">Anjali Sharma</div>
                <div className="text-[10px] text-blue-600/80 mt-0.5">Students roster, Outbox & Copilot</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('trainer')}
                className="group p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/70 hover:border-emerald-300 transition-all text-left shadow-xs hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-950">3. Trainer</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[11px] text-emerald-800 font-medium">Priya Sundaram</div>
                <div className="text-[10px] text-emerald-600/80 mt-0.5">Timetable, Attendance (Zero Fees)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('accounts')}
                className="group p-3.5 rounded-2xl border border-amber-200 bg-amber-50/40 hover:bg-amber-100/70 hover:border-amber-300 transition-all text-left shadow-xs hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-950">4. Accounts</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[11px] text-amber-800 font-medium">Suresh Iyer</div>
                <div className="text-[10px] text-amber-600/80 mt-0.5">Fee ledgers, EMIs & Approvals</div>
              </button>
            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-white px-3 text-slate-400 font-medium">or continue with custom credentials</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all shadow-2xs"
                  placeholder="name@institute.org"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 transition-all shadow-2xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Verifying Session...' : 'Sign In to Operations Console'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center flex items-center justify-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Strict Decoded JWT Token Clearance. No mutable roles accepted.</span>
          </div>
        </div>

      </div>
    </div>
  );
};
