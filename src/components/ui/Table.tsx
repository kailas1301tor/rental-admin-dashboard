import type { ReactNode, TableHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function TableShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto overscroll-x-contain rounded-xl border border-border bg-surface [-webkit-overflow-scrolling:touch]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Table({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn('min-w-full border-collapse text-left text-sm', className)}
      {...props}
    />
  );
}

export function Th({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'whitespace-nowrap border-b border-border bg-canvas/80 px-3 py-3 font-medium text-text-secondary sm:px-4',
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        'whitespace-nowrap border-b border-border px-3 py-3 text-text-primary sm:px-4',
        className,
      )}
      {...props}
    />
  );
}
