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
  CreditCard,
  Award,
  Video,
  ShieldAlert,
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
  group?: string;
}

export const ALL_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['owner', 'counselor', 'trainer', 'accounts'],
    group: 'Overview',
  },
  {
    id: 'copilot',
    label: 'Copilot Chat',
    icon: Bot,
    allowedRoles: ['owner', 'counselor', 'trainer'],
    badge: 'AI',
    badgeVariant: 'info',
    group: 'Intelligence',
  },
  {
    id: 'dropout_risk',
    label: 'Dropout Risk',
    icon: ShieldAlert,
    allowedRoles: ['owner', 'counselor'],
    badge: 'Risk',
    badgeVariant: 'danger',
    group: 'Intelligence',
  },
  {
    id: 'students',
    label: 'Students',
    icon: Users,
    allowedRoles: ['owner', 'accounts', 'counselor'],
    group: 'Management',
  },
  {
    id: 'batches',
    label: 'Batches & Courses',
    icon: BookOpen,
    allowedRoles: ['owner', 'counselor', 'trainer'],
    group: 'Management',
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: CheckCircle2,
    allowedRoles: ['owner', 'counselor', 'trainer'],
    group: 'Management',
  },
  {
    id: 'timetable',
    label: 'Timetable',
    icon: CalendarDays,
    allowedRoles: ['owner', 'trainer'],
    group: 'Management',
  },
  {
    id: 'recordings',
    label: 'Recordings',
    icon: Video,
    allowedRoles: ['owner', 'counselor', 'trainer'],
    group: 'Content',
  },
  {
    id: 'certifications',
    label: 'Certifications',
    icon: Award,
    allowedRoles: ['owner', 'counselor', 'trainer'],
    group: 'Content',
  },
  {
    id: 'fees',
    label: 'Fees & EMIs',
    icon: IndianRupee,
    allowedRoles: ['owner', 'accounts'],
    group: 'Finance',
  },
  {
    id: 'fee_recognition',
    label: 'Fee Recognition',
    icon: CreditCard,
    allowedRoles: ['owner', 'accounts'],
    badge: 'OCR',
    badgeVariant: 'purple',
    group: 'Finance',
  },
  {
    id: 'approvals',
    label: 'Approvals',
    icon: ShieldCheck,
    allowedRoles: ['owner', 'accounts', 'counselor'],
    group: 'Operations',
  },
  {
    id: 'audit',
    label: 'Audit Log',
    icon: FileText,
    allowedRoles: ['owner', 'accounts'],
    group: 'Operations',
  },
  {
    id: 'redteam',
    label: 'Red-Team Suite',
    icon: Flame,
    allowedRoles: ['owner'],
    group: 'Operations',
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

  const allowedItems = ALL_NAV_ITEMS.filter(item =>
    role ? item.allowedRoles.includes(role) : false
  );

  // Group items
  const groups: Record<string, NavItemConfig[]> = {};
  allowedItems.forEach(item => {
    const g = item.group || 'Other';
    if (!groups[g]) groups[g] = [];
    groups[g].push(item);
  });

  const groupOrder = ['Overview', 'Intelligence', 'Management', 'Content', 'Finance', 'Operations'];

  return (
    <aside
      className={`relative z-20 flex flex-col bg-[#0f1117] text-slate-400 transition-all duration-200 ease-in-out border-r border-white/5 ${
        isCollapsed ? 'w-14' : 'w-56'
      } shrink-0 min-h-[calc(100vh-4rem)]`}
    >
      {/* Role Header */}
      <div className="px-3 py-3 border-b border-white/5 flex items-center justify-between min-h-[48px]">
        {!isCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-white capitalize truncate">
              {role || 'Guest'}
            </span>
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider shrink-0">
              mode
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors ml-auto shrink-0"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
        {groupOrder.map(groupName => {
          const items = groups[groupName];
          if (!items || items.length === 0) return null;
          return (
            <div key={groupName}>
              {!isCollapsed && (
                <div className="px-2 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700">
                    {groupName}
                  </span>
                </div>
              )}
              <div className="space-y-0.5">
                {items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectScreen(item.id)}
                      className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-xs font-medium transition-all group relative ${
                        isActive
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-300'
                        }`}
                      />

                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between text-left min-w-0">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <Badge variant={item.badgeVariant || 'neutral'} size="sm">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      )}

                      {isCollapsed && isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="px-3 py-2.5 border-t border-white/5">
          <div className="text-[10px] text-slate-700 font-mono">FastAPI · SafeQuery™</div>
        </div>
      )}
    </aside>
  );
};
