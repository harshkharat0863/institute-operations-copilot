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
        className={`inline-flex items-center p-0.5 rounded-xl border transition-all ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-300'
            : 'bg-slate-100 border-slate-200 text-slate-600'
        } ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            !isDark
              ? 'bg-white text-amber-600 shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Switch to Light Mode"
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            isDark
              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Switch to Dark Mode"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center gap-2 p-2 rounded-xl border transition-all cursor-pointer focus:outline-hidden ${
        isDark
          ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-amber-400 hover:text-amber-300 shadow-sm'
          : 'bg-white hover:bg-slate-50 border-slate-200 text-indigo-600 hover:text-indigo-700 shadow-sm'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme mode"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};
