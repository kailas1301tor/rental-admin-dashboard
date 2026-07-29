import { useMemo, useState } from 'react';
import {
  Download,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  Store,
  UserPlus,
  Ban,
  Layers3,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApiSWR } from '@/api/swr-helpers';
import { ENDPOINTS } from '@/api/endpoints';
import { PermissionGate } from '@/components/auth/PermissionGate';
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
import { RboMobileCard } from '@/pages/super-admin/rbos/RboMobileCard';
import { categoryPathLabel } from '@/lib/category-helpers';
import { cn, formatDateTime } from '@/lib/utils';
import { useListFilters } from '@/hooks/useListFilters';
import type { Category, RboStatus, RboVendor } from '@/types';

type Tab = 'all' | 'onboarding' | 'rejected';
type JoinedFilter = 'all' | '30d' | '90d' | '1y';
type RatingFilter = 'all' | '4+' | '3+' | 'below3';

const PAGE_SIZE = 10;

const CAT_TONES = [
  'border-accent/40 bg-accent-muted text-accent',
  'border-success/40 bg-success-muted text-success',
  'border-warning/40 bg-warning-muted text-warning',
  'border-border bg-canvas text-text-secondary',
] as const;

function parseTab(value: string | null): Tab {
  if (value === 'onboarding' || value === 'rejected') return value;
  if (value === 'active') return 'all';
  return 'all';
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function withinJoined(iso: string, filter: JoinedFilter) {
  if (filter === 'all') return true;
  const created = new Date(iso).getTime();
  const now = Date.now();
  const day = 86_400_000;
  if (filter === '30d') return now - created <= 30 * day;
  if (filter === '90d') return now - created <= 90 * day;
  return now - created <= 365 * day;
}

function matchesRating(rating: number, filter: RatingFilter) {
  if (filter === 'all') return true;
  if (filter === '4+') return rating >= 4;
  if (filter === '3+') return rating >= 3;
  return rating > 0 && rating < 3;
}

export function RbosPage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => parseTab(searchParams.get('tab')));
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RboStatus | 'all'>('all');
  const [joinedFilter, setJoinedFilter] = useState<JoinedFilter>('all');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [page, setPage] = useState(1);

  const { filters, setFilters, reset, matchesDistrict, matchesTaxonomy } =
    useListFilters();

  const { data, error, isLoading, mutate } = useApiSWR<RboVendor[]>(
    ENDPOINTS.rbos,
  );
  const { data: categories } = useApiSWR<Category[]>(ENDPOINTS.categories);

  const catList = categories ?? [];

  const list = data ?? [];

  const counts = useMemo(() => {
    const active = list.filter((r) => r.status === 'active').length;
    const onboarding = list.filter((r) => r.status === 'onboarding').length;
    const rejected = list.filter((r) => r.status === 'rejected').length;
    const rated = list.filter((r) => r.ratingAvg > 0);
    const avg =
      rated.length === 0
        ? 0
        : rated.reduce((s, r) => s + r.ratingAvg, 0) / rated.length;
    return {
      active,
      onboarding,
      rejected,
      avg,
      categories: categories?.length ?? 0,
    };
  }, [list, categories]);

  function onTabChange(next: Tab) {
    setTab(next);
    setPage(1);
    setSearchParams(next === 'all' ? {} : { tab: next }, { replace: true });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((r) => {
      if (!matchesDistrict(r.districtId)) return false;
      if (!matchesTaxonomy(r.categoryIds, catList)) return false;
      if (tab === 'onboarding' && r.status !== 'onboarding') return false;
      if (tab === 'rejected' && r.status !== 'rejected') return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!withinJoined(r.createdAt, joinedFilter)) return false;
      if (!matchesRating(r.ratingAvg, ratingFilter)) return false;
      if (!q) return true;
      return (
        r.businessName.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [
    list,
    tab,
    query,
    statusFilter,
    joinedFilter,
    ratingFilter,
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
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  if (isLoading && !data) return <ListPageSkeleton kpiCount={5} />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="hidden text-2xl font-semibold text-text-primary sm:block">RBOs</h1>
          <p className="mt-1 max-w-xl text-sm text-text-secondary">
            Manage registered business owners, onboarding, and vendor status.
          </p>
        </div>
        <PermissionGate module="rbos">
          <Button
            onClick={() =>
              toast('Add RBO opens when vendor create API is ready', 'info')
            }
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add RBO
          </Button>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Active RBOs"
          value={counts.active.toLocaleString('en-IN')}
          icon={Store}
          onView={() => {
            onTabChange('all');
            setStatusFilter('active');
          }}
        />
        <KpiCard
          label="Onboarding"
          value={counts.onboarding.toLocaleString('en-IN')}
          icon={UserPlus}
          onView={() => onTabChange('onboarding')}
        />
        <KpiCard
          label="Rejected"
          value={counts.rejected.toLocaleString('en-IN')}
          icon={Ban}
          onView={() => onTabChange('rejected')}
        />
        <KpiCard
          label="Avg. Rating"
          value={counts.avg ? counts.avg.toFixed(2) : '—'}
          icon={Star}
        />
        <KpiCard
          label="Total Categories"
          value={counts.categories.toLocaleString('en-IN')}
          icon={Layers3}
          to="/categories"
        />
      </div>

      <ListFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onReset={reset}
        categories={catList}
        search={
          <label className="relative block w-full">
            <span className="sr-only">Search vendors</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search vendors…"
              className={searchControlClass}
            />
          </label>
        }
      >
        <FilterSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v as RboStatus | 'all');
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'Status' },
            { value: 'active', label: 'Active' },
            { value: 'onboarding', label: 'Onboarding' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'frozen', label: 'Frozen' },
          ]}
        />
        <FilterSelect
          value={joinedFilter}
          onChange={(v) => {
            setJoinedFilter(v as JoinedFilter);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'Joined' },
            { value: '30d', label: 'Last 30 days' },
            { value: '90d', label: 'Last 90 days' },
            { value: '1y', label: 'Last year' },
          ]}
        />
        <FilterSelect
          value={ratingFilter}
          onChange={(v) => {
            setRatingFilter(v as RatingFilter);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'Rating' },
            { value: '4+', label: '4.0+' },
            { value: '3+', label: '3.0+' },
            { value: 'below3', label: 'Below 3' },
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

      <div className="space-y-4">
        <div
          role="tablist"
          className="mobile-scroll-x border-b border-border"
        >
          {(
            [
              { id: 'all' as const, label: `All (${list.length})` },
              {
                id: 'onboarding' as const,
                label: `Onboarding (${counts.onboarding})`,
              },
              {
                id: 'rejected' as const,
                label: `Rejected (${counts.rejected})`,
              },
            ] as const
          ).map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'relative min-h-11 px-4 text-sm font-medium transition-colors',
                  active
                    ? 'text-accent'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent" />
                ) : null}
              </button>
            );
          })}
        </div>

        {pageRows.length === 0 ? (
          <EmptyState title="No vendors match these filters" />
        ) : (
          <>
            <div className="space-y-3 lg:hidden">
              {pageRows.map((r) => (
                <RboMobileCard
                  key={r.id}
                  vendor={r}
                  categoryNames={r.categoryIds.map((id) =>
                    categoryPathLabel(catList, id),
                  )}
                  onMore={() =>
                    toast('More actions available on vendor detail', 'info')
                  }
                />
              ))}
            </div>

            <TableShell className="hidden lg:block">
              <Table>
                <thead>
                  <tr>
                    <Th>Business</Th>
                    <Th>Owner</Th>
                    <Th>Contact</Th>
                    <Th>Categories</Th>
                    <Th>Rating</Th>
                    <Th>Joined</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <ClickableTableRow
                      key={r.id}
                      to={`/rbos/${r.id}`}
                      ariaLabel={`View ${r.businessName}`}
                    >
                      <ClickableTd>
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-xs font-semibold text-accent">
                            {initials(r.businessName)}
                          </span>
                          <div className="min-w-0">
                            <p className="block truncate font-medium text-text-primary">
                              {r.businessName}
                            </p>
                            <p className="truncate text-xs text-text-muted">
                              {r.id}
                            </p>
                          </div>
                        </div>
                      </ClickableTd>
                      <ClickableTd className="text-sm text-text-primary">
                        {r.ownerName}
                      </ClickableTd>
                      <ClickableTd>
                        <p className="text-sm text-text-primary">{r.phone}</p>
                        <p className="truncate text-xs text-text-muted">
                          {r.email}
                        </p>
                      </ClickableTd>
                      <ClickableTd>
                        <div className="flex max-w-[14rem] flex-wrap gap-1">
                          {r.categoryIds.length === 0 ? (
                            <span className="text-xs text-text-muted">—</span>
                          ) : (
                            r.categoryIds.map((id, i) => (
                              <span
                                key={id}
                                className={cn(
                                  'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium',
                                  CAT_TONES[i % CAT_TONES.length],
                                )}
                              >
                                {categoryPathLabel(catList, id)}
                              </span>
                            ))
                          )}
                        </div>
                      </ClickableTd>
                      <ClickableTd>
                        <StarRating value={r.ratingAvg} />
                      </ClickableTd>
                      <ClickableTd className="text-sm text-text-secondary">
                        {formatDateTime(r.createdAt)}
                      </ClickableTd>
                      <ClickableTd>
                        <StatusPill status={r.status} />
                      </ClickableTd>
                      <TableActionsCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/rbos/${r.id}`}
                            onClick={stopRowNavigation}
                            className="inline-flex h-9 items-center rounded-full border border-border-strong px-3 text-sm font-medium text-text-primary transition-colors hover:border-accent hover:text-accent"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary hover:border-accent hover:text-text-primary"
                            aria-label={`More actions for ${r.businessName}`}
                            onClick={() =>
                              toast(
                                'More actions available on vendor detail',
                                'info',
                              )
                            }
                          >
                            <MoreHorizontal className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </TableActionsCell>
                    </ClickableTableRow>
                  ))}
                </tbody>
              </Table>
            </TableShell>
          </>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-muted">
            Showing {rangeStart} to {rangeEnd} of {filtered.length} results
          </p>
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  onView,
  to,
}: {
  label: string;
  value: string;
  icon: typeof Store;
  onView?: () => void;
  to?: string;
}) {
  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-accent">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        {to ? (
          <Link to={to} className="text-xs font-medium text-accent hover:underline">
            View all →
          </Link>
        ) : onView ? (
          <button
            type="button"
            onClick={onView}
            className="text-xs font-medium text-accent hover:underline"
          >
            View all →
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">
        {value}
      </p>
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
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function StarRating({ value }: { value: number }) {
  if (!value) {
    return <span className="text-sm text-text-muted">—</span>;
  }
  const full = Math.floor(value);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-semibold tabular-nums text-text-primary">
        {value.toFixed(1)}
      </span>
      <span className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              'h-3 w-3',
              i < full ? 'fill-accent text-accent' : 'text-border-strong',
            )}
          />
        ))}
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: RboStatus }) {
  const tone =
    status === 'active'
      ? 'border-success/30 bg-success-muted text-success'
      : status === 'onboarding'
        ? 'border-warning/30 bg-warning-muted text-warning'
        : status === 'frozen'
          ? 'border-danger/30 bg-danger-muted text-danger'
          : 'border-border bg-canvas text-text-secondary';
  const dot =
    status === 'active'
      ? 'bg-success'
      : status === 'onboarding'
        ? 'bg-warning'
        : status === 'frozen'
          ? 'bg-danger'
          : 'bg-text-muted';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        tone,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} aria-hidden />
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
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    0,
    7,
  );

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
