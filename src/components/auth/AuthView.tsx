import React, { useState } from 'react';
import {
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
import { ThemeToggle } from '../common/ThemeToggle';
import { DEMO_ACCOUNTS } from '../../lib/demoAccounts';
import { UserRole } from '../../types';
import { Button } from '../common/Button';

interface RoleOption {
  role: UserRole;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badge: string;
}

const ROLES_LIST: RoleOption[] = [
  {
    role: 'owner',
    title: 'Owner / Director',
    subtitle: 'Executive oversight, full system clearance, financial control & red-team audit',
    icon: Building2,
    badge: 'Full Access',
  },
  {
    role: 'counselor',
    title: 'Academic Counselor',
    subtitle: 'Student onboarding, dropout risk radar, failure chain intervention & copilot',
    icon: Users,
    badge: 'Counseling',
  },
  {
    role: 'trainer',
    title: 'Batch Trainer',
    subtitle: 'Assigned cohorts, timetable schedules, classroom logs & lecture recordings',
    icon: GraduationCap,
    badge: 'Faculty',
  },
  {
    role: 'accounts',
    title: 'Accounts & Finance',
    subtitle: 'Fee ledgers, EMI installments, payment OCR reconciliation & reminder dispatches',
    icon: Receipt,
    badge: 'Financial',
  },
];

interface AuthViewProps {
  initialMode?: 'signin' | 'signup';
  onBackToHome?: () => void;
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

  const handleSelectDemoRole = (role: UserRole) => {
    setSelectedDemoRole(role);
    const demo = DEMO_ACCOUNTS[role];
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.password);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your email address', 'error');
      return;
    }
    if (!password) {
      showToast('Please enter your password', 'error');
      return;
    }
    try {
      await login(email.trim(), password);
      showToast('Welcome back! Signed in successfully.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      showToast(msg, 'error');
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
      showToast(`Account created! Welcome, ${signupName}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 antialiased font-sans bg-bg text-text">
      {/* Top Header Bar */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between pb-6 gap-3">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-subtle transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Overview</span>
        </button>

        <div className="flex items-center gap-2.5">
          <ThemeToggle variant="button" />

          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-text-muted">
            <Database className="w-3.5 h-3.5 text-status-green" strokeWidth={1.5} />
            <span className="hidden sm:inline">Postgres 3NF</span>
            <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
          </div>
        </div>
      </div>

      {/* Main Auth Card Container */}
      <div className="max-w-xl w-full mx-auto my-auto">
        <div className="bg-surface rounded-[8px] p-6 sm:p-8 border border-border">
          {/* Brand Heading */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <div className="w-8 h-8 rounded-[6px] bg-accent flex items-center justify-center text-white">
              <Building2 className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <span className="font-serif text-lg font-medium tracking-tight text-text">
                Institute Operations Copilot
              </span>
              <p className="text-xs text-text-muted">Relational Admin & Operations Console</p>
            </div>
          </div>

          {/* Segmented Switcher */}
          <div className="flex items-center p-0.5 bg-surface-subtle border border-border rounded-[6px] mb-6">
            <button
              type="button"
              onClick={() => setAuthMode('signin')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-surface text-text border border-border shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-surface text-text border border-border shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* TAB 1: SIGN IN */}
          {authMode === 'signin' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-text">
                  Sign In
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Enter your credentials or choose a pre-seeded persona
                </p>
              </div>

              {/* Demo Accounts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-text-subtle uppercase tracking-wider">
                    Demo Accounts
                  </span>
                  <span className="text-[10px] text-text-muted font-mono bg-surface-subtle px-1.5 py-0.5 rounded-[4px] border border-border">
                    pwd: password123
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {ROLES_LIST.map(item => {
                    const isSelected = selectedDemoRole === item.role;
                    const Icon = item.icon;
                    const demo = DEMO_ACCOUNTS[item.role];
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => handleSelectDemoRole(item.role)}
                        className={`p-2.5 rounded-[6px] border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-accent-subtle border-accent/40 text-accent-text'
                            : 'bg-surface hover:bg-surface-subtle border-border text-text'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />}
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-medium leading-tight">
                            {item.title.split(' ')[0]}
                          </div>
                          <div className="text-[10px] text-text-muted font-mono truncate mt-0.5">
                            {demo.email}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSignIn} className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@institute.org"
                      className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-border text-xs text-text bg-surface placeholder:text-text-subtle focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-text">
                      Password
                    </label>
                    <span className="text-[11px] text-text-subtle">
                      Default: password123
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-9 py-2 rounded-[6px] border border-border text-xs text-text bg-surface placeholder:text-text-subtle focus:border-accent font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-text-muted">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded-[3px] accent-accent"
                    />
                    <span>Remember workstation</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="w-full mt-2"
                  icon={<ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />}
                >
                  Sign In
                </Button>
              </form>
            </div>
          )}

          {/* TAB 2: SIGN UP */}
          {authMode === 'signup' && (
            <div className="space-y-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-text">
                  Register Account
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Create a staff account with designated operational role
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 text-text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={e => setSignupName(e.target.value)}
                      placeholder="e.g. Anand Kumar"
                      className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-border text-xs text-text bg-surface placeholder:text-text-subtle focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      placeholder="name@institute.org"
                      className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-border text-xs text-text bg-surface placeholder:text-text-subtle focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-9 py-2 rounded-[6px] border border-border text-xs text-text bg-surface placeholder:text-text-subtle focus:border-accent font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text cursor-pointer"
                    >
                      {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1.5">
                    Select Staff Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {ROLES_LIST.filter(r => r.role !== 'owner').map(r => {
                      const isSelected = signupRole === r.role;
                      const Icon = r.icon;
                      return (
                        <div
                          key={r.role}
                          onClick={() => setSignupRole(r.role)}
                          className={`p-2.5 rounded-[6px] border text-left cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-accent-subtle border-accent/40 text-accent-text'
                              : 'bg-surface hover:bg-surface-subtle border-border text-text'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span className="text-xs font-medium capitalize">
                              {r.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-text-muted mt-1 leading-tight line-clamp-2">
                            {r.subtitle}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {signupRole === 'trainer' && (
                  <div className="p-3 bg-surface-subtle border border-border rounded-[6px] space-y-1">
                    <label className="block text-[11px] font-medium text-text">
                      Teaching Subject / Track
                    </label>
                    <input
                      type="text"
                      value={signupSpecialization}
                      onChange={e => setSignupSpecialization(e.target.value)}
                      placeholder="e.g. Java, Python, Web Dev"
                      className="w-full px-2.5 py-1.5 rounded-[4px] border border-border text-xs bg-surface text-text focus:border-accent"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="w-full mt-3"
                  icon={<ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />}
                >
                  Create Staff Account
                </Button>
              </form>
            </div>
          )}

          {/* Bottom Security Compliance Stamp */}
          <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
              <span>Verified Role Claims</span>
            </div>
            <span className="text-text-subtle font-mono text-[10px]">Least Privilege Enforced</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-text-subtle pt-4">
        Protected by PostgreSQL schema boundaries and immutable audit logs.
      </div>
    </div>
  );
};
