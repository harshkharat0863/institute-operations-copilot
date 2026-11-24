import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  IndianRupee,
  CheckCircle2,
  Bot,
  CalendarDays,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Award,
  Video,
  ShieldAlert,
  Link2,
  Flame,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Badge, BadgeVariant } from './Badge';

export interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  allowedRoles: UserRole[];
  badge?: string;
  badgeVariant?: BadgeVariant;
  group?: 'Main' | 'Admin tools';
}

export const ALL_NAV_ITEMS: NavItemConfig[] = [
  // Primary operational screens
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['owner', 'counselor', 'trainer', 'accounts'],
    group: 'Main',
  },
  {
    id: 'students',
    label: 'Students',
    icon: Users,
    allowedRoles: ['owner', 'counselor', 'accounts'],
    group: 'Main',
  },
  {
    id: 'batches',
    label: 'Batches',
    icon: BookOpen,
    allowedRoles: ['owner', 'counselor', 'trainer'],
    group: 'Main',
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: CheckCircle2,
    allowedRoles: ['owner', 'counselor', 'trainer'],
    group: 'Main',
  },
  {
    id: 'fees',
    label: 'Fees',
    icon: IndianRupee,
    allowedRoles: ['owner', 'accounts'],
    group: 'Main',
  },
  {
    id: 'timetable',
    label: 'Timetable',
    icon: CalendarDays,
    allowedRoles: ['owner', 'trainer'],
    group: 'Main',
  },
  {
    id: 'copilot',
    label: 'Copilot',
    icon: Bot,
    allowedRoles: ['owner', 'counselor', 'trainer', 'accounts'],
    group: 'Main',
  },
  {
    id: 'approvals',
    label: 'Approvals',
    icon: ShieldCheck,
    allowedRoles: ['owner', 'accounts', 'counselor'],
    group: 'Main',
  },

  // Admin tools (Owner / admin oversight)
  {
    id: 'certifications',
    label: 'Certifications',
    icon: Award,
    allowedRoles: ['owner'],
    group: 'Admin tools',
  },
  {
    id: 'recordings',
    label: 'Recordings',
    icon: Video,
    allowedRoles: ['owner'],
    group: 'Admin tools',
  },
  {
    id: 'dropout_risk',
    label: 'Dropout Risk',
    icon: ShieldAlert,
    allowedRoles: ['owner'],
    group: 'Admin tools',
  },
  {
    id: 'failure_chain',
    label: 'Failure Chain',
    icon: Link2,
    allowedRoles: ['owner'],
    group: 'Admin tools',
  },
  {
    id: 'redteam',
    label: 'Red Team',
    icon: Flame,
    allowedRoles: ['owner'],
    group: 'Admin tools',
  },
];

interface SidebarProps {
  activeScreen: string;
  onSelectScreen: (screenId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onSelectScreen,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { role } = useAuth();

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Lock body scroll when mobile off-canvas drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  // Filter items by role
  const allowedItems = ALL_NAV_ITEMS.filter(
    item => role && item.allowedRoles.includes(role)
  );

  // Group items
  const mainItems = allowedItems.filter(item => item.group === 'Main');
  const adminItems = allowedItems.filter(item => item.group === 'Admin tools');

  const renderNavGroup = (items: NavItemConfig[], groupTitle?: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        {groupTitle && !isCollapsed && (
          <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-wider text-text-subtle uppercase">
            {groupTitle}
          </div>
        )}
        <div className="space-y-0.5">
          {items.map(item => {
            const Icon = item.icon;
            // Map legacy aliases
            const isMatch =
              activeScreen === item.id ||
              (item.id === 'fees' && activeScreen === 'fee_recognition') ||
              (item.id === 'approvals' && activeScreen === 'audit');

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectScreen(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-xs font-medium transition-colors cursor-pointer text-left min-h-[36px] ${
                  isMatch
                    ? 'bg-accent-subtle text-accent-text font-semibold'
                    : 'text-text-muted hover:text-text hover:bg-surface-subtle'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isMatch ? 'text-accent' : 'text-text-subtle'
                  }`}
                  strokeWidth={1.5}
                />

                {!isCollapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}

                {!isCollapsed && item.badge && (
                  <Badge variant={item.badgeVariant || 'neutral'} size="sm">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ============================================================ */}
      {/* 1. MOBILE OFF-CANVAS DRAWER (< 1024px)                       */}
      {/* ============================================================ */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Off-canvas panel */}
          <div className="relative z-10 w-64 max-w-[80vw] bg-surface border-r border-border h-full flex flex-col justify-between p-4 shadow-xl overflow-y-auto drawer-panel">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                <span className="font-serif text-sm font-semibold tracking-tight text-text">
                  Navigation
                </span>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1 rounded-[4px] text-text-muted hover:text-text hover:bg-surface-subtle cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              {renderNavGroup(mainItems)}
              {renderNavGroup(adminItems, 'Admin tools')}
            </div>

            <div className="pt-4 border-t border-border text-[11px] text-text-subtle">
              Signed in as <span className="font-semibold text-text capitalize">{role}</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. DESKTOP PERMANENT SIDEBAR (>= 1024px)                      */}
      {/* ============================================================ */}
      <aside
        className={`hidden lg:flex flex-col justify-between shrink-0 border-r border-border bg-surface transition-all duration-150 select-none ${
          isCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        <div className="p-3 overflow-y-auto flex-1">
          {renderNavGroup(mainItems)}
          {renderNavGroup(adminItems, isCollapsed ? undefined : 'Admin tools')}
        </div>

        {/* Bottom Collapse Toggle */}
        <div className="p-2 border-t border-border flex items-center justify-between">
          {!isCollapsed && (
            <span className="text-[10px] text-text-subtle uppercase tracking-wider px-2 font-mono">
              Role: {role}
            </span>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-[4px] text-text-muted hover:text-text hover:bg-surface-subtle transition-colors cursor-pointer ml-auto"
            title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
