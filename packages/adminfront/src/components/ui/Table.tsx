import React from 'react';

/**
 * According to Rule 26: Tailwind Dropdown Clipping Prevention,
 * We MUST NOT use overflow-hidden or overflow-x-auto on the immediate table wrapper 
 * if dropdowns are rendered inline. We use overflow-visible.
 */

export const TableContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible ${className}`}
      {...props}
    />
  )
);
TableContainer.displayName = 'TableContainer';

export const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className = '', ...props }, ref) => (
    <table
      ref={ref}
      className={`min-w-full divide-y divide-gray-200 ${className}`}
      {...props}
    />
  )
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', ...props }, ref) => (
    <thead ref={ref} className={`bg-gray-50 ${className}`} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', ...props }, ref) => (
    <tbody
      ref={ref}
      className={`bg-white divide-y divide-gray-200 ${className}`}
      {...props}
    />
  )
);
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className = '', ...props }, ref) => (
    <tr
      ref={ref}
      className={`hover:bg-gray-50 transition-colors ${className}`}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className = '', ...props }, ref) => (
    <th
      ref={ref}
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className = '', ...props }, ref) => (
    <td
      ref={ref}
      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-600 ${className}`}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';
