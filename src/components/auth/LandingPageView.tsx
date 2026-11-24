import React from 'react';
import {
  ShieldCheck,
  Calendar,
  Users,
  GraduationCap,
  Receipt,
  Building2,
  ArrowRight,
  Database,
  Layers,
  Video,
  Award,
  ShieldAlert,
  Bot,
  Zap,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { Button } from '../common/Button';

interface LandingPageViewProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen font-sans bg-bg text-text antialiased selection:bg-accent-subtle selection:text-accent-text">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-border bg-surface/90 px-4 sm:px-8 lg:px-12 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-accent flex items-center justify-center text-white">
            <Building2 className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div>
            <span className="font-serif font-medium text-base tracking-tight text-text">
              Institute Operations Copilot
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs text-text-muted">
          <a href="#capabilities" className="hover:text-text transition-colors">Platform Capabilities</a>
          <a href="#copilot" className="hover:text-text transition-colors">Text-to-SQL Copilot</a>
          <a href="#roles" className="hover:text-text transition-colors">Role Governance</a>
          <a href="#dbms" className="hover:text-text transition-colors">DBMS Architecture</a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle variant="button" />

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenAuth('signin')}
          >
            Sign In
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenAuth('signup')}
            icon={<ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />}
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* 2. EDITORIAL HERO SECTION */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 lg:px-12 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] border border-border bg-surface text-xs text-text-muted mb-6">
          <span className="w-2 h-2 rounded-full bg-status-green" />
          <span className="font-medium text-text">Third Normal Form Relational Platform</span>
          <span className="text-text-subtle">•</span>
          <span>PostgreSQL + Gemini AST Guard</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-text leading-[1.15]">
          Editorial operations & AI governance for coaching institutes.
        </h1>

        <p className="mt-6 text-sm sm:text-base text-text-muted max-w-2xl mx-auto leading-relaxed">
          A disciplined DBMS console pairing 3NF schema views, strict role-based access control, automated fee recognition, and an AI SQL Copilot that answers operational queries with read-only database safety.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => onOpenAuth('signin')}
            icon={<ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
          >
            Launch Console (Demo Accounts)
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              const el = document.getElementById('copilot');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Inspect AI SQL Pipeline
          </Button>
        </div>
      </section>

      {/* 3. CORE METRICS STRIP */}
      <section className="border-y border-border bg-surface py-8 px-4 sm:px-8 lg:px-12">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-semibold text-text tabular-nums">3NF</div>
            <div className="text-xs text-text-muted mt-1 uppercase tracking-wider">Normalized Schema</div>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-semibold text-text tabular-nums">4 Tiers</div>
            <div className="text-xs text-text-muted mt-1 uppercase tracking-wider">Role Clearance</div>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-semibold text-text tabular-nums">&lt; 3.0s</div>
            <div className="text-xs text-text-muted mt-1 uppercase tracking-wider">Readonly Timeout</div>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-semibold text-text tabular-nums">100%</div>
            <div className="text-xs text-text-muted mt-1 uppercase tracking-wider">AST Query Audited</div>
          </div>
        </div>
      </section>

      {/* 4. PLATFORM CAPABILITIES */}
      <section id="capabilities" className="py-16 px-4 sm:px-8 lg:px-12 max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-text">
            Operational Capabilities
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-2 max-w-xl mx-auto">
            Engineered around relational integrity, role boundaries, and faculty coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-[8px] p-5">
            <div className="w-8 h-8 rounded-[6px] bg-accent-subtle text-accent-text flex items-center justify-center mb-3">
              <Bot className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-base font-medium text-text">Natural Language SQL Copilot</h3>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              Staff asks queries in plain English. Gemini drafts PostgreSQL SELECT statements validated via sqlglot AST parsing before execution against role-restricted views.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-[8px] p-5">
            <div className="w-8 h-8 rounded-[6px] bg-accent-subtle text-accent-text flex items-center justify-center mb-3">
              <Calendar className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-base font-medium text-text">Constraint Timetable Solver</h3>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              Handles trainer leave, room conflicts, and batch tracks with algorithmic reschedule proposals, conflict audits, and approval workflows.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-[8px] p-5">
            <div className="w-8 h-8 rounded-[6px] bg-accent-subtle text-accent-text flex items-center justify-center mb-3">
              <ShieldAlert className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-base font-medium text-text">Dropout & Risk Diagnostics</h3>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              Correlates attendance dips with pending installment overdue timelines to surface early-warning alerts for counselors and directors.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-[8px] p-5">
            <div className="w-8 h-8 rounded-[6px] bg-accent-subtle text-accent-text flex items-center justify-center mb-3">
              <Receipt className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-base font-medium text-text">Fee Installment Ledgers</h3>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              Granular payments tracking mapped to student EMIs. Derived views compute paid, pending, and overdue balances without redundant denormalized counters.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-[8px] p-5">
            <div className="w-8 h-8 rounded-[6px] bg-accent-subtle text-accent-text flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-base font-medium text-text">Zero-Trust Role Governance</h3>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              Trainers access cohort attendance and timetables but are strictly blocked from phone numbers, fee statuses, and salary ledgers at the schema layer.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-[8px] p-5">
            <div className="w-8 h-8 rounded-[6px] bg-accent-subtle text-accent-text flex items-center justify-center mb-3">
              <Database className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-base font-medium text-text">Audit Trail & Red-Team Suite</h3>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              Immutable logging of every data query, approval decision, and security violation, complete with 10 automated red-team test attack scenarios.
            </p>
          </div>
        </div>
      </section>

      {/* 5. ROLE PROFILES */}
      <section id="roles" className="border-t border-border bg-surface py-16 px-4 sm:px-8 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-text">
              Four Specialized Operational Roles
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-2">
              Every staff member operates inside a tailored interface with strict data boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-border rounded-[8px] p-4 bg-bg">
              <div className="flex items-center justify-between mb-3">
                <Building2 className="w-4 h-4 text-accent" strokeWidth={1.5} />
                <span className="text-[10px] font-semibold uppercase text-accent tracking-wider">Owner</span>
              </div>
              <h4 className="font-serif text-sm font-medium text-text">Director / Owner</h4>
              <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                Full system clearance, revenue forecasting, approval queue decisions, and red-team audit logs.
              </p>
            </div>

            <div className="border border-border rounded-[8px] p-4 bg-bg">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
                <span className="text-[10px] font-semibold uppercase text-text-subtle tracking-wider">Counselor</span>
              </div>
              <h4 className="font-serif text-sm font-medium text-text">Academic Counselor</h4>
              <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                Student admissions, batch allocations, attendance velocity tracking, and parent communication.
              </p>
            </div>

            <div className="border border-border rounded-[8px] p-4 bg-bg">
              <div className="flex items-center justify-between mb-3">
                <GraduationCap className="w-4 h-4 text-status-green" strokeWidth={1.5} />
                <span className="text-[10px] font-semibold uppercase text-status-green tracking-wider">Trainer</span>
              </div>
              <h4 className="font-serif text-sm font-medium text-text">Batch Faculty</h4>
              <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                Class schedules, room assignments, attendance marking. PII and fee records strictly masked.
              </p>
            </div>

            <div className="border border-border rounded-[8px] p-4 bg-bg">
              <div className="flex items-center justify-between mb-3">
                <Receipt className="w-4 h-4 text-status-amber" strokeWidth={1.5} />
                <span className="text-[10px] font-semibold uppercase text-status-amber tracking-wider">Accounts</span>
              </div>
              <h4 className="font-serif text-sm font-medium text-text">Finance & Accounts</h4>
              <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                Installment collections, overdue fee tracking, receipt reconciliation, and payment approval drafts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CTA */}
      <section className="border-t border-border py-16 px-4 sm:px-8 text-center bg-bg">
        <div className="max-w-xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-text">
            Ready to explore the console?
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-2">
            Pre-seeded with 70+ realistic Indian student records, active batches, and faculty timetables.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => onOpenAuth('signin')}
              icon={<ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />}
            >
              Sign In with Demo Account
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-6 px-4 sm:px-8 text-center text-xs text-text-subtle bg-surface">
        Institute Operations Copilot • College DBMS Project • PostgreSQL 3NF • FastAPI • React 19
      </footer>
    </div>
  );
};
