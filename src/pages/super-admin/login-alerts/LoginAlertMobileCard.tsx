import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn, formatDateTime } from '@/lib/utils';
import type { LoginAttempt } from '@/types';

export function LoginAlertMobileCard({ row }: { row: LoginAttempt }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors active:bg-accent-muted/30"
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent"
          aria-hidden
        >
          {initials(row.userName)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-text-primary">{row.userName}</p>
              <p className="mt-0.5 text-xs text-text-muted">{row.role}</p>
            </div>
            <ChevronDown
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0 text-text-muted transition-transform duration-200',
                open && 'rotate-180',
              )}
              aria-hidden
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge
              tone={
                row.result === 'success'
                  ? 'success'
                  : row.result === 'blocked'
                    ? 'danger'
                    : 'warning'
              }
            >
              {row.result}
            </Badge>
            {row.emailAlertSent ? (
              <Badge tone="accent">Email sent</Badge>
            ) : (
              <Badge>Email pending</Badge>
            )}
          </div>

          <p className="mt-2 break-all text-sm text-text-secondary">{row.ip}</p>
          <p className="mt-0.5 break-words text-xs text-text-muted">
            {row.location}
          </p>

          <p className="mt-2 text-sm text-text-secondary">
            {formatDateTime(row.attemptedAt)}
          </p>
        </div>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border bg-canvas/40 px-4 py-3">
          <DetailField label="User" value={row.userName} />
          <DetailField label="Role" value={row.role} />
          <DetailField label="IP address" value={row.ip} breakAll />
          <DetailField label="Location" value={row.location} />
          <DetailField label="Result">
            <Badge
              tone={
                row.result === 'success'
                  ? 'success'
                  : row.result === 'blocked'
                    ? 'danger'
                    : 'warning'
              }
            >
              {row.result}
            </Badge>
          </DetailField>
          <DetailField label="Email alert">
            {row.emailAlertSent ? (
              <Badge tone="accent">Sent</Badge>
            ) : (
              <Badge>Pending</Badge>
            )}
          </DetailField>
          <DetailField
            label="Attempted at"
            value={formatDateTime(row.attemptedAt)}
          />
        </div>
      ) : null}
    </div>
  );
}

function DetailField({
  label,
  value,
  breakAll,
  children,
}: {
  label: string;
  value?: string;
  breakAll?: boolean;
  children?: ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      {children ?? (
        <p
          className={cn(
            'mt-0.5 text-sm text-text-primary',
            breakAll ? 'break-all' : 'break-words',
          )}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
