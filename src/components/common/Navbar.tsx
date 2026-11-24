import React, { useState } from 'react';
import {
  LogOut,
  ChevronDown,
  Building2,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';
import { Badge, BadgeVariant } from './Badge';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onNavigateScreen?: (screen: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, role, logout, switchRoleQuick } = useAuth();
  const { showToast } = useToast();
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState<boolean>(false);

  const roleBadgeVariants: Record<UserRole, BadgeVariant> = {
    owner: 'accent',
    counselor: 'neutral',
    trainer: 'success',
    accounts: 'warning',
  };

  const handleRoleSwitch = async (newRole: UserRole) => {
    setIsRoleMenuOpen(false);
    await switchRoleQuick(newRole);
    showToast(`Switched active persona to ${newRole.toUpperCase()}`, 'info');
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-surface border-b border-border px-3 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger + Editorial branding */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-[6px] border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-subtle transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-4 h-4" strokeWidth={1.5} />
          </button>
        )}

        <div className="w-7 h-7 rounded-[6px] bg-accent flex items-center justify-center text-white shrink-0">
          <Building2 className="w-4 h-4" strokeWidth={1.5} />
        </div>
        <div className="truncate">
          <span className="font-serif text-sm sm:text-base font-semibold tracking-tight text-text truncate block">
            Institute Operations
          </span>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <ThemeToggle variant="button" />

        {/* Role Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-[6px] border border-border bg-surface hover:bg-surface-subtle transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
            aria-label="User role menu"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-accent-subtle text-accent-text flex items-center justify-center text-[10px] font-semibold shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <span className="text-xs font-medium text-text hidden sm:block truncate max-w-[120px]">
              {user?.name}
            </span>
            {role && (
              <Badge variant={roleBadgeVariants[role]} size="sm">
                {role}
              </Badge>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-text-subtle shrink-0" strokeWidth={1.5} />
          </button>

          {isRoleMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-60 max-w-[calc(100vw-1.5rem)] rounded-[8px] bg-surface shadow-xl border border-border py-1.5 z-50">
              <div className="px-3 py-2 border-b border-border mb-1">
                <div className="text-xs font-semibold text-text truncate">{user?.name}</div>
                <div className="text-[10px] text-text-muted truncate">{user?.email}</div>
              </div>

              <div className="px-2 mb-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-text-subtle px-1 mb-1">
                  Switch Persona
                </div>
                {(['owner', 'counselor', 'trainer', 'accounts'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    onClick={() => handleRoleSwitch(r)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 sm:py-1.5 text-xs rounded-[6px] transition-colors cursor-pointer min-h-[40px] sm:min-h-0 ${
                      role === r
                        ? 'bg-accent-subtle text-accent-text font-medium'
                        : 'text-text-muted hover:text-text hover:bg-surface-subtle'
                    }`}
                  >
                    <span className="capitalize">{r}</span>
                    <Badge variant={roleBadgeVariants[r]} size="sm">{r}</Badge>
                  </button>
                ))}
              </div>

              <div className="border-t border-border pt-1 px-2">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-2.5 py-2 sm:py-1.5 text-xs text-status-red hover:bg-status-red-bg rounded-[6px] transition-colors font-medium cursor-pointer min-h-[40px] sm:min-h-0"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
