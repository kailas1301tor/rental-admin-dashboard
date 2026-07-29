import { useMemo, useState } from 'react';
import {
  Download,
  Eye,
  MapPin,
  MoreVertical,
  Search,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApiSWR } from '@/api/swr-helpers';
import { ENDPOINTS } from '@/api/endpoints';
import { ListFilterBar } from '@/components/filters/ListFilterBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  EmptyState,
  ErrorState,
} from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { Table, TableShell, Th } from '@/components/ui/Table';
import {
  ClickableTableRow,
  ClickableTd,
  stopRowNavigation,
  TableActionsCell,
} from '@/components/ui/clickable-row';
import { useToast } from '@/components/ui/Toast';
import {
  filterSelectClass,
  searchControlClass,
} from '@/components/ui/control-styles';
import { useListFilters } from '@/hooks/useListFilters';
import { UserMobileCard } from '@/pages/super-admin/users/UserMobileCard';
import { cn, formatDateTime } from '@/lib/utils';
import type {
  Category,
  MarketplaceUser,
  MarketplaceUserStatus,
  RboVendor,
} from '@/types';

const PAGE_SIZE = 10;

const AVATAR_TONES = [
  'bg-accent-muted text-accent',
  'bg-success-muted text-success',
  'bg-warning-muted text-warning',
  'bg-danger-muted text-danger',
  'bg-canvas text-text-secondary ring-1 ring-border',
] as const;

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function isNewUser(joinedAt: string) {
  const day = 86_400_000;
  return Date.now() - new Date(joinedAt).getTime() <= 30 * day;
}

export function UsersPage() {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | MarketplaceUserStatus>('');
  const [rboId, setRboId] = useState('');
  const [page, setPage] = useState(1);

  const { filters, setFilters, reset, matchesDistrict, matchesTaxonomy } =
    useListFilters();
  const { data, error, isLoading, mutate } = useApiSWR<MarketplaceUser[]>(
    ENDPOINTS.users,
  );
  const { data: rbos } = useApiSWR<RboVendor[]>(ENDPOINTS.rbos);
  const { data: categories } = useApiSWR<Category[]>(ENDPOINTS.categories);

  const catList = categories ?? [];

  const rboMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rbos ?? []) m.set(r.id, r.businessName);
    return m;
  }, [rbos]);

  const rboById = useMemo(() => {
    const m = new Map<string, RboVendor>();
    for (const r of rbos ?? []) m.set(r.id, r);
    return m;
  }, [rbos]);

  const list = data ?? [];

  const kpis = useMemo(() => {
    const total = list.length;
    const active = list.filter((u) => u.status === 'active').length;
    const inactive = list.filter((u) => u.status === 'inactive').length;
    const neu = list.filter((u) => isNewUser(u.joinedAt)).length;
    return {
      total,
      active,
      inactive,
      neu,
      activePct: total ? Math.round((active / total) * 1000) / 10 : 0,
      inactivePct: total ? Math.round((inactive / total) * 1000) / 10 : 0,
      newPct: total ? Math.round((neu / total) * 1000) / 10 : 0,
    };
  }, [list]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return list.filter((u) => {
      if (!matchesDistrict(u.districtId)) return false;
      const linkedRbo = u.rboId ? rboById.get(u.rboId) : undefined;
      const categoryIds = linkedRbo?.categoryIds ?? [];
      if (!matchesTaxonomy(categoryIds, catList)) return false;
      if (status && u.status !== status) return false;
      if (rboId === '__none__' && u.rboId !== null) return false;
      if (rboId && rboId !== '__none__' && u.rboId !== rboId) return false;
      if (!query) return true;
      const rboName = u.rboId
        ? (rboMap.get(u.rboId)?.toLowerCase() ?? '')
        : '';
      return (
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.phone.toLowerCase().includes(query) ||
        u.id.toLowerCase().includes(query) ||
        u.city.toLowerCase().includes(query) ||
        rboName.includes(query)
      );
    });
  }, [
    list,
    q,
    status,
    rboId,
    rboMap,
    rboById,
    matchesDistrict,
    matchesTaxonomy,
    catList,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const rangeStart =
    filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  if (isLoading && !data) return <ListPageSkeleton kpiCount={4} />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="hidden text-2xl font-semibold text-text-primary sm:block">
          User Management
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          Browse marketplace customers, filter by status and location, and
          review account activity across RBOs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total users"
          value={kpis.total.toLocaleString('en-IN')}
          hint="All registered accounts"
          icon={Users}
          tone="accent"
        />
        <KpiCard
          label="Active users"
          value={kpis.active.toLocaleString('en-IN')}
          hint={`${kpis.activePct}% of total`}
          icon={UserCheck}
          tone="success"
        />
        <KpiCard
          label="Inactive users"
          value={kpis.inactive.toLocaleString('en-IN')}
          hint={`${kpis.inactivePct}% of total`}
          icon={UserMinus}
          tone="danger"
        />
        <KpiCard
          label="New users"
          value={kpis.neu.toLocaleString('en-IN')}
          hint={`${kpis.newPct}% joined in 30 days`}
          icon={UserPlus}
          tone="warning"
        />
      </div>

      <ListFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onReset={reset}
        categories={catList}
        search={
          <label className="relative block w-full">
            <span className="sr-only">Search users</span>
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
              placeholder="Search by name, email, phone, or ID…"
              className={searchControlClass}
            />
          </label>
        }
      >
        <FilterSelect
          value={status}
          onChange={(v) => {
            setStatus(v as '' | MarketplaceUserStatus);
            setPage(1);
          }}
          options={[
            { value: '', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
        <FilterSelect
          value={rboId}
          onChange={(v) => {
            setRboId(v);
            setPage(1);
          }}
          options={[
            { value: '', label: 'All RBOs' },
            { value: '__none__', label: 'No RBO linked' },
            ...(rbos ?? []).map((r) => ({
              value: r.id,
              label: r.businessName,
            })),
          ]}
        />
        <Button
          variant="outline"
          size="sm"
          className="self-end"
          onClick={() => toast('Export CSV coming soon', 'info')}
        >
          <Download className="h-4 w-4" aria-hidden />
          Export
        </Button>
      </ListFilterBar>

      {pageRows.length === 0 ? (
        <EmptyState title="No users match filters" />
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {pageRows.map((user, idx) => (
              <UserMobileCard
                key={user.id}
                user={user}
                avatarTone={
                  AVATAR_TONES[
                    (safePage * PAGE_SIZE + idx) % AVATAR_TONES.length
                  ]
                }
                rboName={user.rboId ? (rboMap.get(user.rboId) ?? null) : null}
                onMore={() => toast('More actions coming soon', 'info')}
              />
            ))}
          </div>

          <TableShell className="hidden lg:block">
            <Table>
              <thead>
                <tr>
                  <Th>User</Th>
                  <Th>Contact</Th>
                  <Th>Location</Th>
                  <Th>RBO</Th>
                  <Th>Joined On</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((user, idx) => {
                  const tone =
                    AVATAR_TONES[
                      (safePage * PAGE_SIZE + idx) % AVATAR_TONES.length
                    ];
                  return (
                    <ClickableTableRow
                      key={user.id}
                      to={`/users/${user.id}`}
                      ariaLabel={`View ${user.name}`}
                    >
                      <ClickableTd>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                              tone,
                            )}
                            aria-hidden
                          >
                            {initials(user.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-text-primary">
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-text-muted">
                              {user.id.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </ClickableTd>
                      <ClickableTd>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-text-primary">
                            {user.email}
                          </p>
                          <p className="truncate text-xs text-text-muted">
                            {user.phone}
                          </p>
                        </div>
                      </ClickableTd>
                      <ClickableTd>
                        <div className="flex items-start gap-1.5">
                          <MapPin
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted"
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <p className="text-sm text-text-primary">
                              {user.city}, {user.state}
                            </p>
                            <p className="text-xs text-text-muted">
                              {user.pincode}
                            </p>
                          </div>
                        </div>
                      </ClickableTd>
                      <ClickableTd>
                        {user.rboId ? (
                          <Link
                            to={`/rbos/${user.rboId}`}
                            onClick={stopRowNavigation}
                            className="text-sm text-text-primary hover:text-accent"
                          >
                            {rboMap.get(user.rboId) ?? user.rboId}
                          </Link>
                        ) : (
                          <span className="text-sm text-text-muted">—</span>
                        )}
                      </ClickableTd>
                      <ClickableTd className="whitespace-nowrap text-sm text-text-secondary">
                        {formatDateTime(user.joinedAt)}
                      </ClickableTd>
                      <ClickableTd>
                        <StatusPill status={user.status} />
                      </ClickableTd>
                      <TableActionsCell>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/users/${user.id}`}
                            onClick={stopRowNavigation}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-text-secondary hover:border-accent hover:text-accent"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden />
                            View
                          </Link>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary hover:border-accent hover:text-text-primary"
                            aria-label={`More actions for ${user.name}`}
                            onClick={() =>
                              toast('More actions coming soon', 'info')
                            }
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </TableActionsCell>
                    </ClickableTableRow>
                  );
                })}
              </tbody>
            </Table>
          </TableShell>
        </>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          Showing {rangeStart} to {rangeEnd} of {filtered.length} users
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

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Users;
  tone: 'accent' | 'success' | 'danger' | 'warning';
}) {
  const iconTone = {
    accent: 'bg-accent-muted text-accent',
    success: 'bg-success-muted text-success',
    danger: 'bg-danger-muted text-danger',
    warning: 'bg-warning-muted text-warning',
  }[tone];

  return (
    <Card className="!p-4">
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          iconTone,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">
        {value}
      </p>
      <p className="mt-1 text-xs text-text-secondary">{hint}</p>
    </Card>
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

function StatusPill({ status }: { status: MarketplaceUserStatus }) {
  const active = status === 'active';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        active
          ? 'border-success/30 bg-success-muted text-success'
          : 'border-danger/30 bg-danger-muted text-danger',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          active ? 'bg-success' : 'bg-danger',
        )}
        aria-hidden
      />
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
