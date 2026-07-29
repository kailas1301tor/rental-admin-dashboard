import { useMemo } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { canView, isSuperAdmin } from '@/auth/permissions';
import { useProfile } from '@/auth/ProfileProvider';
import { APP_NAV, type NavItem } from '@/layouts/nav';

export function useFilteredNav(): NavItem[] {
  const { user } = useAuth();
  const { permissions } = useProfile();

  return useMemo(() => {
    return APP_NAV.filter((item) => {
      if (item.superAdminOnly) return isSuperAdmin(user);
      if (!item.permission) return true;
      return canView(permissions, item.permission, user);
    });
  }, [permissions, user]);
}
