import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { filterSelectClass, searchControlClass } from '@/components/ui/control-styles';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { NavigableListCard } from '@/components/ui/NavigableListCard';
import { cn, formatInr } from '@/lib/utils';
import type { ProductStatus, RboVendor, Service } from '@/types';

export function ServicesPage({ embedded = false }: { embedded?: boolean }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | ProductStatus>('');

  const { data, error, isLoading, mutate } = useApiSWR<Service[]>(ENDPOINTS.services);
  const { data: rbos } = useApiSWR<RboVendor[]>(ENDPOINTS.rbos);

  const rboMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rbos ?? []) m.set(r.id, r.businessName);
    return m;
  }, [rbos]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (data ?? []).filter((s) => {
      if (status && s.status !== status) return false;
      if (!query) return true;
      const vendor = rboMap.get(s.rboId)?.toLowerCase() ?? '';
      return (
        s.name.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query) ||
        vendor.includes(query)
      );
    });
  }, [data, q, status, rboMap]);

  if (isLoading && !data) return <ListPageSkeleton kpiCount={3} />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Services
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Review and approve rental services submitted by vendors.
          </p>
        </div>
      ) : null}

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
            placeholder="Search services…"
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

      {filtered.length === 0 ? (
        <EmptyState
          title="No services found"
          description="Adjust filters or wait for vendor submissions."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((service) => (
            <NavigableListCard
              key={service.id}
              to={`/listings/services/${service.id}`}
              label={`View ${service.name}`}
              summary={
                <div className="flex items-start gap-3">
                  <img
                    src={service.images[0]}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary">{service.name}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {service.id.toUpperCase()}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {rboMap.get(service.rboId) ?? service.rboId}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusPill status={service.status} />
                      {service.isHighValue ? (
                        <span className="rounded-full border border-warning/40 bg-warning-muted px-2 py-0.5 text-xs text-warning">
                          High value
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-medium tabular-nums">
                      {formatInr(service.pricePerDayInr)}
                      <span className="font-normal text-text-muted"> / day</span>
                    </p>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: ProductStatus }) {
  const tone =
    status === 'active'
      ? 'border-success/30 bg-success-muted text-success'
      : status === 'rejected'
        ? 'border-danger/30 bg-danger-muted text-danger'
        : status === 'frozen'
          ? 'border-border bg-canvas text-text-secondary'
          : 'border-warning/30 bg-warning-muted text-warning';
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
        tone,
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
