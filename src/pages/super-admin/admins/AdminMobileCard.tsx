import { useState } from 'react';
import { ChevronDown, Lock, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn, formatDateTime } from '@/lib/utils';
import type { PlatformAdmin } from '@/types';

export function AdminMobileCard({
  admin,
  subtitle,
  readOnly,
  onEdit,
  onFreeze,
  onArchive,
}: {
  admin: PlatformAdmin;
  subtitle: string;
  readOnly?: boolean;
  onEdit: (admin: PlatformAdmin) => void;
  onFreeze: (admin: PlatformAdmin) => void;
  onArchive: (admin: PlatformAdmin) => void;
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
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
          {initials(admin.name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-text-primary">
                {admin.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-text-muted">
                {subtitle}
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

          <div className="mt-2">
            <StatusPill status={admin.status} />
          </div>

          <p className="mt-2 truncate text-sm text-text-secondary">
            {admin.email}
          </p>
        </div>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border bg-canvas/40 px-4 py-3">
          <DetailField label="Email" value={admin.email} breakAll />
          <DetailField label="Phone" value={admin.phone} />
          <DetailField label="Address" value={admin.address} />
          <DetailField
            label="Last active"
            value={
              admin.lastActiveAt ? formatDateTime(admin.lastActiveAt) : '—'
            }
          />

          {readOnly ? (
            <p className="text-sm text-text-muted">View only — no actions</p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(admin)}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onFreeze(admin)}
              >
                <Lock className="h-3.5 w-3.5 text-accent" aria-hidden />
                {admin.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-danger hover:border-danger hover:text-danger"
                onClick={() => onArchive(admin)}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Delete
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function DetailField({
  label,
  value,
  breakAll,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 text-sm text-text-primary',
          breakAll ? 'break-all' : 'break-words',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: PlatformAdmin['status'] }) {
  const active = status === 'active';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        active
          ? 'border-success/30 bg-success-muted text-success'
          : status === 'frozen'
            ? 'border-warning/30 bg-warning-muted text-warning'
            : 'border-border bg-canvas text-text-secondary',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          active
            ? 'bg-success'
            : status === 'frozen'
              ? 'bg-warning'
              : 'bg-text-muted',
        )}
        aria-hidden
      />
      {status}
    </span>
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
