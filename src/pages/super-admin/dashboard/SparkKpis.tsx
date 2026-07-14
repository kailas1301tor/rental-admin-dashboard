import {
  CalendarRange,
  IndianRupee,
  Store,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sparkline } from '@/components/ui/Sparkline';
import { BOOKING_VALUE_MONTH_LABEL } from '@/lib/metrics';
import { cn, formatInr } from '@/lib/utils';
import type { DashboardKpis } from '@/types';

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        'text-xs font-semibold tabular-nums',
        up ? 'text-success' : 'text-danger',
      )}
    >
      {up ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

const ICON_WRAP: Record<string, string> = {
  accent: 'bg-accent-muted text-accent',
  warning: 'bg-warning-muted text-warning',
  danger: 'bg-danger-muted text-danger',
  success: 'bg-success-muted text-success',
};

export function SparkKpis({ kpis }: { kpis: DashboardKpis }) {
  const cards: Array<{
    label: string;
    value: string;
    spark: DashboardKpis['sparks']['bookingValue'];
    tone: 'accent' | 'success' | 'danger' | 'warning';
    icon: LucideIcon;
    to?: string;
  }> = [
    {
      label: BOOKING_VALUE_MONTH_LABEL,
      value: formatInr(kpis.revenueInr),
      spark: kpis.sparks.bookingValue,
      tone: 'accent',
      icon: IndianRupee,
      to: '/reports',
    },
    {
      label: 'Active rentals',
      value: kpis.activeBookings.toLocaleString('en-IN'),
      spark: kpis.sparks.activeRentals,
      tone: 'warning',
      icon: CalendarRange,
    },
    {
      label: 'Cancellations (7 days)',
      value: kpis.cancellationsLast7Days.toLocaleString('en-IN'),
      spark: kpis.sparks.cancellations,
      tone: 'danger',
      icon: XCircle,
      to: '/reports',
    },
    {
      label: 'Active vendors',
      value: kpis.activeVendors.toLocaleString('en-IN'),
      spark: kpis.sparks.activeVendors,
      tone: 'success',
      icon: Store,
      to: '/rbos',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const inner = (
          <>
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl',
                  ICON_WRAP[card.tone],
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <Delta value={card.spark.deltaPct} />
            </div>
            <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-text-muted">
              {card.label}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-text-primary sm:text-2xl">
              {card.value}
            </p>
            <div className="mt-2">
              <Sparkline values={card.spark.sparkline} tone={card.tone} />
            </div>
          </>
        );
        const className =
          'block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/40';
        if (card.to) {
          return (
            <Link key={card.label} to={card.to} className={className}>
              {inner}
            </Link>
          );
        }
        return (
          <div key={card.label} className={className}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
