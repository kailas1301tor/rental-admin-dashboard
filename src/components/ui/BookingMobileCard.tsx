import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { cn, formatDateTime, formatInr } from '@/lib/utils';
import type { BookingStatus, BookingSummary } from '@/types';

export function BookingMobileCard({
  booking,
  rboName,
  showRbo = true,
  showCustomer = false,
  onView,
}: {
  booking: BookingSummary;
  rboName?: string;
  showRbo?: boolean;
  showCustomer?: boolean;
  onView?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors active:bg-accent-muted/30"
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent"
          aria-hidden
        >
          {initials(showCustomer ? booking.customerName : booking.id)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-text-primary">
                {booking.id.toUpperCase()}
              </p>
              {showCustomer ? (
                <p className="mt-0.5 truncate text-xs text-text-muted">
                  {booking.customerName}
                </p>
              ) : showRbo && rboName ? (
                <p className="mt-0.5 truncate text-xs text-text-muted">
                  {rboName}
                </p>
              ) : null}
            </div>
            <ChevronDown
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0 text-text-muted transition-transform duration-200',
                open && 'rotate-180',
              )}
              aria-hidden
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <BookingStatusPill status={booking.status} />
            <span className="text-sm font-medium tabular-nums text-text-primary">
              {formatInr(booking.amountInr)}
            </span>
          </div>

          <p className="mt-2 text-sm text-text-secondary">
            {formatDateTime(booking.startAt)}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            → {formatDateTime(booking.endAt)}
          </p>
        </div>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border bg-canvas/40 px-4 py-3">
          <DetailField
            label="Booking ID"
            value={booking.id.toUpperCase()}
          />
          {showCustomer ? (
            <DetailField label="Customer" value={booking.customerName} />
          ) : null}
          {showRbo && rboName ? (
            <DetailField label="RBO">
              <Link
                to={`/rbos/${booking.rboId}`}
                className="text-sm text-accent hover:underline"
              >
                {rboName}
              </Link>
            </DetailField>
          ) : null}
          <DetailField
            label="Start"
            value={formatDateTime(booking.startAt)}
          />
          <DetailField label="End" value={formatDateTime(booking.endAt)} />
          <DetailField
            label="Amount"
            value={formatInr(booking.amountInr)}
          />
          <DetailField label="Status">
            <BookingStatusPill status={booking.status} />
          </DetailField>

          {onView ? (
            <div className="pt-1">
              <Button size="sm" variant="outline" onClick={onView}>
                View
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DetailField({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      {children ?? (
        <p className="mt-0.5 break-words text-sm text-text-primary">{value}</p>
      )}
    </div>
  );
}

function BookingStatusPill({ status }: { status: BookingStatus }) {
  const tone =
    status === 'completed'
      ? 'border-success/30 bg-success-muted text-success'
      : status === 'cancelled'
        ? 'border-danger/30 bg-danger-muted text-danger'
        : status === 'active'
          ? 'border-accent/30 bg-accent-muted text-accent'
          : 'border-warning/30 bg-warning-muted text-warning';
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

function initials(value: string) {
  return value
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
