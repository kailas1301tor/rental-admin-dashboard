import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarPlus,
  Download,
  Eye,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  Trash2,
} from 'lucide-react';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  EmptyState,
  ErrorState,
  PageLoader,
} from '@/components/ui/States';
import { Table, TableShell, Td, Th } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { cn, formatDateTime } from '@/lib/utils';
import type {
  ActivityLogActionKind,
  ActivityLogEntry,
  ActivityLogModule,
  ActivityLogRole,
  ActivityLogStatus,
} from '@/types';

const PAGE_SIZE = 10;

const AVATAR_TONES = [
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

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function inDateRange(iso: string, from: string, to: string) {
  if (!from && !to) return true;
  const t = new Date(iso).getTime();
  if (from) {
    const start = new Date(`${from}T00:00:00`).getTime();
    if (t < start) return false;
  }
  if (to) {
    const end = new Date(`${to}T23:59:59`).getTime();
    if (t > end) return false;
  }
  return true;
}

export function ActivityLogPage() {
  const { toast } = useToast();
  const { data, error, isLoading, mutate } = useApiSWR<ActivityLogEntry[]>(
    ENDPOINTS.activityLog,
  );

  const [q, setQ] = useState('');
  const [user, setUser] = useState('');
  const [role, setRole] = useState<'' | ActivityLogRole>('');
  const [module, setModule] = useState<'' | ActivityLogModule>('');
  const [action, setAction] = useState<'' | ActivityLogActionKind>('');
  const [status, setStatus] = useState<'' | ActivityLogStatus>('');
  const [from, setFrom] = useState('2025-05-13');
  const [to, setTo] = useState('2025-05-20');
  const [page, setPage] = useState(1);

  const list = data ?? [];

  const users = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of list) map.set(row.userEmail, row.userName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [list]);

  const modules = useMemo(() => {
    return [...new Set(list.map((r) => r.module))].sort();
  }, [list]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return list.filter((row) => {
      if (user && row.userEmail !== user) return false;
      if (role && row.role !== role) return false;
      if (module && row.module !== module) return false;
      if (action && row.actionKind !== action) return false;
      if (status && row.status !== status) return false;
      if (!inDateRange(row.occurredAt, from, to)) return false;
      if (!query) return true;
      return (
        row.actionLabel.toLowerCase().includes(query) ||
        row.module.toLowerCase().includes(query) ||
        row.details.toLowerCase().includes(query) ||
        row.userName.toLowerCase().includes(query) ||
        row.userEmail.toLowerCase().includes(query) ||
        row.ipAddress.includes(query)
      );
    });
  }, [list, q, user, role, module, action, status, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const rangeStart =
    filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  function resetFilters() {
    setQ('');
    setUser('');
    setRole('');
    setModule('');
    setAction('');
    setStatus('');
    setFrom('2025-05-13');
    setTo('2025-05-20');
    setPage(1);
  }

  if (isLoading && !data) return <PageLoader />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Activity Log
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Track all activities performed across the platform.
        </p>
      </div>

      <Card className="!p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search activity</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by action, module, details…"
                className="h-11 w-full rounded-xl border border-border bg-canvas pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect
                value={user}
                onChange={(v) => {
                  setUser(v);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Users' },
                  ...users.map(([email, name]) => ({
                    value: email,
                    label: name,
                  })),
                ]}
              />
              <FilterSelect
                value={role}
                onChange={(v) => {
                  setRole(v as '' | ActivityLogRole);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'super_admin', label: 'Super Admin' },
                  { value: 'general_admin', label: 'General Admin' },
                  { value: 'staff', label: 'Staff' },
                  { value: 'rbo', label: 'RBO' },
                  { value: 'customer', label: 'Customer' },
                ]}
              />
              <FilterSelect
                value={module}
                onChange={(v) => {
                  setModule(v as '' | ActivityLogModule);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Modules' },
                  ...modules.map((m) => ({ value: m, label: m })),
                ]}
              />
              <FilterSelect
                value={action}
                onChange={(v) => {
                  setAction(v as '' | ActivityLogActionKind);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Actions' },
                  { value: 'created', label: 'Created' },
                  { value: 'updated', label: 'Updated' },
                  { value: 'deleted', label: 'Deleted' },
                  { value: 'booking_created', label: 'Booking Created' },
                  { value: 'login', label: 'Login' },
                  { value: 'logout', label: 'Logout' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'viewed', label: 'Viewed' },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <FilterSelect
                value={status}
                onChange={(v) => {
                  setStatus(v as '' | ActivityLogStatus);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'success', label: 'Success' },
                  { value: 'failed', label: 'Failed' },
                  { value: 'info', label: 'Info' },
                ]}
              />
              <label className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm text-text-secondary">
                <CalendarDays className="h-4 w-4 text-text-muted" aria-hidden />
                <span className="sr-only">From date</span>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-text-primary focus:outline-none"
                />
                <span className="text-text-muted">–</span>
                <span className="sr-only">To date</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-text-primary focus:outline-none"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                Reset Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast('Export CSV coming soon', 'info')}
              >
                <Download className="h-4 w-4" aria-hidden />
                Export
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {pageRows.length === 0 ? (
        <EmptyState title="No activities match filters" />
      ) : (
        <TableShell>
          <Table>
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Action</Th>
                <Th>Module</Th>
                <Th>Details</Th>
                <Th>Status</Th>
                <Th>IP Address</Th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, idx) => {
                const tone =
                  AVATAR_TONES[
                    (safePage * PAGE_SIZE + idx) % AVATAR_TONES.length
                  ];
                return (
                  <tr key={row.id} className="hover:bg-accent-muted/30">
                    <Td className="whitespace-nowrap text-text-secondary">
                      {formatDateTime(row.occurredAt)}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                            tone,
                          )}
                          aria-hidden
                        >
                          {initials(row.userName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary">
                            {row.userName}
                          </p>
                          <p className="truncate text-xs text-text-muted">
                            {row.userEmail}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <RoleBadge role={row.role} />
                    </Td>
                    <Td>
                      <ActionCell
                        kind={row.actionKind}
                        label={row.actionLabel}
                      />
                    </Td>
                    <Td className="text-text-secondary">{row.module}</Td>
                    <Td>
                      <p className="max-w-[16rem] truncate text-sm text-text-primary xl:max-w-xs">
                        {row.details}
                      </p>
                    </Td>
                    <Td>
                      <StatusPill status={row.status} />
                    </Td>
                    <Td>
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-text-primary">
                          {row.ipAddress}
                        </p>
                        <p className="text-xs text-text-muted">{row.location}</p>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableShell>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          Showing {rangeStart} to {rangeEnd} of {filtered.length} activities
        </p>
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onChange={setPage}
        />
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 min-w-[9rem] rounded-xl border border-border bg-surface px-3 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
    >
      {options.map((o) => (
        <option key={o.value || o.label} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function RoleBadge({ role }: { role: ActivityLogRole }) {
  return (
    <span className="inline-flex rounded-full border border-accent/30 bg-accent-muted px-2.5 py-0.5 text-[11px] font-medium text-accent">
      {ROLE_LABEL[role]}
    </span>
  );
}

function ActionCell({
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

function StatusPill({ status }: { status: ActivityLogStatus }) {
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

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        ‹
      </Button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={cn(
            'inline-flex h-9 min-w-9 items-center justify-center rounded-lg text-sm font-medium',
            p === page
              ? 'bg-accent text-text-on-accent'
              : 'text-text-secondary hover:bg-accent-muted hover:text-text-primary',
          )}
        >
          {p}
        </button>
      ))}
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        ›
      </Button>
    </div>
  );
}
