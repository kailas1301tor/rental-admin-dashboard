import type { AuthUser } from '@/types';
import type {
  PermissionLevel,
  PermissionModule,
  UserPermissions,
} from '@/types/permissions';
import { maxPermissionLevel } from '@/auth/listing-permissions';

export const ALL_MODULES: PermissionModule[] = [
  'dashboard',
  'admins',
  'staff',
  'departments',
  'rbos',
  'listings',
  'bookings',
  'categories',
  'users',
  'login_alerts',
  'approval_overrides',
  'reports',
  'activity_log',
  'reviews_moderation',
  'support',
  'deal_desk',
  'notifications',
  'settings',
];

export const MODULE_LABELS: Record<PermissionModule, string> = {
  dashboard: 'Dashboard',
  admins: 'Admins',
  staff: 'Staff',
  departments: 'Departments',
  rbos: 'RBOs',
  listings: 'Listings',
  bookings: 'Bookings',
  categories: 'Categories',
  users: 'Users',
  login_alerts: 'Login Alerts',
  approval_overrides: 'Approval Overrides',
  reports: 'Reports',
  activity_log: 'Activity Log',
  reviews_moderation: 'Review Moderation',
  support: 'Support Inbox',
  deal_desk: 'Deal Desk',
  notifications: 'Notifications',
  settings: 'Settings',
};

const PATH_TO_MODULE: Record<string, PermissionModule> = {
  '/': 'dashboard',
  '/admins': 'admins',
  '/staff': 'staff',
  '/departments': 'departments',
  '/rbos': 'rbos',
  '/listings': 'listings',
  '/products': 'listings',
  '/services': 'listings',
  '/bookings': 'bookings',
  '/categories': 'categories',
  '/users': 'users',
  '/login-alerts': 'login_alerts',
  '/approval-overrides': 'approval_overrides',
  '/reports': 'reports',
  '/activity-log': 'activity_log',
  '/reviews': 'reviews_moderation',
  '/support': 'support',
  '/deal-desk': 'deal_desk',
  '/notifications': 'notifications',
  '/settings': 'settings',
};

export function listingsPermissionLevel(
  permissions: UserPermissions,
): PermissionLevel | undefined {
  const legacy = permissions as UserPermissions & {
    products?: PermissionLevel;
    services?: PermissionLevel;
  };
  return maxPermissionLevel(
    permissions.listings,
    legacy.products,
    legacy.services,
  );
}

export function isSuperAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === 'Super Admin';
}

const BYPASS_ROLES = ['Super Admin', 'General Admin', 'Department Admin', 'Staff'];

export function canView(
  permissions: UserPermissions,
  module: PermissionModule,
  user?: AuthUser | null,
): boolean {
  if (isSuperAdmin(user)) return true;
  if (user && BYPASS_ROLES.includes(user.role)) return true;
  const level =
    module === 'listings'
      ? listingsPermissionLevel(permissions)
      : permissions[module];
  return level === 'view' || level === 'manage';
}

export function canManage(
  permissions: UserPermissions,
  module: PermissionModule,
  user?: AuthUser | null,
): boolean {
  if (isSuperAdmin(user)) return true;
  if (user && BYPASS_ROLES.includes(user.role)) return true;
  if (module === 'listings') {
    return listingsPermissionLevel(permissions) === 'manage';
  }
  return permissions[module] === 'manage';
}

export function navToModule(pathname: string): PermissionModule | null {
  if (pathname === '/permissions') return null;
  const exact = PATH_TO_MODULE[pathname];
  if (exact) return exact;

  for (const [path, module] of Object.entries(PATH_TO_MODULE)) {
    if (path !== '/' && pathname.startsWith(`${path}/`)) {
      return module;
    }
  }
  return null;
}

export function firstAllowedPath(
  permissions: UserPermissions,
  user?: AuthUser | null,
): string | null {
  if (isSuperAdmin(user)) return '/';
  const order = [
    '/',
    '/rbos',
    '/listings',
    '/bookings',
    '/users',
    '/support',
    '/deal-desk',
    '/categories',
    '/staff',
    '/departments',
    '/admins',
    '/login-alerts',
    '/approval-overrides',
    '/reviews',
    '/notifications',
    '/reports',
    '/activity-log',
    '/settings',
  ];
  for (const path of order) {
    const module = navToModule(path);
    if (module && canView(permissions, module, user)) return path;
  }
  return null;
}

export function isValidPermissionLevel(
  value: unknown,
): value is PermissionLevel {
  return value === 'view' || value === 'manage';
}

export function sanitizePermissions(
  input: UserPermissions,
): UserPermissions {
  const legacy = input as UserPermissions & {
    products?: PermissionLevel;
    services?: PermissionLevel;
  };
  const merged: UserPermissions = { ...input };
  const listingLevel = maxPermissionLevel(
    merged.listings,
    legacy.products,
    legacy.services,
  );
  if (listingLevel) {
    merged.listings = listingLevel;
  }
  delete (merged as { products?: PermissionLevel; services?: PermissionLevel }).products;
  delete (merged as { products?: PermissionLevel; services?: PermissionLevel }).services;

  const out: UserPermissions = {};
  for (const key of ALL_MODULES) {
    const level = merged[key];
    if (isValidPermissionLevel(level)) {
      out[key] = level;
    }
  }
  return out;
}

export function grantedModuleCount(permissions: UserPermissions): number {
  return ALL_MODULES.filter((m) => permissions[m] !== undefined).length;
}

export function portalLabel(role: string | undefined): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'general_admin_1':
    case 'general_admin_2':
      return 'General Admin';
    case 'department_admin':
      return 'Department Admin';
    default:
      return 'Admin';
  }
}
