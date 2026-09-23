import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  to,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  to?: string;
  accent?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              accent ? 'bg-accent text-text-on-accent' : 'bg-accent-muted text-accent',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-text-secondary">{hint}</p>
      ) : null}
    </>
  );

  const className = cn(
    'rounded-xl border bg-surface p-4 transition-colors',
    accent ? 'border-accent/40 ring-1 ring-accent/15' : 'border-border',
    to && 'hover:border-accent/50 hover:bg-surface-elevated',
  );

  if (to) {
    return (
      <Link to={to} className={cn(className, 'block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40')}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
