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
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Bot,
  Zap,
} from 'lucide-react';

interface LandingPageViewProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white antialiased">
      
      {/* =========================================================================
          1. TOP NAVIGATION BAR
          ========================================================================= */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight">InstituteOps</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 bg-indigo-950/80 border border-indigo-700/60 px-2 py-0.5 rounded-full">
                ENTERPRISE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">AI Operations Platform</p>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Platform Capabilities</a>
          <a href="#copilot" className="hover:text-white transition-colors">AI Copilot</a>
          <a href="#timetable" className="hover:text-white transition-colors">Timetable Solver</a>
          <a href="#roles" className="hover:text-white transition-colors">Role Governance</a>
          <a href="#failure-chain" className="hover:text-white transition-colors">Failure Chain</a>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Database Active</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <button
            onClick={() => onOpenAuth('signin')}
            className="px-3.5 py-1.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-900/60 hover:bg-slate-900 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
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
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Glow ambient background lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[250px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Problem Statement 1: AI Operations Copilot for Coaching Institutes</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            The Central Nervous System for <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200">
              Modern Coaching Institutes
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Run your entire coaching academy simply by asking. Unify student cohorts, clash-free constraint timetables, hybrid biometric attendance, and EMI ledgers under verified role governance.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth('signin')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Sign In to Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-sm font-semibold text-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Register New Staff Account</span>
              <Users className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Trust points */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>4 Distinct Roles (Owner, Counselor, Trainer, Accounts)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Trust Read-Only SQL & RBAC</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Human-in-the-Loop Message Approvals</span>
            </div>
          </div>
        </div>

        {/* Product Visual Mockup / Interface Snapshot */}
        <div className="mt-14 relative z-10 rounded-2xl p-2 bg-gradient-to-b from-slate-700/60 to-slate-800/40 border border-slate-700/60 shadow-2xl max-w-5xl mx-auto">
          <div className="rounded-xl bg-slate-900 overflow-hidden border border-slate-800 p-4 sm:p-6">
            {/* Mock Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-xs text-slate-400">operations-console.institute.internal</span>
              </div>
              <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-2.5 py-0.5 rounded-full">
                PS1 Benchmark Verified
              </span>
            </div>

            {/* Mock Preview Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
              {/* Card 1: Copilot NLP Ask */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                  <Bot className="w-4 h-4" />
                  <span>Natural Language Query</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300">
                  "Which students in the Java batch missed three or more classes and have an EMI due this week?"
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Identified 4 flagged students + 1-click WhatsApp staging</span>
                </div>
              </div>

              {/* Card 2: Clash-Free Timetable Re-plan */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                  <Calendar className="w-4 h-4" />
                  <span>Clash-Free Solver (&lt; 60ms)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300">
                  Trainer unavailable on Tuesday ➔ shifted 3 sessions to Wednesday/Thursday with 0 clashes.
                </div>
                <div className="text-[11px] text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Room capacity (45 seats) & online limits verified</span>
                </div>
              </div>

              {/* Card 3: The Hidden Student Failure Chain */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Failure Chain Correlation</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300">
                  Correlates attendance, failed quizzes, unpaid EMIs, and idle LMS telemetry into a unified action plan.
                </div>
                <div className="text-[11px] text-sky-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span>Replaces fragmented alerts with Counselor-Trainer sync</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. 4-PILLAR OPERATIONAL METRICS BAR
          ========================================================================= */}
      <section className="border-y border-slate-800 bg-slate-900/50 py-10 px-4 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">0 Clashes</div>
            <div className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">Multi-Resource Timetable Solver</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400 tracking-tight">4 Roles</div>
            <div className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">Non-Bypassable Schema Guardrails</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight">99.8%</div>
            <div className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">Hybrid Attendance Verification</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-sky-400 tracking-tight">100% Audit</div>
            <div className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">Immutable Query & Action History</div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. CORE PLATFORM CAPABILITIES
          ========================================================================= */}
      <section id="features" className="py-20 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Core Capabilities</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built Directly For The Real Challenges Of Institute Operations
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
            Coaching institutes face unique cross-department operational friction. Here is how InstituteOps automates each one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">AI Operations Copilot</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Staff asks questions in plain natural language. The copilot maps queries to approved safe read-only operations, shows the exact query executed for verification, and stages outgoing WhatsApp messages for human approval.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-indigo-400 font-semibold">
              <span>Read-Only Query Transparency</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Clash-Free Timetable Solver</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Optimizes across trainer workloads, classroom capacities (30-45 seats), slot timings, and online WebRTC seats. When an instructor is sick or a new batch is added, it re-plans in 54ms and explains every slot movement.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-amber-400 font-semibold">
              <span>Sub-Second Constraint Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">The Hidden Student Failure Chain</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Breaks departmental silos. Correlates dropping biometric attendance, failed code assignments, overdue fee EMIs, and LMS dropouts to prevent student dropouts with coordinated Counselor-Trainer-Accounts intervention plans.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-rose-400 font-semibold">
              <span>Cross-Department Telemetry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Hybrid Attendance Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Unifies on-campus biometric turnstile kiosk check-ins with virtual classroom WebRTC & Zoom SDK logs, recording accurate session durations and IP addresses.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-purple-400 font-semibold">
              <span>Dual-Mode Attendance Tracking</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">UPI & Bank OCR Reconciliation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload bank settlement sheets or UPI text feeds. The engine parses UTR numbers, matches against expected student EMI installments, and computes matching confidence scores.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-400 font-semibold">
              <span>Automated Financial Clearance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Verified Certifications & Recordings</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated certificate generation verifying 80%+ attendance and zero fee arrears with cryptographic verification codes, plus curated classroom lecture video libraries with code repo links.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-sky-400 font-semibold">
              <span>Verifiable Academic Credentials</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. ROLE-BASED ACCESS CONTROL (RBAC) GOVERNANCE MATRIX
          ========================================================================= */}
      <section id="roles" className="py-20 px-4 sm:px-8 lg:px-12 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Security & Compliance</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Strict Non-Bypassable Role Clearance
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
              Every query, UI button, and API endpoint is strictly locked to the user's verified JWT role claims.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Role 1 */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-purple-500/30 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Building2 className="w-5 h-5 text-purple-400" />
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-700/60">
                    TIER 1
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mt-3">1. Owner / Director</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Full system clearance, revenue analytics, timetable solver overrides, and red-team security audits.
                </p>
              </div>
              <div className="text-[11px] text-purple-300 font-mono">Unrestricted Authority</div>
            </div>

            {/* Role 2 */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-sky-500/30 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Users className="w-5 h-5 text-sky-400" />
                  <span className="text-[10px] font-bold text-sky-300 bg-sky-950 px-2 py-0.5 rounded border border-sky-700/60">
                    TIER 2
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mt-3">2. Academic Counselor</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Student profiles, dropout risk radar, failure chain interventions, and copilot attendance queries.
                </p>
              </div>
              <div className="text-[11px] text-sky-300 font-mono">Student & Risk Clearance</div>
            </div>

            {/* Role 3 */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700/60">
                    TIER 3
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mt-3">3. Batch Trainer</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Assigned cohorts, timetable, attendance logs. Zero access to fee dues, financial tables, or student phone numbers.
                </p>
              </div>
              <div className="text-[11px] text-emerald-300 font-mono">Financial Data Redacted</div>
            </div>

            {/* Role 4 */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Receipt className="w-5 h-5 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-700/60">
                    TIER 4
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mt-3">4. Accounts Staff</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Fee collection ledgers, EMI overdue tracking, payment OCR settlement, and reminder outbox approval.
                </p>
              </div>
              <div className="text-[11px] text-amber-300 font-mono">Financial Operations Scope</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. BOTTOM CALL TO ACTION
          ========================================================================= */}
      <section className="py-20 px-4 sm:px-8 lg:px-12 max-w-5xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-indigo-950/80 to-slate-900 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-4 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to streamline your institute's operations?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
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
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-xs sm:text-sm font-semibold text-slate-900 transition-all cursor-pointer"
              >
                Create Staff Account (4 Roles)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FOOTER
          ========================================================================= */}
      <footer className="border-t border-slate-800/80 py-8 px-4 sm:px-8 lg:px-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="font-bold text-slate-300">InstituteOps</span>
            <span>— AI Operations Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
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
