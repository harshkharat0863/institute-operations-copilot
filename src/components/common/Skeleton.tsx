import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle' | 'card';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
}) => {
  const variantStyles = {
    text: 'h-4 w-full rounded-[4px]',
    rect: 'h-24 w-full rounded-[6px]',
    circle: 'w-8 h-8 rounded-full',
    card: 'h-32 w-full rounded-[8px]',
  }[variant];

  return (
    <div
      className={`animate-pulse bg-surface-muted ${variantStyles} ${className}`}
    />
  );
};
