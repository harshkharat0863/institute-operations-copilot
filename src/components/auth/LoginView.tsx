import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Calendar,
  Users,
  GraduationCap,
  Receipt,
  Building2,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEMO_USERS } from '../../lib/mock/data';
import { UserRole } from '../../types';

interface RoleCard {
  role: UserRole;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  bgClass: string;
  borderClass: string;
  textClass: string;
  subtextClass: string;
  arrowClass: string;
  activeRing: string;
}

const ROLE_CARDS: RoleCard[] = [
  {
    role: 'owner',
    title: '1. Owner',
    subtitle: 'Full System & Red-Team',
    icon: Building2,
    bgClass: 'bg-purple-50/70 hover:bg-purple-50',
    borderClass: 'border-purple-200/90',
    textClass: 'text-purple-950',
    subtextClass: 'text-purple-700/80',
    arrowClass: 'text-purple-500',
    activeRing: 'ring-2 ring-purple-500 border-purple-400 bg-purple-50',
  },
  {
    role: 'counselor',
    title: '2. Counselor',
    subtitle: 'Students, Batches & Copilot',
    icon: Users,
    bgClass: 'bg-sky-50/70 hover:bg-sky-50',
    borderClass: 'border-sky-200/90',
    textClass: 'text-sky-950',
    subtextClass: 'text-sky-700/80',
    arrowClass: 'text-sky-500',
    activeRing: 'ring-2 ring-sky-500 border-sky-400 bg-sky-50',
  },
  {
    role: 'trainer',
    title: '3. Trainer',
    subtitle: 'Schedule & Attendance',
    icon: GraduationCap,
    bgClass: 'bg-emerald-50/70 hover:bg-emerald-50',
    borderClass: 'border-emerald-200/90',
    textClass: 'text-emerald-950',
    subtextClass: 'text-emerald-700/80',
    arrowClass: 'text-emerald-500',
    activeRing: 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50',
  },
  {
    role: 'accounts',
    title: '4. Accounts',
    subtitle: 'Fees, EMIs & Approvals',
    icon: Receipt,
    bgClass: 'bg-amber-50/70 hover:bg-amber-50',
    borderClass: 'border-amber-200/90',
    textClass: 'text-amber-950',
    subtextClass: 'text-amber-700/80',
    arrowClass: 'text-amber-500',
    activeRing: 'ring-2 ring-amber-500 border-amber-400 bg-amber-50',
  },
];

export const LoginView: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [email, setEmail] = useState('owner@institute.org');
  const [password, setPassword] = useState('password123');

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    const demo = DEMO_USERS[role];
    if (demo) {
      setEmail(demo.email);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, selectedRole);
      showToast(`Signed in as ${selectedRole.toUpperCase()} successfully`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf8] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      {/* Main Container Card matching reference */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/90 overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT PANEL (Dark Slate/Navy) */}
        <div className="w-full md:w-[42%] bg-[#131b26] p-7 sm:p-9 lg:p-10 flex flex-col justify-between text-white relative">
          <div>
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                <Sparkles className="w-5 h-5 text-indigo-100" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight leading-tight">
                  InstituteOps
                </h2>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  ENTERPRISE COPILOT
                </p>
              </div>
            </div>

            {/* Main Headline */}
            <div className="mt-8">
              <h1 className="text-2xl sm:text-[1.7rem] font-bold text-white leading-snug tracking-tight">
                AI Operations Desk for Coaching Institutes
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed mt-3">
                Role-governed intelligence: automated timetable constraint solver, zero-trust PII masking, and human-in-the-loop WhatsApp reminders.
              </p>
            </div>

            {/* 3 Feature Highlights */}
            <div className="mt-7 space-y-2.5">
              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs font-medium text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero-Trust AST Defense & RLS</span>
              </div>

              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs font-medium text-slate-200">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Drag-and-Drop Timetable Solver</span>
              </div>

              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs font-medium text-slate-200">
                <Users className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Human-in-the-Loop Approvals</span>
              </div>
            </div>
          </div>

          {/* Bottom Supabase Status */}
          <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Supabase PostgreSQL</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (Clean White Form & Role Cards) */}
        <div className="w-full md:w-[58%] p-7 sm:p-9 lg:p-10 flex flex-col justify-between bg-white">
          <div>
            {/* Top Header */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Quick One-Click Sign In
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick any role to test its specific access level
                </p>
              </div>
              <span className="shrink-0 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full">
                4 Roles
              </span>
            </div>

            {/* 4 Role Selector Cards (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROLE_CARDS.map(item => {
                const isSelected = selectedRole === item.role;
                const Icon = item.icon;

                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleSelectRole(item.role)}
                    className={`rounded-xl p-3 border text-left transition-all cursor-pointer ${
                      item.bgClass
                    } ${
                      isSelected ? item.activeRing : item.borderClass
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${item.arrowClass}`} />
                        <span className={`text-xs font-bold ${item.textClass}`}>
                          {item.title}
                        </span>
                      </div>
                      <ArrowRight className={`w-3.5 h-3.5 ${item.arrowClass}`} />
                    </div>
                    <div className={`text-[11px] font-medium mt-1 pl-6 ${item.subtextClass}`}>
                      {item.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-400">
                <span className="bg-white px-3">OR SIGN IN WITH EMAIL</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* EMAIL */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@institute.org"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-sm shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Verifying Session...' : 'Sign In to Operations Console'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Bottom Security Pill */}
          <div className="mt-5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center gap-2 text-[11.5px] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Decoded JWT Clearance. Role strictly derived from verified token.</span>
          </div>
        </div>

      </div>
    </div>
  );
};
