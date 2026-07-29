import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Lock, Pencil, Trash2, UserPlus } from 'lucide-react';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn, formatDateTime } from '@/lib/utils';
import type { Department, PlatformAdmin } from '@/types';

export function DepartmentCard({
  dept,
  hod,
  staffCount,
  onEdit,
  onAssignHod,
  onToggleFreeze,
  onArchive,
}: {
  dept: Department;
  hod?: PlatformAdmin;
  staffCount: number;
  onEdit: (dept: Department) => void;
  onAssignHod: (dept: Department) => void;
  onToggleFreeze: (dept: Department) => void;
  onArchive: (dept: Department) => void;
}) {
  const showAssignHod = !dept.hodAdminId && dept.status === 'active';

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent',
            )}
            aria-hidden
          >
            <Building2 className="h-4 w-4" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-text-primary">
                {dept.name}
              </h3>
              <Badge
                tone={
                  dept.status === 'active'
                    ? 'success'
                    : dept.status === 'frozen'
                      ? 'warning'
                      : 'neutral'
                }
              >
                {dept.status}
              </Badge>
            </div>

            {dept.description ? (
              <p className="mt-1 text-sm text-text-secondary">
                {dept.description}
              </p>
            ) : null}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <MetaItem label="HOD">
            {hod ? (
              <Link
                to="/admins"
                className="text-sm font-medium text-accent hover:underline"
              >
                {hod.name}
              </Link>
            ) : (
              <span className="text-sm text-text-muted">Vacant</span>
            )}
          </MetaItem>
          <MetaItem label="Staff">
            <span className="text-sm font-medium tabular-nums text-text-primary">
              {staffCount}
            </span>
          </MetaItem>
          <MetaItem label="Created">
            <span className="text-sm text-text-secondary">
              {formatDateTime(dept.createdAt)}
            </span>
          </MetaItem>
        </dl>
      </div>

      <PermissionGate module="departments">
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-canvas/40 px-4 py-3 sm:px-5">
          <Button size="sm" variant="outline" onClick={() => onEdit(dept)}>
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit
          </Button>
          {showAssignHod ? (
            <Button size="sm" variant="outline" onClick={() => onAssignHod(dept)}>
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
              Assign HOD
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => onToggleFreeze(dept)}>
            <Lock className="h-3.5 w-3.5" aria-hidden />
            {dept.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-danger hover:border-danger"
            disabled={staffCount > 0}
            onClick={() => onArchive(dept)}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Archive
          </Button>
        </div>
      </PermissionGate>
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
