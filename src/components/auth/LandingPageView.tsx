import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Calendar,
  Users,
  GraduationCap,
  Receipt,
  Building2,
  ArrowRight,
  CheckCircle2,
  Database,
  Layers,
  Video,
  Award,
  ArrowUpRight,
  ShieldAlert,
  Bot,
  Zap,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../common/ThemeToggle';

interface LandingPageViewProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onOpenAuth }) => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen font-sans selection:bg-indigo-500 selection:text-white antialiased transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* =========================================================================
          1. TOP NAVIGATION BAR
          ========================================================================= */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between transition-colors ${
        isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-white/85 border-slate-200 shadow-xs'
      }`}>
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                InstituteOps
              </span>
            </div>
            <p className={`text-[10px] font-medium hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              AI Operations Platform
            </p>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className={`hidden md:flex items-center gap-6 text-xs font-semibold ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          <a href="#features" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>Platform Capabilities</a>
          <a href="#copilot" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>AI Copilot</a>
          <a href="#timetable" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>Timetable Solver</a>
          <a href="#roles" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>Role Governance</a>
          <a href="#failure-chain" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>Failure Chain</a>
        </nav>

        {/* Right CTA Actions & Theme Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Top Navbar Theme Mode Toggle */}
          <ThemeToggle variant="segmented" />

          <div className={`hidden lg:flex items-center gap-2 px-3 py-1 rounded-full border text-xs ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Database Active</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <button
            onClick={() => onOpenAuth('signin')}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'border-slate-700 hover:border-slate-600 bg-slate-900/60 hover:bg-slate-900 text-slate-200'
                : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 shadow-xs'
            }`}
          >
            Sign In
          </button>

          <button
            onClick={() => onOpenAuth('signup')}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Create Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION
          ========================================================================= */}
      <section className="relative pt-14 pb-18 sm:pt-20 sm:pb-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Glow ambient background lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[250px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-indigo-500" />
            <span>Problem Statement 1: AI Operations Copilot for Coaching Institutes</span>
          </div>

          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            The Central Nervous System for <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-600">
              Modern Coaching Institutes
            </span>
          </h1>

          <p className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Run your entire coaching academy simply by asking. Unify student cohorts, clash-free constraint timetables, hybrid biometric attendance, and EMI ledgers under verified role governance.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth('signin')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Sign In to Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenAuth('signup')}
              className={`w-full sm:w-auto px-7 py-3.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm'
              }`}
            >
              <span>Register New Staff Account</span>
              <Users className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* =====================================================================
              CENTRAL OPTION: THEME MODE CHANGER (DARK MODE / LIGHT MODE)
              ===================================================================== */}
          <div className="pt-3 pb-1 flex items-center justify-center">
            <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${
              isDark
                ? 'bg-slate-900/90 border-slate-800 text-slate-300 shadow-md'
                : 'bg-white border-slate-200 text-slate-700 shadow-md'
            }`}>
              <span className="text-xs font-semibold">Display Theme:</span>
              <ThemeToggle variant="segmented" />
            </div>
          </div>

          {/* Trust points */}
          <div className={`pt-2 flex flex-wrap items-center justify-center gap-6 text-xs ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>4 Distinct Roles (Owner, Counselor, Trainer, Accounts)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero-Trust Read-Only SQL & RBAC</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Human-in-the-Loop Message Approvals</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. CORE PLATFORM CAPABILITIES
          ========================================================================= */}
      <section id="features" className="py-20 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">Core Capabilities</div>
          <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Built Directly For The Real Challenges Of Institute Operations
          </h2>
          <p className={`text-sm sm:text-base mt-3 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Coaching institutes face unique cross-department operational friction. Here is how InstituteOps automates each one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark
              ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}>
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                AI Operations Copilot
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Staff asks questions in plain natural language. The copilot maps queries to approved safe read-only operations, shows the exact query executed for verification, and stages outgoing WhatsApp messages for human approval.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-indigo-500 font-semibold">
              <span>Read-Only Query Transparency</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 2 */}
          <div className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark
              ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}>
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Clash-Free Timetable Solver
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Optimizes across trainer workloads, classroom capacities (30-45 seats), slot timings, and online WebRTC seats. When an instructor is sick or a new batch is added, it re-plans in 54ms and explains every slot movement.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold">
              <span>Sub-Second Constraint Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 3 */}
          <div className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark
              ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}>
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                The Hidden Student Failure Chain
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Breaks departmental silos. Correlates dropping biometric attendance, failed code assignments, overdue fee EMIs, and LMS dropouts to prevent student dropouts with coordinated Counselor-Trainer-Accounts intervention plans.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-rose-500 font-semibold">
              <span>Cross-Department Telemetry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 4 */}
          <div className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark
              ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}>
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Hybrid Attendance Engine
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Unifies on-campus biometric turnstile kiosk check-ins with virtual classroom WebRTC & Zoom SDK logs, recording accurate session durations and IP addresses.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-purple-500 font-semibold">
              <span>Dual-Mode Attendance Tracking</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 5 */}
          <div className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark
              ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}>
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                UPI & Bank OCR Reconciliation
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Upload bank settlement sheets or UPI text feeds. The engine parses UTR numbers, matches against expected student EMI installments, and computes matching confidence scores.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Automated Financial Clearance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 6 */}
          <div className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark
              ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}>
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Verified Certifications & Recordings
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Automated certificate generation verifying 80%+ attendance and zero fee arrears with cryptographic verification codes, plus curated classroom lecture video libraries with code repo links.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-sky-600 dark:text-sky-400 font-semibold">
              <span>Verifiable Academic Credentials</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. ROLE-BASED ACCESS CONTROL (RBAC) GOVERNANCE MATRIX
          ========================================================================= */}
      <section id="roles" className={`py-20 px-4 sm:px-8 lg:px-12 border-t transition-colors ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/70 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">Security & Compliance</div>
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Strict Non-Bypassable Role Clearance
            </h2>
            <p className={`text-sm sm:text-base mt-3 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Every query, UI button, and API endpoint is strictly locked to the user's verified JWT role claims.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Role 1 */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
              isDark ? 'bg-slate-950 border-purple-500/30' : 'bg-white border-purple-200 shadow-xs'
            }`}>
              <div>
                <div className="flex items-center justify-between">
                  <Building2 className="w-5 h-5 text-purple-500" />
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-700/60">
                    TIER 1
                  </span>
                </div>
                <h4 className={`text-base font-bold mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  1. Owner / Director
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Full system clearance, revenue analytics, timetable solver overrides, and red-team security audits.
                </p>
              </div>
              <div className="text-[11px] text-purple-500 font-mono">Unrestricted Authority</div>
            </div>

            {/* Role 2 */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
              isDark ? 'bg-slate-950 border-sky-500/30' : 'bg-white border-sky-200 shadow-xs'
            }`}>
              <div>
                <div className="flex items-center justify-between">
                  <Users className="w-5 h-5 text-sky-500" />
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-300 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-700/60">
                    TIER 2
                  </span>
                </div>
                <h4 className={`text-base font-bold mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  2. Academic Counselor
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Student profiles, dropout risk radar, failure chain interventions, and copilot attendance queries.
                </p>
              </div>
              <div className="text-[11px] text-sky-500 font-mono">Student & Risk Clearance</div>
            </div>

            {/* Role 3 */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
              isDark ? 'bg-slate-950 border-emerald-500/30' : 'bg-white border-emerald-200 shadow-xs'
            }`}>
              <div>
                <div className="flex items-center justify-between">
                  <GraduationCap className="w-5 h-5 text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-700/60">
                    TIER 3
                  </span>
                </div>
                <h4 className={`text-base font-bold mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  3. Batch Trainer
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Assigned cohorts, timetable, attendance logs. Zero access to fee dues, financial tables, or student phone numbers.
                </p>
              </div>
              <div className="text-[11px] text-emerald-500 font-mono">Financial Data Redacted</div>
            </div>

            {/* Role 4 */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
              isDark ? 'bg-slate-950 border-amber-500/30' : 'bg-white border-amber-200 shadow-xs'
            }`}>
              <div>
                <div className="flex items-center justify-between">
                  <Receipt className="w-5 h-5 text-amber-500" />
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-700/60">
                    TIER 4
                  </span>
                </div>
                <h4 className={`text-base font-bold mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  4. Accounts Staff
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Fee collection ledgers, EMI overdue tracking, payment OCR settlement, and reminder outbox approval.
                </p>
              </div>
              <div className="text-[11px] text-amber-500 font-mono">Financial Operations Scope</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. BOTTOM CALL TO ACTION
          ========================================================================= */}
      <section className="py-20 px-4 sm:px-8 lg:px-12 max-w-5xl mx-auto text-center">
        <div className={`p-8 sm:p-12 rounded-3xl border shadow-2xl relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-500/30'
            : 'bg-gradient-to-b from-indigo-50/90 to-white border-indigo-200'
        }`}>
          <div className="relative z-10 space-y-4 max-w-xl mx-auto">
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Ready to streamline your institute's operations?
            </h2>
            <p className={`text-xs sm:text-sm leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Experience the AI Operations Copilot, clash-free timetable scheduler, and multi-department failure chain in action.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onOpenAuth('signin')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Sign In to Console
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white hover:bg-slate-100 text-slate-900'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                Create Staff Account (4 Roles)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FOOTER
          ========================================================================= */}
      <footer className={`border-t py-8 px-4 sm:px-8 lg:px-12 text-center text-xs transition-colors ${
        isDark ? 'border-slate-800/80 bg-slate-950 text-slate-400' : 'border-slate-200 bg-white text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>InstituteOps</span>
            <span>— AI Operations Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>FastAPI Backend</span>
            <span>•</span>
            <span>React & Tailwind CSS</span>
            <span>•</span>
            <span>Supabase Database</span>
            <span>•</span>
            <span>Zero-Trust AST Guard</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
