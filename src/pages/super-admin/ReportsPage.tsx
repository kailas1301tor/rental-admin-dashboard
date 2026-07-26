import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  Download,
  IndianRupee,
  LayoutDashboard,
  LineChart as LineChartIcon,
  Package,
  Star,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApiSWR } from '@/api/swr-helpers';
import { ENDPOINTS } from '@/api/endpoints';
import { ListFilterBar } from '@/components/filters/ListFilterBar';
import {
  CHART_AXIS,
  CHART_COLORS,
  CHART_GRID,
  CHART_TOOLTIP_STYLE,
} from '@/components/charts/chart-theme';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import {
  EmptyState,
  ErrorState,
} from '@/components/ui/States';
import { Skeleton } from '@/components/ui/Skeleton';
import { SectionSkeleton } from '@/components/ui/skeletons';
import { Table, TableShell, Td, Th } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { filterSelectClass } from '@/components/ui/control-styles';
import { type BookingSeriesGranularity } from '@/lib/booking-series';
import { BookingVolumeChart } from '@/pages/super-admin/reports/BookingVolumeChart';
import {
  buildBookingVolumeSeries,
} from '@/lib/booking-volume-series';
import {
  businessTypes,
  matchesTaxonomyFilters,
} from '@/lib/category-helpers';
import { BOOKING_VALUE_HINT, BOOKING_VALUE_LABEL } from '@/lib/metrics';
import { matchesDistricts } from '@/lib/kerala-districts';
import { cn, formatDateTime, formatInr, formatInrCrore } from '@/lib/utils';
import { useListFilters } from '@/hooks/useListFilters';
import type {
  Category,
  Product,
  RboVendor,
  ReportBookings,
  ReportOverview,
  ReportProducts,
  ReportRbos,
} from '@/types';
import type { ListFiltersState } from '@/hooks/useListFilters';

type Tab =
  | 'overview'
  | 'bookings'
  | 'rentals'
  | 'revenue'
  | 'users'
  | 'products'
  | 'vendors';

type ChartKind = 'line' | 'area' | 'bar';
type CompareWith = 'previous' | 'yoy' | 'none';
type GroupBy = 'day' | 'week' | 'month';

const TABS: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings', icon: CalendarRange },
  { id: 'rentals', label: 'Rentals', icon: Package },
  { id: 'revenue', label: 'Revenue', icon: IndianRupee },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'vendors', label: 'Vendors', icon: Store },
];

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function ReportsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [from, setFrom] = useState('2025-05-13');
  const [to, setTo] = useState('2025-05-20');
  const [compareWith, setCompareWith] = useState<CompareWith>('previous');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [chartKind, setChartKind] = useState<ChartKind>('line');
  const [applied, setApplied] = useState({ from: '2025-05-13', to: '2025-05-20' });

  const { filters, setFilters, reset } = useListFilters();

  const overview = useApiSWR<ReportOverview>(ENDPOINTS.reportOverview);
  const bookings = useApiSWR<ReportBookings>(ENDPOINTS.reportBookings);
  const products = useApiSWR<ReportProducts>(ENDPOINTS.reportProducts);
  const rbos = useApiSWR<ReportRbos>(ENDPOINTS.reportRbos);
  const { data: categoryData } = useApiSWR<Category[]>(ENDPOINTS.categories);
  const { data: productData } = useApiSWR<Product[]>(ENDPOINTS.products);
  const { data: rboData } = useApiSWR<RboVendor[]>(ENDPOINTS.rbos);

  const catList = categoryData ?? [];

  const scopedOverview = useMemo(() => {
    if (!overview.data) return undefined;
    return scopeReportOverview(
      overview.data,
      filters,
      productData ?? [],
      rboData ?? [],
      catList,
    );
  }, [overview.data, filters, productData, rboData, catList]);

  const scopedProducts = useMemo(() => {
    if (!products.data) return undefined;
    return scopeReportProducts(products.data, filters, productData ?? [], catList);
  }, [products.data, filters, productData, catList]);

  const scopedRbos = useMemo(() => {
    if (!rbos.data) return undefined;
    return scopeReportRbos(rbos.data, filters, rboData ?? [], catList);
  }, [rbos.data, filters, rboData, catList]);

  const rangeLabel = useMemo(() => {
    const fmt = (iso: string) =>
      new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(`${iso}T12:00:00`));
    return `${fmt(applied.from)} – ${fmt(applied.to)}`;
  }, [applied.from, applied.to]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="hidden text-2xl font-semibold text-text-primary sm:block">Reports</h1>
          <nav className="mt-1 text-sm text-text-muted">
            <Link to="/" className="hover:text-accent">
              Home
            </Link>
            <span className="mx-1.5">›</span>
            <span className="text-text-secondary">Reports</span>
          </nav>
        </div>
        <Button
          variant="outline"
          onClick={() => toast('Export queued (mock CSV)', 'success')}
        >
          <Download className="h-4 w-4" aria-hidden />
          Export Report
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>

      <Card className="!p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center xl:gap-3">
          <label className="inline-flex h-11 min-w-0 items-center gap-2 rounded-full border border-border bg-canvas px-3.5 text-sm text-text-secondary sm:col-span-1">
            <CalendarDays
              className="h-4 w-4 shrink-0 text-text-muted"
              aria-hidden
            />
            <span className="shrink-0 text-xs text-text-muted">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="min-w-0 flex-1 bg-transparent py-0 text-sm text-text-primary focus:outline-none"
            />
          </label>

          <label className="inline-flex h-11 min-w-0 items-center gap-2 rounded-full border border-border bg-canvas px-3.5 text-sm text-text-secondary sm:col-span-1">
            <CalendarDays
              className="h-4 w-4 shrink-0 text-text-muted"
              aria-hidden
            />
            <span className="shrink-0 text-xs text-text-muted">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="min-w-0 flex-1 bg-transparent py-0 text-sm text-text-primary focus:outline-none"
            />
          </label>

          <select
            value={compareWith}
            onChange={(e) => setCompareWith(e.target.value as CompareWith)}
            className={cn(filterSelectClass, 'xl:min-w-[10.5rem] xl:flex-none')}
            aria-label="Compare with"
          >
            <option value="previous">Previous Period</option>
            <option value="yoy">Same period last year</option>
            <option value="none">No comparison</option>
          </select>

          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className={cn(filterSelectClass, 'xl:min-w-[10.5rem] xl:flex-none')}
            aria-label="Group by"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>

          <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-1 xl:ml-auto">
            <Button
              size="sm"
              onClick={() => {
                setApplied({ from, to });
                toast('Filters applied', 'success');
              }}
            >
              Apply Filters
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Showing {rangeLabel}
          {compareWith === 'previous'
            ? ' · vs previous period'
            : compareWith === 'yoy'
              ? ' · vs same period last year'
              : ''}
          {' · '}
          grouped by {groupBy}
        </p>
      </Card>

      <ListFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onReset={reset}
        categories={catList}
      />

      {scopedOverview ? (
        <KpiRow data={scopedOverview} compareWith={compareWith} />
      ) : overview.isLoading ? (
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          role="status"
          aria-busy="true"
          aria-label="Loading"
        >
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-7 w-28" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
          ))}
          <span className="sr-only">Loading…</span>
        </div>
      ) : null}

      <div
        role="tablist"
        className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface p-2 lg:flex-nowrap lg:gap-0 lg:rounded-none lg:border-0 lg:border-b lg:border-border lg:bg-transparent lg:p-0"
      >
        {TABS.map((item) => {
          const active = tab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={cn(
                'relative inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors lg:min-h-11 lg:rounded-none lg:border-0 lg:px-3',
                active
                  ? 'border-accent/40 bg-accent-muted text-accent lg:bg-transparent'
                  : 'border-border bg-canvas text-text-secondary hover:border-accent/30 hover:text-text-primary lg:border-0 lg:bg-transparent lg:hover:bg-transparent',
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {item.label}
              {active ? (
                <span className="absolute inset-x-2 bottom-0 hidden h-0.5 rounded-full bg-accent lg:block" />
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === 'overview' ? (
        <OverviewTab
          state={{ ...overview, data: scopedOverview }}
          chartKind={chartKind}
          onChartKind={setChartKind}
        />
      ) : null}
      {tab === 'bookings' ? (
        <BookingsTab
          state={bookings}
          rangeFrom={applied.from}
          rangeTo={applied.to}
        />
      ) : null}
      {tab === 'rentals' ? (
        <PlaceholderTab
          title="Active rentals"
          description="Live rentals and return windows will appear here."
        />
      ) : null}
      {tab === 'revenue' ? (
        <RevenueTab state={{ ...overview, data: scopedOverview }} />
      ) : null}
      {tab === 'users' ? (
        <PlaceholderTab
          title="User growth"
          description="Signup and retention charts ship with the users analytics API."
        />
      ) : null}
      {tab === 'products' ? (
        <ProductsTab state={{ ...products, data: scopedProducts }} />
      ) : null}
      {tab === 'vendors' ? <RbosTab state={{ ...rbos, data: scopedRbos }} /> : null}
    </div>
  );
}

function reportScopeRatio(
  items: Product[],
  filters: ListFiltersState,
  categories: Category[],
): number {
  const hasDistrict = filters.districts.length > 0;
  const hasTaxonomy =
    filters.businessTypeIds.length > 0 ||
    filters.businessCategoryIds.length > 0;
  if (!hasDistrict && !hasTaxonomy) return 1;

  const totalWeight = items.reduce((s, p) => s + p.bookingCount, 0);
  if (totalWeight === 0) return 1;

  const matchedWeight = items
    .filter((p) => {
      if (!matchesDistricts(filters.districts, p.districtId)) return false;
      return matchesTaxonomyFilters(
        [p.categoryId],
        categories,
        filters.businessTypeIds,
        filters.businessCategoryIds,
      );
    })
    .reduce((s, p) => s + p.bookingCount, 0);

  return matchedWeight / totalWeight;
}

function scopeReportOverview(
  data: ReportOverview,
  filters: ListFiltersState,
  products: Product[],
  rbos: RboVendor[],
  categories: Category[],
): ReportOverview {
  const ratio = reportScopeRatio(products, filters, categories);
  const hasFilters =
    filters.districts.length > 0 ||
    filters.businessTypeIds.length > 0 ||
    filters.businessCategoryIds.length > 0;

  const matchingRboNames = new Set(
    rbos
      .filter((r) => {
        if (!matchesDistricts(filters.districts, r.districtId)) return false;
        return matchesTaxonomyFilters(
          r.categoryIds,
          categories,
          filters.businessTypeIds,
          filters.businessCategoryIds,
        );
      })
      .map((r) => r.businessName),
  );

  const topCategories = data.topCategories.filter((row) => {
    if (!hasFilters) return true;
    const cat = categories.find((c) => c.name === row.name);
    if (!cat) return true;
    return matchesTaxonomyFilters(
      [cat.id],
      categories,
      filters.businessTypeIds,
      filters.businessCategoryIds,
    );
  });

  const salesByCategory = data.salesByCategory.filter((row) => {
    if (!hasFilters) return true;
    const type = businessTypes(categories).find((c) => c.name === row.name);
    if (!type) return true;
    return matchesTaxonomyFilters(
      [type.id],
      categories,
      filters.businessTypeIds,
      filters.businessCategoryIds,
    );
  });

  const topRbos =
    hasFilters && matchingRboNames.size > 0
      ? data.topRbos.filter((r) => matchingRboNames.has(r.name))
      : hasFilters
        ? []
        : data.topRbos;

  const scale = (n: number) => Math.round(n * ratio);

  return {
    ...data,
    kpis: {
      ...data.kpis,
      gmvInr: scale(data.kpis.gmvInr),
      bookings: scale(data.kpis.bookings),
      completedBookings: scale(data.kpis.completedBookings),
      cancellations: scale(data.kpis.cancellations),
      activeRentals: scale(data.kpis.activeRentals),
    },
    gmvSeries: data.gmvSeries.map((row) => ({
      ...row,
      gmvInr: scale(row.gmvInr),
    })),
    bookingsByStatus: data.bookingsByStatus.map((row) => ({
      ...row,
      value: scale(row.value),
    })),
    topCategories,
    salesByCategory,
    topRbos,
  };
}

function scopeReportProducts(
  data: ReportProducts,
  filters: ListFiltersState,
  products: Product[],
  categories: Category[],
): ReportProducts {
  const allowedIds = new Set(
    products
      .filter((p) => {
        if (!matchesDistricts(filters.districts, p.districtId)) return false;
        return matchesTaxonomyFilters(
          [p.categoryId],
          categories,
          filters.businessTypeIds,
          filters.businessCategoryIds,
        );
      })
      .map((p) => p.id),
  );

  const hasFilters =
    filters.districts.length > 0 ||
    filters.businessTypeIds.length > 0 ||
    filters.businessCategoryIds.length > 0;
  if (!hasFilters) return data;

  const pick = <T extends { id: string }>(rows: T[]) =>
    rows.filter((r) => allowedIds.has(r.id));

  return {
    topByGmv: pick(data.topByGmv),
    negativeReview: pick(data.negativeReview),
    highReview: pick(data.highReview),
  };
}

function scopeReportRbos(
  data: ReportRbos,
  filters: ListFiltersState,
  rbos: RboVendor[],
  categories: Category[],
): ReportRbos {
  const allowedIds = new Set(
    rbos
      .filter((r) => {
        if (!matchesDistricts(filters.districts, r.districtId)) return false;
        return matchesTaxonomyFilters(
          r.categoryIds,
          categories,
          filters.businessTypeIds,
          filters.businessCategoryIds,
        );
      })
      .map((r) => r.id),
  );

  const hasFilters =
    filters.districts.length > 0 ||
    filters.businessTypeIds.length > 0 ||
    filters.businessCategoryIds.length > 0;
  if (!hasFilters) return data;

  const pick = <T extends { id: string }>(rows: T[]) =>
    rows.filter((r) => allowedIds.has(r.id));

  return {
    leaderboard: pick(data.leaderboard),
    badReview: pick(data.badReview),
    goodReview: pick(data.goodReview),
  };
}

type SWRLike<T> = {
  data?: T;
  error?: { message: string };
  isLoading: boolean;
  mutate: () => Promise<unknown>;
};

function KpiRow({
  data,
  compareWith,
}: {
  data: ReportOverview;
  compareWith: CompareWith;
}) {
  const d = data.kpis;
  const show = compareWith !== 'none';
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <ReportKpi
        label={BOOKING_VALUE_LABEL}
        value={formatInr(d.gmvInr)}
        delta={show ? d.deltas.gmvPct : null}
        icon={IndianRupee}
      />
      <ReportKpi
        label="Total Bookings"
        value={d.bookings.toLocaleString('en-IN')}
        delta={show ? d.deltas.bookingsPct : null}
        icon={CalendarRange}
      />
      <ReportKpi
        label="Completed Bookings"
        value={d.completedBookings.toLocaleString('en-IN')}
        delta={show ? d.deltas.completedPct : null}
        icon={CheckCircle2}
      />
      <ReportKpi
        label="Cancelled Bookings"
        value={d.cancellations.toLocaleString('en-IN')}
        delta={show ? d.deltas.cancellationsPct : null}
        icon={XCircle}
        invertDelta
      />
      <ReportKpi
        label="Active Rentals"
        value={d.activeRentals.toLocaleString('en-IN')}
        delta={show ? d.deltas.activeRentalsPct : null}
        icon={Package}
      />
      <ReportKpi
        label="Avg Rating"
        value={d.avgRating.toFixed(1)}
        delta={show ? d.deltas.avgRatingPts : null}
        icon={Star}
        deltaSuffix=" pts"
      />
    </div>
  );
}

function ReportKpi({
  label,
  value,
  delta,
  icon: Icon,
  invertDelta,
  deltaSuffix = '%',
}: {
  label: string;
  value: string;
  delta: number | null;
  icon: typeof IndianRupee;
  invertDelta?: boolean;
  deltaSuffix?: string;
}) {
  const positive = delta != null && (invertDelta ? delta < 0 : delta >= 0);
  const negative = delta != null && (invertDelta ? delta > 0 : delta < 0);
  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
          {label}
        </p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-muted text-accent">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
        {value}
      </p>
      {delta != null ? (
        <p
          className={cn(
            'mt-1 inline-flex items-center gap-1 text-xs font-medium',
            positive && 'text-success',
            negative && 'text-danger',
            !positive && !negative && 'text-text-secondary',
          )}
        >
          {positive ? (
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
          ) : negative ? (
            <TrendingDown className="h-3.5 w-3.5" aria-hidden />
          ) : null}
          {delta > 0 ? '+' : ''}
          {delta}
          {deltaSuffix} vs previous period
        </p>
      ) : (
        <p className="mt-1 text-xs text-text-muted">{BOOKING_VALUE_HINT}</p>
      )}
    </Card>
  );
}

function OverviewTab({
  state,
  chartKind,
  onChartKind,
}: {
  state: SWRLike<ReportOverview>;
  chartKind: ChartKind;
  onChartKind: (v: ChartKind) => void;
}) {
  if (state.isLoading && !state.data) return <SectionSkeleton rows={4} />;
  if (state.error) {
    return (
      <ErrorState
        message={state.error.message}
        onRetry={() => void state.mutate()}
      />
    );
  }
  if (!state.data) return <EmptyState title="No overview data" />;
  const d = state.data;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card className="!p-4 sm:!p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              {BOOKING_VALUE_LABEL} Over Time
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Daily booking ₹ in the selected period
            </p>
          </div>
          <select
            value={chartKind}
            onChange={(e) => onChartKind(e.target.value as ChartKind)}
            className="h-9 rounded-full border border-border bg-surface px-3 text-xs text-text-primary focus:border-accent focus:outline-none"
            aria-label="Chart type"
          >
            <option value="line">Line</option>
            <option value="area">Area</option>
            <option value="bar">Bar</option>
          </select>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartKind === 'bar' ? (
              <BarChart data={d.gmvSeries}>
                <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={CHART_AXIS} fontSize={11} />
                <YAxis
                  stroke={CHART_AXIS}
                  fontSize={11}
                  tickFormatter={(v) => `${Number(v) / 1e5}L`}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v) => [formatInr(Number(v)), BOOKING_VALUE_LABEL]}
                />
                <Bar
                  dataKey="gmvInr"
                  fill="var(--accent)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            ) : chartKind === 'area' ? (
              <AreaChart data={d.gmvSeries}>
                <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={CHART_AXIS} fontSize={11} />
                <YAxis
                  stroke={CHART_AXIS}
                  fontSize={11}
                  tickFormatter={(v) => `${Number(v) / 1e5}L`}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v) => [formatInr(Number(v)), BOOKING_VALUE_LABEL]}
                />
                <Area
                  type="monotone"
                  dataKey="gmvInr"
                  stroke="var(--accent)"
                  fill="var(--accent-muted)"
                />
              </AreaChart>
            ) : (
              <LineChart data={d.gmvSeries}>
                <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={CHART_AXIS} fontSize={11} />
                <YAxis
                  stroke={CHART_AXIS}
                  fontSize={11}
                  tickFormatter={(v) => `${Number(v) / 1e5}L`}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v) => [formatInr(Number(v)), BOOKING_VALUE_LABEL]}
                />
                <Line
                  type="monotone"
                  dataKey="gmvInr"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'var(--accent)' }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="!p-4 sm:!p-5">
        <h2 className="text-sm font-semibold text-text-primary">
          Bookings by Status
        </h2>
        <p className="mt-0.5 text-xs text-text-muted">
          Share of bookings in the selected range
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="h-56 min-w-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={d.bookingsByStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {d.bookingsByStatus.map((row) => (
                    <Cell key={row.name} fill={row.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="w-full space-y-2.5 sm:w-44">
            {d.bookingsByStatus.map((row) => (
              <li
                key={row.name}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="inline-flex items-center gap-2 text-text-secondary">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: row.color }}
                    aria-hidden
                  />
                  {row.name}
                </span>
                <span className="tabular-nums text-text-primary">
                  {row.value}{' '}
                  <span className="text-text-muted">({row.pct}%)</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-text-primary">
            Top Performing Categories
          </h2>
        </div>
        <TableShell className="rounded-none border-0">
          <Table>
            <thead>
              <tr>
                <Th>Category</Th>
                <Th>Bookings</Th>
                <Th>{BOOKING_VALUE_LABEL}</Th>
                <Th>Change</Th>
              </tr>
            </thead>
            <tbody>
              {d.topCategories.map((row) => (
                <tr key={row.name} className="hover:bg-accent-muted/30">
                  <Td className="font-medium text-text-primary">{row.name}</Td>
                  <Td className="tabular-nums">{row.bookings}</Td>
                  <Td className="tabular-nums">{formatInr(row.gmvInr)}</Td>
                  <Td>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium',
                        row.changePct >= 0 ? 'text-success' : 'text-danger',
                      )}
                    >
                      {row.changePct >= 0 ? (
                        <TrendingUp className="h-3 w-3" aria-hidden />
                      ) : (
                        <TrendingDown className="h-3 w-3" aria-hidden />
                      )}
                      {row.changePct > 0 ? '+' : ''}
                      {row.changePct}%
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableShell>
      </Card>

      <Card className="!p-4 sm:!p-5">
        <h2 className="text-sm font-semibold text-text-primary">
          Recent Booking Activity
        </h2>
        <ul className="mt-4 space-y-3">
          {d.recentActivity.map((item, idx) => (
            <li
              key={item.id}
              className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                  idx % 2 === 0
                    ? 'bg-accent-muted text-accent'
                    : 'bg-success-muted text-success',
                )}
                aria-hidden
              >
                {initials(item.customerName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">
                  {item.customerName}
                </p>
                <p className="truncate text-xs text-text-muted">
                  {item.bookingId}
                </p>
              </div>
              <BookingStatusBadge status={item.status} />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium tabular-nums text-text-primary">
                  {formatInr(item.amountInr)}
                </p>
                <p className="text-[11px] text-text-muted">
                  {formatDateTime(item.occurredAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function BookingStatusBadge({
  status,
}: {
  status: ReportOverview['recentActivity'][number]['status'];
}) {
  const tone =
    status === 'Completed'
      ? 'border-success/30 bg-success-muted text-success'
      : status === 'Confirmed'
        ? 'border-accent/30 bg-accent-muted text-accent'
        : status === 'Cancelled' || status === 'Rejected'
          ? 'border-danger/30 bg-danger-muted text-danger'
          : 'border-warning/30 bg-warning-muted text-warning';
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        tone,
      )}
    >
      {status}
    </span>
  );
}

function PlaceholderTab({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="!p-8 text-center">
      <LineChartIcon className="mx-auto h-8 w-8 text-text-muted" aria-hidden />
      <h2 className="mt-3 text-sm font-semibold text-text-primary">{title}</h2>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
    </Card>
  );
}

function RevenueTab({ state }: { state: SWRLike<ReportOverview> }) {
  if (state.isLoading && !state.data) return <SectionSkeleton rows={4} />;
  if (state.error) {
    return (
      <ErrorState message={state.error.message} onRetry={() => void state.mutate()} />
    );
  }
  if (!state.data) return <EmptyState title="No revenue data" />;
  const d = state.data;
  const categoryTotal = d.salesByCategory.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader
          title={`${BOOKING_VALUE_LABEL} by category`}
          description={`${formatInr(categoryTotal)} total across all categories`}
        />
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
          <div className="relative mx-auto h-52 w-full max-w-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={d.salesByCategory}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={82}
                  paddingAngle={2}
                >
                  {d.salesByCategory.map((item, i) => (
                    <Cell
                      key={item.name}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(value, name) => {
                    const amount = Number(value);
                    const pct =
                      categoryTotal > 0
                        ? Math.round((amount / categoryTotal) * 100)
                        : 0;
                    return [`${formatInr(amount)} (${pct}%)`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold tabular-nums text-text-primary">
                {formatInrCrore(categoryTotal)}
              </span>
              <span className="text-xs text-text-muted">total value</span>
            </div>
          </div>
          <ul className="space-y-2.5">
            {d.salesByCategory.map((item, i) => {
              const pct =
                categoryTotal > 0
                  ? Math.round((item.value / categoryTotal) * 100)
                  : 0;
              return (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2.5 text-text-secondary">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="shrink-0 text-right tabular-nums">
                    <span className="font-semibold text-text-primary">
                      {formatInr(item.value)}
                    </span>
                    <span className="ml-2 text-xs text-text-muted">{pct}%</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </Card>
      <Card>
        <CardHeader title={`Top vendors by ${BOOKING_VALUE_LABEL.toLowerCase()}`} />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.topRbos}>
              <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke={CHART_AXIS} fontSize={11} />
              <YAxis
                stroke={CHART_AXIS}
                fontSize={11}
                tickFormatter={(v) => `${Number(v) / 1e5}L`}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(v) => [formatInr(Number(v)), BOOKING_VALUE_LABEL]}
              />
              <Bar dataKey="gmvInr" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function bookingStatusColor(name: string, index: number): string {
  switch (name) {
    case 'Completed':
      return 'var(--success)';
    case 'Active':
    case 'Confirmed':
      return 'var(--accent)';
    case 'Pending':
      return 'var(--warning)';
    case 'Cancelled':
    case 'Rejected':
      return 'var(--danger)';
    default:
      return CHART_COLORS[index % CHART_COLORS.length];
  }
}

function BookingsTab({
  state,
  rangeFrom,
  rangeTo,
}: {
  state: SWRLike<ReportBookings>;
  rangeFrom: string;
  rangeTo: string;
}) {
  const [volumeView, setVolumeView] =
    useState<BookingSeriesGranularity>('day');

  const statusTotal = useMemo(
    () =>
      (state.data?.byStatus ?? []).reduce((sum, item) => sum + item.value, 0),
    [state.data?.byStatus],
  );

  const volumeSeries = useMemo(() => {
    if (!state.data || statusTotal === 0) return [];
    return buildBookingVolumeSeries(
      rangeFrom,
      rangeTo,
      statusTotal,
      volumeView,
    );
  }, [rangeFrom, rangeTo, state.data, statusTotal, volumeView]);

  if (state.isLoading && !state.data) return <SectionSkeleton rows={4} />;
  if (state.error) {
    return (
      <ErrorState message={state.error.message} onRetry={() => void state.mutate()} />
    );
  }
  if (!state.data) return <EmptyState title="No booking report" />;
  const d = state.data;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader
          title="Bookings by status"
          description={`${statusTotal.toLocaleString('en-IN')} bookings in the selected period`}
        />
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
          <div className="relative mx-auto h-52 w-full max-w-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={d.byStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={82}
                  paddingAngle={2}
                >
                  {d.byStatus.map((item, i) => (
                    <Cell
                      key={item.name}
                      fill={bookingStatusColor(item.name, i)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(value, name) => {
                    const count = Number(value);
                    const pct =
                      statusTotal > 0
                        ? Math.round((count / statusTotal) * 100)
                        : 0;
                    return [`${count.toLocaleString('en-IN')} (${pct}%)`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold tabular-nums text-text-primary">
                {statusTotal.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-text-muted">total bookings</span>
            </div>
          </div>
          <ul className="space-y-2.5">
            {d.byStatus.map((item, i) => {
              const pct =
                statusTotal > 0
                  ? Math.round((item.value / statusTotal) * 100)
                  : 0;
              return (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2.5 text-text-secondary">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: bookingStatusColor(item.name, i),
                      }}
                    />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="shrink-0 text-right tabular-nums">
                    <span className="font-semibold text-text-primary">
                      {item.value.toLocaleString('en-IN')}
                    </span>
                    <span className="ml-2 text-xs text-text-muted">{pct}%</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </Card>
      <Card>
        <CardHeader title="Cancellations trend" />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.cancellationSeries}>
              <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke={CHART_AXIS} />
              <YAxis stroke={CHART_AXIS} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="count" stroke="var(--danger)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <BookingVolumeChart
        series={volumeSeries}
        view={volumeView}
        onViewChange={setVolumeView}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
      />
    </div>
  );
}

function ProductsTab({ state }: { state: SWRLike<ReportProducts> }) {
  if (state.isLoading && !state.data) return <SectionSkeleton rows={4} />;
  if (state.error) {
    return (
      <ErrorState message={state.error.message} onRetry={() => void state.mutate()} />
    );
  }
  if (!state.data) return <EmptyState title="No product report" />;
  const d = state.data;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title={`Top products by ${BOOKING_VALUE_LABEL.toLowerCase()}`} />
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.topByGmv} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
              <XAxis type="number" stroke={CHART_AXIS} tickFormatter={(v) => `${Number(v) / 1e5}L`} />
              <YAxis type="category" dataKey="name" width={140} stroke={CHART_AXIS} fontSize={11} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(v) => [formatInr(Number(v)), BOOKING_VALUE_LABEL]}
              />
              <Bar dataKey="gmvInr" fill="var(--accent)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SimpleProductTable title="Negative-review products" rows={d.negativeReview} />
        <SimpleProductTable title="High-review products" rows={d.highReview} />
      </div>
    </div>
  );
}

function SimpleProductTable({
  title,
  rows,
}: {
  title: string;
  rows: { id: string; name: string; ratingAvg: number; reviewCount: number }[];
}) {
  return (
    <Card>
      <CardHeader title={title} />
      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Rating</Th>
              <Th>Reviews</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td className="font-medium">{r.name}</Td>
                <Td>{r.ratingAvg.toFixed(1)}</Td>
                <Td>{r.reviewCount}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableShell>
    </Card>
  );
}

function RbosTab({ state }: { state: SWRLike<ReportRbos> }) {
  if (state.isLoading && !state.data) return <SectionSkeleton rows={4} />;
  if (state.error) {
    return (
      <ErrorState message={state.error.message} onRetry={() => void state.mutate()} />
    );
  }
  if (!state.data) return <EmptyState title="No RBO report" />;
  const d = state.data;
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-3">
        <CardHeader title="Vendor leaderboard" />
        <TableShell>
          <Table>
            <thead>
              <tr>
                <Th>Vendor</Th>
                <Th>{BOOKING_VALUE_LABEL}</Th>
                <Th>Rating</Th>
              </tr>
            </thead>
            <tbody>
              {d.leaderboard.map((r) => (
                <tr key={r.id}>
                  <Td className="font-medium">{r.name}</Td>
                  <Td>{formatInr(r.gmvInr)}</Td>
                  <Td>{r.ratingAvg.toFixed(1)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableShell>
      </Card>
      <Card>
        <CardHeader title="Good-review vendors" />
        <ul className="space-y-2 text-sm">
          {d.goodReview.map((r) => (
            <li key={r.id} className="flex justify-between">
              <span>{r.name}</span>
              <span className="font-medium text-success">{r.ratingAvg.toFixed(1)}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="xl:col-span-2">
        <CardHeader title="Bad-review vendors" />
        <ul className="space-y-2 text-sm">
          {d.badReview.map((r) => (
            <li key={r.id} className="flex justify-between">
              <span>{r.name}</span>
              <span className="font-medium text-danger">{r.ratingAvg.toFixed(1)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}