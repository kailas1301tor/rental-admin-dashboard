import { useMemo, useState, type ReactNode } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  CreditCard,
  MapPin,
  MoreHorizontal,
  Pencil,
  Smartphone,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Badge } from '@/components/ui/Badge';
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
import { cn, formatDateTime, formatInr } from '@/lib/utils';
import type {
  BookingStatus,
  MarketplaceUserDetail,
  MarketplaceUserStatus,
  RboActivityEvent,
  RboVendor,
} from '@/types';

type Tab =
  | 'overview'
  | 'bookings'
  | 'addresses'
  | 'payments'
  | 'activity'
  | 'devices';

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function bookingLabel(status: BookingStatus): string {
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled' || status === 'rejected') return 'Cancelled';
  return 'Upcoming';
}

function bookingTone(status: BookingStatus) {
  const label = bookingLabel(status);
  if (label === 'Completed') {
    return 'border-success/30 bg-success-muted text-success';
  }
  if (label === 'Cancelled') {
    return 'border-danger/30 bg-danger-muted text-danger';
  }
  return 'border-accent/30 bg-accent-muted text-accent';
}

export function UserDetailPage() {
  const { id = '' } = useParams();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const { data: overview, error, isLoading, mutate } = useApiSWR<any>(
    id ? `${ENDPOINTS.users}/${id}/overview` : null,
  );
  const { data: bookings = [] } = useApiSWR<any[]>(
    id ? `${ENDPOINTS.users}/${id}/bookings` : null,
  );
  const { data: addresses = [] } = useApiSWR<any[]>(
    id ? `${ENDPOINTS.users}/${id}/addresses` : null,
  );
  const { data: activity = [] } = useApiSWR<any[]>(
    id ? `${ENDPOINTS.users}/${id}/activity-logs` : null,
  );
  const { data: devices = [] } = useApiSWR<any[]>(
    id ? `${ENDPOINTS.users}/${id}/devices` : null,
  );

  const { data: rbos } = useApiSWR<RboVendor[]>(ENDPOINTS.rbos);

  const rboMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rbos ?? []) m.set(r.id, r.businessName);
    return m;
  }, [rbos]);

  if (isLoading && !overview) return <DetailPageSkeleton />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }
  if (!overview) return <EmptyState title="User not found" />;

  const {
    user,
    emailVerified,
    phoneVerified,
    role,
    accountType,
    lastLoginAt,
    updatedAt,
    rbo,
    bookingSummary,
    spending,
  } = overview;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'bookings', label: `Bookings (${bookingSummary.total})` },
    { id: 'addresses', label: `Addresses (${addresses.length})` },
    // { id: 'payments', label: `Payment Methods` }, // Payment Methods disabled for now
    { id: 'activity', label: 'Activity Logs' },
    { id: 'devices', label: `Devices (${devices.length})` },
  ];

  const recentBookings = bookings.slice(0, 3);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-text-muted">
        <Link to="/users" className="hover:text-accent">
          User Management
        </Link>
        <span className="mx-1.5">/</span>
        <Link to="/users" className="hover:text-accent">
          Users
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-primary">{user.name}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold text-text-primary sm:text-3xl">
              {user.name}
            </h1>
            <StatusPill status={user.status} />
          </div>
          <p className="mt-1.5 text-sm text-text-secondary">
            User ID: {user.id.toUpperCase()}
            <span className="mx-2 text-text-muted">·</span>
            Joined on {formatDateTime(user.joinedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast('More actions coming soon', 'info')}
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </Button>
          <PermissionGate module="users">
            <Button
              size="sm"
              onClick={() =>
                toast('Edit User opens when the API is ready', 'info')
              }
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Edit User
            </Button>
          </PermissionGate>
        </div>
      </div>

      <Card className="!p-4 sm:!p-5">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="flex flex-col items-center gap-3 lg:col-span-2">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-accent-muted text-2xl font-semibold text-accent">
              {initials(user.name)}
            </span>
            <PermissionGate module="users">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  toast('Avatar upload opens when the API is ready', 'info')
                }
              >
                Change Avatar
              </Button>
            </PermissionGate>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-10 lg:grid-cols-3">
            <ProfileBlock label="Contact">
              <p className="flex flex-wrap items-center gap-2 text-sm text-text-primary">
                {user.email}
                {emailVerified ? (
                  <Badge tone="success">Verified</Badge>
                ) : (
                  <Badge tone="warning">Unverified</Badge>
                )}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{user.phone}</p>
            </ProfileBlock>

            <ProfileBlock label="Location">
              <p className="flex items-start gap-1.5 text-sm text-text-primary">
                <MapPin
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted"
                  aria-hidden
                />
                <span>
                  {user.city}, {user.state} {user.pincode}
                </span>
              </p>
            </ProfileBlock>

            <ProfileBlock label="RBO">
              {rbo ? (
                <p className="text-sm text-text-primary">
                  {rbo.businessName}
                  <Link
                    to={`/rbos/${rbo.id}`}
                    className="ml-2 font-medium text-accent hover:underline"
                  >
                    View RBO
                  </Link>
                </p>
              ) : (
                <p className="text-sm text-text-muted">No RBO linked</p>
              )}
            </ProfileBlock>

            <ProfileBlock label="Account status">
              <div className="flex items-center gap-2">
                <StatusPill status={user.status} />
              </div>
            </ProfileBlock>

            <ProfileBlock label="Last login">
              <p className="text-sm text-text-primary">
                {formatDateTime(lastLoginAt)}
              </p>
            </ProfileBlock>

            <ProfileBlock label="Last updated">
              <p className="text-sm text-text-primary">
                {formatDateTime(updatedAt)}
              </p>
            </ProfileBlock>
          </div>
        </div>
      </Card>

      <div
        role="tablist"
        className="mobile-scroll-x border-b border-border"
      >
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
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card>
              <h2 className="mb-4 text-sm font-semibold text-text-primary">
                Account Overview
              </h2>
              <dl className="space-y-3 text-sm">
                <InfoRow label="User ID" value={user.id.toUpperCase()} />
                <InfoRow
                  label="Role"
                  value={
                    <Badge tone="accent" className="capitalize">
                      {role}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Account type"
                  value={
                    <span className="capitalize text-text-primary">
                      {accountType}
                    </span>
                  }
                />
                <InfoRow
                  label="Status"
                  value={<StatusPill status={user.status} />}
                />
                <InfoRow
                  label="Email verified"
                  value={<VerifiedFlag yes={emailVerified} />}
                />
                <InfoRow
                  label="Phone verified"
                  value={<VerifiedFlag yes={phoneVerified} />}
                />
              </dl>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-text-primary">
                  Booking Summary
                </h2>
                <button
                  type="button"
                  className="text-xs font-medium text-accent hover:underline"
                  onClick={() => setTab('bookings')}
                >
                  View all bookings
                </button>
              </div>
              <dl className="space-y-3 text-sm">
                <InfoRow
                  label="Total bookings"
                  value={String(bookingSummary.total)}
                />
                <InfoRow
                  label="Completed"
                  value={
                    <span className="font-medium text-success">
                      {bookingSummary.completed}
                    </span>
                  }
                />
                <InfoRow
                  label="Upcoming"
                  value={
                    <span className="font-medium text-accent">
                      {bookingSummary.upcoming}
                    </span>
                  }
                />
                <InfoRow
                  label="Cancelled"
                  value={
                    <span className="font-medium text-danger">
                      {bookingSummary.cancelled}
                    </span>
                  }
                />
              </dl>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-text-primary">
                  Spending Summary
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-text-secondary">
                  Last 12 months
                  <ChevronDown className="h-3 w-3" aria-hidden />
                </span>
              </div>
              <dl className="space-y-3 text-sm">
                <InfoRow
                  label="Total spent"
                  value={formatInr(spending.totalSpentInr)}
                />
                <InfoRow
                  label="Average order value"
                  value={formatInr(spending.averageOrderInr)}
                />
                <InfoRow
                  label="Last transaction"
                  value={
                    spending.lastTransactionAt && spending.lastTransactionInr != null
                      ? `${formatDateTime(spending.lastTransactionAt)} · ${formatInr(spending.lastTransactionInr)}`
                      : '—'
                  }
                />
              </dl>
            </Card>
          </div>

          <RecentBookingsTable
            bookings={recentBookings}
            rboName={(rboId) => rboMap.get(rboId) ?? rboId}
            onViewAll={() => setTab('bookings')}
            onViewBooking={() =>
              toast('Booking detail opens when the API is ready', 'info')
            }
          />
        </div>
      ) : null}

      {tab === 'bookings' ? (
        <BookingsTable
          bookings={bookings}
          rboName={(rboId) => rboMap.get(rboId) ?? rboId}
          onView={() =>
            toast('Booking detail opens when the API is ready', 'info')
          }
        />
      ) : null}

      {tab === 'addresses' ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {addresses.map((addr) => (
            <Card key={addr.id} className="!p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text-primary">
                  {addr.label}
                </p>
                {addr.isDefault ? <Badge tone="accent">Default</Badge> : null}
              </div>
              <p className="text-sm text-text-secondary">{addr.line1}</p>
              {addr.line2 ? (
                <p className="text-sm text-text-secondary">{addr.line2}</p>
              ) : null}
              <p className="mt-1 text-sm text-text-secondary">
                {addr.city}, {addr.state} {addr.pincode}
              </p>
            </Card>
          ))}
        </div>
      ) : null}

      {/* {tab === 'payments' ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {paymentMethods.map((pm) => (
            <Card key={pm.id} className="!p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-muted text-accent">
                  <CreditCard className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">
                      {pm.brand} ······{pm.last4}
                    </p>
                    {pm.isDefault ? (
                      <Badge tone="accent">Default</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    Expires {String(pm.expMonth).padStart(2, '0')}/{pm.expYear}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null} */}

      {tab === 'activity' ? <ActivityList events={activity} /> : null}

      {tab === 'devices' ? (
        <div className="space-y-3">
          {devices.map((device) => (
            <Card key={device.id} className="!p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas text-text-secondary ring-1 ring-border">
                  <Smartphone className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">
                      {device.name}
                    </p>
                    {device.current ? (
                      <Badge tone="success">This device</Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {device.platform}
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">
                    {device.location}
                    <span className="mx-1.5 text-text-muted">·</span>
                    Last active {formatDateTime(device.lastActiveAt)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProfileBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-right font-medium text-text-primary">{value}</dd>
    </div>
  );
}

function VerifiedFlag({ yes }: { yes: boolean }) {
  if (!yes) return <span className="text-text-secondary">No</span>;
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-success">
      Yes
      <CheckCircle2 className="h-4 w-4" aria-hidden />
    </span>
  );
}

function StatusPill({ status }: { status: MarketplaceUserStatus }) {
  const active = status === 'active';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        active
          ? 'border-success/30 bg-success-muted text-success'
          : 'border-danger/30 bg-danger-muted text-danger',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          active ? 'bg-success' : 'bg-danger',
        )}
        aria-hidden
      />
      {status}
    </span>
  );
}

function BookingStatusPill({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        bookingTone(status),
      )}
    >
      {bookingLabel(status)}
    </span>
  );
}

function RecentBookingsTable({
  bookings,
  rboName,
  onViewAll,
  onViewBooking,
}: {
  bookings: MarketplaceUserDetail['bookings'];
  rboName: (rboId: string) => string;
  onViewAll: () => void;
  onViewBooking: () => void;
}) {
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="border-b border-border px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-text-primary">
          Recent Bookings
        </h2>
      </div>
      {bookings.length === 0 ? (
        <div className="p-6">
          <EmptyState title="No bookings yet" />
        </div>
      ) : (
        <>
          <div className="space-y-3 p-4 lg:hidden">
            {bookings.map((b) => (
              <BookingMobileCard
                key={b.id}
                booking={b}
                rboName={rboName(b.rboId)}
                showRbo
                onView={onViewBooking}
              />
            ))}
          </div>

          <TableShell className="hidden border-0 rounded-none lg:block">
          <Table>
            <thead>
              <tr>
                <Th>Booking ID</Th>
                <Th>RBO</Th>
                <Th>Date</Th>
                <Th>Slot / Window</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-accent-muted/30">
                  <Td className="font-medium text-text-primary">
                    {b.id.toUpperCase()}
                  </Td>
                  <Td>
                    <Link
                      to={`/rbos/${b.rboId}`}
                      className="hover:text-accent"
                    >
                      {rboName(b.rboId)}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap text-text-secondary">
                    {formatDateTime(b.startAt).split(',')[0]}
                  </Td>
                  <Td className="whitespace-nowrap text-text-secondary">
                    {formatDateTime(b.startAt)}
                  </Td>
                  <Td className="tabular-nums">{formatInr(b.amountInr)}</Td>
                  <Td>
                    <BookingStatusPill status={b.status} />
                  </Td>
                  <Td className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onViewBooking}
                    >
                      View
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableShell>
        </>
      )}
      <div className="border-t border-border px-4 py-3 text-center">
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          View all bookings
          <ChevronDown className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </Card>
  );
}

function BookingsTable({
  bookings,
  rboName,
  onView,
}: {
  bookings: MarketplaceUserDetail['bookings'];
  rboName: (rboId: string) => string;
  onView: () => void;
}) {
  if (bookings.length === 0) {
    return <EmptyState title="No bookings for this user" />;
  }
  return (
    <>
      <div className="space-y-3 lg:hidden">
        {bookings.map((b) => (
          <BookingMobileCard
            key={b.id}
            booking={b}
            rboName={rboName(b.rboId)}
            showRbo
            onView={onView}
          />
        ))}
      </div>

      <TableShell className="hidden lg:block">
      <Table>
        <thead>
          <tr>
            <Th>Booking ID</Th>
            <Th>RBO</Th>
            <Th>Start</Th>
            <Th>End</Th>
            <Th>Amount</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="hover:bg-accent-muted/30">
              <Td className="font-medium">{b.id.toUpperCase()}</Td>
              <Td>
                <Link to={`/rbos/${b.rboId}`} className="hover:text-accent">
                  {rboName(b.rboId)}
                </Link>
              </Td>
              <Td className="whitespace-nowrap text-text-secondary">
                {formatDateTime(b.startAt)}
              </Td>
              <Td className="whitespace-nowrap text-text-secondary">
                {formatDateTime(b.endAt)}
              </Td>
              <Td className="tabular-nums">{formatInr(b.amountInr)}</Td>
              <Td>
                <BookingStatusPill status={b.status} />
              </Td>
              <Td className="text-right">
                <Button size="sm" variant="outline" onClick={onView}>
                  View
                </Button>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableShell>
    </>
  );
}

function ActivityList({ events }: { events: RboActivityEvent[] }) {
  if (events.length === 0) {
    return <EmptyState title="No activity yet" />;
  }
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Card key={event.id} className="!p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {event.title}
              </p>
              <p className="mt-0.5 text-sm text-text-secondary">{event.detail}</p>
              <p className="mt-2 text-xs text-text-muted">
                {event.actor}
                <span className="mx-1.5">·</span>
                {formatDateTime(event.occurredAt)}
              </p>
            </div>
            <span
              className={cn(
                'mt-1 h-2 w-2 shrink-0 rounded-full',
                event.tone === 'success' && 'bg-success',
                event.tone === 'warning' && 'bg-warning',
                event.tone === 'danger' && 'bg-danger',
                event.tone === 'accent' && 'bg-accent',
              )}
              aria-hidden
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
