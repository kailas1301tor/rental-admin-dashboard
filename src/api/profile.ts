import { apiGet } from '@/api/axios-helpers';
import { apiPatch } from '@/api/axios-helpers';
import { ENDPOINTS } from '@/api/endpoints';
import type {
  AdminPermissionRow,
  AdminProfile,
  UserPermissions,
} from '@/types';

export async function fetchProfile(): Promise<AdminProfile> {
  return apiGet<AdminProfile>(ENDPOINTS.profile);
}

export async function fetchAdminPermissions(): Promise<AdminPermissionRow[]> {
  return apiGet<AdminPermissionRow[]>(ENDPOINTS.adminPermissions);
}

export async function updateUserPermissions(
  userId: string,
  permissions: UserPermissions,
): Promise<UserPermissions> {
  return apiPatch<UserPermissions>(
    `${ENDPOINTS.adminPermissions}/${userId}`,
    { permissions },
  );
}
