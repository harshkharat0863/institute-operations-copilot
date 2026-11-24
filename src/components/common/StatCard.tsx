import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string | number;
    positive?: boolean;
    neutral?: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  trend,
  icon,
  className = '',
}) => {
  return (
    <div
      className={`bg-surface border border-border rounded-[8px] p-4 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
          {label}
        </span>
        {icon && (
          <span className="text-text-muted p-1 rounded-[4px] bg-surface-subtle">
            {icon}
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-text tabular-nums">
          {value}
        </div>

        {(subtext || trend) && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
            {trend && (
              <span
                className={`font-medium tabular-nums ${
                  trend.neutral
                    ? 'text-text-muted'
                    : trend.positive
                    ? 'text-status-green'
                    : 'text-status-red'
                }`}
              >
                {trend.value}
              </span>
            )}
            {subtext && <span>{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
