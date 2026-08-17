import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { BookingMobileCard } from '@/components/ui/BookingMobileCard';
import { Card } from '@/components/ui/Card';
import { filterSelectClass, searchControlClass } from '@/components/ui/control-styles';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { Table, TableShell, Th } from '@/components/ui/Table';
import {
  ClickableTableRow,
  ClickableTd,
} from '@/components/ui/clickable-row';
import type { BookingStatus, BookingSummaryExtended, RboVendor } from '@/types';

const PAGE_SIZE = 12;

export function BookingsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | BookingStatus>('');
  const [page, setPage] = useState(1);

  const { data, error, isLoading, mutate } = useApiSWR<BookingSummaryExtended[]>(
    ENDPOINTS.bookings,
  );
  const { data: rbos } = useApiSWR<RboVendor[]>(ENDPOINTS.rbos);

  const rboMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rbos ?? []) m.set(r.id, r.businessName);
    return m;
  }, [rbos]);

  const list = data ?? [];

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return list.filter((b) => {
      if (status && b.status !== status) return false;
      if (!query) return true;
      return (
        b.id.toLowerCase().includes(query) ||
        b.customerName.toLowerCase().includes(query) ||
        (rboMap.get(b.rboId)?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [list, q, status, rboMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (isLoading && !data) return <ListPageSkeleton kpiCount={3} />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Bookings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Platform-wide booking management and status oversight.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search booking ID, customer, vendor…"
            className={searchControlClass}
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as '' | BookingStatus);
            setPage(1);
          }}
          className={filterSelectClass}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No bookings found"
          description="Try adjusting filters or search."
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {pageRows.map((booking) => (
              <BookingMobileCard
                key={booking.id}
                booking={booking}
                rboName={rboMap.get(booking.rboId)}
                showCustomer
                onView={() => navigate(`/bookings/${booking.id}`)}
              />
            ))}
          </div>

          <Card className="hidden overflow-hidden md:block">
            <TableShell>
              <Table>
                <thead>
                  <tr>
                    <Th>Booking</Th>
                    <Th>Customer</Th>
                    <Th>Vendor</Th>
                    <Th>Type</Th>
                    <Th>Status</Th>
                    <Th>Amount</Th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((booking) => (
                    <ClickableTableRow
                      key={booking.id}
                      to={`/bookings/${booking.id}`}
                    >
                      <ClickableTd className="font-medium">
                        {booking.id.toUpperCase()}
                      </ClickableTd>
                      <ClickableTd>{booking.customerName}</ClickableTd>
                      <ClickableTd>
                        {rboMap.get(booking.rboId) ?? booking.rboId}
                      </ClickableTd>
                      <ClickableTd className="capitalize">
                        {booking.listingKind}
                      </ClickableTd>
                      <ClickableTd className="capitalize">
                        {booking.status}
                      </ClickableTd>
                      <ClickableTd>₹{booking.amountInr.toLocaleString('en-IN')}</ClickableTd>
                    </ClickableTableRow>
                  ))}
                </tbody>
              </Table>
            </TableShell>
          </Card>

          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>
              {filtered.length} booking{filtered.length === 1 ? '' : 's'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-border px-3 py-1 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-2 py-1">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-border px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
