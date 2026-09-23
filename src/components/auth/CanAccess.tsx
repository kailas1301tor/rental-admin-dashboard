import type { ReactNode } from 'react';
import { useRBAC } from '@/auth/useRBAC';

interface CanAccessProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function CanAccess({ permission, children, fallback = null }: CanAccessProps) {
  const { hasPermission } = useRBAC();

  if (!hasPermission(permission)) {
    return fallback;
  }

  return children;
}
