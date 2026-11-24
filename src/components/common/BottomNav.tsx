import React, { useState } from 'react';
import {
  LayoutDashboard,
  Bot,
  ShieldCheck,
  Users,
  CalendarDays,
  CheckCircle2,
  IndianRupee,
  BookOpen,
  MoreHorizontal,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ALL_NAV_ITEMS, NavItemConfig } from './Sidebar';
import { Badge } from './Badge';

interface BottomNavProps {
  activeScreen: string;
  onSelectScreen: (screenId: string) => void;
}

const ROLE_TOP_ITEMS: Record<UserRole, string[]> = {
  owner: ['dashboard', 'students', 'fees', 'approvals'],
  counselor: ['dashboard', 'students', 'batches', 'approvals'],
  trainer: ['dashboard', 'batches', 'timetable', 'attendance'],
  accounts: ['dashboard', 'fees', 'students', 'approvals'],
};

export const BottomNav: React.FC<BottomNavProps> = ({
  activeScreen,
  onSelectScreen,
}) => {
  const { role } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  if (!role) return null;

  const topIds = ROLE_TOP_ITEMS[role] || ['dashboard', 'students', 'attendance', 'approvals'];
  const allowedItems = ALL_NAV_ITEMS.filter(item => item.allowedRoles.includes(role));

  const topItems: NavItemConfig[] = [];
  topIds.forEach(id => {
    const found = allowedItems.find(it => it.id === id);
    if (found) topItems.push(found);
  });

  const moreItems = allowedItems.filter(item => !topIds.includes(item.id));
  const isMoreActive = moreItems.some(
    it =>
      it.id === activeScreen ||
      (it.id === 'fees' && activeScreen === 'fee_recognition') ||
      (it.id === 'approvals' && activeScreen === 'audit')
  );

  const handleSelect = (id: string) => {
    onSelectScreen(id);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Fixed Bottom Tab Bar for Mobile (< 1024px) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around px-1 h-14"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {topItems.map(item => {
          const Icon = item.icon;
          const isActive =
            activeScreen === item.id ||
            (item.id === 'fees' && activeScreen === 'fee_recognition') ||
            (item.id === 'approvals' && activeScreen === 'audit');

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[44px] transition-colors cursor-pointer ${
                isActive ? 'text-accent font-semibold' : 'text-text-muted hover:text-text'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" strokeWidth={1.5} />
              <span className="text-[10px] leading-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* 5th Button: More */}
        {moreItems.length > 0 && (
          <button
            onClick={() => setIsMoreOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[44px] transition-colors cursor-pointer ${
              isMoreActive ? 'text-accent font-semibold' : 'text-text-muted hover:text-text'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5" strokeWidth={1.5} />
            <span className="text-[10px] leading-tight">More</span>
          </button>
        )}
      </nav>

      {/* "More" Bottom Sheet Drawer */}
      {isMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity"
            onClick={() => setIsMoreOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <div className="relative z-10 w-full bg-surface border-t border-border rounded-t-[12px] p-4 pb-8 shadow-2xl max-h-[75dvh] overflow-y-auto drawer-panel">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
              <span className="font-serif text-sm font-semibold text-text">
                More screens
              </span>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-[4px] text-text-muted hover:text-text hover:bg-surface-subtle"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="divide-y divide-border/60">
              {moreItems.map(item => {
                const Icon = item.icon;
                const isActive =
                  activeScreen === item.id ||
                  (item.id === 'fees' && activeScreen === 'fee_recognition') ||
                  (item.id === 'approvals' && activeScreen === 'audit');

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between py-3 px-2 text-xs transition-colors cursor-pointer ${
                      isActive ? 'text-accent font-semibold bg-accent-subtle/50 rounded-[6px]' : 'text-text hover:bg-surface-subtle rounded-[6px]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-text-subtle" strokeWidth={1.5} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <Badge variant={item.badgeVariant || 'neutral'} size="sm">
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-text-subtle" strokeWidth={1.5} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
