import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  approveListingDeal,
  listingDealsUrl,
  rejectListingDeal,
} from '@/api/deals';
import { apiFailureFieldErrors, emptyFieldErrors, requireFields } from '@/lib/form-errors';
import { CanAccess } from '@/components/auth/CanAccess';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { Table, TableShell, Td, Th } from '@/components/ui/Table';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { useApiSWR } from '@/api/swr-helpers';
import { cn, formatDateTime, formatInr } from '@/lib/utils';
import type { FieldErrors } from '@/lib/form-errors';
import type { ListingDeal, ListingDealStatus } from '@/types';

type StatusTab = 'pending_review' | 'active' | 'rejected';

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: 'pending_review', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'rejected', label: 'Rejected' },
];

function statusTone(
  status: ListingDealStatus,
): 'success' | 'danger' | 'warning' | 'accent' | 'neutral' {
  if (status === 'active') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'pending_review') return 'warning';
  return 'neutral';
}

function listingHref(deal: ListingDeal): string | null {
  if (deal.listingKind === 'product' && deal.productId) {
    return `/listings/products/${deal.productId}`;
  }
  if (deal.listingKind === 'service' && deal.serviceId) {
    return `/listings/services/${deal.serviceId}`;
  }
  if (deal.listingId) {
    return deal.listingKind === 'service'
      ? `/listings/services/${deal.listingId}`
      : `/listings/products/${deal.listingId}`;
  }
  return null;
}

function pricingLabel(deal: ListingDeal): string {
  if (deal.pricingMode === 'percent') {
    return `${deal.discountPercent}% off → ${formatInr(deal.dealPricePerDayInr)}/day`;
  }
  return `${formatInr(deal.dealPricePerDayInr)}/day (was ${formatInr(deal.originalPricePerDayInr)})`;
}

function windowLabel(deal: ListingDeal): string {
  const start = deal.startsAt ? formatDateTime(deal.startsAt) : '—';
  const end = deal.endsAt ? formatDateTime(deal.endsAt) : 'Open';
  return `${start} → ${end}`;
}

export function ListingDealsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<StatusTab>('pending_review');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ListingDeal | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyFieldErrors());

  const { data, error, isLoading, mutate } = useApiSWR<ListingDeal[]>(
    listingDealsUrl(tab),
  );

  const rows = data ?? [];

  async function handleApprove(deal: ListingDeal) {
    setBusyId(deal.id);
    try {
      await approveListingDeal(deal.id);
      await mutate();
      toast('Deal approved', 'success');
    } catch (err) {
      const failure = apiFailureFieldErrors(err);
      toast(failure.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  function openReject(deal: ListingDeal) {
    setRejectTarget(deal);
    setRejectionReason('');
    setFieldErrors(emptyFieldErrors());
  }

  function closeReject() {
    setRejectTarget(null);
    setRejectionReason('');
    setFieldErrors(emptyFieldErrors());
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    const { fieldErrors: next, message } = requireFields(
      { rejectionReason },
      [{ field: 'rejectionReason', label: 'Rejection reason' }],
    );
    if (message) {
      setFieldErrors(next);
      toast(message, 'error');
      return;
    }
    setBusyId(rejectTarget.id);
    try {
      await rejectListingDeal(rejectTarget.id, rejectionReason.trim());
      await mutate();
      toast('Deal rejected', 'success');
      closeReject();
    } catch (err) {
      const failure = apiFailureFieldErrors(err);
      setFieldErrors(failure.fieldErrors);
      toast(failure.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading && !data) return <ListPageSkeleton showKpis={false} />;
  if (error) {
    return (
      <ErrorState message={error.message} onRetry={() => void mutate()} />
    );
  }

  return (
    <div>
      <PageHeader
        title="Listing Deals"
        description="Review promotional deals submitted by RBOs before they go live."
      />

      <Card className="mb-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((item) => (
            <Button
              key={item.value}
              size="sm"
              variant={tab === item.value ? 'primary' : 'outline'}
              onClick={() => setTab(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="No deals in this queue"
          description={
            tab === 'pending_review'
              ? 'New deal submissions from vendors will appear here.'
              : 'Nothing matched this status filter.'
          }
        />
      ) : (
        <TableShell>
          <Table>
            <thead>
              <tr>
                <Th>Listing</Th>
                <Th>Deal</Th>
                <Th>RBO</Th>
                <Th>Pricing</Th>
                <Th>Window</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((deal) => {
                const href = listingHref(deal);
                return (
                  <tr key={deal.id}>
                    <Td>
                      <div className="flex min-w-[12rem] items-center gap-3 whitespace-normal">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-canvas">
                          {deal.listingImage ? (
                            <img
                              src={deal.listingImage}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          {href ? (
                            <Link
                              to={href}
                              className="font-medium text-text-primary hover:text-accent"
                            >
                              {deal.listingName || 'Listing'}
                            </Link>
                          ) : (
                            <p className="font-medium text-text-primary">
                              {deal.listingName || 'Listing'}
                            </p>
                          )}
                          <p className="text-xs capitalize text-text-muted">
                            {deal.listingKind}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="max-w-[14rem] whitespace-normal">
                        <p className="font-medium text-text-primary">
                          {deal.title}
                        </p>
                        {deal.terms ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">
                            {deal.terms}
                          </p>
                        ) : null}
                      </div>
                    </Td>
                    <Td>
                      <Link
                        to={`/rbos/${deal.rboId}`}
                        className="text-text-primary hover:text-accent"
                      >
                        {deal.rboName || deal.rboId}
                      </Link>
                    </Td>
                    <Td>
                      <span className="whitespace-normal text-sm">
                        {pricingLabel(deal)}
                      </span>
                    </Td>
                    <Td>
                      <span className="whitespace-normal text-xs text-text-secondary">
                        {windowLabel(deal)}
                      </span>
                    </Td>
                    <Td>
                      <Badge tone={statusTone(deal.status)}>
                        {deal.status.replace('_', ' ')}
                      </Badge>
                      {deal.status === 'rejected' && deal.rejectionReason ? (
                        <p className="mt-1 max-w-[10rem] whitespace-normal text-xs text-danger">
                          {deal.rejectionReason}
                        </p>
                      ) : null}
                    </Td>
                    <Td className="text-right">
                      {deal.status === 'pending_review' ? (
                        <CanAccess permission="change_listingdeal">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              isLoading={busyId === deal.id}
                              onClick={() => void handleApprove(deal)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={busyId === deal.id}
                              onClick={() => openReject(deal)}
                            >
                              Reject
                            </Button>
                          </div>
                        </CanAccess>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableShell>
      )}

      <Modal
        open={Boolean(rejectTarget)}
        title="Reject listing deal"
        description="Tell the vendor why this deal was rejected."
        onClose={closeReject}
        footer={
          <>
            <Button variant="outline" onClick={closeReject}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={busyId === rejectTarget?.id}
              onClick={() => void confirmReject()}
            >
              Confirm reject
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {rejectTarget ? (
            <p className={cn('text-sm text-text-secondary')}>
              Rejecting <span className="font-medium text-text-primary">{rejectTarget.title}</span>
              {' '}
              on {rejectTarget.listingName}.
            </p>
          ) : null}
          <Textarea
            name="rejectionReason"
            label="Rejection reason"
            value={rejectionReason}
            onChange={(e) => {
              setRejectionReason(e.target.value);
              if (fieldErrors.rejectionReason) {
                setFieldErrors(emptyFieldErrors());
              }
            }}
            error={fieldErrors.rejectionReason}
            placeholder="Shown to the vendor"
            rows={4}
          />
        </div>
      </Modal>
    </div>
  );
}
