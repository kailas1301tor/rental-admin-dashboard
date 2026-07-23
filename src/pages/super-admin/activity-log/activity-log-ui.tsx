import {
  CalendarPlus,
  Eye,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  ShieldCheck,
  ShieldX,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ActivityLogActionKind,
  ActivityLogRole,
  ActivityLogStatus,
} from '@/types';

export const AVATAR_TONES = [
  'bg-accent-muted text-accent',
  'bg-success-muted text-success',
  'bg-warning-muted text-warning',
  'bg-danger-muted text-danger',
  'bg-canvas text-text-secondary ring-1 ring-border',
] as const;

const ROLE_LABEL: Record<ActivityLogRole, string> = {
  super_admin: 'Super Admin',
  general_admin: 'General Admin',
  staff: 'Staff',
  rbo: 'RBO',
  customer: 'Customer',
};

export function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function RoleBadge({ role }: { role: ActivityLogRole }) {
  return (
    <span className="inline-flex rounded-full border border-accent/30 bg-accent-muted px-2.5 py-0.5 text-[11px] font-medium text-accent">
      {ROLE_LABEL[role]}
    </span>
  );
}

export function ActionCell({
  kind,
  label,
}: {
  kind: ActivityLogActionKind;
  label: string;
}) {
  const meta: Record<
    ActivityLogActionKind,
    { Icon: typeof Plus; className: string }
  > = {
    created: { Icon: Plus, className: 'text-success' },
    updated: { Icon: Pencil, className: 'text-accent' },
    deleted: { Icon: Trash2, className: 'text-danger' },
    booking_created: { Icon: CalendarPlus, className: 'text-success' },
    login: { Icon: LogIn, className: 'text-accent' },
    logout: { Icon: LogOut, className: 'text-text-muted' },
    approved: { Icon: ShieldCheck, className: 'text-success' },
    rejected: { Icon: ShieldX, className: 'text-danger' },
    viewed: { Icon: Eye, className: 'text-text-secondary' },
  };
  const { Icon, className } = meta[kind];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary">
      <Icon className={cn('h-3.5 w-3.5', className)} aria-hidden />
      {label}
    </span>
  );
}

export function StatusPill({ status }: { status: ActivityLogStatus }) {
  const tone =
    status === 'success'
      ? 'border-success/30 bg-success-muted text-success'
      : status === 'failed'
        ? 'border-danger/30 bg-danger-muted text-danger'
        : 'border-accent/30 bg-accent-muted text-accent';
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        tone,
      )}
    >
      {status}
    </span>
  );
}
