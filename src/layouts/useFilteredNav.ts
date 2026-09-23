import { useMemo } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useRBAC } from '@/auth/useRBAC';
import { APP_NAV, type NavItem } from '@/layouts/nav';

export function useFilteredNav(): NavItem[] {
  const { user } = useAuth();
  const { hasAnyPermission } = useRBAC();

  return useMemo(() => {
    return APP_NAV.filter((item) => {
      if (item.superAdminOnly) {
        return user?.role === 'super_admin' || user?.role === 'Super Admin';
      }
      if (!item.permissions || item.permissions.length === 0) return true;
      return hasAnyPermission(item.permissions);
    });
  }, [user, hasAnyPermission]);
}
