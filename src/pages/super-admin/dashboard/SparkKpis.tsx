import {
  CalendarRange,
  IndianRupee,
  Store,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sparkline } from '@/components/ui/Sparkline';
import {
  bookingValueLabelForRange,
  cancellationsLabelForRange,
} from '@/lib/date-range';
import { cn, formatInr } from '@/lib/utils';
import type { DashboardKpis } from '@/types';

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        'text-[10px] font-semibold tabular-nums sm:text-xs',
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

export function SparkKpis({
  kpis,
  rangeFrom,
  rangeTo,
}: {
  kpis: DashboardKpis;
  rangeFrom: string;
  rangeTo: string;
}) {
  const cards: Array<{
    label: string;
    shortLabel: string;
    value: string;
    spark: DashboardKpis['sparks']['bookingValue'];
    tone: 'accent' | 'success' | 'danger' | 'warning';
    icon: LucideIcon;
    to?: string;
  }> = [
    {
      label: bookingValueLabelForRange(rangeFrom, rangeTo),
      shortLabel: 'Booking value',
      value: formatInr(kpis.revenueInr),
      spark: kpis.sparks.bookingValue,
      tone: 'accent',
      icon: IndianRupee,
      to: '/reports',
    },
    {
      label: 'Active rentals',
      shortLabel: 'Active rentals',
      value: kpis.activeBookings.toLocaleString('en-IN'),
      spark: kpis.sparks.activeRentals,
      tone: 'warning',
      icon: CalendarRange,
    },
    {
      label: cancellationsLabelForRange(rangeFrom, rangeTo),
      shortLabel: 'Cancellations',
      value: kpis.cancellationsLast7Days.toLocaleString('en-IN'),
      spark: kpis.sparks.cancellations,
      tone: 'danger',
      icon: XCircle,
      to: '/reports',
    },
    {
      label: 'Active vendors',
      shortLabel: 'Active vendors',
      value: kpis.activeVendors.toLocaleString('en-IN'),
      spark: kpis.sparks.activeVendors,
      tone: 'success',
      icon: Store,
      to: '/rbos',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const inner = (
          <>
            <div className="flex items-start justify-between gap-1.5">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl',
                  ICON_WRAP[card.tone],
                )}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
              </span>
              <Delta value={card.spark.deltaPct} />
            </div>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-text-muted sm:mt-3 sm:text-[11px]">
              <span className="sm:hidden">{card.shortLabel}</span>
              <span className="hidden sm:inline">{card.label}</span>
            </p>
            <p className="mt-0.5 text-base font-semibold tabular-nums leading-tight text-text-primary sm:mt-1 sm:text-2xl">
              {card.value}
            </p>
            <div className="mt-1.5 sm:mt-2">
              <Sparkline
                values={card.spark.sparkline}
                tone={card.tone}
                className="h-7 sm:h-9"
              />
            </div>
          </>
        );
        const className =
          'block rounded-xl border border-border bg-surface p-3 transition-colors hover:border-accent/40 active:bg-accent-muted/20 sm:p-4';
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
