import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Download,
  RefreshCw,
  Search,
} from 'lucide-react';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { ListFilterBar } from '@/components/filters/ListFilterBar';
import { Button } from '@/components/ui/Button';
import {
  EmptyState,
  ErrorState,
} from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { Table, TableShell, Td, Th } from '@/components/ui/Table';
import {
  filterSelectClass,
  searchControlClass,
} from '@/components/ui/control-styles';
import { ActivityLogMobileCard } from '@/pages/super-admin/activity-log/ActivityLogMobileCard';
import {
  AVATAR_TONES,
  ActionCell,
  RoleBadge,
  StatusPill,
  initials,
} from '@/pages/super-admin/activity-log/activity-log-ui';
import { cn, formatDateTime } from '@/lib/utils';
import { useListFilters } from '@/hooks/useListFilters';
import type {
  ActivityLogActionKind,
  ActivityLogEntry,
  ActivityLogModule,
  ActivityLogRole,
  ActivityLogStatus,
} from '@/types';

const PAGE_SIZE = 10;

function getStartOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}


export function ActivityLogPage() {
  const { filters, setFilters, reset } = useListFilters();
  const [q, setQ] = useState('');
  const [user, setUser] = useState('');
  const [role, setRole] = useState<'' | ActivityLogRole>('');
  const [module, setModule] = useState<'' | ActivityLogModule>('');
  const [action, setAction] = useState<'' | ActivityLogActionKind>('');
  const [status, setStatus] = useState<'' | ActivityLogStatus>('');
  const [from, setFrom] = useState(() => getStartOfMonth());
  const [to, setTo] = useState(() => getToday());
  const [page, setPage] = useState(1);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    if (user) params.set('user', user);
    if (role) params.set('role', role);
    if (module) params.set('module', module);
    if (action) params.set('action', action);
    if (status) params.set('status', status);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('page', String(page));
    params.set('page_size', String(PAGE_SIZE));
    return params;
  }, [q, user, role, module, action, status, from, to, page]);

  const { data, error, isLoading, mutate } = useApiSWR<{ data: ActivityLogEntry[], total_count: number, total_pages: number }>(
    `${ENDPOINTS.activityLog}?${searchParams.toString()}`,
  );

  const list = data?.data ?? [];

  // TODO: Usually you fetch unique users/modules from an API,
  // For now, we leave them as empty options or static, since backend controls data
  const users: [string, string][] = [];
  const modules: string[] = ['Admins', 'Authentication', 'Roles', 'System', 'Products', 'RBOs', 'Bookings', 'Analytics', 'Approvals', 'Other'];

  const filtered = list;
  
  const totalPages = data?.total_pages ?? 1;
  const safePage = page;
  const pageRows = filtered;
  const totalCount = data?.total_count ?? 0;
  const rangeStart = totalCount === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, totalCount);

  function resetFilters() {
    setQ('');
    setUser('');
    setRole('');
    setModule('');
    setAction('');
    setStatus('');
    setFrom(getStartOfMonth());
    setTo(getToday());
    setPage(1);
  }

  if (isLoading && !data) return <ListPageSkeleton showKpis={false} />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="hidden text-2xl font-semibold text-text-primary sm:block">
          Activity Log
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Track all activities performed across the platform.
        </p>
      </div>

      <ListFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onReset={reset}
        showTaxonomy={false}
        showDistrict={false}
        search={
          <label className="relative block w-full">
            <span className="sr-only">Search activity</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by action, module, details…"
              className={searchControlClass}
            />
          </label>
        }
      >
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
        <label className="inline-flex h-11 min-w-0 items-center gap-2 rounded-full border border-border bg-surface px-3.5 text-sm text-text-secondary">
          <CalendarDays
            className="h-4 w-4 shrink-0 text-text-muted"
            aria-hidden
          />
          <span className="shrink-0 text-xs text-text-muted">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="min-w-0 flex-1 bg-transparent text-text-primary focus:outline-none"
          />
        </label>
        <label className="inline-flex h-11 min-w-0 items-center gap-2 rounded-full border border-border bg-surface px-3.5 text-sm text-text-secondary">
          <CalendarDays
            className="h-4 w-4 shrink-0 text-text-muted"
            aria-hidden
          />
          <span className="shrink-0 text-xs text-text-muted">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="min-w-0 flex-1 bg-transparent text-text-primary focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2 self-end">
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Reset page filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const exportParams = new URLSearchParams(searchParams.toString());
              exportParams.set('export', 'true');
              window.open(
                `${import.meta.env.VITE_API_BASE_URL}${ENDPOINTS.activityLog}?${exportParams.toString()}`,
                '_blank'
              );
            }}
          >
            <Download className="h-4 w-4" aria-hidden />
            Export
          </Button>
        </div>
      </ListFilterBar>

      {pageRows.length === 0 ? (
        <EmptyState title="No activities match filters" />
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {pageRows.map((row, idx) => (
              <ActivityLogMobileCard
                key={row.id}
                row={row}
                avatarTone={
                  AVATAR_TONES[
                    (safePage * PAGE_SIZE + idx) % AVATAR_TONES.length
                  ]
                }
              />
            ))}
          </div>

          <TableShell className="hidden lg:block">
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
                          <p className="text-xs text-text-muted">
                            {row.location}
                          </p>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableShell>
        </>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          Showing {rangeStart} to {rangeEnd} of {totalCount} activities
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
      className={filterSelectClass}
    >
      {options.map((o) => (
        <option key={o.value || o.label} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
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
            'inline-flex h-9 min-w-9 items-center justify-center rounded-full text-sm font-medium',
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
