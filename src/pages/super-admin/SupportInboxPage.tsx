import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { Card } from '@/components/ui/Card';
import { filterSelectClass } from '@/components/ui/control-styles';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { cn, formatDateTime } from '@/lib/utils';
import type { SupportConversation } from '@/types';

function requesterLabel(conv: SupportConversation): string {
  if (conv.participantType === 'vendor') {
    return conv.vendorName ?? 'Vendor';
  }
  return conv.customerName ?? 'Customer';
}

function participantBadge(conv: SupportConversation): string {
  return conv.participantType === 'vendor' ? 'Vendor' : 'Customer';
}

export function SupportInboxPage() {
  const [status, setStatus] = useState<'' | SupportConversation['status']>('');
  const [participantType, setParticipantType] = useState<
    '' | SupportConversation['participantType']
  >('');

  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (participantType) params.set('participantType', participantType);
  const qs = params.toString();
  const url = qs
    ? `${ENDPOINTS.supportConversations}?${qs}`
    : ENDPOINTS.supportConversations;

  const { data, error, isLoading, mutate } = useApiSWR<SupportConversation[]>(url);

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
          Support inbox
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Customer and vendor conversations with platform staff — assign and reply.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={participantType}
          onChange={(e) =>
            setParticipantType(
              e.target.value as '' | SupportConversation['participantType'],
            )
          }
          className={filterSelectClass}
        >
          <option value="">All participants</option>
          <option value="customer">Customers</option>
          <option value="vendor">Vendors</option>
        </select>
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as '' | SupportConversation['status'])
          }
          className={filterSelectClass}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="assigned">Assigned</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No conversations"
          description="Support threads from customers and vendors will appear here."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((conv) => (
            <Link key={conv.id} to={`/support/${conv.id}`}>
              <Card className="!p-4 transition-colors hover:bg-accent-muted/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-text-primary">{conv.subject}</p>
                      <span className="rounded-full border border-border bg-canvas px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                        {participantBadge(conv)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-text-muted">
                      {requesterLabel(conv)}
                      {conv.relatedBookingId
                        ? ` · ${conv.relatedBookingId.toUpperCase()}`
                        : ''}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {formatDateTime(conv.lastMessageAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusPill status={conv.status} />
                    {conv.unreadByStaff > 0 ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-white">
                        {conv.unreadByStaff} new
                      </span>
                    ) : null}
                    {conv.assignedStaffName ? (
                      <span className="text-xs text-text-muted">
                        {conv.assignedStaffName}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: SupportConversation['status'] }) {
  const tone =
    status === 'resolved' || status === 'closed'
      ? 'border-success/30 bg-success-muted text-success'
      : status === 'assigned'
        ? 'border-accent/30 bg-accent-muted text-accent'
        : 'border-warning/30 bg-warning-muted text-warning';
  return (
    <span
      className={cn(
        'rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
        tone,
      )}
    >
      {status}
    </span>
  );
}
