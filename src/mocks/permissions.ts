import type { UserPermissions } from '@/types/permissions';

/** Mutable per-user permission store — swapped for Profile API later. */
export const mockUserPermissions: Record<string, UserPermissions> = {
  'ga-1': {
    dashboard: 'manage',
    rbos: 'manage',
    products: 'manage',
    categories: 'manage',
    users: 'manage',
    staff: 'manage',
    approval_overrides: 'manage',
    departments: 'view',
    login_alerts: 'view',
    reports: 'view',
    activity_log: 'view',
    settings: 'view',
  },
  'ga-2': {
    dashboard: 'view',
    rbos: 'view',
    products: 'view',
    users: 'view',
    reports: 'view',
  },
  'hod-ops': {
    approval_overrides: 'manage',
    rbos: 'view',
    products: 'view',
    login_alerts: 'view',
  },
  'hod-onboard': {
    rbos: 'manage',
    products: 'manage',
    categories: 'view',
    users: 'view',
  },
  'hod-accounts': {
    reports: 'manage',
    approval_overrides: 'view',
    users: 'view',
  },
  'hod-audit': {
    activity_log: 'manage',
    login_alerts: 'view',
    approval_overrides: 'view',
    reports: 'view',
  },
};

export function fullManagePermissions(): UserPermissions {
  return {
    dashboard: 'manage',
    admins: 'manage',
    staff: 'manage',
    departments: 'manage',
    rbos: 'manage',
    products: 'manage',
    categories: 'manage',
    users: 'manage',
    login_alerts: 'manage',
    approval_overrides: 'manage',
    reports: 'manage',
    activity_log: 'manage',
    settings: 'manage',
  };
}
