import React from 'react';

interface PageContentProps {
  children: React.ReactNode;
  noPadding?: boolean;
  className?: string;
}

export function PageContent({ children, noPadding = false, className = '' }: PageContentProps) {
  return (
    <div className={`bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden ${noPadding ? '' : 'p-6'} ${className}`}>
      {children}
    </div>
  );
}
