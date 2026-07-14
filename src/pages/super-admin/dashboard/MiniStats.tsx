import { Sparkline } from '@/components/ui/Sparkline';
import { cn } from '@/lib/utils';
import type { DashboardKpis } from '@/types';

function Delta({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        'text-[10px] font-semibold tabular-nums',
        up ? 'text-success' : 'text-danger',
      )}
    >
      {up ? '+' : ''}
      {value.toFixed(1)}
      {suffix}
    </span>
  );
}

export function MiniStats({ kpis }: { kpis: DashboardKpis }) {
  const { miniStats } = kpis;
  const items = [
    {
      label: 'Total users',
      value: miniStats.totalUsers.toLocaleString('en-IN'),
      delta: miniStats.deltas.totalUsers,
      spark: kpis.sparks.bookingValue.sparkline,
      tone: 'success' as const,
    },
    {
      label: 'New registrations',
      value: miniStats.newRegistrations.toLocaleString('en-IN'),
      delta: miniStats.deltas.newRegistrations,
      spark: kpis.sparks.activeRentals.sparkline,
      tone: 'accent' as const,
    },
    {
      label: 'Completed bookings',
      value: miniStats.completedBookings.toLocaleString('en-IN'),
      delta: miniStats.deltas.completedBookings,
      spark: kpis.sparks.activeVendors.sparkline,
      tone: 'success' as const,
    },
    {
      label: 'Pending payments',
      value: miniStats.pendingPayments.toLocaleString('en-IN'),
      delta: miniStats.deltas.pendingPayments,
      spark: kpis.sparks.cancellations.sparkline,
      tone: 'danger' as const,
    },
    {
      label: 'Total vendors',
      value: miniStats.totalVendors.toLocaleString('en-IN'),
      delta: miniStats.deltas.totalVendors,
      spark: [3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9],
      tone: 'warning' as const,
    },
    {
      label: 'Avg. rating',
      value: `${miniStats.avgRating.toFixed(1)}/5`,
      delta: miniStats.deltas.avgRating,
      spark: [3.8, 3.9, 4.0, 4.0, 4.1, 4.1, 4.0, 4.1, 4.2, 4.1, 4.1, 4.6],
      tone: 'accent' as const,
      deltaSuffix: '',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border bg-surface px-3.5 py-3"
        >
          <div className="flex items-start justify-between gap-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
              {item.label}
            </p>
            <Delta value={item.delta} suffix={item.deltaSuffix ?? '%'} />
          </div>
          <p className="mt-1 text-lg font-semibold tabular-nums text-text-primary">
            {item.value}
          </p>
          <Sparkline values={item.spark} tone={item.tone} className="mt-1 h-6" />
        </div>
      ))}
    </div>
  );
}
