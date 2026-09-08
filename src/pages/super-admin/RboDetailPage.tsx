import { useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Clock3,
  FileText,
  Lock,
  MoreHorizontal,
  Package,
  Percent,
  Star,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { apiPatch } from '@/api/axios-helpers';
import { getErrorMessage } from '@/api/axios-client';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import {
  EmptyState,
  ErrorState,
} from '@/components/ui/States';
import { DetailPageSkeleton } from '@/components/ui/skeletons';
import { Table, TableShell, Td, Th } from '@/components/ui/Table';
import {
  ClickableTableRow,
  ClickableTd,
  TableActionsCell,
} from '@/components/ui/clickable-row';
import { useToast } from '@/components/ui/Toast';
import { RboDetailProductMobileCard } from '@/pages/super-admin/rbos/RboDetailProductMobileCard';
import { RboDetailReviewMobileCard } from '@/pages/super-admin/rbos/RboDetailReviewMobileCard';
import { RboDetailStaffMobileCard } from '@/pages/super-admin/rbos/RboDetailStaffMobileCard';
import { kycTypeLabel } from '@/mocks/kyc-documents';
import { BOOKING_VALUE_LABEL } from '@/lib/metrics';
import { categoryPathLabel } from '@/lib/category-helpers';
import { cn, formatDateTime, formatInr } from '@/lib/utils';
import type {
  Category,
  KycDocument,
  Product,
  Review,
  RboActivityEvent,
  RboDetail,
  RboStaff,
  RboStatus,
} from '@/types';

type Tab = 'overview' | 'products' | 'staff' | 'reviews' | 'activity';

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error('ErrorBoundary caught error', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return <div className="p-10 text-red-500 bg-red-100 rounded-lg"><h2>RboDetailPage CRASHED</h2><pre className="mt-4">{this.state.error?.stack}</pre></div>;
    }
    return this.props.children;
  }
}

export function RboDetailPage() {
  return <ErrorBoundary><RboDetailPageInner /></ErrorBoundary>;
}

function RboDetailPageInner() {
  const { id = '' } = useParams();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const { data, error, isLoading, mutate } = useApiSWR<RboDetail>(
    id ? `${ENDPOINTS.rbos}/${id}` : null,
  );
  const { data: categories } = useApiSWR<Category[]>(ENDPOINTS.categories);

  const catList = categories ?? [];

  async function patchVendor(status: string) {
    try {
      await apiPatch(`${ENDPOINTS.rbos}/${id}`, { status });
      await mutate();
      toast(`Vendor marked ${status}`, 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  async function patchProduct(productId: string, status: string) {
    try {
      await apiPatch(`${ENDPOINTS.rbos}/${id}/products/${productId}`, {
        status,
      });
      await mutate();
      toast('Product updated', 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  async function patchStaff(staffId: string, status: string) {
    try {
      await apiPatch(`${ENDPOINTS.rbos}/${id}/staff/${staffId}`, { status });
      await mutate();
      toast('RBO staff updated', 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  async function patchReview(reviewId: string, status: string) {
    try {
      await apiPatch(`${ENDPOINTS.rbos}/${id}/reviews/${reviewId}`, {
        status,
      });
      await mutate();
      toast('Review updated', 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  if (isLoading && !data) return <DetailPageSkeleton />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }
  if (!data) return <EmptyState title="RBO not found" />;

  const { vendor, products, staff, reviews, metrics, activity, kycStatus, kycDocuments } =
    data;
  const city = vendor.address.split(',').slice(-2).join(',').trim();

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: `Products (${products.length})` },
    { id: 'staff', label: `Staff (${staff.length})` },
    { id: 'reviews', label: `Reviews (${reviews.length})` },
    { id: 'activity', label: 'Activity Log' },
  ];

  return (
    <div className="space-y-6">
      <nav className="text-sm text-text-muted">
        <Link to="/" className="hover:text-accent">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <Link to="/rbos" className="hover:text-accent">
          RBOs
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-primary">{vendor.businessName}</span>
      </nav>

      <Card className="!p-4 sm:!p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-muted text-lg font-semibold text-accent sm:h-20 sm:w-20 sm:text-xl">
              {initials(vendor.businessName)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-text-primary">
                  {vendor.businessName}
                </h1>
                <StatusPill status={vendor.status} />
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                {vendor.ownerName} · {vendor.email} · {vendor.phone}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {vendor.categoryIds.map((cid) => (
                  <span
                    key={cid}
                    className="rounded-full border border-accent/35 bg-accent-muted px-2.5 py-0.5 text-[11px] font-medium text-accent"
                  >
                    {categoryPathLabel(catList, cid)}
                  </span>
                ))}
                <span className="rounded-full border border-border bg-canvas px-2.5 py-0.5 text-[11px] font-medium text-text-secondary">
                  {city || vendor.address}
                </span>
                <span className="rounded-full border border-border bg-canvas px-2.5 py-0.5 text-[11px] font-medium text-text-muted">
                  {vendor.id}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:items-end">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:gap-6">
              <StatLabel
                label="Joined on"
                value={formatDateTime(vendor.createdAt).split(',')[0] ?? '—'}
              />
              <StatLabel
                label="Total listings"
                value={String(products.length)}
              />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                  Average rating
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-sm font-semibold tabular-nums text-text-primary">
                    {vendor.ratingAvg ? vendor.ratingAvg.toFixed(1) : '—'}
                  </span>
                  {vendor.ratingAvg ? <Stars value={vendor.ratingAvg} /> : null}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                  KYC status
                </p>
                <KycBadge status={kycStatus} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {vendor.status === 'onboarding' ? (
                <PermissionGate module="rbos">
                  <>
                    <Button size="sm" onClick={() => void patchVendor('active')}>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => void patchVendor('rejected')}
                    >
                      Reject
                    </Button>
                  </>
                </PermissionGate>
              ) : null}
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
              <PermissionGate module="rbos">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-accent/50 text-accent hover:bg-accent-muted"
                  onClick={() =>
                    void patchVendor(
                      vendor.status === 'frozen' ? 'active' : 'frozen',
                    )
                  }
                >
                  <Lock className="h-4 w-4" aria-hidden />
                  {vendor.status === 'frozen' ? 'Unfreeze RBO' : 'Freeze RBO'}
                </Button>
              </PermissionGate>
            </div>
          </div>
        </div>
      </Card>

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
        <OverviewTab
          products={products}
          staff={staff}
          reviews={reviews}
          activity={activity}
          metrics={metrics}
          kycDocuments={kycDocuments}
          catList={catList}
          onShowProducts={() => setTab('products')}
          onShowStaff={() => setTab('staff')}
          onShowReviews={() => setTab('reviews')}
          onShowActivity={() => setTab('activity')}
        />
      ) : null}

      {tab === 'products' ? (
        <ProductsTab
          products={products}
          catList={catList}
          onPatch={patchProduct}
        />
      ) : null}

      {tab === 'staff' ? (
        <StaffTab staff={staff} onPatch={patchStaff} />
      ) : null}

      {tab === 'reviews' ? (
        <ReviewsTab reviews={reviews} onPatch={patchReview} />
      ) : null}

      {tab === 'activity' ? <ActivityList events={activity} /> : null}
    </div>
  );
}

function OverviewTab({
  products,
  staff,
  reviews,
  activity,
  metrics,
  kycDocuments,
  catList,
  onShowProducts,
  onShowStaff,
  onShowReviews,
  onShowActivity,
}: {
  products: Product[];
  staff: RboStaff[];
  reviews: Review[];
  activity: RboActivityEvent[];
  metrics: RboDetail['metrics'];
  kycDocuments: KycDocument[];
  catList: Category[];
  onShowProducts: () => void;
  onShowStaff: () => void;
  onShowReviews: () => void;
  onShowActivity: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total bookings"
          value={metrics.totalBookings.toLocaleString('en-IN')}
          delta={metrics.deltas.bookings}
          icon={Package}
        />
        <MetricCard
          label={BOOKING_VALUE_LABEL}
          value={formatInr(metrics.totalRevenueInr)}
          delta={metrics.deltas.revenue}
          icon={TrendingUp}
        />
        <MetricCard
          label="Response time"
          value={`${metrics.responseTimeHours.toFixed(1)}h`}
          delta={metrics.deltas.response}
          icon={Clock3}
          invertDelta
        />
        <MetricCard
          label="Completion rate"
          value={`${metrics.completionRatePct}%`}
          delta={metrics.deltas.completion}
          icon={CheckCircle2}
        />
        <MetricCard
          label="Cancellation rate"
          value={`${metrics.cancellationRatePct}%`}
          delta={metrics.deltas.cancellation}
          icon={Percent}
          invertDelta
        />
      </div>

      <Card>
        <CardHeader
          title="KYC documents"
          description="Submitted verification documents (read-only)"
        />
        {kycDocuments.length === 0 ? (
          <EmptyState title="No KYC documents" />
        ) : (
          <ul className="divide-y divide-border">
            {kycDocuments.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {kycTypeLabel(doc.type)}
                  </p>
                  <p className="text-xs text-text-muted">
                    {doc.fileName ?? 'Document'} ·{' '}
                    {formatDateTime(doc.uploadedAt)}
                  </p>
                  {doc.rejectionReason ? (
                    <p className="mt-1 text-xs text-danger">{doc.rejectionReason}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize',
                      doc.status === 'verified'
                        ? 'border-success/30 bg-success-muted text-success'
                        : doc.status === 'pending'
                          ? 'border-warning/30 bg-warning-muted text-warning'
                          : 'border-danger/30 bg-danger-muted text-danger',
                    )}
                  >
                    {doc.status}
                  </span>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    View
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <PanelHeader title="Recent listings" onViewAll={onShowProducts} />
          {products.length === 0 ? (
            <EmptyState title="No listings" />
          ) : (
            <ul className="space-y-2.5">
              {products.slice(0, 4).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-border px-2.5 py-2"
                >
                  {p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent">
                      <Package className="h-4 w-4" aria-hidden />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/listings/products/${p.id}`}
                      className="block truncate text-sm font-medium text-text-primary hover:text-accent"
                    >
                      {p.name}
                    </Link>
                    <p className="truncate text-xs text-text-muted">
                      {categoryPathLabel(catList, p.categoryId)} ·{' '}
                      {formatInr(p.pricePerDayInr)}/day
                    </p>
                  </div>
                  <ProductStatus status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <PanelHeader title="Staff members" onViewAll={onShowStaff} />
          {staff.length === 0 ? (
            <EmptyState title="No staff" />
          ) : (
            <ul className="space-y-2.5">
              {staff.slice(0, 5).map((s, i) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-border px-2.5 py-2"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
                    {initials(s.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {s.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {i === 0 ? 'Manager' : 'Staff'} · {s.phone}
                    </p>
                  </div>
                  <StatusDot
                    active={s.status === 'active'}
                    label={s.status}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <PanelHeader title="Recent reviews" onViewAll={onShowReviews} />
          {reviews.length === 0 ? (
            <EmptyState title="No reviews" />
          ) : (
            <ul className="space-y-2.5">
              {[...reviews]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .slice(0, 3)
                .map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-border px-3 py-2.5"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-xs font-semibold text-text-secondary">
                      {initials(r.author)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-text-primary">
                          {r.direction === 'posted' && r.targetName
                            ? `${r.author} → ${r.targetName}`
                            : r.author}
                        </p>
                        <div className="flex items-center gap-2">
                          <ReviewDirectionBadge direction={r.direction} />
                          <Stars value={r.rating} />
                        </div>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
                        {r.body}
                      </p>
                      <p className="mt-1 text-[11px] text-text-muted">
                        {formatDateTime(r.createdAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <PanelHeader title="Activity timeline" onViewAll={onShowActivity} />
        <ActivityList events={activity.slice(0, 5)} compact />
      </Card>
    </div>
  );
}

function ProductsTab({
  products,
  catList,
  onPatch,
}: {
  products: Product[];
  catList: Category[];
  onPatch: (id: string, status: string) => Promise<void>;
}) {
  if (products.length === 0) {
    return <EmptyState title="No products for this RBO" />;
  }
  return (
    <>
      <div className="space-y-3 lg:hidden">
        {products.map((p) => (
          <RboDetailProductMobileCard
            key={p.id}
            product={p}
            catList={catList}
            onPatch={onPatch}
          />
        ))}
      </div>

      <TableShell className="hidden lg:block">
      <Table>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Category</Th>
            <Th>Price / day</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <ClickableTableRow
              key={p.id}
              to={`/listings/products/${p.id}`}
              ariaLabel={`View ${p.name}`}
            >
              <ClickableTd>
                <div className="flex items-center gap-3">
                  {p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : null}
                  <p className="font-medium text-text-primary">{p.name}</p>
                </div>
              </ClickableTd>
              <ClickableTd className="text-sm text-text-secondary">
                {categoryPathLabel(catList, p.categoryId)}
              </ClickableTd>
              <ClickableTd>{formatInr(p.pricePerDayInr)}</ClickableTd>
              <ClickableTd>
                <ProductStatus status={p.status} />
              </ClickableTd>
              <TableActionsCell>
                <PermissionGate module="rbos">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void onPatch(
                          p.id,
                          p.status === 'frozen' ? 'active' : 'frozen',
                        )
                      }
                    >
                      {p.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                    </Button>
                  </div>
                </PermissionGate>
              </TableActionsCell>
            </ClickableTableRow>
          ))}
        </tbody>
      </Table>
    </TableShell>
    </>
  );
}

function StaffTab({
  staff,
  onPatch,
}: {
  staff: RboStaff[];
  onPatch: (id: string, status: string) => Promise<void>;
}) {
  if (staff.length === 0) return <EmptyState title="No RBO sub-staff" />;
  return (
    <>
      <div className="space-y-3 lg:hidden">
        {staff.map((s) => (
          <RboDetailStaffMobileCard
            key={s.id}
            staff={s}
            onPatch={onPatch}
          />
        ))}
      </div>

      <TableShell className="hidden lg:block">
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Phone</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
                    {initials(s.name)}
                  </span>
                  <span className="font-medium">{s.name}</span>
                </div>
              </Td>
              <Td>{s.phone}</Td>
              <Td>
                <StatusDot active={s.status === 'active'} label={s.status} />
              </Td>
              <Td>
                <PermissionGate module="rbos">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void onPatch(
                          s.id,
                          s.status === 'frozen' ? 'active' : 'frozen',
                        )
                      }
                    >
                      {s.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                    </Button>
                  </div>
                </PermissionGate>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableShell>
    </>
  );
}

function ReviewsTab({
  reviews,
  onPatch,
}: {
  reviews: Review[];
  onPatch: (id: string, status: string) => Promise<void>;
}) {
  const [direction, setDirection] = useState<'received' | 'posted'>('received');
  const filtered = reviews.filter((r) => r.direction === direction);

  if (reviews.length === 0) return <EmptyState title="No reviews" />;

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-border bg-canvas p-1">
        {(['received', 'posted'] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDirection(d)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors',
              direction === d
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {d} ({reviews.filter((r) => r.direction === d).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={`No ${direction} reviews`} />
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {filtered.map((r) => (
              <RboDetailReviewMobileCard
                key={r.id}
                review={r}
                direction={direction}
                onPatch={onPatch}
              />
            ))}
          </div>

          <TableShell className="hidden lg:block">
          <Table>
            <thead>
              <tr>
                <Th>{direction === 'posted' ? 'Author / Target' : 'Author'}</Th>
                <Th>Rating</Th>
                <Th>Review</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <Td>
                    <p className="text-sm text-text-primary">{r.author}</p>
                    {direction === 'posted' && r.targetName ? (
                      <p className="text-xs text-text-muted">
                        → {r.targetName}
                      </p>
                    ) : null}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <span className="tabular-nums">{r.rating}</span>
                      <Stars value={r.rating} />
                    </div>
                  </Td>
                  <Td className="max-w-xs truncate">{r.body}</Td>
                  <Td>
                    <span className="text-xs capitalize text-text-secondary">
                      {r.status}
                    </span>
                  </Td>
                  <Td>
                    <PermissionGate module="rbos">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void onPatch(
                              r.id,
                              r.status === 'frozen' ? 'visible' : 'frozen',
                            )
                          }
                        >
                          {r.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void onPatch(r.id, 'hidden')}
                        >
                          Hide
                        </Button>
                      </div>
                    </PermissionGate>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableShell>
        </>
      )}
    </div>
  );
}

function ReviewDirectionBadge({
  direction,
}: {
  direction: Review['direction'];
}) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        direction === 'received'
          ? 'bg-accent-muted text-accent'
          : 'bg-warning-muted text-warning',
      )}
    >
      {direction}
    </span>
  );
}

function ActivityList({
  events,
  compact,
}: {
  events: RboActivityEvent[];
  compact?: boolean;
}) {
  if (events.length === 0) {
    return <EmptyState title="No activity yet" />;
  }
  return (
    <ul className={cn('space-y-2.5', !compact && 'rounded-xl border border-border bg-surface p-4')}>
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
                <UserRound className="h-4 w-4" aria-hidden />
              ) : e.tone === 'danger' ? (
                <Ban className="h-4 w-4" aria-hidden />
              ) : (
                <FileText className="h-4 w-4" aria-hidden />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{e.title}</p>
              <p className="text-xs text-text-secondary">{e.detail}</p>
              <p className="mt-0.5 text-[11px] text-text-muted">by {e.actor}</p>
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
  delta,
  icon: Icon,
  invertDelta,
}: {
  label: string;
  value: string;
  delta: number;
  icon: typeof Package;
  invertDelta?: boolean;
}) {
  const up = delta >= 0;
  const good = invertDelta ? !up : up;
  return (
    <Card className="!p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-muted text-accent">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-text-primary">
        {value}
      </p>
      <p
        className={cn(
          'mt-1 text-xs font-medium tabular-nums',
          good ? 'text-success' : 'text-danger',
        )}
      >
        {up ? '+' : ''}
        {delta.toFixed(1)}% vs last month
      </p>
    </Card>
  );
}

function PanelHeader({
  title,
  onViewAll,
}: {
  title: string;
  onViewAll?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      {onViewAll ? (
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-medium text-accent hover:underline"
        >
          View all →
        </button>
      ) : null}
    </div>
  );
}

function StatLabel({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-text-primary">{value}</p>
    </div>
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

function StatusPill({ status }: { status: RboStatus }) {
  const tone =
    status === 'active'
      ? 'border-success/30 bg-success-muted text-success'
      : status === 'onboarding'
        ? 'border-warning/30 bg-warning-muted text-warning'
        : 'border-danger/30 bg-danger-muted text-danger';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        tone,
      )}
    >
      {status}
    </span>
  );
}

function KycBadge({
  status,
}: {
  status: RboDetail['kycStatus'];
}) {
  const tone =
    status === 'verified'
      ? 'text-success'
      : status === 'pending'
        ? 'text-warning'
        : 'text-danger';
  return (
    <p className={cn('mt-1 flex items-center gap-1.5 text-sm font-semibold capitalize', tone)}>
      {status === 'verified' ? (
        <CheckCircle2 className="h-4 w-4" aria-hidden />
      ) : null}
      {status}
    </p>
  );
}

function ProductStatus({ status }: { status: Product['status'] }) {
  const tone =
    status === 'active'
      ? 'border-success/30 bg-success-muted text-success'
      : status === 'frozen'
        ? 'border-warning/30 bg-warning-muted text-warning'
        : 'border-border bg-canvas text-text-secondary';
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize',
        tone,
      )}
    >
      {status}
    </span>
  );
}

function StatusDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize',
        active
          ? 'border-success/30 bg-success-muted text-success'
          : 'border-warning/30 bg-warning-muted text-warning',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          active ? 'bg-success' : 'bg-warning',
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}
