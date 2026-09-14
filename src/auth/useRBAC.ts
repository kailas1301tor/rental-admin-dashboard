import { useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { isSuperAdmin } from '@/auth/permissions';

const BYPASS_ROLES = [
  'Super Admin',
  'super_admin',
  'General Admin',
  'general_admin',
  'general_admin_1',
  'general_admin_2',
  'Department Admin',
  'department_admin',
  'Staff',
];

export function useRBAC() {
  const { user } = useAuth();

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      if (isSuperAdmin(user) || BYPASS_ROLES.includes(user.role)) return true;
      return user.permissions?.includes(permission) ?? false;
    },
    [user],
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]) => {
      if (!user) return false;
      if (isSuperAdmin(user) || BYPASS_ROLES.includes(user.role)) return true;
      return permissions.some((p) => user.permissions?.includes(p));
    },
    [user],
  );

  return { hasPermission, hasAnyPermission };
}
