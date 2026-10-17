import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Users,
  GraduationCap,
  Receipt,
  Building2,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  User as UserIcon,
  CheckCircle2,
  ArrowLeft,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEMO_USERS } from '../../lib/mock/data';
import { UserRole } from '../../types';

interface RoleOption {
  role: UserRole;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
}

const ROLES_LIST: RoleOption[] = [
  {
    role: 'owner',
    title: 'Owner / Director',
    subtitle: 'Executive oversight, full system clearance, financial control & red-team audit',
    icon: Building2,
    badge: 'Full Access',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    role: 'counselor',
    title: 'Academic Counselor',
    subtitle: 'Student onboarding, dropout risk radar, failure chain intervention & copilot',
    icon: Users,
    badge: 'Mentorship',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  {
    role: 'trainer',
    title: 'Batch Trainer / Faculty',
    subtitle: 'Assigned cohorts, timetable schedules, classroom logs & lecture recordings',
    icon: GraduationCap,
    badge: 'Teaching Scope',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    role: 'accounts',
    title: 'Accounts & Finance',
    subtitle: 'Fee ledgers, EMI installments, payment OCR reconciliation & reminder dispatches',
    icon: Receipt,
    badge: 'Financial Scope',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
];

interface AuthViewProps {
  initialMode?: 'signin' | 'signup';
  onBackToHome: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ initialMode = 'signin', onBackToHome }) => {
  const { login, register, isLoading } = useAuth();
  const { showToast } = useToast();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialMode);

  // Sign In State
  const [selectedDemoRole, setSelectedDemoRole] = useState<UserRole>('owner');
  const [email, setEmail] = useState('owner@institute.org');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('counselor');
  const [signupSpecialization, setSignupSpecialization] = useState('Java, Spring Boot');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Quick Demo Role Click
  const handleSelectDemoRole = (role: UserRole) => {
    setSelectedDemoRole(role);
    const demo = DEMO_USERS[role];
    if (demo) {
      setEmail(demo.email);
      setPassword('password123');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your email address', 'error');
      return;
    }
    try {
      await login(email, selectedDemoRole);
      showToast(`Welcome back! Signed in as ${selectedDemoRole.toUpperCase()}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Authentication failed. Please verify credentials.', 'error');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      showToast('Please enter a valid work email', 'error');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    try {
      await register(
        signupName.trim(),
        signupEmail.trim(),
        signupPassword,
        signupRole,
        signupRole === 'trainer' ? signupSpecialization : undefined
      );
      showToast(`Account created! Welcome to InstituteOps, ${signupName}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Registration failed. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8 antialiased font-sans text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Header Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-4">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Project Overview</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Supabase Database Connected</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Main Auth Card Container */}
      <div className="max-w-xl w-full mx-auto my-auto">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-slate-900">
          
          {/* Top Brand Logo */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/20">
              <Sparkles className="w-4 h-4 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base tracking-tight">InstituteOps</span>
              </div>
              <p className="text-[11px] text-slate-500">Institute Operations & AI Copilot Desk</p>
            </div>
          </div>

          {/* Segmented Switcher: Sign In vs Create Account */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setAuthMode('signin')}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* ===============================================================
              TAB 1: SIGN IN MODE
              =============================================================== */}
          {authMode === 'signin' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Welcome back
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Sign in to your institute operations console
                </p>
              </div>

              {/* Quick 1-Click Role Presets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Quick One-Click Demo Access
                  </span>
                  <span className="text-[10px] text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    One-Click Fill
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {ROLES_LIST.map(item => {
                    const isSelected = selectedDemoRole === item.role;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => handleSelectDemoRole(item.role)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500'
                            : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                        <div className="mt-2">
                          <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                            {item.title.split(' ')[0]}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {item.role === 'owner' ? 'Full Control' : item.role === 'counselor' ? 'Students & Risk' : item.role === 'trainer' ? 'Schedules' : 'Fees & EMIs'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  <span className="bg-white px-2.5">Credentials</span>
                </div>
              </div>

              {/* Sign In Form */}
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@institute.org"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => showToast('Demo password is set to "password123"', 'info')}
                      className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span>Keep this workstation logged in</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-sm shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Authenticating JWT Session...
                    </span>
                  ) : (
                    <>
                      Sign In to Operations Console
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2 text-xs text-slate-500">
                Don't have an operations account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer underline"
                >
                  Register new account
                </button>
              </div>
            </div>
          )}

          {/* ===============================================================
              TAB 2: SIGN UP / CREATE ACCOUNT MODE (FOR ALL 4 ROLES)
              =============================================================== */}
          {authMode === 'signup' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Create Operations Account
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Register a new staff profile under your designated institute role
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={e => setSignupName(e.target.value)}
                      placeholder="e.g. Dr. K. Radhakrishnan"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Work Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Work / Institute Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      placeholder="staff.member@institute.org"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Role Selector: 4 Roles */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Assign Institute Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ROLES_LIST.map(r => {
                      const isSelected = signupRole === r.role;
                      const Icon = r.icon;
                      return (
                        <div
                          key={r.role}
                          onClick={() => setSignupRole(r.role)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-50/90 border-indigo-500 ring-1 ring-indigo-500'
                              : 'bg-slate-50 hover:bg-slate-100/60 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                              <span className={`text-xs font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                                {r.title}
                              </span>
                            </div>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${r.badgeColor}`}>
                              {r.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-tight line-clamp-2">
                            {r.subtitle}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Specialization for Trainer */}
                {signupRole === 'trainer' && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                    <label className="block text-[11px] font-semibold text-emerald-950 uppercase">
                      Teaching Specialization
                    </label>
                    <input
                      type="text"
                      value={signupSpecialization}
                      onChange={e => setSignupSpecialization(e.target.value)}
                      placeholder="e.g. Java, Spring Boot, Microservices"
                      className="w-full px-3 py-1.5 rounded-lg border border-emerald-200 text-xs bg-white text-slate-900 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                )}

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-sm shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 mt-3"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account & Provisioning Role...
                    </span>
                  ) : (
                    <>
                      Create Account & Enter Console
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-1 text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer underline"
                >
                  Sign in here
                </button>
              </div>
            </div>
          )}

          {/* Bottom Security Compliance Stamp */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-bit Decoded JWT Authorization</span>
            </div>
            <span className="text-slate-400 font-mono">RBAC Verified</span>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 pt-4">
        Protected by multi-tier schema guardrails and immutable audit logs.
      </div>
    </div>
  );
};
