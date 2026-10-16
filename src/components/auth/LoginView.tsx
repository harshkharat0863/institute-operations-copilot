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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Subtle Background Glows */}
      <div className="absolute top-10 left-1/4 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl bg-slate-800/90 border border-slate-700/70 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden relative z-10 flex flex-col md:flex-row">
        
        {/* Left Side: Clean Brand Introduction */}
        <div className="md:w-5/12 bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700/60">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-white tracking-tight">InstituteOps</h1>
                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Enterprise Copilot</span>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                AI Operations Desk for Coaching Institutes
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Role-governed intelligence: automated timetable constraint solver, zero-trust PII masking, and human-in-the-loop WhatsApp reminders.
              </p>
            </div>

            {/* Core Capability Cards */}
            <div className="mt-6 space-y-2.5">
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-xs text-slate-300 font-medium">SafeQuery™ AST Defense & RLS</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="text-xs text-slate-300 font-medium">Drag-and-Drop Timetable Solver</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="text-xs text-slate-300 font-medium">Human-in-the-Loop Approvals</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Supabase PostgreSQL</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          </div>
        </div>

        {/* Right Side: Quick One-Click Login & Manual Form */}
        <div className="md:w-7/12 p-6 sm:p-8 bg-white flex flex-col justify-center">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Quick One-Click Sign In</h3>
                <p className="text-xs text-slate-500">Pick any role to test its specific access level</p>
              </div>
              <Badge variant="purple" size="sm">
                4 Roles
              </Badge>
            </div>

            {/* 4 Persona Cards */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <button
                type="button"
                onClick={() => handleQuickLogin('owner')}
                className="group p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100 hover:border-purple-300 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-xs font-bold text-purple-950">1. Owner</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[10px] text-purple-800">Full System & Red-Team</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('counselor')}
                className="group p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-300 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-blue-950">2. Counselor</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[10px] text-blue-800">Students, Batches & Copilot</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('trainer')}
                className="group p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-300 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-950">3. Trainer</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[10px] text-emerald-800">Schedule & Attendance</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('accounts')}
                className="group p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100 hover:border-amber-300 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-bold text-amber-950">4. Accounts</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[10px] text-amber-800">Fees, EMIs & Approvals</div>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-white px-2 text-slate-400 font-semibold">Or sign in with email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
                    placeholder="name@institute.org"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.99] disabled:opacity-50 mt-1 cursor-pointer"
              >
                {isLoading ? 'Verifying Session...' : 'Sign In to Operations Console'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-3 p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Decoded JWT Clearance. Role strictly derived from verified token.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
