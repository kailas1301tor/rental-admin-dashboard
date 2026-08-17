import type { UserPermissions } from '@/types/permissions';

/** Merge legacy products/services keys into listings for stored profiles. */
export const mockUserPermissions: Record<string, UserPermissions> = {
  'ga-1': {
    dashboard: 'manage',
    rbos: 'manage',
    listings: 'manage',
    bookings: 'manage',
    categories: 'manage',
    users: 'manage',
    staff: 'manage',
    approval_overrides: 'manage',
    support: 'manage',
    deal_desk: 'view',
    reviews_moderation: 'manage',
    notifications: 'view',
    departments: 'view',
    login_alerts: 'view',
    reports: 'view',
    activity_log: 'view',
    settings: 'view',
  },
  'ga-2': {
    dashboard: 'view',
    rbos: 'view',
    listings: 'view',
    users: 'view',
    reports: 'view',
  },
  'hod-ops': {
    approval_overrides: 'manage',
    rbos: 'view',
    listings: 'view',
    login_alerts: 'view',
  },
  'hod-onboard': {
    rbos: 'manage',
    listings: 'manage',
    categories: 'view',
    users: 'view',
    reviews_moderation: 'view',
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
    listings: 'manage',
    bookings: 'manage',
    categories: 'manage',
    users: 'manage',
    login_alerts: 'manage',
    approval_overrides: 'manage',
    reports: 'manage',
    activity_log: 'manage',
    reviews_moderation: 'manage',
    support: 'manage',
    deal_desk: 'manage',
    notifications: 'manage',
    settings: 'manage',
  };
}
