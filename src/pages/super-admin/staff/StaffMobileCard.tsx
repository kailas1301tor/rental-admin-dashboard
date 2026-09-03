import { PermissionGate } from '@/components/auth/PermissionGate';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { NavigableListCard } from '@/components/ui/NavigableListCard';
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
  return (
    <NavigableListCard
      onActivate={onEdit}
      label={`Edit ${staff.name}`}
      summary={
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
            {initials(staff.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-text-primary">
              {staff.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-text-muted">
              {staff.department?.name || 'N/A'}
            </p>
            <div className="mt-2">
              <Badge tone={staff.status === 'active' ? 'success' : 'warning'}>
                {staff.status}
              </Badge>
            </div>
            <p className="mt-2 truncate text-sm text-text-secondary">
              {staff.email}
            </p>
          </div>
        </div>
      }
      details={
        <>
          <DetailField label="Email" value={staff.email} breakAll />
          <DetailField label="Phone" value={staff.phone} />
          <DetailField
            label="Department"
            value={staff.department?.name || 'N/A'}
          />
          <DetailField label="Joined" value={formatDateTime(staff.createdAt)} />
          <PermissionGate module="staff">
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={onEdit}>
                Edit
              </Button>
              <Button size="sm" variant="secondary" onClick={onToggleFreeze}>
                {staff.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
              </Button>
            </div>
          </PermissionGate>
        </>
      }
    />
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
