import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEMO_USERS } from '../../lib/mock/data';
import { UserRole } from '../../types';

export const LoginView: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [email, setEmail] = useState('owner@institute.org');
  const [password, setPassword] = useState('••••••••••');

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
    const demo = DEMO_USERS[newRole];
    if (demo) {
      setEmail(demo.email);
    }
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, selectedRole);
      showToast('Welcome back! Signed in successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'error');
    }
  };

  const roleDescriptions: Record<UserRole, { title: string; subtitle: string }> = {
    owner: {
      title: 'Director / Institute Owner',
      subtitle: 'Complete administrative access, financial ledgers, audit logs & red-team security.',
    },
    counselor: {
      title: 'Academic Counselor',
      subtitle: 'Student admissions, attendance logs, and WhatsApp outbox follow-ups.',
    },
    trainer: {
      title: 'Faculty / Trainer',
      subtitle: 'Teaching timetable & class attendance. Financials & contact numbers strictly hidden.',
    },
    accounts: {
      title: 'Accounts Officer',
      subtitle: 'Fee collections, EMI installments, ledger settlement & payment approvals.',
    },
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-8 sm:px-6 font-sans">
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 mb-3">
            <Building className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Institute Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Sign in to access your administrative operations workspace
          </p>
        </div>

        {/* Clean Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-8">
          <form onSubmit={handleQuickSubmit} className="space-y-4">

            {/* Role Dropdown Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Your Role / Portal
              </label>
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={e => handleRoleChange(e.target.value as UserRole)}
                  className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-medium focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-hidden transition-all cursor-pointer"
                >
                  <option value="owner">👑 Owner & Director (Vikramaditya Mehta)</option>
                  <option value="counselor">🎓 Academic Counselor (Anjali Sharma)</option>
                  <option value="trainer">📚 Faculty / Trainer (Priya Sundaram)</option>
                  <option value="accounts">💳 Accounts Officer (Suresh Iyer)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>

              {/* Dynamic Scope Helper */}
              <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-600 leading-snug">
                  <strong className="text-slate-800 font-semibold">{roleDescriptions[selectedRole].title}: </strong>
                  {roleDescriptions[selectedRole].subtitle}
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-hidden transition-all"
                  placeholder="name@institute.org"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                Remember this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-xs transition-all cursor-pointer disabled:opacity-50 mt-1"
            >
              {isLoading ? 'Verifying Session...' : 'Sign In to Operations Console'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Clean Security Footer */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500 text-center">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>256-bit encrypted session • Supabase PostgreSQL active</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-400">
          © 2026 Institute Operations Desk • Internal Staff Portal
        </div>

      </div>
    </div>
  );
};
