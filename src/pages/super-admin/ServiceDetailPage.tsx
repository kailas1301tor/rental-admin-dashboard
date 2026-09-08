import { ArrowLeft, CheckCircle2, Snowflake } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { apiPatch } from '@/api/axios-helpers';
import { getErrorMessage } from '@/api/axios-client';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { CanAccess } from '@/components/auth/CanAccess';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/States';
import { DetailPageSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/Toast';
import { formatInr } from '@/lib/utils';
import type { ProductStatus, ServiceDetail } from '@/types';

export function ServiceDetailPage() {
  const { id = '' } = useParams();
  const { toast } = useToast();
  const { data, error, isLoading, mutate } = useApiSWR<ServiceDetail>(
    id ? `${ENDPOINTS.services}/${id}` : null,
  );

  async function setStatus(status: ProductStatus, rejectionReason?: string) {
    try {
      await apiPatch(`${ENDPOINTS.services}/${id}`, { status, rejectionReason });
      await mutate();
      toast(`Service ${status.replace('_', ' ')}`, 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  async function rejectService() {
    const reason = window.prompt('Rejection reason for vendor:');
    if (!reason?.trim()) return;
    await setStatus('rejected', reason.trim());
  }

  if (isLoading && !data) return <DetailPageSkeleton />;
  if (error || !data) {
    return (
      <ErrorState
        message={error?.message ?? 'Service not found'}
        onRetry={() => void mutate()}
      />
    );
  }

  const { service, rbo, category } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/listings?kind=service"
            className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to listings
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-text-primary">
            {service.name}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {category.name} ·{' '}
            <Link to={`/rbos/${rbo.id}`} className="text-accent hover:underline">
              {rbo.businessName}
            </Link>
          </p>
        </div>
        <CanAccess permission="change_product">
          <div className="flex flex-wrap gap-2">
            {service.status === 'pending_review' ? (
              <>
                <Button size="sm" onClick={() => void setStatus('active')}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => void rejectService()}>
                  Reject
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void setStatus(service.status === 'frozen' ? 'active' : 'frozen')
                }
              >
                <Snowflake className="h-4 w-4" aria-hidden />
                {service.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
              </Button>
            )}
          </div>
        </CanAccess>
      </div>

      {service.status === 'pending_review' ? (
        <div className="rounded-xl border border-warning/40 bg-warning-muted px-4 py-3 text-sm text-warning">
          This service is awaiting platform approval.
        </div>
      ) : null}

      {service.rejectionReason ? (
        <div className="rounded-xl border border-danger/40 bg-danger-muted px-4 py-3 text-sm text-danger">
          <span className="font-medium">Rejection reason:</span> {service.rejectionReason}
        </div>
      ) : null}

      <Card className="!p-5">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            {service.images[0] ? (
              <img
                src={service.images[0]}
                alt=""
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            ) : null}
          </div>
          <div className="space-y-4 text-sm">
            <p className="text-text-secondary">{service.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Rate / day" value={formatInr(service.pricePerDayInr)} />
              <Stat label="Deposit" value={formatInr(service.depositInr)} />
              <Stat label="Bookings" value={String(service.bookingCount)} />
              <Stat label="Rating" value={service.ratingAvg.toFixed(1)} />
            </div>
            {service.isHighValue ? (
              <p className="rounded-lg border border-warning/30 bg-warning-muted px-3 py-2 text-warning">
                High-value service — customer inquiries route through Deal Desk.
              </p>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-canvas px-3 py-2">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 font-medium text-text-primary">{value}</p>
    </div>
  );
}
