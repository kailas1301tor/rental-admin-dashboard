import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import {
  ListingKindTabs,
  type ListingKindTab,
} from '@/components/listings/ListingKindTabs';
import { filterSelectClass, searchControlClass } from '@/components/ui/control-styles';
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
  products,
  services,
  rboMap,
}: {
  products: Product[];
  services: Service[];
  rboMap: Map<string, string>;
}) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | ProductStatus>('');

  const rows = useMemo<UnifiedRow[]>(() => {
    const productRows: UnifiedRow[] = products.map((p) => ({
      id: p.id,
      kind: 'product',
      name: p.name,
      rboId: p.rboId,
      status: p.status,
      pricePerDayInr: p.pricePerDayInr,
    }));
    const serviceRows: UnifiedRow[] = services.map((s) => ({
      id: s.id,
      kind: 'service',
      name: s.name,
      rboId: s.rboId,
      status: s.status,
      pricePerDayInr: s.pricePerDayInr,
    }));
    return [...productRows, ...serviceRows];
  }, [products, services]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (status && row.status !== status) return false;
      if (!query) return true;
      const vendor = rboMap.get(row.rboId)?.toLowerCase() ?? '';
      return (
        row.name.toLowerCase().includes(query) ||
        row.id.toLowerCase().includes(query) ||
        vendor.includes(query)
      );
    });
  }, [rows, q, status, rboMap]);

  if (filtered.length === 0) {
    return (
      <EmptyState
        title="No listings found"
        description="Try another filter or check product and service tabs."
      />
    );
  }

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
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search listings…"
            className={searchControlClass}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as '' | ProductStatus)}
          className={filterSelectClass}
        >
          <option value="">All statuses</option>
          <option value="pending_review">Pending review</option>
          <option value="active">Active</option>
          <option value="frozen">Frozen</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
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
            {filtered.map((row) => (
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
    </div>
  );
}

export function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const kind = parseKind(searchParams.get('kind'));

  const { data: products, error: productsError, isLoading: productsLoading, mutate } =
    useApiSWR<Product[]>(ENDPOINTS.products);
  const { data: services } = useApiSWR<Service[]>(ENDPOINTS.services);
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

  if (kind === 'all' && productsLoading && !products) {
    return <ListPageSkeleton kpiCount={3} />;
  }

  if (kind === 'all' && productsError) {
    return <ErrorState message={productsError.message} onRetry={() => void mutate()} />;
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
        <AllListingsTable
          products={products ?? []}
          services={services ?? []}
          rboMap={rboMap}
        />
      ) : null}
      {kind === 'product' ? <ProductsPage embedded /> : null}
      {kind === 'service' ? <ServicesPage embedded /> : null}
    </div>
  );
}
