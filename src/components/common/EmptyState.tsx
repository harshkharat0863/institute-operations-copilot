import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <div
      className={`border border-border border-dashed rounded-[8px] p-8 sm:p-12 text-center flex flex-col items-center justify-center bg-surface/50 ${className}`}
    >
      <div className="w-9 h-9 rounded-[6px] bg-surface-subtle border border-border flex items-center justify-center text-text-muted mb-3">
        {icon || <Inbox className="w-4 h-4" strokeWidth={1.5} />}
      </div>
      <h3 className="font-serif text-base font-medium text-text">{title}</h3>
      {description && (
        <p className="text-xs text-text-muted mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
