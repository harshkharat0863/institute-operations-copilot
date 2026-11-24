import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-colors select-none rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent';

  const sizeClasses = {
    sm: 'h-7 px-2.5 text-xs gap-1.5',
    md: 'h-8 px-3 text-xs gap-2',
    lg: 'h-9 px-4 text-sm gap-2',
  }[size];

  const variantClasses = {
    primary:
      'bg-accent text-white hover:bg-accent-hover border border-transparent active:opacity-95',
    secondary:
      'bg-surface text-text border border-border hover:bg-surface-subtle active:bg-surface-muted',
    ghost:
      'bg-transparent text-text-muted hover:text-text hover:bg-surface-subtle active:bg-surface-muted',
    danger:
      'bg-status-red-bg text-status-red border border-status-red/20 hover:bg-status-red/15 active:opacity-95',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && <span className="shrink-0 flex items-center">{icon}</span>
      )}
      {children}
    </button>
  );
};
