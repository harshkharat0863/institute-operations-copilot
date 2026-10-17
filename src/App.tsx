/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar, ALL_NAV_ITEMS } from './components/common/Sidebar';
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
import { Info, BookOpen, Layers, Download } from 'lucide-react';
import { Modal } from './components/common/Modal';

function MainApp() {
  const { isAuthenticated, role, isLoading, forbiddenScreenTriggered, setForbiddenScreenTriggered } = useAuth();
  const [activeScreen, setActiveScreen] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isReadmeModalOpen, setIsReadmeModalOpen] = useState<boolean>(false);

  // If role changes, ensure activeScreen is allowed
  useEffect(() => {
    if (role && activeScreen) {
      const navItem = ALL_NAV_ITEMS.find(item => item.id === activeScreen);
      if (navItem && !navItem.allowedRoles.includes(role)) {
        // Fallback to dashboard if currently on a screen not allowed for new role
        setActiveScreen('dashboard');
        setForbiddenScreenTriggered(false);
      }
    }
  }, [role, activeScreen, setForbiddenScreenTriggered]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
        return <FeeRecognitionView />;
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
        return <AuditView />;
      case 'redteam':
        return <RedTeamView />;
      default:
        return <DashboardView onNavigate={setActiveScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased font-sans text-slate-900">
      <Navbar onNavigateScreen={setActiveScreen} />

      <div className="flex flex-1">
        <Sidebar
          activeScreen={activeScreen}
          onSelectScreen={screenId => {
            setActiveScreen(screenId);
            setForbiddenScreenTriggered(false);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderActiveScreen()}
        </main>
      </div>

      {/* Floating Documentation / Hackathon Libraries button in bottom right */}
      <button
        onClick={() => setIsReadmeModalOpen(true)}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-lg hover:bg-slate-800 border border-slate-700/80 transition-all backdrop-blur-xs"
        title="View Architecture & Libraries"
      >
        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden sm:inline">Stack & Libraries</span>
      </button>

      {/* Libraries & Architecture Modal */}
      <Modal
        isOpen={isReadmeModalOpen}
        onClose={() => setIsReadmeModalOpen(false)}
        title="Institute Operations Copilot — Architecture & Library Roster"
        description="Comprehensive technical disclosure adhering to hackathon rules"
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs text-slate-700 max-h-[70vh] overflow-y-auto pr-1">
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <h4 className="font-bold text-indigo-950 mb-1">Core Architecture Principles</h4>
            <p className="text-slate-600 leading-relaxed">
              1. <strong>Decoded JWT Roles:</strong> Permissions never trust user inputs; roles are parsed strictly from the decoded JWT claims.<br />
              2. <strong>Zero-Trust PII Masking:</strong> Phone numbers are uniformly masked (e.g. <code className="font-mono">98******21</code>).<br />
              3. <strong>Mock-to-Production Toggle:</strong> Works out-of-the-box against realistic Indian dataset, then switches to live FastAPI via environment variable (<code className="font-mono">NEXT_PUBLIC_USE_MOCK=false</code> or in-app toggle).<br />
              4. <strong>Zero-Trust Read-Only AST Guard:</strong> Direct SQL generation with role view schema boundaries and red-team tested defenses.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wide mb-2">
              Installed Libraries & Roles (Hackathon Roster)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-900 block font-mono">@tanstack/react-table</span>
                <span className="text-slate-500 text-[11px]">
                  Headless, sortable, filterable tables for students and batches roster with pagination.
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-900 block font-mono">recharts</span>
                <span className="text-slate-500 text-[11px]">
                  Weekly attendance velocity trend lines and cohort-wise attendance bar visualizations.
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-900 block font-mono">lucide-react</span>
                <span className="text-slate-500 text-[11px]">
                  Clean, production-grade icon iconography across navigation, actions, and security alerts.
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-900 block font-mono">tailwindcss</span>
                <span className="text-slate-500 text-[11px]">
                  Atomic modern design tokens, rounded-2xl cards, subtle shadows, and slate/indigo palettes.
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-900 block font-mono">motion</span>
                <span className="text-slate-500 text-[11px]">
                  Fluid animations for modal view transitions and interactive UI disclosures.
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-900 block font-mono">TypeScript</span>
                <span className="text-slate-500 text-[11px]">
                  Strict static typing across all models, API contracts, RBAC tiers, and component props.
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1">Benchmark Scenario Validation</h4>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              • <strong>Java Batch Query:</strong> "Which students in the Java batch have missed three or more classes and have an EMI due this week?" returns 4 flagged students (Aarav Sharma, Rohan Gupta, Sneha Patil, Vikram Malhotra) with one-click WhatsApp reminder drafting.<br />
              • <strong>Trainer Refusal:</strong> When Trainer Priya asks about fees or collections, query is blocked at the schema layer.<br />
              • <strong>Timetable Re-plan:</strong> Moves 3 classes with plain-English rationales when trainer is unavailable.
            </p>
          </div>

          {/* Download Source Code Section */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                <Download className="w-4 h-4 text-emerald-700" />
                Download Complete Frontend Codebase
              </div>
              <div className="text-[11px] text-emerald-800 mt-0.5">
                Entire source tree, mock database, components, and configuration files bundled as ready-to-run package.
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/institute-operations-copilot.zip"
                download="institute-operations-copilot.zip"
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                .ZIP Archive (~122 KB)
              </a>
              <a
                href="/institute-operations-copilot.tar.gz"
                download="institute-operations-copilot.tar.gz"
                className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-900 font-semibold text-xs transition-colors"
              >
                .tar.gz
              </a>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => setIsReadmeModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 text-xs"
            >
              Close Documentation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
