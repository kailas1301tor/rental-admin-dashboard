import { useAuth } from '@/auth/AuthContext';
import { useCallback } from 'react';

export function useRBAC() {
  const { user } = useAuth();

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      return user.permissions?.includes(permission) ?? false;
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]) => {
      if (!user) return false;
      return permissions.some((p) => user.permissions?.includes(p));
    },
    [user]
  );

  return { hasPermission, hasAnyPermission };
}
