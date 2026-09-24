import { useMemo } from 'react';
import { useRBAC } from '@/auth/useRBAC';
import { APP_NAV, type NavItem } from '@/layouts/nav';

export function useFilteredNav(): NavItem[] {
  const { hasAnyPermission } = useRBAC();

  return useMemo(() => {
    return APP_NAV.filter((item) => {
      if (!item.permissions || item.permissions.length === 0) {
        return false;
      }
      return hasAnyPermission(item.permissions);
    });
  }, [hasAnyPermission]);
}
