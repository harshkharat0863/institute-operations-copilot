import React, { useState, useEffect } from 'react';
import {
  Shield,
  Layers,
  LogOut,
  ChevronDown,
  Sparkles,
  Server,
  Database,
  ExternalLink,
  Settings2,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isMockMode, setMockMode, getApiBaseUrl, setApiBaseUrl } from '../../lib/api';
import { UserRole } from '../../types';
import { Badge, BadgeVariant } from './Badge';
import { Modal } from './Modal';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onNavigateScreen?: (screen: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateScreen }) => {
  const { user, role, logout, switchRoleQuick } = useAuth();
  const { showToast } = useToast();
  const [mockActive, setMockActive] = useState<boolean>(isMockMode());
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [customApiUrl, setCustomApiUrl] = useState<string>(getApiBaseUrl());

  useEffect(() => {
    const handleMockChange = () => setMockActive(isMockMode());
    window.addEventListener('mock_mode_changed', handleMockChange);
    return () => window.removeEventListener('mock_mode_changed', handleMockChange);
  }, []);

  const handleToggleMock = (enable: boolean) => {
    setMockMode(enable);
    setMockActive(enable);
    showToast(
      enable
        ? 'Switched to local Mock Data (/lib/mock)'
        : `Switched to real FastAPI backend (${getApiBaseUrl()})`,
      enable ? 'info' : 'warning',
      'API Source Toggled'
    );
  };

  const roleBadgeVariants: Record<UserRole, BadgeVariant> = {
    owner: 'purple',
    counselor: 'info',
    trainer: 'success',
    accounts: 'warning',
  };

  const handleRoleSwitch = async (newRole: UserRole) => {
    setIsRoleMenuOpen(false);
    await switchRoleQuick(newRole);
    showToast(`Switched active persona to ${newRole.toUpperCase()}`, 'info');
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-xs">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                Institute Operations Copilot
              </span>
              <span className="hidden md:inline-flex text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                v1.4 SafeQuery™
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-400">
              AI-driven governance & operations platform
            </p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* MOCK MODE PILL & TOGGLE */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <div className="flex items-center gap-1">
              {mockActive ? (
                <Database className="w-3.5 h-3.5 text-indigo-600" />
              ) : (
                <Server className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span className="hidden lg:inline text-slate-500">Source:</span>
              <span
                className={`font-semibold cursor-pointer ${
                  mockActive ? 'text-indigo-700' : 'text-emerald-700'
                }`}
                onClick={() => setIsConfigModalOpen(true)}
                title="Click to configure API settings"
              >
                {mockActive ? 'MOCK DATA' : 'FASTAPI BACKEND'}
              </span>
            </div>

            {/* Toggle switch */}
            <button
              onClick={() => handleToggleMock(!mockActive)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                mockActive ? 'bg-indigo-600' : 'bg-emerald-600'
              }`}
              title={mockActive ? 'Switch to Real Backend' : 'Switch to Mock Data'}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  mockActive ? 'translate-x-0' : 'translate-x-4'
                }`}
              />
            </button>

            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="text-slate-400 hover:text-slate-600 ml-0.5 p-0.5 rounded"
              title="API Config"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* DOWNLOAD CODE BUTTON */}
          <a
            href="/institute-operations-copilot.zip"
            download="institute-operations-copilot.zip"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors text-xs font-semibold shadow-2xs"
            title="Download full project source code archive (.zip)"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Download Zip</span>
          </a>

          {/* Quick Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {user?.name}
                </div>
              </div>
              {role && (
                <Badge variant={roleBadgeVariants[role]} size="sm" dot>
                  {role.toUpperCase()}
                </Badge>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isRoleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Current Persona
                  </div>
                  <div className="text-sm font-semibold text-slate-800">{user?.name}</div>
                  <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Decoded JWT claim:</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      role: "{role}"
                    </span>
                  </div>
                </div>

                <div className="px-2 py-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Quick Switch Role (Demo)
                  </div>
                  {(['owner', 'counselor', 'trainer', 'accounts'] as UserRole[]).map(r => (
                    <button
                      key={r}
                      onClick={() => handleRoleSwitch(r)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        role === r
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="capitalize">{r}</span>
                      <Badge variant={roleBadgeVariants[r]} size="sm">
                        {r}
                      </Badge>
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-1.5 px-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Backend / Mock Settings Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Data Source & Backend Configuration"
        description="Configure whether queries execute locally or connect to the real FastAPI service"
      >
        <div className="space-y-4 text-sm text-slate-700">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-semibold text-slate-800 mb-1">Environment Variable Mapping</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              In production, setting <code className="text-indigo-600 font-mono">NEXT_PUBLIC_USE_MOCK=false</code> or <code className="text-indigo-600 font-mono">VITE_USE_MOCK=false</code> routes all requests to <code className="text-indigo-600 font-mono">NEXT_PUBLIC_API_URL</code>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Active Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleToggleMock(true)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  mockActive
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Database className="w-4 h-4 text-indigo-600" />
                  Mock Data Mode
                </div>
                <div className="text-[11px] text-slate-500">
                  120 students, benchmark Java queries, simulated replanner & red-team.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleMock(false)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  !mockActive
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Server className="w-4 h-4 text-emerald-600" />
                  Real FastAPI Backend
                </div>
                <div className="text-[11px] text-slate-500">
                  Calls live endpoints on your configured FastAPI server.
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              FastAPI Server URL (when mock is disabled)
            </label>
            <input
              type="text"
              value={customApiUrl}
              onChange={e => setCustomApiUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setApiBaseUrl(customApiUrl);
                setIsConfigModalOpen(false);
                showToast('API URL settings updated successfully', 'success');
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
