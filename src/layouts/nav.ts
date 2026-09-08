import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Briefcase,
  Bell,
  CalendarDays,
  ClipboardCheck,
  ContactRound,
  FileText,
  Headphones,
  History,
  KeyRound,
  LayoutDashboard,
  Layers3,
  Package,
  Settings,
  ShieldAlert,
  Star,
  Store,
  UserCog,
  Users,
} from 'lucide-react';
import type { PermissionModule } from '@/types';

export type NavSection =
  | 'operations'
  | 'user_management'
  | 'oversight'
  | 'insights'
  | 'system';

export interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: LucideIcon;
  section: NavSection;
  permissions?: string[];
  superAdminOnly?: boolean;
}

export const NAV_SECTIONS: Array<{ id: NavSection; label: string }> = [
  { id: 'operations', label: 'Operations' },
  { id: 'user_management', label: 'User Management' },
  { id: 'oversight', label: 'Oversight' },
  { id: 'insights', label: 'Insights' },
  { id: 'system', label: 'System' },
];

export const APP_NAV: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    end: true,
    icon: LayoutDashboard,
    section: 'operations',
    // Always show or require bookingsummary fallback, leaving empty means always show
  },
  {
    to: '/admins',
    label: 'Admins',
    icon: UserCog,
    section: 'operations',
    permissions: ['view_superadmin', 'view_generaladmin', 'view_departmentadmin'],
  },
  {
    to: '/staff',
    label: 'Staff',
    icon: Users,
    section: 'operations',
    permissions: ['view_staff'],
  },
  {
    to: '/departments',
    label: 'Departments',
    icon: Building2,
    section: 'operations',
    permissions: ['view_department'],
  },
  {
    to: '/rbos',
    label: 'RBOs',
    icon: Store,
    section: 'operations',
    permissions: ['view_rbovendor'],
  },
  {
    to: '/listings',
    label: 'Listings',
    icon: Package,
    section: 'operations',
    permissions: ['view_product', 'view_service'],
  },
  {
    to: '/bookings',
    label: 'Bookings',
    icon: CalendarDays,
    section: 'operations',
    permissions: ['view_bookingsummary'],
  },
  {
    to: '/categories',
    label: 'Categories',
    icon: Layers3,
    section: 'operations',
    permissions: ['view_category'],
  },
  {
    to: '/users',
    label: 'Users',
    icon: ContactRound,
    section: 'user_management',
    permissions: ['view_marketplaceuser'],
  },
  {
    to: '/login-alerts',
    label: 'Login Alerts',
    icon: ShieldAlert,
    section: 'oversight',
    permissions: ['view_loginalert'],
  },
  {
    to: '/support',
    label: 'Support',
    icon: Headphones,
    section: 'oversight',
    permissions: ['view_supportticket'],
  },
  {
    to: '/deal-desk',
    label: 'Deal Desk',
    icon: Briefcase,
    section: 'oversight',
    permissions: ['view_dealdeskinquiry'],
  },
  {
    to: '/reviews',
    label: 'Reviews',
    icon: Star,
    section: 'oversight',
    permissions: ['view_review'],
  },
  {
    to: '/approval-overrides',
    label: 'Approval Overrides',
    icon: ClipboardCheck,
    section: 'oversight',
    permissions: ['view_approvaloverrideitem'],
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: FileText,
    section: 'insights',
    permissions: ['view_bookingsummary', 'view_platformsettings'],
  },
  {
    to: '/activity-log',
    label: 'Activity Log',
    icon: History,
    section: 'insights',
    permissions: ['view_auditlog'],
  },
  {
    to: '/notifications',
    label: 'Notifications',
    icon: Bell,
    section: 'insights',
    permissions: ['view_systemnotification'],
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
    section: 'system',
    permissions: ['view_platformsettings'],
  },
  {
    to: '/permissions',
    label: 'Permissions',
    icon: KeyRound,
    section: 'system',
    permissions: ['view_group'],
    superAdminOnly: true,
  },
];

/** @deprecated Use APP_NAV */
export const SUPER_ADMIN_NAV = APP_NAV;

/** Primary destinations for the mobile bottom tab bar. */
export const MOBILE_BOTTOM_NAV: Array<
  Pick<NavItem, 'to' | 'label' | 'end' | 'icon' | 'permissions'>
> = [
  {
    to: '/',
    label: 'Home',
    end: true,
    icon: LayoutDashboard,
  },
  { to: '/rbos', label: 'RBOs', icon: Store, permissions: ['view_rbovendor'] },
  { to: '/listings', label: 'Listings', icon: Package, permissions: ['view_product', 'view_service'] },
  {
    to: '/login-alerts',
    label: 'Alerts',
    icon: ShieldAlert,
    permissions: ['view_loginalert'],
  },
];
