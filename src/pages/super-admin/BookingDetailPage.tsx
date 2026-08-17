import { type ReactNode } from 'react';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/States';
import { DetailPageSkeleton } from '@/components/ui/skeletons';
import { formatDateTime, formatInr } from '@/lib/utils';
import type { BookingDetail } from '@/types';

export function BookingDetailPage() {
  const { id = '' } = useParams();
  const { data, error, isLoading, mutate } = useApiSWR<BookingDetail>(
    id ? `${ENDPOINTS.bookings}/${id}` : null,
  );

  if (isLoading && !data) return <DetailPageSkeleton />;
  if (error || !data) {
    return (
      <ErrorState
        message={error?.message ?? 'Booking not found'}
        onRetry={() => void mutate()}
      />
    );
  }

  const { booking, product, service, rbo, customer } = data;
  const listing = product ?? service;
  const invoiceUrl = `${ENDPOINTS.bookings}/${id}/invoice`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/bookings"
            className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to bookings
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">
            {booking.id.toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-text-secondary capitalize">
            {booking.status} · {booking.listingKind}
          </p>
        </div>
        <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" aria-hidden />
            GST invoice
          </Button>
        </a>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-text-primary">Booking</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Dates">
              {formatDateTime(booking.startAt)} → {formatDateTime(booking.endAt)}
            </Row>
            <Row label="Amount">{formatInr(booking.amountInr)}</Row>
            <Row label="Payment" className="capitalize">
              {booking.paymentStatus ?? '—'}
            </Row>
            <Row label="Customer">
              {customer ? (
                <Link to={`/users/${customer.id}`} className="text-accent hover:underline">
                  {customer.name}
                </Link>
              ) : (
                booking.customerName
              )}
            </Row>
            {booking.customerPhone ? (
              <Row label="Phone">{booking.customerPhone}</Row>
            ) : null}
          </dl>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-text-primary">Listing & vendor</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Listing">
              {listing ? (
                <Link
                  to={
                    product
                      ? `/listings/products/${product.id}`
                      : `/listings/services/${service!.id}`
                  }
                  className="text-accent hover:underline"
                >
                  {listing.name}
                </Link>
              ) : (
                '—'
              )}
            </Row>
            <Row label="Vendor">
              <Link to={`/rbos/${rbo.id}`} className="text-accent hover:underline">
                {rbo.businessName}
              </Link>
            </Row>
          </dl>
        </Card>
      </div>

      {listing?.images[0] ? (
        <Card className="!p-4">
          <div className="flex items-center gap-4">
            <img
              src={listing.images[0]}
              alt=""
              className="h-20 w-20 rounded-xl object-cover"
            />
            <div>
              <p className="font-medium text-text-primary">{listing.name}</p>
              <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
                <FileText className="h-3.5 w-3.5" aria-hidden />
                Booking reference for support and invoices
              </p>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function Row({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-muted">{label}</dt>
      <dd className={className ?? 'text-text-primary text-right'}>{children}</dd>
    </div>
  );
}
