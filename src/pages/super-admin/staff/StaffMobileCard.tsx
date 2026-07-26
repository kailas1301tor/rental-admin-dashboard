import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatDateTime } from '@/lib/utils';
import { departmentLabel } from '@/lib/departments';
import type { Department, PlatformStaff } from '@/types';

export function StaffMobileCard({
  staff,
  deptList,
  onEdit,
  onToggleFreeze,
}: {
  staff: PlatformStaff;
  deptList: Department[];
  onEdit: () => void;
  onToggleFreeze: () => void;
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
              <p className="truncate font-medium text-text-primary">
                {staff.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-text-muted">
                {departmentLabel(staff.departmentId, deptList)}
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
            <Badge tone={staff.status === 'active' ? 'success' : 'warning'}>
              {staff.status}
            </Badge>
          </div>

          <p className="mt-2 truncate text-sm text-text-secondary">
            {staff.email}
          </p>
        </div>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border bg-canvas/40 px-4 py-3">
          <DetailField label="Email" value={staff.email} breakAll />
          <DetailField label="Phone" value={staff.phone} />
          <DetailField
            label="Department"
            value={departmentLabel(staff.departmentId, deptList)}
          />
          <DetailField label="Joined" value={formatDateTime(staff.createdAt)} />

          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={onEdit}>
              Edit
            </Button>
            <Button size="sm" variant="secondary" onClick={onToggleFreeze}>
              {staff.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
            </Button>
          </div>
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

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
