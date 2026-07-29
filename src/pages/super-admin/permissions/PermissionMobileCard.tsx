import { type ReactNode } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { NavigableListCard } from '@/components/ui/NavigableListCard';
import { cn } from '@/lib/utils';
import { adminTierLabel, departmentLabel } from '@/lib/departments';
import { grantedModuleCount } from '@/auth/permissions';
import type { AdminPermissionRow } from '@/types';

export function PermissionMobileCard({
  row,
  onEdit,
}: {
  row: AdminPermissionRow;
  onEdit: () => void;
}) {
  return (
    <NavigableListCard
      onActivate={onEdit}
      label={`Edit permissions for ${row.name}`}
      summary={
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
            {initials(row.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-text-primary">{row.name}</p>
            <p className="mt-0.5 truncate text-xs text-text-muted">
              {row.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="accent">{adminTierLabel(row.tier)}</Badge>
              <span className="text-xs tabular-nums text-text-muted">
                {grantedModuleCount(row.permissions)} modules granted
              </span>
            </div>
            <p className="mt-2 text-sm text-text-secondary">
              {row.departmentId
                ? departmentLabel(row.departmentId)
                : 'No department'}
            </p>
          </div>
        </div>
      }
      details={
        <>
          <DetailField label="Email" value={row.email} breakAll />
          <DetailField label="Role">
            <Badge tone="accent">{adminTierLabel(row.tier)}</Badge>
          </DetailField>
          <DetailField
            label="Department"
            value={
              row.departmentId
                ? departmentLabel(row.departmentId)
                : '—'
            }
          />
          <DetailField
            label="Modules granted"
            value={String(grantedModuleCount(row.permissions))}
          />
          <div className="pt-1">
            <Button size="sm" variant="outline" onClick={onEdit}>
              Edit permissions
            </Button>
          </div>
        </>
      }
    />
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
