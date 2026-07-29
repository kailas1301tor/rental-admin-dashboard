import type { AuthUser } from '@/types';
import type {
  PermissionLevel,
  PermissionModule,
  UserPermissions,
} from '@/types/permissions';

export const ALL_MODULES: PermissionModule[] = [
  'dashboard',
  'admins',
  'staff',
  'departments',
  'rbos',
  'products',
  'categories',
  'users',
  'login_alerts',
  'approval_overrides',
  'reports',
  'activity_log',
  'settings',
];

export const MODULE_LABELS: Record<PermissionModule, string> = {
  dashboard: 'Dashboard',
  admins: 'Admins',
  staff: 'Staff',
  departments: 'Departments',
  rbos: 'RBOs',
  products: 'Products',
  categories: 'Categories',
  users: 'Users',
  login_alerts: 'Login Alerts',
  approval_overrides: 'Approval Overrides',
  reports: 'Reports',
  activity_log: 'Activity Log',
  settings: 'Settings',
};

const PATH_TO_MODULE: Record<string, PermissionModule> = {
  '/': 'dashboard',
  '/admins': 'admins',
  '/staff': 'staff',
  '/departments': 'departments',
  '/rbos': 'rbos',
  '/products': 'products',
  '/categories': 'categories',
  '/users': 'users',
  '/login-alerts': 'login_alerts',
  '/approval-overrides': 'approval_overrides',
  '/reports': 'reports',
  '/activity-log': 'activity_log',
  '/settings': 'settings',
};

export function isSuperAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === 'super_admin';
}

export function canView(
  permissions: UserPermissions,
  module: PermissionModule,
  user?: AuthUser | null,
): boolean {
  if (isSuperAdmin(user)) return true;
  const level = permissions[module];
  return level === 'view' || level === 'manage';
}

export function canManage(
  permissions: UserPermissions,
  module: PermissionModule,
  user?: AuthUser | null,
): boolean {
  if (isSuperAdmin(user)) return true;
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
    '/products',
    '/users',
    '/categories',
    '/staff',
    '/departments',
    '/admins',
    '/login-alerts',
    '/approval-overrides',
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
  const out: UserPermissions = {};
  for (const key of ALL_MODULES) {
    const level = input[key];
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
