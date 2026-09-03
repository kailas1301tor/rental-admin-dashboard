import { useState, useMemo } from 'react';
import { getErrorMessage } from '@/api/axios-client';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { assignRolePermissions } from '@/api/roles';
import { useProfile } from '@/auth/ProfileProvider';
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
import { PermissionMobileCard } from '@/pages/super-admin/permissions/PermissionMobileCard';
import type { BackendRole, BackendPermission } from '@/types';

export function PermissionsPage() {
  const { toast } = useToast();
  const { mutate: mutateProfile } = useProfile();
  
  const { data: roles, error: rolesError, isLoading: rolesLoading, mutate: mutateRoles } = useApiSWR<BackendRole[]>(
    ENDPOINTS.roles,
  );
  
  const { data: permissionsList, error: permissionsError, isLoading: permissionsLoading } = useApiSWR<BackendPermission[]>(
    ENDPOINTS.permissionsList,
  );

  const [editingRole, setEditingRole] = useState<BackendRole | null>(null);
  const [draftPermissionIds, setDraftPermissionIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const rows = roles ?? [];

  function openEditor(role: BackendRole) {
    setEditingRole(role);
    setDraftPermissionIds(new Set(role.permissions.map(p => p.id)));
  }

  function togglePermission(permissionId: number) {
    setDraftPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  }

  async function onSave() {
    if (!editingRole) return;
    setSaving(true);
    try {
      await assignRolePermissions(editingRole.id, Array.from(draftPermissionIds));
      await mutateRoles();
      await mutateProfile();
      toast('Permissions updated successfully', 'success');
      setEditingRole(null);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  if ((rolesLoading && !roles) || (permissionsLoading && !permissionsList)) {
    return <ListPageSkeleton showKpis={false} />;
  }
  
  if (rolesError || permissionsError) {
    return <ErrorState message={rolesError?.message || permissionsError?.message} onRetry={() => void mutateRoles()} />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Role Permissions"
        description="Configure module access for predefined roles. These apply to all users assigned to the respective role."
      />

      {rows.length === 0 ? (
        <EmptyState title="No roles found" />
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {rows.map((row) => (
              <PermissionMobileCard
                key={row.id}
                row={row}
                onEdit={() => openEditor(row)}
              />
            ))}
          </div>

          <TableShell className="hidden lg:block">
          <Table>
            <thead>
              <tr>
                <Th>Role</Th>
                <Th>Modules granted</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <ClickableTableRow
                  key={row.id}
                  onActivate={() => openEditor(row)}
                  ariaLabel={`Edit permissions for ${row.name}`}
                >
                  <ClickableTd>
                    <p className="font-medium text-text-primary">{row.name}</p>
                  </ClickableTd>
                  <ClickableTd className="tabular-nums">
                    {row.permissions.length}
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
        open={Boolean(editingRole)}
        onClose={() => setEditingRole(null)}
        title={editingRole ? `Permissions — ${editingRole.name}` : 'Permissions'}
        description="Select the granular permissions granted to this role."
        className="sm:max-w-2xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingRole(null)}>
              Cancel
            </Button>
            <Button onClick={() => void onSave()} isLoading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="max-h-[min(60vh,28rem)] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {permissionsList?.map((permission) => (
              <label 
                key={permission.id} 
                className="flex items-start gap-3 p-3 rounded-md border border-border/50 bg-surface/50 hover:bg-surface cursor-pointer transition-colors"
              >
                <div className="flex h-5 items-center">
                  <input
                    type="checkbox"
                    checked={draftPermissionIds.has(permission.id)}
                    onChange={() => togglePermission(permission.id)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                </div>
                <div className="flex flex-col text-sm">
                  <span className="font-medium text-text-primary">{permission.name}</span>
                  <span className="text-xs text-text-muted font-mono mt-0.5">{permission.codename}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

