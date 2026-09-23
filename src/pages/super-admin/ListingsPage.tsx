import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { Search } from 'lucide-react';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR, usePaginatedApiSWR } from '@/api/swr-helpers';
import { Button } from '@/components/ui/Button';
import {
  ListingKindTabs,
  type ListingKindTab,
} from '@/components/listings/ListingKindTabs';
import { selectControlClass, filterSelectClass, searchControlClass } from '@/components/ui/control-styles';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { cn, formatInr } from '@/lib/utils';
import { ProductsPage } from '@/pages/super-admin/ProductsPage';
import { ServicesPage } from '@/pages/super-admin/ServicesPage';
import type { Product, ProductStatus, RboVendor, Service } from '@/types';

type UnifiedRow = {
  id: string;
  kind: 'product' | 'service';
  name: string;
  rboId: string;
  status: ProductStatus;
  pricePerDayInr: number;
};

function parseKind(value: string | null): ListingKindTab {
  if (value === 'product' || value === 'service') return value;
  return 'all';
}

function AllListingsTable({
  rboMap,
}: {
  rboMap: Map<string, string>;
}) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | ProductStatus>('');
  const [page, setPage] = useState(1);
  const [debouncedQ] = useDebounce(q, 300);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedQ) params.set('search', debouncedQ);
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('page_size', '10');
    return params;
  }, [debouncedQ, status, page]);

  const { data, error, isLoading } = usePaginatedApiSWR<{ data: UnifiedRow[]; total_count: number; total_pages: number }>(
    `${ENDPOINTS.listings}?${searchParams.toString()}`
  );

  const rows = data?.data ?? [];
  const totalCount = data?.total_count ?? 0;
  const totalPages = data?.total_pages ?? 1;

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * 10 + 1;
  const rangeEnd = Math.min(page * 10, totalCount);

  if (isLoading && !data) return <ListPageSkeleton kpiCount={3} />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search listings…"
            className={searchControlClass}
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as '' | ProductStatus);
            setPage(1);
          }}
          className={selectControlClass}
        >
          <option value="">All statuses</option>
          <option value="pending_review">Pending review</option>
          <option value="active">Active</option>
          <option value="frozen">Frozen</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No listings found"
          description="Try another filter or check product and service tabs."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-canvas/50 text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Listing</th>
              <th className="px-4 py-3 font-medium">RBO</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Price / day</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.kind}-${row.id}`} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
                      row.kind === 'product'
                        ? 'bg-accent-muted text-accent'
                        : 'bg-canvas text-text-secondary',
                    )}
                  >
                    {row.kind}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/listings/${row.kind}s/${row.id}`}
                    className="font-medium text-text-primary hover:text-accent"
                  >
                    {row.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {rboMap.get(row.rboId) ?? row.rboId}
                </td>
                <td className="px-4 py-3 capitalize text-text-secondary">
                  {row.status.replace('_', ' ')}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-primary">
                  {formatInr(row.pricePerDayInr)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          Showing {rangeStart} to {rangeEnd} of {totalCount} listings
        </p>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
        </>
      )}
    </div>
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

export function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const kind = parseKind(searchParams.get('kind'));

  const { data: rbos } = useApiSWR<RboVendor[]>(ENDPOINTS.rbos);

  const rboMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rbos ?? []) m.set(r.id, r.businessName);
    return m;
  }, [rbos]);

  function setKind(next: ListingKindTab) {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') {
      params.delete('kind');
    } else {
      params.set('kind', next);
    }
    setSearchParams(params, { replace: true });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Listings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Products and services offered by vendors — one place to review and manage.
        </p>
      </div>

      <ListingKindTabs value={kind} onChange={setKind} />

      {kind === 'all' ? (
        <AllListingsTable rboMap={rboMap} />
      ) : null}
      {kind === 'product' ? <ProductsPage embedded /> : null}
      {kind === 'service' ? <ServicesPage embedded /> : null}
    </div>
  );
}
