import type { ReactNode } from 'react';
import { useRBAC } from '@/auth/useRBAC';
import type { PermissionModule } from '@/types';

// Map legacy module names to standard Django view/change permissions
const legacyMap: Record<string, string> = {
  dashboard: 'view_platformsettings',
  admins: 'view_superadmin',
  staff: 'view_staff',
  departments: 'view_department',
  rbos: 'view_rbovendor',
  listings: 'view_product',
  bookings: 'view_bookingsummary',
  categories: 'view_category',
  users: 'view_marketplaceuser',
  login_alerts: 'view_loginalert',
  support: 'view_supportticket',
  deal_desk: 'view_dealdeskinquiry',
  reviews_moderation: 'view_review',
  approval_overrides: 'view_approvaloverrideitem',
  reports: 'view_platformsettings',
  activity_log: 'view_auditlog',
  notifications: 'view_systemnotification',
  settings: 'view_platformsettings',
};

export function PermissionGate({
  module,
  level = 'manage',
  children,
  fallback = null,
}: {
  module: PermissionModule | string;
  level?: 'view' | 'manage';
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasPermission } = useRBAC();
  const basePermission = legacyMap[module as string] || `view_${module as string}`;
  
  // Example: if level is 'manage', try to infer 'change_rbovendor' or 'add_rbovendor'.
  // For safety on legacy components, we will map 'manage' to the 'change_' prefix if view_ is known.
  let targetPerm = basePermission;
  if (level === 'manage' && basePermission.startsWith('view_')) {
    targetPerm = basePermission.replace('view_', 'change_');
  }

  const allowed = hasPermission(targetPerm);

  if (!allowed) return fallback;
  return children;
}
