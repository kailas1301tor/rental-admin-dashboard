import { useMemo } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useProfile } from '@/auth/ProfileProvider';
import {
  canManage as checkManage,
  canView as checkView,
  isSuperAdmin,
} from '@/auth/permissions';
import type { PermissionModule } from '@/types';

export function usePermissions() {
  const { user } = useAuth();
  const { permissions } = useProfile();

  return useMemo(
    () => ({
      permissions,
      isSuperAdmin: isSuperAdmin(user),
      canView: (module: PermissionModule) =>
        checkView(permissions, module, user),
      canManage: (module: PermissionModule) =>
        checkManage(permissions, module, user),
    }),
    [permissions, user],
  );
}
