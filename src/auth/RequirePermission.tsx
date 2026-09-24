import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useProfile } from '@/auth/ProfileProvider';
import {
  canManage,
  canView,
  firstAllowedPath,
} from '@/auth/permissions';
import { useRBAC } from '@/auth/useRBAC';
import { DetailPageSkeleton } from '@/components/ui/skeletons';
import type { PermissionModule } from '@/types';
import type { ReactNode } from 'react';

export function RequirePermission({
  module,
  permission,
  level = 'view',
  children,
}: {
  module?: PermissionModule;
  permission?: string;
  level?: 'view' | 'manage';
  /** @deprecated Ignored — access is permission-based only */
  superAdminOnly?: boolean;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const { permissions, isLoading } = useProfile();
  const { hasPermission } = useRBAC();

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (permission) {
    if (!hasPermission(permission)) {
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
      ? canManage(permissions, module, user)
      : canView(permissions, module, user);

  if (!allowed) {
    const fallback = firstAllowedPath(permissions, user);
    return <Navigate to={fallback ?? '/unauthorized'} replace />;
  }

  return children;
}
