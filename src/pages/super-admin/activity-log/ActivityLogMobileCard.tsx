import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import type { ActivityLogEntry } from '@/types';
import {
  ActionCell,
  RoleBadge,
  StatusPill,
  initials,
} from '@/pages/super-admin/activity-log/activity-log-ui';

export function ActivityLogMobileCard({
  row,
  avatarTone,
}: {
  row: ActivityLogEntry;
  avatarTone: string;
}) {
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
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            avatarTone,
          )}
          aria-hidden
        >
          {initials(row.userName)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-text-primary">
                {row.userName}
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                {formatDateTime(row.occurredAt)}
              </p>
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
            <ActionCell kind={row.actionKind} label={row.actionLabel} />
            <StatusPill status={row.status} />
          </div>

          <p className="mt-2 line-clamp-2 text-sm text-text-secondary">
            {row.details}
          </p>
        </div>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border bg-canvas/40 px-4 py-3">
          <DetailField label="Email" value={row.userEmail} breakAll />
          <DetailField label="Role">
            <RoleBadge role={row.role} />
          </DetailField>
          <DetailField label="Module" value={row.module} />
          <DetailField label="Details" value={row.details} />
          <DetailField
            label="IP address"
            value={`${row.ipAddress} · ${row.location}`}
            breakAll
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
