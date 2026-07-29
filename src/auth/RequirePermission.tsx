import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useProfile } from '@/auth/ProfileProvider';
import {
  canView,
  firstAllowedPath,
  isSuperAdmin,
} from '@/auth/permissions';
import { DetailPageSkeleton } from '@/components/ui/skeletons';
import type { PermissionModule } from '@/types';
import type { ReactNode } from 'react';

export function RequirePermission({
  module,
  level = 'view',
  superAdminOnly,
  children,
}: {
  module?: PermissionModule;
  level?: 'view' | 'manage';
  superAdminOnly?: boolean;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const { permissions, isLoading } = useProfile();

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (superAdminOnly) {
    if (!isSuperAdmin(user)) {
      const fallback = firstAllowedPath(permissions, user);
      return <Navigate to={fallback ?? '/unauthorized'} replace />;
    }
    return children;
  }

  if (!module) {
    return children;
  }

  const allowed =
    level === 'manage'
      ? permissions[module] === 'manage' || isSuperAdmin(user)
      : canView(permissions, module, user);

  if (!allowed) {
    const fallback = firstAllowedPath(permissions, user);
    return <Navigate to={fallback ?? '/unauthorized'} replace />;
  }

  return children;
}
