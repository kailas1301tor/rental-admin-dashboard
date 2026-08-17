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
  permission?: PermissionModule;
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
    permission: 'dashboard',
  },
  {
    to: '/admins',
    label: 'Admins',
    icon: UserCog,
    section: 'operations',
    permission: 'admins',
  },
  {
    to: '/staff',
    label: 'Staff',
    icon: Users,
    section: 'operations',
    permission: 'staff',
  },
  {
    to: '/departments',
    label: 'Departments',
    icon: Building2,
    section: 'operations',
    permission: 'departments',
  },
  {
    to: '/rbos',
    label: 'RBOs',
    icon: Store,
    section: 'operations',
    permission: 'rbos',
  },
  {
    to: '/listings',
    label: 'Listings',
    icon: Package,
    section: 'operations',
    permission: 'listings',
  },
  {
    to: '/bookings',
    label: 'Bookings',
    icon: CalendarDays,
    section: 'operations',
    permission: 'bookings',
  },
  {
    to: '/categories',
    label: 'Categories',
    icon: Layers3,
    section: 'operations',
    permission: 'categories',
  },
  {
    to: '/users',
    label: 'Users',
    icon: ContactRound,
    section: 'user_management',
    permission: 'users',
  },
  {
    to: '/login-alerts',
    label: 'Login Alerts',
    icon: ShieldAlert,
    section: 'oversight',
    permission: 'login_alerts',
  },
  {
    to: '/support',
    label: 'Support',
    icon: Headphones,
    section: 'oversight',
    permission: 'support',
  },
  {
    to: '/deal-desk',
    label: 'Deal Desk',
    icon: Briefcase,
    section: 'oversight',
    permission: 'deal_desk',
  },
  {
    to: '/reviews',
    label: 'Reviews',
    icon: Star,
    section: 'oversight',
    permission: 'reviews_moderation',
  },
  {
    to: '/approval-overrides',
    label: 'Approval Overrides',
    icon: ClipboardCheck,
    section: 'oversight',
    permission: 'approval_overrides',
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: FileText,
    section: 'insights',
    permission: 'reports',
  },
  {
    to: '/activity-log',
    label: 'Activity Log',
    icon: History,
    section: 'insights',
    permission: 'activity_log',
  },
  {
    to: '/notifications',
    label: 'Notifications',
    icon: Bell,
    section: 'insights',
    permission: 'notifications',
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
    section: 'system',
    permission: 'settings',
  },
  {
    to: '/permissions',
    label: 'Permissions',
    icon: KeyRound,
    section: 'system',
    superAdminOnly: true,
  },
];

/** @deprecated Use APP_NAV */
export const SUPER_ADMIN_NAV = APP_NAV;

/** Primary destinations for the mobile bottom tab bar. */
export const MOBILE_BOTTOM_NAV: Array<
  Pick<NavItem, 'to' | 'label' | 'end' | 'icon' | 'permission'>
> = [
  {
    to: '/',
    label: 'Home',
    end: true,
    icon: LayoutDashboard,
    permission: 'dashboard',
  },
  { to: '/rbos', label: 'RBOs', icon: Store, permission: 'rbos' },
  { to: '/listings', label: 'Listings', icon: Package, permission: 'listings' },
  {
    to: '/login-alerts',
    label: 'Alerts',
    icon: ShieldAlert,
    permission: 'login_alerts',
  },
];
