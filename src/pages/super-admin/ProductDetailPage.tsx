import { useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  Lock,
  MoreHorizontal,
  Package,
  Pencil,
  Snowflake,
  Star,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { apiPatch } from '@/api/axios-helpers';
import { getErrorMessage } from '@/api/axios-client';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { CanAccess } from '@/components/auth/CanAccess';
import { BookingMobileCard } from '@/components/ui/BookingMobileCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  EmptyState,
  ErrorState,
} from '@/components/ui/States';
import { DetailPageSkeleton } from '@/components/ui/skeletons';
import { Table, TableShell, Td, Th } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { categoryPathLabel } from '@/lib/category-helpers';
import { BOOKING_VALUE_LABEL } from '@/lib/metrics';
import { cn, formatDateTime, formatInr } from '@/lib/utils';
import type {
  BookingSummary,
  Category,
  ProductDetail,
  ProductStatus,
  Review,
  RboActivityEvent,
} from '@/types';

type Tab = 'overview' | 'bookings' | 'reviews' | 'activity';

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function ProductDetailPage() {
  const { id = '' } = useParams();
  const { toast } = useToast();
  const [activeImage, setActiveImage] = useState(0);
  const [tab, setTab] = useState<Tab>('overview');
  const { data, error, isLoading, mutate } = useApiSWR<ProductDetail>(
    id ? `${ENDPOINTS.products}/${id}` : null,
  );
  const { data: categories } = useApiSWR<Category[]>(ENDPOINTS.categories);

  const catList = categories ?? [];

  async function setStatus(
    status: ProductStatus,
    rejectionReason?: string,
  ) {
    try {
      await apiPatch(`${ENDPOINTS.products}/${id}`, {
        status,
        rejectionReason,
      });
      await mutate();
      toast(`Product ${status.replace('_', ' ')}`, 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  async function rejectListing() {
    const reason = window.prompt('Rejection reason for vendor:');
    if (!reason?.trim()) return;
    await setStatus('rejected', reason.trim());
  }

  if (isLoading && !data) return <DetailPageSkeleton />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }
  if (!data) return <EmptyState title="Product not found" />;

  const {
    product,
    rbo,
    reviews,
    bookings,
    createdAt,
    updatedAt,
    insuranceCovered,
    tags,
    activity,
    metrics,
  } = data;
  const categoryLabel = categoryPathLabel(catList, product.categoryId);
  const images = product.images.length ? product.images : [''];
  const thumbLimit = 4;
  const extraThumbs = Math.max(0, images.length - thumbLimit);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'bookings', label: `Bookings (${bookings.length})` },
    { id: 'reviews', label: `Reviews (${reviews.length})` },
    { id: 'activity', label: 'Activity Log' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav className="text-sm text-text-muted">
          <Link to="/listings?kind=product" className="hover:text-accent">
            Products
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-text-primary">{product.name}</span>
        </nav>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/listings?kind=product"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-text-secondary hover:border-accent hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to listings
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast('More actions available in upcoming release', 'info')
            }
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
            More actions
          </Button>
          <CanAccess permission="change_product">
            {product.status === 'pending_review' ? (
              <>
                <Button size="sm" onClick={() => void setStatus('active')}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Approve listing
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-danger/50 text-danger hover:bg-danger-muted"
                  onClick={() => void rejectListing()}
                >
                  Reject
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void setStatus(
                      product.status === 'frozen' ? 'active' : 'frozen',
                    )
                  }
                >
                  <Snowflake className="h-4 w-4" aria-hidden />
                  {product.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                </Button>
              </>
            )}
          </CanAccess>
        </div>
      </div>

      {product.status === 'pending_review' ? (
        <div className="rounded-xl border border-warning/40 bg-warning-muted px-4 py-3 text-sm text-warning">
          This listing was submitted by a vendor and is awaiting your review.
        </div>
      ) : null}

      {product.rejectionReason ? (
        <div className="rounded-xl border border-danger/40 bg-danger-muted px-4 py-3 text-sm text-danger">
          <span className="font-medium">Rejection reason:</span>{' '}
          {product.rejectionReason}
        </div>
      ) : null}

      <Card className="!p-4 sm:!p-5">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-canvas">
              {images[activeImage] ? (
                <img
                  src={images[activeImage]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.slice(0, thumbLimit).map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border',
                    i === activeImage ? 'border-accent' : 'border-border',
                  )}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  {i === thumbLimit - 1 && extraThumbs > 0 ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xs font-semibold text-white">
                      +{extraThumbs}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            {product.minimumDays != null ? (
              <div className="mt-4 rounded-xl border border-border bg-canvas px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Minimum rental
                </p>
                <p className="mt-1 text-sm font-medium text-text-primary">
                  {product.minimumDays} day{product.minimumDays === 1 ? '' : 's'}
                </p>
              </div>
            ) : null}
            {product.videoUrl ? (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
                  Walkthrough
                </p>
                <video
                  controls
                  className="w-full rounded-xl border border-border"
                  src={product.videoUrl}
                />
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-7">
            <StatusPill status={product.status} />
            <h1 className="mt-2 text-2xl font-semibold text-text-primary sm:text-3xl">
              {product.name}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              <Link
                to={`/rbos/${rbo.id}`}
                className="font-medium text-accent hover:underline"
              >
                {rbo.businessName}
              </Link>
              <span className="mx-1.5 text-text-muted">·</span>
              {categoryLabel}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <MetaPill label={`RBO ID: ${rbo.id.toUpperCase()}`} />
              <MetaPill
                label={`Added on: ${formatDateTime(createdAt).split(',')[0] ?? '—'}`}
              />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              {product.description}
            </p>
            <ul className="mt-5 space-y-2.5">
              <QuickStat
                label="Price / day"
                value={formatInr(product.pricePerDayInr)}
              />
              <QuickStat
                label="Deposit"
                value={formatInr(product.depositInr)}
              />
              <li className="flex items-center justify-between gap-3 text-sm">
                <span className="text-text-muted">Rating</span>
                <span className="flex items-center gap-1.5 font-medium text-text-primary">
                  {product.ratingAvg.toFixed(1)}
                  <Stars value={product.ratingAvg} />
                  <span className="text-text-muted">
                    ({product.reviewCount})
                  </span>
                </span>
              </li>
              <QuickStat
                label="Total bookings"
                value={String(product.bookingCount)}
              />
              <li className="flex items-center justify-between gap-3 text-sm">
                <span className="text-text-muted">Status</span>
                <StatusPill status={product.status} />
              </li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total bookings"
          value={product.bookingCount.toLocaleString('en-IN')}
          hint={`↑ ${metrics.bookingsDeltaPct.toFixed(1)}%`}
          good
        />
        <MetricCard
          label={BOOKING_VALUE_LABEL}
          value={formatInr(metrics.revenueInr)}
          hint={`↑ ${metrics.revenueDeltaPct.toFixed(1)}%`}
          good
        />
        <MetricCard
          label="Avg. rating"
          value={product.ratingAvg.toFixed(1)}
          hint="Across all bookings"
        />
        <MetricCard
          label="Availability"
          value={product.status === 'active' ? 'Available' : product.status}
          hint={
            product.status === 'active'
              ? 'Listed and rentable'
              : 'Not currently rentable'
          }
          good={product.status === 'active'}
        />
      </div>

      <div role="tablist" className="mobile-scroll-x border-b border-border">
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={cn(
                'relative min-h-11 shrink-0 px-4 text-sm font-medium transition-colors',
                active
                  ? 'text-accent'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {item.label}
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent" />
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === 'overview' ? (
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-text-primary">
              Product information
            </h2>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <InfoRow label="Category" value={categoryLabel} />
              <InfoRow
                label="RBO"
                value={
                  <Link
                    to={`/rbos/${rbo.id}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {rbo.businessName}
                  </Link>
                }
              />
              <InfoRow
                label="Price / day"
                value={formatInr(product.pricePerDayInr)}
              />
              <InfoRow label="Deposit" value={formatInr(product.depositInr)} />
              <InfoRow label="Stock" value="1 unit" />
              <InfoRow
                label="Status"
                value={<StatusPill status={product.status} />}
              />
              <InfoRow
                label="Added on"
                value={formatDateTime(createdAt)}
              />
              <InfoRow
                label="Last updated"
                value={formatDateTime(updatedAt)}
              />
              <InfoRow label="Product ID" value={product.id.toUpperCase()} />
              <InfoRow
                label="Insurance"
                value={
                  insuranceCovered ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-success">
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                      Covered
                    </span>
                  ) : (
                    'Not covered'
                  )
                }
              />
              <div className="sm:col-span-2">
                <dt className="text-text-muted">Tags</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border bg-canvas px-2.5 py-0.5 text-[11px] font-medium text-text-secondary"
                    >
                      {t}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <PanelHeader
                title="Bookings"
                actionLabel="View all bookings"
                onAction={() => setTab('bookings')}
              />
              <BookingsTable bookings={bookings.slice(0, 4)} compact />
            </Card>
            <Card>
              <PanelHeader
                title="Reviews"
                actionLabel="View all reviews"
                onAction={() => setTab('reviews')}
              />
              <ReviewsList reviews={reviews.slice(0, 2)} />
            </Card>
          </div>

          <Card>
            <PanelHeader
              title="Activity log"
              actionLabel="View full log"
              onAction={() => setTab('activity')}
            />
            <ActivityList events={activity.slice(0, 4)} />
          </Card>
        </div>
      ) : null}

      {tab === 'bookings' ? (
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            All bookings
          </h2>
          <BookingsTable bookings={bookings} />
        </Card>
      ) : null}

      {tab === 'reviews' ? (
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            All reviews
          </h2>
          <ReviewsList reviews={reviews} />
        </Card>
      ) : null}

      {tab === 'activity' ? (
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            Full activity log
          </h2>
          <ActivityList events={activity} />
        </Card>
      ) : null}
    </div>
  );
}

function BookingsTable({
  bookings,
  compact,
}: {
  bookings: BookingSummary[];
  compact?: boolean;
}) {
  if (bookings.length === 0) return <EmptyState title="No bookings" />;
  return (
    <>
      <div className="space-y-3 lg:hidden">
        {bookings.map((b) => (
          <BookingMobileCard
            key={b.id}
            booking={b}
            showCustomer
            showRbo={false}
          />
        ))}
      </div>

      <TableShell className="hidden lg:block">
      <Table>
        <thead>
          <tr>
            <Th>Customer</Th>
            <Th>Status</Th>
            <Th>Amount</Th>
            <Th>Window</Th>
            {!compact ? <Th className="text-right"> </Th> : null}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <Td>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-[11px] font-semibold text-accent">
                    {initials(b.customerName)}
                  </span>
                  <span className="font-medium">{b.customerName}</span>
                </div>
              </Td>
              <Td>
                <BookingStatus status={b.status} />
              </Td>
              <Td className="tabular-nums">{formatInr(b.amountInr)}</Td>
              <Td className="text-xs text-text-secondary">
                {formatDateTime(b.startAt)} → {formatDateTime(b.endAt)}
              </Td>
              {!compact ? (
                <Td>
                  <div className="flex justify-end">
                    <MoreHorizontal className="h-4 w-4 text-text-muted" aria-hidden />
                  </div>
                </Td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </Table>
    </TableShell>
    </>
  );
}

function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return <EmptyState title="No reviews yet" />;
  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-xl border border-border px-3 py-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas text-xs font-semibold text-text-secondary">
              {initials(r.author)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-text-primary">
                  {r.author}
                </p>
                <span className="rounded-full border border-success/30 bg-success-muted px-2 py-0.5 text-[10px] font-medium text-success">
                  Verified
                </span>
                <span className="text-[11px] text-text-muted">
                  {formatDateTime(r.createdAt)}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-sm font-semibold tabular-nums">
                  {r.rating.toFixed(1)}
                </span>
                <Stars value={r.rating} />
              </div>
              <p className="mt-1.5 text-sm text-text-secondary">{r.body}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ActivityList({ events }: { events: RboActivityEvent[] }) {
  if (events.length === 0) return <EmptyState title="No activity yet" />;
  return (
    <ul className="space-y-2.5">
      {events.map((e) => (
        <li
          key={e.id}
          className="flex flex-col gap-2 rounded-xl border border-border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                e.tone === 'success' && 'bg-success-muted text-success',
                e.tone === 'warning' && 'bg-warning-muted text-warning',
                e.tone === 'danger' && 'bg-danger-muted text-danger',
                e.tone === 'accent' && 'bg-accent-muted text-accent',
              )}
            >
              {e.tone === 'success' ? (
                <Package className="h-4 w-4" aria-hidden />
              ) : e.tone === 'warning' ? (
                <ImageIcon className="h-4 w-4" aria-hidden />
              ) : e.title.toLowerCase().includes('lock') ||
                e.title.toLowerCase().includes('freeze') ? (
                <Lock className="h-4 w-4" aria-hidden />
              ) : (
                <Pencil className="h-4 w-4" aria-hidden />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{e.title}</p>
              <p className="text-xs text-text-secondary">{e.detail}</p>
              <p className="mt-0.5 text-[11px] text-text-muted">By {e.actor}</p>
            </div>
          </div>
          <p className="shrink-0 text-xs text-text-muted sm:text-right">
            {formatDateTime(e.occurredAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function MetricCard({
  label,
  value,
  hint,
  good,
}: {
  label: string;
  value: string;
  hint: string;
  good?: boolean;
}) {
  return (
    <Card className="!p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
        {value}
      </p>
      <p
        className={cn(
          'mt-1 text-xs font-medium',
          good === true
            ? 'text-success'
            : good === false
              ? 'text-danger'
              : 'text-text-secondary',
        )}
      >
        {hint}
      </p>
    </Card>
  );
}

function PanelHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      <button
        type="button"
        onClick={onAction}
        className="text-xs font-medium text-accent hover:underline"
      >
        {actionLabel} →
      </button>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-2 last:border-0">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-right font-medium text-text-primary">{value}</dd>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </li>
  );
}

function MetaPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border bg-canvas px-2.5 py-0.5 text-[11px] font-medium text-text-secondary">
      {label}
    </span>
  );
}

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i < full ? 'fill-accent text-accent' : 'text-border-strong',
          )}
        />
      ))}
    </span>
  );
}

function StatusPill({ status }: { status: ProductStatus }) {
  const tone =
    status === 'active'
      ? 'border-success/30 bg-success-muted text-success'
      : status === 'pending_review'
        ? 'border-warning/30 bg-warning-muted text-warning'
        : status === 'frozen'
          ? 'border-warning/30 bg-warning-muted text-warning'
          : status === 'rejected'
            ? 'border-danger/30 bg-danger-muted text-danger'
            : 'border-border bg-canvas text-text-secondary';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        tone,
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function BookingStatus({ status }: { status: BookingSummary['status'] }) {
  const tone =
    status === 'completed'
      ? 'border-success/30 bg-success-muted text-success'
      : status === 'cancelled' || status === 'rejected'
        ? 'border-danger/30 bg-danger-muted text-danger'
        : 'border-accent/30 bg-accent-muted text-accent';
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        tone,
      )}
    >
      {status}
    </span>
  );
}
