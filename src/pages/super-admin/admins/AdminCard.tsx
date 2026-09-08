import type { ReactNode } from 'react';
import { Lock, Pencil } from 'lucide-react';
import { CanAccess } from '@/components/auth/CanAccess';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn, formatDateTime } from '@/lib/utils';
import type { PlatformAdmin } from '@/types';

export function AdminCard({
  admin,
  subtitle,
  readOnly,
  onEdit,
  onFreeze,
}: {
  admin: PlatformAdmin;
  subtitle: string;
  readOnly?: boolean;
  onEdit: (admin: PlatformAdmin) => void;
  onFreeze: (admin: PlatformAdmin) => void;
}) {
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
            {initials(admin.name)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-text-primary">
                  {admin.name}
                </h3>
                <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>
              </div>
              <StatusPill status={admin.status} />
            </div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <MetaItem label="Email">
            <span className="break-all text-sm text-text-primary">
              {admin.email}
            </span>
          </MetaItem>
          <MetaItem label="Phone">
            <span className="text-sm text-text-primary">{admin.phone}</span>
          </MetaItem>
          <MetaItem label="Last active">
            <span className="text-sm text-text-secondary">
              {admin.lastActiveAt ? formatDateTime(admin.lastActiveAt) : '—'}
            </span>
          </MetaItem>
        </dl>
      </div>

      {readOnly ? (
        <div className="border-t border-border bg-canvas/40 px-4 py-3 sm:px-5">
          <p className="text-sm text-text-muted">View only — no actions</p>
        </div>
      ) : (
        <CanAccess permission="change_user">
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-canvas/40 px-4 py-3 sm:px-5">
            <Button size="sm" variant="outline" onClick={() => onEdit(admin)}>
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => onFreeze(admin)}>
              <Lock className="h-3.5 w-3.5" aria-hidden />
              {admin.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
            </Button>
          </div>
        </CanAccess>
      )}
    </Card>
  );
}

function MetaItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function StatusPill({ status }: { status: PlatformAdmin['status'] }) {
  const active = status === 'active';
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
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
