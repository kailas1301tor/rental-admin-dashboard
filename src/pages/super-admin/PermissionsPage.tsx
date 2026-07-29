import { useMemo, useState } from 'react';
import { getErrorMessage } from '@/api/axios-client';
import { ENDPOINTS } from '@/api/endpoints';
import { updateUserPermissions } from '@/api/profile';
import { useApiSWR } from '@/api/swr-helpers';
import {
  ALL_MODULES,
  MODULE_LABELS,
  grantedModuleCount,
} from '@/auth/permissions';
import { useProfile } from '@/auth/ProfileProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { Table, TableShell, Th } from '@/components/ui/Table';
import {
  ClickableTableRow,
  ClickableTd,
  TableActionsCell,
} from '@/components/ui/clickable-row';
import { useToast } from '@/components/ui/Toast';
import { adminTierLabel, departmentLabel } from '@/lib/departments';
import { PermissionMobileCard } from '@/pages/super-admin/permissions/PermissionMobileCard';
import type {
  AdminPermissionRow,
  PermissionLevel,
  PermissionModule,
  UserPermissions,
} from '@/types';

type LevelChoice = 'none' | PermissionLevel;

function toChoice(
  permissions: UserPermissions,
  module: PermissionModule,
): LevelChoice {
  return permissions[module] ?? 'none';
}

function fromChoice(choice: LevelChoice): PermissionLevel | undefined {
  return choice === 'none' ? undefined : choice;
}

export function PermissionsPage() {
  const { toast } = useToast();
  const { mutate: mutateProfile } = useProfile();
  const { data, error, isLoading, mutate } = useApiSWR<AdminPermissionRow[]>(
    ENDPOINTS.adminPermissions,
  );
  const [editing, setEditing] = useState<AdminPermissionRow | null>(null);
  const [draft, setDraft] = useState<UserPermissions>({});
  const [saving, setSaving] = useState(false);

  const rows = data ?? [];

  const moduleDraft = useMemo(() => {
    const map = new Map<PermissionModule, LevelChoice>();
    for (const module of ALL_MODULES) {
      map.set(module, toChoice(draft, module));
    }
    return map;
  }, [draft]);

  function openEditor(row: AdminPermissionRow) {
    setEditing(row);
    setDraft({ ...row.permissions });
  }

  function setModuleLevel(module: PermissionModule, choice: LevelChoice) {
    setDraft((prev) => {
      const next = { ...prev };
      const level = fromChoice(choice);
      if (level) next[module] = level;
      else delete next[module];
      return next;
    });
  }

  async function onSave() {
    if (!editing) return;
    setSaving(true);
    try {
      await updateUserPermissions(editing.userId, draft);
      await mutate();
      await mutateProfile();
      toast('Permissions updated', 'success');
      setEditing(null);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading && !data) return <ListPageSkeleton showKpis={false} />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Permissions"
        description="Configure per-user module access for General Admins and Department Admins. Super Admins always have full access."
      />

      {rows.length === 0 ? (
        <EmptyState title="No configurable admins" />
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {rows.map((row) => (
              <PermissionMobileCard
                key={row.userId}
                row={row}
                onEdit={() => openEditor(row)}
              />
            ))}
          </div>

          <TableShell className="hidden lg:block">
          <Table>
            <thead>
              <tr>
                <Th>Admin</Th>
                <Th>Role</Th>
                <Th>Department</Th>
                <Th>Modules granted</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <ClickableTableRow
                  key={row.userId}
                  onActivate={() => openEditor(row)}
                  ariaLabel={`Edit permissions for ${row.name}`}
                >
                  <ClickableTd>
                    <p className="font-medium text-text-primary">{row.name}</p>
                    <p className="text-xs text-text-muted">{row.email}</p>
                  </ClickableTd>
                  <ClickableTd>
                    <Badge tone="accent">{adminTierLabel(row.tier)}</Badge>
                  </ClickableTd>
                  <ClickableTd className="text-sm text-text-secondary">
                    {row.departmentId
                      ? departmentLabel(row.departmentId)
                      : '—'}
                  </ClickableTd>
                  <ClickableTd className="tabular-nums">
                    {grantedModuleCount(row.permissions)}
                  </ClickableTd>
                  <TableActionsCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditor(row)}
                    >
                      Edit permissions
                    </Button>
                  </TableActionsCell>
                </ClickableTableRow>
              ))}
            </tbody>
          </Table>
        </TableShell>
        </>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Permissions — ${editing.name}` : 'Permissions'}
        description="Set View for read-only access or Manage for full module control."
        className="sm:max-w-2xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => void onSave()} isLoading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="max-h-[min(60vh,28rem)] overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-muted">
                <th className="py-2 pr-3 font-medium">Module</th>
                <th className="px-2 py-2 font-medium">None</th>
                <th className="px-2 py-2 font-medium">View</th>
                <th className="px-2 py-2 font-medium">Manage</th>
              </tr>
            </thead>
            <tbody>
              {ALL_MODULES.map((module) => (
                <tr key={module} className="border-b border-border/60">
                  <td className="py-2.5 pr-3 font-medium text-text-primary">
                    {MODULE_LABELS[module]}
                  </td>
                  {(['none', 'view', 'manage'] as const).map((choice) => (
                    <td key={choice} className="px-2 py-2.5 text-center">
                      <input
                        type="radio"
                        name={`perm-${module}`}
                        checked={moduleDraft.get(module) === choice}
                        onChange={() => setModuleLevel(module, choice)}
                        className="h-4 w-4 accent-accent"
                        aria-label={`${MODULE_LABELS[module]} ${choice}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
