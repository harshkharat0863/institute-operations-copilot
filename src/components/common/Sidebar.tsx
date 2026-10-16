import React from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  IndianRupee,
  CheckCircle2,
  Bot,
  CalendarDays,
  ShieldCheck,
  FileText,
  Flame,
  ChevronLeft,
  ChevronRight,
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
}

export const ALL_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['owner', 'counselor', 'trainer', 'accounts'],
  },
  {
    id: 'copilot',
    label: 'Copilot Chat',
    icon: Bot,
    allowedRoles: ['owner', 'counselor', 'trainer'],
    badge: 'AI Core',
    badgeVariant: 'info',
  },
  {
    id: 'students',
    label: 'Students',
    icon: Users,
    allowedRoles: ['owner', 'accounts', 'counselor'],
  },
  {
    id: 'batches',
    label: 'Batches & Courses',
    icon: BookOpen,
    allowedRoles: ['owner', 'counselor', 'trainer'],
  },
  {
    id: 'attendance',
    label: 'Attendance & Logs',
    icon: CheckCircle2,
    allowedRoles: ['owner', 'counselor', 'trainer'],
  },
  {
    id: 'fees',
    label: 'Fees & EMIs',
    icon: IndianRupee,
    allowedRoles: ['owner', 'accounts'],
  },
  {
    id: 'approvals',
    label: 'Approvals Queue',
    icon: ShieldCheck,
    allowedRoles: ['owner', 'accounts', 'counselor'],
    badge: 'Outbox',
    badgeVariant: 'warning',
  },
  {
    id: 'timetable',
    label: 'Timetable Grid',
    icon: CalendarDays,
    allowedRoles: ['owner', 'trainer'],
    badge: '0 Conflicts',
    badgeVariant: 'success',
  },
  {
    id: 'audit',
    label: 'Audit & Query Log',
    icon: FileText,
    allowedRoles: ['owner', 'accounts'],
  },
  {
    id: 'redteam',
    label: 'Red-Team Attack Suite',
    icon: Flame,
    allowedRoles: ['owner'],
    badge: 'Owner',
    badgeVariant: 'purple',
  },
];

interface SidebarProps {
  activeScreen: string;
  onSelectScreen: (screenId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onSelectScreen,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { role } = useAuth();

  // Filter allowed items strictly by role
  const allowedItems = ALL_NAV_ITEMS.filter(item => (role ? item.allowedRoles.includes(role) : false));

  return (
    <aside
      className={`relative z-20 flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out border-r border-slate-800 ${
        isCollapsed ? 'w-18' : 'w-64'
      } shrink-0 min-h-[calc(100vh-4rem)]`}
    >
      {/* Role Pill Header inside Sidebar */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Access Tier
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white capitalize">
                {role || 'Guest'} Mode
              </span>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-auto"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {allowedItems.map(item => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectScreen(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <Badge variant={item.badgeVariant || 'neutral'} size="sm">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Security Context Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
          <div className="font-semibold text-slate-300">FastAPI & SafeQuery™</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Role views active. All raw phones masked with zero-trust AST checks.
          </div>
        </div>
      )}
    </aside>
  );
};
