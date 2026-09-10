import { useMemo, useState } from 'react';
import {
  CalendarRange,
  Download,
  IndianRupee,
  MoreVertical,
  Layers,
  Pencil,
  Plus,
  Search,
  Star,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApiSWR } from '@/api/swr-helpers';
import { ENDPOINTS } from '@/api/endpoints';
import { CanAccess } from '@/components/auth/CanAccess';
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
import { ServiceMobileCard } from '@/pages/super-admin/services/ServiceMobileCard';
import { categoryPathLabel } from '@/lib/category-helpers';
import { BOOKING_VALUE_LABEL, BOOKING_VALUE_MONTH_LABEL } from '@/lib/metrics';
import { cn, formatInr } from '@/lib/utils';
import { useListFilters } from '@/hooks/useListFilters';
import type { Category, Service, ProductStatus, RboVendor } from '@/types';

const PAGE_SIZE = 10;

const CAT_TONES = [
  'border-accent/40 bg-accent-muted text-accent',
  'border-success/40 bg-success-muted text-success',
  'border-warning/40 bg-warning-muted text-warning',
  'border-border bg-canvas text-text-secondary',
] as const;

export function ServicesPage({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [rboId, setRboId] = useState('');
  const [status, setStatus] = useState<'' | ProductStatus>('');
  const [page, setPage] = useState(1);

  const { filters, setFilters, reset, matchesDistrict, matchesTaxonomy } =
    useListFilters();

  const { data, error, isLoading, mutate } = useApiSWR<Service[]>(
    ENDPOINTS.services,
  );
  const { data: rbos } = useApiSWR<RboVendor[]>(ENDPOINTS.rbos);
  const { data: categories } = useApiSWR<Category[]>(ENDPOINTS.categories);

  const catList = categories ?? [];

  const rboMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rbos ?? []) m.set(r.id, r.businessName);
    return m;
  }, [rbos]);
  const catIndex = useMemo(() => {
    const m = new Map<string, number>();
    (categories ?? []).forEach((c, i) => m.set(c.id, i));
    return m;
  }, [categories]);

  const list = data ?? [];

  const kpis = useMemo(() => {
    const total = list.length;
    const active = list.filter((p) => p.status === 'active').length;
    const bookings = list.reduce((s, p) => s + p.bookingCount, 0);
    const revenue = list.reduce(
      (s, p) => s + p.bookingCount * p.pricePerDayInr,
      0,
    );
    const rated = list.filter((p) => p.ratingAvg > 0);
    const avg =
      rated.length === 0
        ? 0
        : rated.reduce((s, p) => s + p.ratingAvg, 0) / rated.length;
    const vendorCount = new Set(list.map((p) => p.rboId)).size;
    return {
      total,
      active,
      bookings,
      revenue,
      avg,
      vendorCount,
      activePct: total ? Math.round((active / total) * 1000) / 10 : 0,
    };
  }, [list]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return list.filter((p) => {
      if (!matchesDistrict(p.districtId)) return false;
      if (!matchesTaxonomy([p.categoryId], catList)) return false;
      if (rboId && p.rboId !== rboId) return false;
      if (status && p.status !== status) return false;
      if (!query) return true;
      const vendor = rboMap.get(p.rboId)?.toLowerCase() ?? '';
      const cat = categoryPathLabel(catList, p.categoryId).toLowerCase();
      return (
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        vendor.includes(query) ||
        cat.includes(query)
      );
    });
  }, [
    list,
    q,
    rboId,
    status,
    rboMap,
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

  if (isLoading && !data) return <ListPageSkeleton kpiCount={5} />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="hidden text-2xl font-semibold text-text-primary sm:block">
              Services
            </h1>
            <p className="mt-1 max-w-xl text-sm text-text-secondary">
              Manage all rental services across RBOs. Filter, search and track
              performance.
            </p>
          </div>
          <CanAccess permission="change_service">
          <Button
            onClick={() =>
              toast('Add Service opens when create API is ready', 'info')
            }
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Service
          </Button>
        </CanAccess>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total services"
          value={kpis.total.toLocaleString('en-IN')}
          hint={`Across ${kpis.vendorCount} RBOs`}
          icon={Layers}
        />
        <KpiCard
          label="Total bookings"
          value={kpis.bookings.toLocaleString('en-IN')}
          hint="This month ↑ 14.8%"
          icon={CalendarRange}
        />
        <KpiCard
          label={BOOKING_VALUE_MONTH_LABEL}
          value={formatInr(kpis.revenue)}
          hint={`${BOOKING_VALUE_LABEL} ↑ 18.6%`}
          icon={IndianRupee}
        />
        <KpiCard
          label="Avg. rating"
          value={kpis.avg ? kpis.avg.toFixed(1) : '—'}
          hint="Across all services"
          icon={Star}
        />
        <KpiCard
          label="Active services"
          value={kpis.active.toLocaleString('en-IN')}
          hint={`${kpis.activePct}% of total`}
          icon={TrendingUp}
        />
      </div>

      <ListFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onReset={reset}
        categories={catList}
        search={
          <label className="relative block w-full">
            <span className="sr-only">Search services</span>
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
              placeholder="Search services…"
              className={searchControlClass}
            />
          </label>
        }
      >
        <FilterSelect
          value={rboId}
          onChange={(v) => {
            setRboId(v);
            setPage(1);
          }}
          options={[
            { value: '', label: 'All vendors' },
            ...(rbos ?? []).map((r) => ({
              value: r.id,
              label: r.businessName,
            })),
          ]}
        />
        <FilterSelect
          value={status}
          onChange={(v) => {
            setStatus(v as '' | ProductStatus);
            setPage(1);
          }}
          options={[
            { value: '', label: 'All status' },
            { value: 'pending_review', label: 'Pending review' },
            { value: 'active', label: 'Active' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'frozen', label: 'Frozen' },
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
        <EmptyState title="No services match filters" />
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {pageRows.map((p) => {
              const toneIdx = catIndex.get(p.categoryId) ?? 0;
              return (
                <ServiceMobileCard
                  key={p.id}
                  service={p}
                  rboName={rboMap.get(p.rboId) ?? p.rboId}
                  categoryName={categoryPathLabel(catList, p.categoryId)}
                  categoryToneIdx={toneIdx}
                  onMore={() =>
                    toast('More actions available on service detail', 'info')
                  }
                />
              );
            })}
          </div>

          <TableShell className="hidden lg:block">
            <Table>
              <thead>
                <tr>
                  <Th>Service</Th>
                  <Th>RBO</Th>
                  <Th>Category</Th>
                  <Th>Price / day</Th>
                  <Th>Bookings</Th>
                  <Th>Rating</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((p) => {
                  const toneIdx = catIndex.get(p.categoryId) ?? 0;
                  return (
                    <ClickableTableRow
                      key={p.id}
                      to={`/listings/services/${p.id}`}
                      ariaLabel={`View ${p.name}`}
                    >
                      <ClickableTd>
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0]}
                            alt=""
                            className="h-11 w-11 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <p className="block truncate font-medium text-text-primary">
                              {p.name}
                            </p>
                            <p className="truncate text-xs text-text-muted">
                              {p.id.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </ClickableTd>
                      <ClickableTd>
                        <Link
                          to={`/rbos/${p.rboId}`}
                          onClick={stopRowNavigation}
                          className="text-sm text-text-primary hover:text-accent"
                        >
                          {rboMap.get(p.rboId) ?? p.rboId}
                        </Link>
                      </ClickableTd>
                      <ClickableTd>
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                            CAT_TONES[toneIdx % CAT_TONES.length],
                          )}
                        >
                          {p.category || '—'}
                        </span>
                      </ClickableTd>
                      <ClickableTd className="tabular-nums">
                        {formatInr(p.pricePerDayInr)}
                      </ClickableTd>
                      <ClickableTd className="tabular-nums">{p.bookingCount}</ClickableTd>
                      <ClickableTd>
                        <StarRating value={p.ratingAvg} />
                      </ClickableTd>
                      <ClickableTd>
                        <StatusPill status={p.status} />
                      </ClickableTd>
                      <TableActionsCell>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/listings/services/${p.id}`}
                            onClick={stopRowNavigation}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary hover:border-accent hover:text-accent"
                            aria-label={`Edit ${p.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                          </Link>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary hover:border-accent hover:text-text-primary"
                            aria-label={`More actions for ${p.name}`}
                            onClick={() =>
                              toast(
                                'More actions available on service detail',
                                'info',
                              )
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
          Showing {rangeStart} to {rangeEnd} of {filtered.length} services
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
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Layers;
}) {
  return (
    <Card className="!p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-accent">
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

function StarRating({ value }: { value: number }) {
  if (!value) return <span className="text-sm text-text-muted">—</span>;
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

function StatusPill({ status }: { status: ProductStatus }) {
  const tone =
    status === 'active'
      ? 'border-success/30 bg-success-muted text-success'
      : status === 'pending_review'
        ? 'border-warning/30 bg-warning-muted text-warning'
        : status === 'frozen'
          ? 'border-warning/30 bg-warning-muted text-warning'
          : status === 'rejected'
            ? 'border-danger/30 bg-danger-muted text-danger'
            : 'border-border bg-canvas text-text-secondary';
  const dot =
    status === 'active'
      ? 'bg-success'
      : status === 'pending_review' || status === 'frozen'
        ? 'bg-warning'
        : status === 'rejected'
          ? 'bg-danger'
          : 'bg-text-muted';
  const label = status.replace('_', ' ');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        tone,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} aria-hidden />
      {label}
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
