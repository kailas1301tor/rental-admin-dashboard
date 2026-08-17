import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { Card } from '@/components/ui/Card';
import { filterSelectClass } from '@/components/ui/control-styles';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { cn, formatDateTime } from '@/lib/utils';
import type { DealDeskInquiry } from '@/types';

export function DealDeskPage() {
  const [status, setStatus] = useState<'' | DealDeskInquiry['status']>('');

  const url = status
    ? `${ENDPOINTS.dealDeskInquiries}?status=${status}`
    : ENDPOINTS.dealDeskInquiries;

  const { data, error, isLoading, mutate } = useApiSWR<DealDeskInquiry[]>(url);

  const sorted = useMemo(
    () =>
      [...(data ?? [])].sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
      ),
    [data],
  );

  if (isLoading && !data) return <ListPageSkeleton kpiCount={2} />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Deal Desk
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Broker-mediated inquiries for high-value listings. No direct customer↔vendor chat.
        </p>
      </div>

      <select
        value={status}
        onChange={(e) =>
          setStatus(e.target.value as '' | DealDeskInquiry['status'])
        }
        className={filterSelectClass}
      >
        <option value="">All statuses</option>
        <option value="open">Open</option>
        <option value="broker_active">Broker active</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>

      {sorted.length === 0 ? (
        <EmptyState
          title="No inquiries"
          description="High-value listing inquiries appear here."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((inq) => (
            <Link key={inq.id} to={`/deal-desk/${inq.id}`}>
              <Card className="!p-4 transition-colors hover:bg-accent-muted/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-text-primary">{inq.subject}</p>
                    <p className="mt-1 text-sm text-text-muted">
                      {inq.listingName} · {inq.rboName}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {inq.customerMaskedLabel} · {formatDateTime(inq.lastMessageAt)}
                    </p>
                  </div>
                  <StatusPill status={inq.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: DealDeskInquiry['status'] }) {
  const tone =
    status === 'resolved' || status === 'closed'
      ? 'border-success/30 bg-success-muted text-success'
      : status === 'broker_active'
        ? 'border-accent/30 bg-accent-muted text-accent'
        : 'border-warning/30 bg-warning-muted text-warning';
  return (
    <span
      className={cn(
        'rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
        tone,
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
