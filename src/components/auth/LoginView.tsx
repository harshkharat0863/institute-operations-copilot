import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEMO_USERS } from '../../lib/mock/data';
import { UserRole } from '../../types';

const ROLES: { value: UserRole; label: string; emoji: string; name: string }[] = [
  { value: 'owner',     label: 'Owner & Director',    emoji: '👑', name: 'Vikramaditya Mehta' },
  { value: 'counselor', label: 'Academic Counselor',  emoji: '🎓', name: 'Anjali Sharma'       },
  { value: 'trainer',   label: 'Faculty / Trainer',   emoji: '📚', name: 'Priya Sundaram'      },
  { value: 'accounts',  label: 'Accounts Officer',    emoji: '💳', name: 'Suresh Iyer'         },
];

const roleInfo: Record<UserRole, string> = {
  owner:     'Complete administrative access — financials, audit logs & red-team security.',
  counselor: 'Student admissions, attendance logs and WhatsApp outbox follow-ups.',
  trainer:   'Teaching timetable & class attendance. Financials strictly hidden.',
  accounts:  'Fee collections, EMI installments, ledger settlement & payment approvals.',
};

export const LoginView: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [email, setEmail] = useState('owner@institute.org');
  const [password, setPassword] = useState('password123');
  const [remember, setRemember] = useState(true);

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
    const demo = DEMO_USERS[newRole];
    if (demo) setEmail(demo.email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, selectedRole);
      showToast('Welcome back! Signed in successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'error');
    }
  };

  const currentRole = ROLES.find(r => r.value === selectedRole)!;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-[420px]">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

          {/* Card top section */}
          <div className="px-8 pt-10 pb-6 text-center">
            {/* App Icon */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-2xl font-bold shadow-md shadow-indigo-200 mb-5 select-none">
              I
            </div>
            <h1 className="text-[1.6rem] font-bold text-slate-900 tracking-tight leading-tight">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Sign in to access your operations workspace
            </p>
          </div>

          {/* Form section */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">

            {/* Role selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Portal / Role
              </label>
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={e => handleRoleChange(e.target.value as UserRole)}
                  className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition cursor-pointer"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>
                      {r.emoji}  {r.label} — {r.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              {/* Role description */}
              <div className="mt-2 px-3 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-[1px]" />
                <p className="text-[11.5px] text-slate-600 leading-snug">
                  {roleInfo[selectedRole]}
                </p>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="w-[15px] h-[15px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@institute.org"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-[15px] h-[15px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                />
              </div>
              <div className="flex items-center justify-between mt-2.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 cursor-pointer focus:ring-indigo-400"
                  />
                  <span className="text-xs text-slate-500">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.985] shadow-sm transition-all cursor-pointer disabled:opacity-60 mt-1"
            >
              {isLoading ? 'Verifying…' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* Security footer inside card */}
          <div className="border-t border-slate-100 px-8 py-4 flex items-center gap-2 bg-slate-50/60">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="text-[11.5px] text-slate-500 leading-snug">
              Session is encrypted end-to-end via Supabase PostgreSQL. Staff-only portal.
            </p>
          </div>
        </div>

        {/* Below-card copyright */}
        <p className="text-center text-xs text-slate-400 mt-5">
          © 2026 Institute Operations Desk · Internal Staff Portal
        </p>
      </div>
    </div>
  );
};
