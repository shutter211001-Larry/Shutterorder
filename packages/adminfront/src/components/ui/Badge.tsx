import React from 'react';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'default';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800 border-green-200',
  danger: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', pulse = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          variantStyles[variant]
        } ${pulse ? 'animate-pulse' : ''} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
