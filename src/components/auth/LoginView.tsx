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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Institute Operations Copilot
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Role-governed AI operations desk for coaching institutes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          {/* Quick Login Buttons (Demo Only) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Quick-Login for Demo Personas
              </span>
              <Badge variant="purple" size="sm">
                4 Strict RBAC Tiers
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('owner')}
                className="flex items-start gap-2.5 p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 transition-all text-left"
              >
                <Building className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-purple-950">1. Owner</div>
                  <div className="text-[11px] text-purple-800">Full platform + Red-team</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('counselor')}
                className="flex items-start gap-2.5 p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 transition-all text-left"
              >
                <UserCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-blue-950">2. Counselor</div>
                  <div className="text-[11px] text-blue-800">Students, Batches, Copilot</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('trainer')}
                className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 transition-all text-left"
              >
                <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">3. Trainer</div>
                  <div className="text-[11px] text-emerald-800">Timetable, NO Fees/Phones</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('accounts')}
                className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 transition-all text-left"
              >
                <Calculator className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-950">4. Accounts</div>
                  <div className="text-[11px] text-amber-800">Fees, EMIs, Approvals</div>
                </div>
              </button>
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">or sign in manually</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="staff@institute.org"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Verifying Token...' : 'Sign In to Operations Console'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>JWT authentication. Role is strictly decoded from JWT claim.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
