import { Link } from 'react-router-dom';
import { apiPatch } from '@/api/axios-helpers';
import { getErrorMessage } from '@/api/axios-client';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/Toast';
import { cn, formatDateTime } from '@/lib/utils';
import type { PlatformNotification } from '@/types';

function entityLink(n: PlatformNotification): string | null {
  if (!n.entityType || !n.entityId) return null;
  switch (n.entityType) {
    case 'rbo':
      return `/rbos/${n.entityId}`;
    case 'service':
      return `/listings/services/${n.entityId}`;
    case 'product':
      return `/listings/products/${n.entityId}`;
    case 'booking':
      return `/bookings/${n.entityId}`;
    case 'support':
      return `/support/${n.entityId}`;
    case 'deal_desk':
      return `/deal-desk/${n.entityId}`;
    case 'review':
      return '/reviews';
    default:
      return null;
  }
}

export function NotificationsPage() {
  const { toast } = useToast();
  const { data, error, isLoading, mutate } = useApiSWR<PlatformNotification[]>(
    ENDPOINTS.notifications,
  );

  const list = data ?? [];
  const unread = list.filter((n) => !n.read).length;

  async function markRead(id: string) {
    try {
      await apiPatch(`${ENDPOINTS.notifications}/${id}`, { read: true });
      await mutate();
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
          Notifications
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Platform events for admins. Push and email delivery ships in a later phase.
        </p>
        {unread > 0 ? (
          <p className="mt-2 text-sm text-accent">{unread} unread</p>
        ) : null}
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="Platform alerts will appear here."
        />
      ) : (
        <div className="space-y-3">
          {list.map((n) => {
            const href = entityLink(n);
            const inner = (
              <Card
                className={cn(
                  '!p-4 transition-colors',
                  !n.read && 'border-accent/30 bg-accent-muted/20',
                  href && 'hover:bg-accent-muted/10',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-text-primary">{n.title}</p>
                    <p className="mt-1 text-sm text-text-secondary">{n.body}</p>
                    <p className="mt-2 text-xs text-text-muted">
                      {formatDateTime(n.createdAt)} · {n.type}
                    </p>
                  </div>
                  {!n.read ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        void markRead(n.id);
                      }}
                    >
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
            return href ? (
              <Link key={n.id} to={href}>{inner}</Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
