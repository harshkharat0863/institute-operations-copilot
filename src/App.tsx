/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar, ALL_NAV_ITEMS } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { Forbidden } from './components/common/Forbidden';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { StudentsView } from './components/students/StudentsView';
import { BatchesView } from './components/batches/BatchesView';
import { FeesView } from './components/fees/FeesView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { CopilotView } from './components/copilot/CopilotView';
import { ApprovalsView } from './components/approvals/ApprovalsView';
import { TimetableView } from './components/timetable/TimetableView';
import { AuditView } from './components/audit/AuditView';
import { RedTeamView } from './components/redteam/RedTeamView';
import { FeeRecognitionView } from './components/fees/FeeRecognitionView';
import { CertificationsView } from './components/certifications/CertificationsView';
import { RecordingsView } from './components/recordings/RecordingsView';
import { DropoutRiskView } from './components/dropout/DropoutRiskView';
import { FailureChainView } from './components/failure_chain/FailureChainView';
import { BookOpen } from 'lucide-react';
import { Modal } from './components/common/Modal';
import { ColdStartNotice } from './components/common/ColdStartNotice';

function MainApp() {
  const { isAuthenticated, role, isLoading, forbiddenScreenTriggered, setForbiddenScreenTriggered } = useAuth();
  const [activeScreen, setActiveScreen] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isReadmeModalOpen, setIsReadmeModalOpen] = useState<boolean>(false);

  // Dynamic per-screen document title
  useEffect(() => {
    const navItem = ALL_NAV_ITEMS.find(item => item.id === activeScreen);
    const title = navItem ? `${navItem.label} | Institute Operations Copilot` : 'Institute Operations Copilot';
    document.title = title;
  }, [activeScreen]);

  // If role changes, ensure activeScreen is allowed
  useEffect(() => {
    if (role && activeScreen) {
      const navItem = ALL_NAV_ITEMS.find(item => item.id === activeScreen);
      if (navItem && !navItem.allowedRoles.includes(role)) {
        setActiveScreen('dashboard');
        setForbiddenScreenTriggered(false);
      }
    }
  }, [role, activeScreen, setForbiddenScreenTriggered]);

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg text-text">
        <div className="text-center space-y-3">
          <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Loading Operations Console...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Route Guard Check
  const currentNav = ALL_NAV_ITEMS.find(n => n.id === activeScreen);
  const isAllowed = currentNav ? (role ? currentNav.allowedRoles.includes(role) : false) : false;

  const renderActiveScreen = () => {
    if (forbiddenScreenTriggered || !isAllowed) {
      return (
        <Forbidden
          attemptedScreen={currentNav?.label || activeScreen}
          onNavigateHome={() => {
            setActiveScreen('dashboard');
            setForbiddenScreenTriggered(false);
          }}
        />
      );
    }

    switch (activeScreen) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveScreen} />;
      case 'copilot':
        return <CopilotView onNavigateToApprovals={() => setActiveScreen('approvals')} />;
      case 'students':
        return <StudentsView />;
      case 'batches':
        return <BatchesView />;
      case 'attendance':
        return <AttendanceView />;
      case 'fees':
        return <FeesView />;
      case 'fee_recognition':
        return <FeesView initialTab="reconciliation" />;
      case 'certifications':
        return <CertificationsView />;
      case 'recordings':
        return <RecordingsView />;
      case 'dropout_risk':
        return <DropoutRiskView />;
      case 'failure_chain':
        return <FailureChainView />;
      case 'approvals':
        return <ApprovalsView />;
      case 'timetable':
        return <TimetableView />;
      case 'audit':
        return <ApprovalsView initialTab="audit" />;
      case 'redteam':
        return <RedTeamView />;
      default:
        return <DashboardView onNavigate={setActiveScreen} />;
    }
  };

  return (
    <div className="min-h-dvh flex flex-col antialiased font-sans bg-bg text-text transition-colors duration-150 overflow-x-hidden">
      <Navbar
        onToggleSidebar={() => setIsMobileMenuOpen(prev => !prev)}
        onNavigateScreen={setActiveScreen}
      />

      <div className="flex flex-1 min-h-[calc(100dvh-3.5rem)]">
        <Sidebar
          activeScreen={activeScreen}
          onSelectScreen={screenId => {
            setActiveScreen(screenId);
            setForbiddenScreenTriggered(false);
            setIsMobileMenuOpen(false);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto max-w-[1280px] mx-auto w-full pb-20 lg:pb-8">
          {renderActiveScreen()}
        </main>
      </div>

      {/* Floating System Architecture button (positioned above bottom tab bar on mobile) */}
      <button
        onClick={() => setIsReadmeModalOpen(true)}
        className="fixed bottom-18 sm:bottom-4 left-3 sm:left-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-surface text-text text-xs font-medium border border-border shadow-md hover:bg-surface-subtle transition-colors cursor-pointer min-h-[36px]"
        title="View Technical Disclosure"
        aria-label="View Technical Disclosure"
      >
        <BookOpen className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
        <span className="hidden sm:inline">Stack & Architecture</span>
      </button>

      {/* Mobile Bottom Tab Bar (screens < 1024px) */}
      <BottomNav
        activeScreen={activeScreen}
        onSelectScreen={screenId => {
          setActiveScreen(screenId);
          setForbiddenScreenTriggered(false);
        }}
      />

      {/* Libraries & Architecture Modal */}
      <Modal
        isOpen={isReadmeModalOpen}
        onClose={() => setIsReadmeModalOpen(false)}
        title="Institute Operations Copilot — Architecture Roster"
        description="Comprehensive technical disclosure and system specification"
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs text-text max-h-[70vh] overflow-y-auto pr-1">
          <div className="p-3 bg-surface-subtle rounded-[6px] border border-border">
            <h4 className="font-semibold text-text mb-1">Core Architecture Principles</h4>
            <p className="text-text-muted leading-relaxed">
              1. <strong>Decoded JWT Roles:</strong> Permissions never trust client inputs; roles are parsed strictly from the verified JWT claims.<br />
              2. <strong>Zero-Trust PII Masking:</strong> Phone numbers are masked at the role boundary (trainers never see student phone or fee details).<br />
              3. <strong>Third Normal Form Database:</strong> Relational PostgreSQL schema with views for fee summaries and attendance velocities.<br />
              4. <strong>Text-to-SQL Guardrails:</strong> Gemini model generates single-statement SQL queries restricted by sqlglot AST parsing and a readonly database role.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-text uppercase tracking-wider text-[11px] mb-2">
              Technology Stack
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-[6px] border border-border bg-surface">
                <span className="font-semibold text-text block font-mono">React 19 & Vite</span>
                <span className="text-text-muted text-[11px]">
                  Modern reactive frontend rendered with fast client bundling and strict typing.
                </span>
              </div>

              <div className="p-2.5 rounded-[6px] border border-border bg-surface">
                <span className="font-semibold text-text block font-mono">Tailwind CSS v4</span>
                <span className="text-text-muted text-[11px]">
                  Calm editorial design tokens, warm off-white surfaces, and deep teal accent.
                </span>
              </div>

              <div className="p-2.5 rounded-[6px] border border-border bg-surface">
                <span className="font-semibold text-text block font-mono">FastAPI & Python 3.14</span>
                <span className="text-text-muted text-[11px]">
                  High-performance async backend with bcrypt password hashing and rate-limited auth.
                </span>
              </div>

              <div className="p-2.5 rounded-[6px] border border-border bg-surface">
                <span className="font-semibold text-text block font-mono">PostgreSQL (3NF) & RLS</span>
                <span className="text-text-muted text-[11px]">
                  Normalized schema with SQL views, read-only safe function, and transactional integrity.
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-surface-subtle rounded-[6px] border border-border">
            <h4 className="font-semibold text-text mb-1">Benchmark Scenario Validation</h4>
            <p className="text-text-muted leading-relaxed text-[11px]">
              • <strong>Java Batch Query:</strong> "Which students in the Java batch have missed three or more classes and have an EMI due this week?" returns flagged students with one-click reminder approvals.<br />
              • <strong>Trainer Refusal:</strong> When Trainer Priya queries fee collections or phone numbers, AST inspection safely refuses the request with a concise explanation.
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => setIsReadmeModalOpen(false)}
              className="px-3.5 py-2 rounded-[6px] bg-accent text-white font-medium hover:bg-accent-hover text-xs transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ColdStartNotice />
          <MainApp />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
