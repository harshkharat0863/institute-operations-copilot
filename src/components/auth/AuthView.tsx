import React, { useState, useEffect } from 'react';
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  MessageSquare,
  CheckSquare,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { DEMO_ACCOUNTS } from '../../lib/demoAccounts';
import { UserRole } from '../../types';
import { api } from '../../lib/api';
import { Modal } from '../common/Modal';

interface PublicStats {
  classes_today: number;
  active_students: number;
  attendance_rate_30d: number;
  emis_due_this_week: number;
}

interface DemoRoleConfig {
  role: UserRole;
  label: string;
  summary: string;
}

const DEMO_ROLES: DemoRoleConfig[] = [
  {
    role: 'owner',
    label: 'Owner',
    summary: 'Full oversight & financials',
  },
  {
    role: 'counselor',
    label: 'Counselor',
    summary: 'Batches, attendance & outreach',
  },
  {
    role: 'trainer',
    label: 'Trainer',
    summary: 'Schedules & cohort logs',
  },
  {
    role: 'accounts',
    label: 'Accounts',
    summary: 'Fee ledgers & EMI collections',
  },
];

export const AuthView: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const { showToast } = useToast();

  // Page title
  useEffect(() => {
    document.title = 'Institute Operations — Run your institute from one place';
  }, []);

  // Form State
  const [selectedDemoRole, setSelectedDemoRole] = useState<UserRole | null>('owner');
  const [email, setEmail] = useState('owner@institute.org');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Stats State
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeAgoText, setTimeAgoText] = useState('Updated just now');

  // Register Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('counselor');
  const [regSpecialization, setRegSpecialization] = useState('Fullstack Development');
  const [isRegistering, setIsRegistering] = useState(false);

  // Fetch Public Live Stats
  const fetchStats = async () => {
    try {
      const data = await api.getPublicStats();
      setStats(data);
      setStatsError(false);
      setLastUpdated(new Date());
      setTimeAgoText('Updated just now');
    } catch (err) {
      console.warn('Could not fetch public stats:', err);
      setStatsError(true);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 60 seconds
    const statsInterval = setInterval(fetchStats, 60000);

    // Update relative timestamp string
    const tickInterval = setInterval(() => {
      const diffSecs = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (diffSecs < 60) {
        setTimeAgoText('Updated just now');
      } else {
        const mins = Math.floor(diffSecs / 60);
        setTimeAgoText(`Updated ${mins}m ago`);
      }
    }, 15000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(tickInterval);
    };
  }, [lastUpdated]);

  const handleSelectDemoRole = (role: UserRole) => {
    setSelectedDemoRole(role);
    setErrorMessage(null);
    const demo = DEMO_ACCOUNTS[role];
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.password);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(cleanEmail, password);
      showToast('Signed in successfully', 'success');
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : '';
      if (raw.toLowerCase().includes('invalid') || raw.toLowerCase().includes('unauthorized') || raw.toLowerCase().includes('401')) {
        setErrorMessage('Wrong email or password');
      } else if (raw.toLowerCase().includes('rate')) {
        setErrorMessage('Too many attempts. Please wait a moment and try again.');
      } else if (raw) {
        setErrorMessage(raw);
      } else {
        setErrorMessage('Wrong email or password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    if (regPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setIsRegistering(true);
    try {
      await register(
        regName.trim(),
        regEmail.trim(),
        regPassword,
        regRole,
        regRole === 'trainer' ? regSpecialization : undefined
      );
      showToast('Account created successfully', 'success');
      setIsRegisterOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      showToast(msg, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  // -------------------------------------------------------------
  // REUSABLE SUB-SECTIONS
  // -------------------------------------------------------------

  const renderTodayStatsCard = () => (
    <div className="bg-surface border border-border rounded-[8px] p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-serif font-medium text-sm text-text">
          Today at the institute
        </h2>
        <span className="text-[11px] font-mono text-text-subtle">
          {statsError ? 'Offline' : timeAgoText}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border mt-4">
        {/* Stat 1: Classes Scheduled Today */}
        <div>
          <div className="text-xl sm:text-2xl font-serif font-medium text-text tabular-nums">
            {isLoadingStats ? (
              <div className="h-7 w-12 bg-surface-muted rounded animate-pulse" />
            ) : statsError || stats === null ? (
              '-'
            ) : (
              stats.classes_today
            )}
          </div>
          <div className="text-[11px] text-text-muted leading-tight mt-1">
            Classes today
          </div>
        </div>

        {/* Stat 2: Active Students */}
        <div>
          <div className="text-xl sm:text-2xl font-serif font-medium text-text tabular-nums">
            {isLoadingStats ? (
              <div className="h-7 w-12 bg-surface-muted rounded animate-pulse" />
            ) : statsError || stats === null ? (
              '-'
            ) : (
              stats.active_students
            )}
          </div>
          <div className="text-[11px] text-text-muted leading-tight mt-1">
            Active students
          </div>
        </div>

        {/* Stat 3: Average Attendance Rate */}
        <div>
          <div className="text-xl sm:text-2xl font-serif font-medium text-text tabular-nums">
            {isLoadingStats ? (
              <div className="h-7 w-14 bg-surface-muted rounded animate-pulse" />
            ) : statsError || stats === null ? (
              '-'
            ) : (
              `${stats.attendance_rate_30d}%`
            )}
          </div>
          <div className="text-[11px] text-text-muted leading-tight mt-1">
            Avg attendance (30d)
          </div>
        </div>

        {/* Stat 4: EMIs Due This Week */}
        <div>
          <div className="text-xl sm:text-2xl font-serif font-medium text-text tabular-nums">
            {isLoadingStats ? (
              <div className="h-7 w-12 bg-surface-muted rounded animate-pulse" />
            ) : statsError || stats === null ? (
              '-'
            ) : (
              stats.emis_due_this_week
            )}
          </div>
          <div className="text-[11px] text-text-muted leading-tight mt-1">
            EMIs due this week
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeaturesList = () => (
    <div className="space-y-4 pt-2">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-[6px] bg-surface border border-border text-accent shrink-0 mt-0.5">
          <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-text">
            Ask questions in plain English
          </h3>
          <p className="text-xs text-text-muted leading-relaxed mt-0.5">
            Query students, attendance velocity, and fee dues without writing code or formulas.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="p-2 rounded-[6px] bg-surface border border-border text-accent shrink-0 mt-0.5">
          <CheckSquare className="w-4 h-4" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-text">
            Approve reminders before they go out
          </h3>
          <p className="text-xs text-text-muted leading-relaxed mt-0.5">
            Review, edit, or reject staged WhatsApp reminders in an approvals queue.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="p-2 rounded-[6px] bg-surface border border-border text-accent shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-text">
            Each role sees only what it needs
          </h3>
          <p className="text-xs text-text-muted leading-relaxed mt-0.5">
            Directors, counselors, trainers, and accounts get distinct role-governed views.
          </p>
        </div>
      </div>
    </div>
  );

  const renderSignInForm = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text tracking-tight">
          Sign in
        </h2>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Select a role below for one-click access or enter your credentials.
        </p>
      </div>

      {/* Inline Error Message */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-5 p-3 rounded-[6px] bg-status-red/10 border border-status-red/30 text-status-red text-xs flex items-center gap-2.5 animate-in fade-in duration-150"
        >
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Try a demo account */}
      <div className="mb-6">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-2.5">
          Try a demo account
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DEMO_ROLES.map(({ role, label, summary }) => {
            const isSelected = selectedDemoRole === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => handleSelectDemoRole(role)}
                className={`p-2.5 rounded-[6px] border text-left transition-colors cursor-pointer min-h-[44px] flex flex-col justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSelected
                    ? 'border-accent bg-accent-subtle/50 text-text ring-1 ring-accent'
                    : 'border-border bg-surface hover:bg-surface-subtle text-text'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-text">{label}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  )}
                </div>
                <span className="text-[11px] text-text-muted truncate mt-0.5">
                  {summary}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label
            htmlFor="signin-email"
            className="block text-xs font-medium text-text mb-1.5"
          >
            Email address
          </label>
          <div className="relative">
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setErrorMessage(null);
                setSelectedDemoRole(null);
              }}
              required
              autoComplete="email"
              placeholder="name@institute.org"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-[6px] border border-border bg-bg text-text text-[16px] placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="signin-password"
            className="block text-xs font-medium text-text mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setErrorMessage(null);
              }}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-[6px] border border-border bg-bg text-text text-[16px] placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 top-1 bottom-1 px-3 min-w-[44px] flex items-center justify-center text-text-muted hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[4px] cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Eye className="w-4 h-4" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="w-full min-h-[44px] py-2.5 px-4 rounded-[6px] bg-accent text-white font-medium hover:bg-accent-hover transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-60 mt-2 shadow-xs"
        >
          {isSubmitting || isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign in</span>
          )}
        </button>
      </form>

      {/* Small Register Text Link */}
      <div className="text-center mt-5 pt-4 border-t border-border text-xs text-text-muted">
        Need an account?{' '}
        <button
          type="button"
          onClick={() => {
            setIsRegisterOpen(true);
            setErrorMessage(null);
          }}
          className="text-accent font-medium hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1 py-0.5"
        >
          Register
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-bg text-text antialiased font-sans flex flex-col overflow-x-hidden selection:bg-accent-subtle selection:text-accent-text">
      {/* ========================================================= */}
      {/* DESKTOP LAYOUT (1024px and wider: 2 columns, full viewport) */}
      {/* ========================================================= */}
      <div className="hidden lg:grid lg:grid-cols-12 min-h-dvh w-full">
        {/* Left Column (Brand Panel, ~58% width) */}
        <aside className="lg:col-span-7 bg-bg border-r border-border p-8 lg:p-14 flex flex-col justify-between overflow-y-auto">
          {/* Top Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[6px] bg-accent flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <span className="font-serif font-medium text-base text-text tracking-tight">
              Institute Operations
            </span>
          </div>

          {/* Main Brand & Live Stats Area */}
          <div className="py-8 space-y-8 max-w-xl">
            <div>
              <h1 className="font-serif text-4xl lg:text-[42px] font-normal leading-[1.15] text-text tracking-tight">
                Run your institute from one place.
              </h1>
              <p className="text-text-muted text-sm sm:text-base leading-relaxed mt-3">
                Students, batches, attendance, fees and timetables, with an assistant that answers questions from your own data.
              </p>
            </div>

            {/* "Today at the institute" Live Card */}
            {renderTodayStatsCard()}

            {/* 3 Plain-Language Features */}
            {renderFeaturesList()}
          </div>

          {/* Bottom spacing */}
          <div className="text-[11px] text-text-subtle">
            Single unified operations workspace
          </div>
        </aside>

        {/* Right Column (Sign-in Form, ~42% width) */}
        <main className="lg:col-span-5 bg-surface p-8 lg:p-12 flex flex-col justify-between overflow-y-auto">
          {/* Top Theme Toggle */}
          <div className="flex items-center justify-end">
            <ThemeToggle variant="button" />
          </div>

          {/* Form Content */}
          <div className="py-6 flex items-center justify-center">
            {renderSignInForm()}
          </div>

          {/* Quiet Footer */}
          <footer className="pt-6">
            <p className="text-center text-xs text-text-subtle">
              Demo project. Data is sample data.
            </p>
          </footer>
        </main>
      </div>

      {/* ========================================================= */}
      {/* MOBILE LAYOUT (Below 1024px: Single column, Sign-in FIRST) */}
      {/* ========================================================= */}
      <div className="lg:hidden flex flex-col min-h-dvh w-full px-4 py-6 sm:px-6 sm:py-8 max-w-md mx-auto justify-between">
        {/* Mobile Header Bar */}
        <header className="flex items-center justify-between pb-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[6px] bg-accent flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <span className="font-serif font-medium text-base text-text tracking-tight">
              Institute Operations
            </span>
          </div>
          <ThemeToggle variant="button" />
        </header>

        {/* Mobile Main Stack */}
        <main className="py-6 space-y-8">
          {/* Mobile Headline */}
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal leading-tight text-text tracking-tight">
              Run your institute from one place.
            </h1>
            <p className="text-text-muted text-xs sm:text-sm leading-relaxed mt-2">
              Students, batches, attendance, fees and timetables, with an assistant that answers questions from your own data.
            </p>
          </div>

          {/* 1. Sign-in Form FIRST on mobile */}
          <div className="bg-surface p-5 sm:p-6 rounded-[8px] border border-border shadow-xs">
            {renderSignInForm()}
          </div>

          {/* 2. "Today at the institute" card SECOND on mobile */}
          {renderTodayStatsCard()}

          {/* 3. Feature list THIRD on mobile */}
          <div className="bg-surface p-5 sm:p-6 rounded-[8px] border border-border shadow-xs">
            <h2 className="font-serif font-medium text-sm text-text mb-4">
              Core Capabilities
            </h2>
            {renderFeaturesList()}
          </div>
        </main>

        {/* Mobile Footer */}
        <footer className="pt-4 pb-2 border-t border-border">
          <p className="text-center text-xs text-text-subtle">
            Demo project. Data is sample data.
          </p>
        </footer>
      </div>

      {/* ========================================================= */}
      {/* REGISTER ACCOUNT MODAL */}
      {/* ========================================================= */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Staff Account"
        description="Create credentials for academic or operations staff."
        maxWidth="md"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs text-text">
          <div>
            <label htmlFor="reg-name" className="block font-medium text-text mb-1">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              value={regName}
              onChange={e => setRegName(e.target.value)}
              required
              placeholder="e.g. Aditi Rao"
              className="w-full min-h-[44px] px-3 py-2 rounded-[6px] border border-border bg-bg text-text text-[16px] focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block font-medium text-text mb-1">
              Work Email
            </label>
            <input
              id="reg-email"
              type="email"
              value={regEmail}
              onChange={e => setRegEmail(e.target.value)}
              required
              placeholder="aditi@institute.org"
              className="w-full min-h-[44px] px-3 py-2 rounded-[6px] border border-border bg-bg text-text text-[16px] focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block font-medium text-text mb-1">
              Password (min. 6 characters)
            </label>
            <input
              id="reg-password"
              type="password"
              value={regPassword}
              onChange={e => setRegPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full min-h-[44px] px-3 py-2 rounded-[6px] border border-border bg-bg text-text text-[16px] focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="reg-role" className="block font-medium text-text mb-1">
              Role Permission
            </label>
            <select
              id="reg-role"
              value={regRole}
              onChange={e => setRegRole(e.target.value as UserRole)}
              className="w-full min-h-[44px] px-3 py-2 rounded-[6px] border border-border bg-bg text-text text-[16px] focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="counselor">Academic Counselor</option>
              <option value="trainer">Batch Trainer</option>
              <option value="accounts">Accounts & Finance</option>
            </select>
          </div>

          {regRole === 'trainer' && (
            <div>
              <label htmlFor="reg-spec" className="block font-medium text-text mb-1">
                Faculty Specialization
              </label>
              <input
                id="reg-spec"
                type="text"
                value={regSpecialization}
                onChange={e => setRegSpecialization(e.target.value)}
                placeholder="e.g. Java, Spring Boot"
                className="w-full min-h-[44px] px-3 py-2 rounded-[6px] border border-border bg-bg text-text text-[16px] focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-[6px] border border-border bg-surface text-text font-medium hover:bg-surface-subtle transition-colors cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRegistering}
              className="min-h-[44px] px-4 py-2 rounded-[6px] bg-accent text-white font-medium hover:bg-accent-hover transition-colors text-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isRegistering && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Account</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
