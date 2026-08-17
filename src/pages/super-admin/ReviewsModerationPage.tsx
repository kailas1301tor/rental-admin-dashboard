import { useState } from 'react';
import { apiPatch } from '@/api/axios-helpers';
import { getErrorMessage } from '@/api/axios-client';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { filterSelectClass } from '@/components/ui/control-styles';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import type { ModerationReview } from '@/types';

export function ReviewsModerationPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<'' | ModerationReview['status']>(
    'pending_moderation',
  );

  const url = status
    ? `${ENDPOINTS.reviewsModeration}?status=${status}`
    : ENDPOINTS.reviewsModeration;

  const { data, error, isLoading, mutate } = useApiSWR<ModerationReview[]>(url);

  const list = data ?? [];

  async function moderate(
    id: string,
    patch: Partial<ModerationReview>,
    label: string,
  ) {
    try {
      await apiPatch(`${ENDPOINTS.reviewsModeration}/${id}`, patch);
      await mutate();
      toast(label, 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  if (isLoading && !data) return <ListPageSkeleton kpiCount={2} />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Review moderation
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Approve or hide reviews before they appear publicly.
        </p>
      </div>

      <select
        value={status}
        onChange={(e) =>
          setStatus(e.target.value as '' | ModerationReview['status'])
        }
        className={filterSelectClass}
      >
        <option value="pending_moderation">Pending moderation</option>
        <option value="visible">Visible</option>
        <option value="hidden">Hidden</option>
        <option value="frozen">Frozen</option>
        <option value="">All</option>
      </select>

      {list.length === 0 ? (
        <EmptyState
          title="No reviews in this queue"
          description="New customer and vendor reviews will appear here."
        />
      ) : (
        <div className="space-y-3">
          {list.map((review) => (
            <Card key={review.id} className="!p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-text-primary">{review.author}</p>
                    <span className="text-sm text-warning">
                      {'★'.repeat(review.rating)}
                    </span>
                    <StatusPill status={review.status} />
                    {review.reported ? (
                      <span className="text-xs text-danger">Reported</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-text-muted">
                    {review.listingName} · {review.rboName} · {review.direction}
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">{review.body}</p>
                  {review.usefulCount > 0 ? (
                    <p className="mt-1 text-xs text-text-muted">
                      {review.usefulCount} marked useful
                    </p>
                  ) : null}
                </div>
                <PermissionGate module="reviews_moderation" level="manage">
                  <div className="flex flex-wrap gap-2">
                    {review.status === 'pending_moderation' ? (
                      <Button
                        size="sm"
                        onClick={() =>
                          void moderate(review.id, { status: 'visible' }, 'Review approved')
                        }
                      >
                        Approve
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void moderate(review.id, { status: 'hidden' }, 'Review hidden')
                      }
                    >
                      Hide
                    </Button>
                  </div>
                </PermissionGate>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: ModerationReview['status'] }) {
  const tone =
    status === 'visible'
      ? 'border-success/30 bg-success-muted text-success'
      : status === 'pending_moderation'
        ? 'border-warning/30 bg-warning-muted text-warning'
        : 'border-border bg-canvas text-text-secondary';
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
