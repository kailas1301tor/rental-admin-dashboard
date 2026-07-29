import type { ReactNode } from 'react';
import { usePermissions } from '@/auth/usePermissions';
import type { PermissionModule } from '@/types';

export function PermissionGate({
  module,
  level = 'manage',
  children,
  fallback = null,
}: {
  module: PermissionModule;
  level?: 'view' | 'manage';
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { canView, canManage } = usePermissions();
  const allowed = level === 'manage' ? canManage(module) : canView(module);
  if (!allowed) return fallback;
  return children;
}
