import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'segmented';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'button',
  showLabel = false,
}) => {
  const { isDark, toggleTheme, setTheme } = useTheme();

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-[6px] border border-border bg-surface-subtle text-text-muted ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
            !isDark
              ? 'bg-surface text-text border border-border shadow-xs'
              : 'text-text-muted hover:text-text'
          }`}
          title="Switch to Light Mode"
        >
          <Sun className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
            isDark
              ? 'bg-surface text-text border border-border shadow-xs'
              : 'text-text-muted hover:text-text'
          }`}
          title="Switch to Dark Mode"
        >
          <Moon className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Dark</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center gap-2 p-1.5 rounded-[6px] border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-subtle transition-colors cursor-pointer ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme mode"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
      ) : (
        <Moon className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
      )}
      {showLabel && (
        <span className="text-xs font-medium text-text">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
