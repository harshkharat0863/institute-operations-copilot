import React, { useState, useEffect } from 'react';
import {
  Shield,
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
      <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200 px-4 sm:px-5 flex items-center justify-between">
        {/* Left: Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">
              Institute Copilot
            </span>
            <span className="hidden md:inline text-[10px] text-slate-400 font-medium ml-2">
              v1.4 · SafeQuery™
            </span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Data Source Indicator */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            title="Configure data source"
          >
            {mockActive ? (
              <Database className="w-3.5 h-3.5 text-indigo-500" />
            ) : (
              <Server className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span className={mockActive ? 'text-indigo-600' : 'text-emerald-600'}>
              {mockActive ? 'Mock' : 'Live API'}
            </span>
            {/* Toggle */}
            <span
              onClick={e => { e.stopPropagation(); handleToggleMock(!mockActive); }}
              className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                mockActive ? 'bg-indigo-500' : 'bg-emerald-500'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                  mockActive ? 'translate-x-0' : 'translate-x-3'
                }`}
              />
            </span>
          </button>

          {/* Download */}
          <a
            href="/institute-operations-copilot.zip"
            download="institute-operations-copilot.zip"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            title="Download source code"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Download ZIP
          </a>

          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-900 hidden sm:block">
                {user?.name}
              </span>
              {role && (
                <Badge variant={roleBadgeVariants[role]} size="sm">
                  {role}
                </Badge>
              )}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isRoleMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white shadow-lg border border-slate-200 py-1.5 z-50">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <div className="text-xs font-semibold text-slate-900">{user?.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
                </div>

                <div className="px-2 mb-1">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-1 mb-1">
                    Switch Role (Demo)
                  </div>
                  {(['owner', 'counselor', 'trainer', 'accounts'] as UserRole[]).map(r => (
                    <button
                      key={r}
                      onClick={() => handleRoleSwitch(r)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg transition-colors ${
                        role === r
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="capitalize">{r}</span>
                      <Badge variant={roleBadgeVariants[r]} size="sm">{r}</Badge>
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-1 px-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
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

      {/* Backend Config Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Data Source Configuration"
        description="Configure whether queries run locally or connect to the real FastAPI service"
      >
        <div className="space-y-4 text-sm text-slate-700">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-semibold text-slate-800 text-xs mb-1">Environment Variable</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              In production, set <code className="text-indigo-600 font-mono bg-indigo-50 px-1 rounded">VITE_USE_MOCK=false</code> to
              route all requests to your configured API URL.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Active Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleToggleMock(true)}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  mockActive
                    ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  Mock Data
                </div>
                <div className="text-[10px] text-slate-500">
                  120 students, benchmark queries, demo dataset.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleMock(false)}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  !mockActive
                    ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Server className="w-3.5 h-3.5 text-emerald-600" />
                  Live FastAPI
                </div>
                <div className="text-[10px] text-slate-500">
                  Connects to your configured backend server.
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              FastAPI Server URL
            </label>
            <input
              type="text"
              value={customApiUrl}
              onChange={e => setCustomApiUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono text-slate-800 focus:outline-hidden focus:border-indigo-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setIsConfigModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setApiBaseUrl(customApiUrl);
                setIsConfigModalOpen(false);
                showToast('API URL settings updated successfully', 'success');
              }}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
