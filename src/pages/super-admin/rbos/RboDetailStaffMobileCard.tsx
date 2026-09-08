import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CanAccess } from '@/components/auth/CanAccess';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { RboStaff } from '@/types';

export function RboDetailStaffMobileCard({
  staff,
  onPatch,
}: {
  staff: RboStaff;
  onPatch: (id: string, status: string) => Promise<void>;
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
          {initials(staff.name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-text-primary">{staff.name}</p>
              <p className="mt-0.5 text-sm text-text-secondary">{staff.phone}</p>
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
            <StatusPill active={staff.status === 'active'} label={staff.status} />
          </div>
        </div>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border bg-canvas/40 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Phone
            </p>
            <p className="mt-0.5 text-sm text-text-primary">{staff.phone}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Status
            </p>
            <div className="mt-0.5">
              <StatusPill active={staff.status === 'active'} label={staff.status} />
            </div>
          </div>

          <CanAccess permission="change_rbovendor">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                void onPatch(
                  staff.id,
                  staff.status === 'frozen' ? 'active' : 'frozen',
                )
              }
            >
              {staff.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
            </Button>
          </CanAccess>
        </div>
      ) : null}
    </div>
  );
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        active
          ? 'border-success/30 bg-success-muted text-success'
          : 'border-warning/30 bg-warning-muted text-warning',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          active ? 'bg-success' : 'bg-warning',
        )}
        aria-hidden
      />
      {label}
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
