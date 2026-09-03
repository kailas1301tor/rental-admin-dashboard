import { apiGet, apiPost } from '@/api/axios-helpers';
import { ENDPOINTS } from '@/api/endpoints';
import type { BackendPermission, BackendRole } from '@/types';

export async function fetchRoles(): Promise<BackendRole[]> {
  return apiGet<BackendRole[]>(ENDPOINTS.roles);
}

export async function fetchPermissions(): Promise<BackendPermission[]> {
  return apiGet<BackendPermission[]>(ENDPOINTS.permissionsList);
}

export async function assignRolePermissions(
  groupId: number,
  permissionIds: number[],
): Promise<void> {
  return apiPost<void>(ENDPOINTS.rolePermissionsAssign, {
    group_id: groupId,
    permission_ids: permissionIds,
  });
}
