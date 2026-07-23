import { useMemo, useState } from 'react';
import {
  CalendarRange,
  Download,
  IndianRupee,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApiSWR } from '@/api/swr-helpers';
import { ENDPOINTS } from '@/api/endpoints';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  EmptyState,
  ErrorState,
} from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { Table, TableShell, Td, Th } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import {
  filterSelectClass,
  searchControlClass,
} from '@/components/ui/control-styles';
import { ProductMobileCard } from '@/pages/super-admin/products/ProductMobileCard';
import { BOOKING_VALUE_LABEL, BOOKING_VALUE_MONTH_LABEL } from '@/lib/metrics';
import { cn, formatInr } from '@/lib/utils';
import type { Category, Product, ProductStatus, RboVendor } from '@/types';

const PAGE_SIZE = 10;

const CAT_TONES = [
  'border-accent/40 bg-accent-muted text-accent',
  'border-success/40 bg-success-muted text-success',
  'border-warning/40 bg-warning-muted text-warning',
  'border-border bg-canvas text-text-secondary',
] as const;

export function ProductsPage() {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [rboId, setRboId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'' | ProductStatus>('');
  const [page, setPage] = useState(1);

  const { data, error, isLoading, mutate } = useApiSWR<Product[]>(
    ENDPOINTS.products,
  );
  const { data: rbos } = useApiSWR<RboVendor[]>(ENDPOINTS.rbos);
  const { data: categories } = useApiSWR<Category[]>(ENDPOINTS.categories);

  const rboMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rbos ?? []) m.set(r.id, r.businessName);
    return m;
  }, [rbos]);
  const catMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories ?? []) m.set(c.id, c.name);
    return m;
  }, [categories]);
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
      if (rboId && p.rboId !== rboId) return false;
      if (categoryId && p.categoryId !== categoryId) return false;
      if (status && p.status !== status) return false;
      if (!query) return true;
      const vendor = rboMap.get(p.rboId)?.toLowerCase() ?? '';
      const cat = catMap.get(p.categoryId)?.toLowerCase() ?? '';
      return (
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        vendor.includes(query) ||
        cat.includes(query)
      );
    });
  }, [list, q, rboId, categoryId, status, rboMap, catMap]);

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
    setRboId('');
    setCategoryId('');
    setStatus('');
    setPage(1);
  }

  if (isLoading && !data) return <ListPageSkeleton kpiCount={5} />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="hidden text-2xl font-semibold text-text-primary sm:block">Products</h1>
          <p className="mt-1 max-w-xl text-sm text-text-secondary">
            Manage all rental products across RBOs. Filter, search and track
            performance.
          </p>
        </div>
        <Button
          onClick={() =>
            toast('Add Product opens when create API is ready', 'info')
          }
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total products"
          value={kpis.total.toLocaleString('en-IN')}
          hint={`Across ${kpis.vendorCount} RBOs`}
          icon={Package}
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
          hint="Across all products"
          icon={Star}
        />
        <KpiCard
          label="Active products"
          value={kpis.active.toLocaleString('en-IN')}
          hint={`${kpis.activePct}% of total`}
          icon={TrendingUp}
        />
      </div>

      <Card className="!p-4">
        <div className="space-y-3">
          <label className="relative block w-full">
            <span className="sr-only">Search products</span>
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
              placeholder="Search products…"
              className={searchControlClass}
            />
          </label>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
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
                value={categoryId}
                onChange={(v) => {
                  setCategoryId(v);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All categories' },
                  ...(categories ?? []).map((c) => ({
                    value: c.id,
                    label: c.name,
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
                  { value: 'active', label: 'Active' },
                  { value: 'frozen', label: 'Frozen' },
                  { value: 'disabled', label: 'Disabled' },
                ]}
              />
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast('Advanced filters ship with the API', 'info')
                }
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                More filters
              </Button>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
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
        <EmptyState title="No products match filters" />
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {pageRows.map((p) => {
              const toneIdx = catIndex.get(p.categoryId) ?? 0;
              return (
                <ProductMobileCard
                  key={p.id}
                  product={p}
                  rboName={rboMap.get(p.rboId) ?? p.rboId}
                  categoryName={catMap.get(p.categoryId) ?? p.categoryId}
                  categoryToneIdx={toneIdx}
                  onMore={() =>
                    toast('More actions available on product detail', 'info')
                  }
                />
              );
            })}
          </div>

          <TableShell className="hidden lg:block">
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
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
                    <tr key={p.id} className="hover:bg-accent-muted/30">
                      <Td>
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0]}
                            alt=""
                            className="h-11 w-11 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/products/${p.id}`}
                              className="block truncate font-medium text-text-primary hover:text-accent"
                            >
                              {p.name}
                            </Link>
                            <p className="truncate text-xs text-text-muted">
                              {p.id.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <Link
                          to={`/rbos/${p.rboId}`}
                          className="text-sm text-text-primary hover:text-accent"
                        >
                          {rboMap.get(p.rboId) ?? p.rboId}
                        </Link>
                      </Td>
                      <Td>
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                            CAT_TONES[toneIdx % CAT_TONES.length],
                          )}
                        >
                          {catMap.get(p.categoryId) ?? p.categoryId}
                        </span>
                      </Td>
                      <Td className="tabular-nums">
                        {formatInr(p.pricePerDayInr)}
                      </Td>
                      <Td className="tabular-nums">{p.bookingCount}</Td>
                      <Td>
                        <StarRating value={p.ratingAvg} />
                      </Td>
                      <Td>
                        <StatusPill status={p.status} />
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/products/${p.id}`}
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
                                'More actions available on product detail',
                                'info',
                              )
                            }
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden />
                          </button>
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
          Showing {rangeStart} to {rangeEnd} of {filtered.length} products
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
  icon: typeof Package;
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
      : status === 'frozen'
        ? 'border-warning/30 bg-warning-muted text-warning'
        : 'border-danger/30 bg-danger-muted text-danger';
  const dot =
    status === 'active'
      ? 'bg-success'
      : status === 'frozen'
        ? 'bg-warning'
        : 'bg-danger';
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
