import type { AuthUser } from '@/types/index';

export type PermissionModule =
  | 'dashboard'
  | 'admins'
  | 'staff'
  | 'departments'
  | 'rbos'
  | 'products'
  | 'categories'
  | 'users'
  | 'login_alerts'
  | 'approval_overrides'
  | 'reports'
  | 'activity_log'
  | 'settings';

export type PermissionLevel = 'view' | 'manage';

export type UserPermissions = Partial<Record<PermissionModule, PermissionLevel>>;

export interface AdminProfile {
  user: AuthUser;
  permissions: UserPermissions;
}

export interface AdminPermissionRow {
  userId: string;
  name: string;
  email: string;
  tier: 'general_admin' | 'department_admin';
  departmentId?: string;
  permissions: UserPermissions;
}
