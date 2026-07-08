import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  backUrl?: string;
  backText?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, backUrl, backText, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        {backUrl && backText && (
          <Link to={backUrl} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors mb-2">
            <ArrowLeft size={16} className="mr-1" />
            {backText}
          </Link>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
