import React from 'react';

export interface CardProps {
  children?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: React.HTMLAttributes<HTMLDivElement>['onClick'];
  id?: string;
  'aria-label'?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  title,
  description,
  action,
  footer,
  onClick,
  id,
  ...rest
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }[padding];

  const hasHeader = Boolean(title || description || action);

  return (
    <div
      className={`bg-surface border border-border rounded-[8px] ${className}`}
      onClick={onClick}
      id={id}
    >
      {hasHeader && (
        <div className="px-4 py-3 border-b border-border flex items-start justify-between gap-3">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-text tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={paddingClasses}>{children}</div>
      {footer && (
        <div className="px-4 py-2.5 border-t border-border bg-surface-subtle/50 rounded-b-[8px]">
          {footer}
        </div>
      )}
    </div>
  );
};
