import type { LucideIcon } from 'lucide-react';
import {
  ClipboardCheck,
  ContactRound,
  FileText,
  History,
  LayoutDashboard,
  Layers3,
  Package,
  Settings,
  ShieldAlert,
  Store,
  UserCog,
  Users,
} from 'lucide-react';

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
}

export const NAV_SECTIONS: Array<{ id: NavSection; label: string }> = [
  { id: 'operations', label: 'Operations' },
  { id: 'user_management', label: 'User Management' },
  { id: 'oversight', label: 'Oversight' },
  { id: 'insights', label: 'Insights' },
  { id: 'system', label: 'System' },
];

export const SUPER_ADMIN_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard, section: 'operations' },
  { to: '/admins', label: 'Admins', icon: UserCog, section: 'operations' },
  { to: '/staff', label: 'Staff', icon: Users, section: 'operations' },
  { to: '/rbos', label: 'RBOs', icon: Store, section: 'operations' },
  { to: '/products', label: 'Products', icon: Package, section: 'operations' },
  { to: '/categories', label: 'Categories', icon: Layers3, section: 'operations' },
  { to: '/users', label: 'Users', icon: ContactRound, section: 'user_management' },
  { to: '/login-alerts', label: 'Login Alerts', icon: ShieldAlert, section: 'oversight' },
  {
    to: '/approval-overrides',
    label: 'Approval Overrides',
    icon: ClipboardCheck,
    section: 'oversight',
  },
  { to: '/reports', label: 'Reports', icon: FileText, section: 'insights' },
  { to: '/activity-log', label: 'Activity Log', icon: History, section: 'insights' },
  { to: '/settings', label: 'Settings', icon: Settings, section: 'system' },
];

/** Primary destinations for the mobile bottom tab bar. */
export const MOBILE_BOTTOM_NAV: Array<
  Pick<NavItem, 'to' | 'label' | 'end' | 'icon'>
> = [
  { to: '/', label: 'Home', end: true, icon: LayoutDashboard },
  { to: '/rbos', label: 'RBOs', icon: Store },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/login-alerts', label: 'Alerts', icon: ShieldAlert },
];
