import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'purple'
  | 'cyan'
  | 'accent';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
  success: {
    bg: 'bg-status-green-bg',
    text: 'text-status-green',
    border: 'border-status-green/20',
    dot: 'bg-status-green',
  },
  warning: {
    bg: 'bg-status-amber-bg',
    text: 'text-status-amber',
    border: 'border-status-amber/20',
    dot: 'bg-status-amber',
  },
  danger: {
    bg: 'bg-status-red-bg',
    text: 'text-status-red',
    border: 'border-status-red/20',
    dot: 'bg-status-red',
  },
  accent: {
    bg: 'bg-accent-subtle',
    text: 'text-accent-text',
    border: 'border-accent/20',
    dot: 'bg-accent',
  },
  info: {
    bg: 'bg-accent-subtle',
    text: 'text-accent-text',
    border: 'border-accent/20',
    dot: 'bg-accent',
  },
  neutral: {
    bg: 'bg-surface-subtle',
    text: 'text-text-muted',
    border: 'border-border',
    dot: 'bg-text-subtle',
  },
  purple: {
    bg: 'bg-surface-subtle',
    text: 'text-text',
    border: 'border-border',
    dot: 'bg-text-subtle',
  },
  cyan: {
    bg: 'bg-accent-subtle',
    text: 'text-accent-text',
    border: 'border-accent/20',
    dot: 'bg-accent',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const v = variantStyles[variant] || variantStyles.neutral;
  const sizeClasses =
    size === 'sm'
      ? 'px-1.5 py-0.5 text-[10px] font-medium'
      : 'px-2 py-0.5 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] border ${v.bg} ${v.text} ${v.border} ${sizeClasses} select-none ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />}
      {children}
    </span>
  );
};
