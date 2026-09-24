import { useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';

export function useRBAC() {
  const { user } = useAuth();

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      return user.permissions?.includes(permission) ?? false;
    },
    [user],
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]) => {
      if (!user) return false;
      if (!permissions.length) return false;
      return permissions.some((p) => user.permissions?.includes(p));
    },
    [user],
  );

  return { hasPermission, hasAnyPermission };
}
