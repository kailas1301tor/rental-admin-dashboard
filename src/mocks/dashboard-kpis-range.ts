import { daysInRange } from '@/lib/date-range';
import { mockKpis } from '@/mocks/super-admin';
import type { DashboardKpis } from '@/types';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function scaleSparkline(values: number[], points: number, seed = 0): number[] {
  if (points <= 0) return values;
  if (points === values.length) return values;
  if (points > values.length) {
    const out = [...values];
    let s = seed || 1;
    while (out.length < points) {
      const last = out[out.length - 1] ?? 1;
      s = (s * 17 + 7) % 997;
      const bump = 0.92 + (s % 16) / 100;
      out.push(Math.max(1, Math.round(last * bump)));
    }
    return out;
  }
  return values.slice(-points);
}

function rangeSeed(from: string, to: string): number {
  let seed = 0;
  for (const ch of `${from}${to}`) seed = (seed * 31 + ch.charCodeAt(0)) % 997;
  return seed;
}

/** Returns KPI snapshots scaled to the requested dashboard date window (mock-only). */
export function buildDashboardKpisForRange(
  from: string,
  to: string,
): DashboardKpis {
  const days = clamp(daysInRange(from, to), 1, 366);
  const factor = days / 30;
  const seed = rangeSeed(from, to);
  const deltaShift = ((seed % 17) - 8) * 0.35;

  const sparkPoints = clamp(Math.round(days / 2.5), 6, 12);

  return {
    ...mockKpis,
    revenueInr: Math.round(mockKpis.revenueInr * factor),
    activeBookings: Math.round(mockKpis.activeBookings * clamp(factor * 1.05, 0.35, 1.2)),
    cancellationsLast7Days: Math.round(
      mockKpis.cancellationsLast7Days * clamp(days / 7, 0.25, 4),
    ),
    miniStats: {
      ...mockKpis.miniStats,
      newRegistrations: Math.round(mockKpis.miniStats.newRegistrations * factor),
      completedBookings: Math.round(mockKpis.miniStats.completedBookings * factor),
      pendingPayments: Math.max(
        12,
        Math.round(mockKpis.miniStats.pendingPayments * clamp(factor, 0.5, 1.4)),
      ),
      deltas: {
        ...mockKpis.miniStats.deltas,
        completedBookings:
          mockKpis.miniStats.deltas.completedBookings + deltaShift,
        newRegistrations:
          mockKpis.miniStats.deltas.newRegistrations + deltaShift * 0.6,
      },
    },
    bookingsTrendDeltaPct: mockKpis.bookingsTrendDeltaPct + deltaShift,
    sparks: {
      bookingValue: {
        deltaPct: mockKpis.sparks.bookingValue.deltaPct + deltaShift,
        sparkline: scaleSparkline(
          mockKpis.sparks.bookingValue.sparkline,
          sparkPoints,
          seed,
        ),
      },
      activeRentals: {
        deltaPct: mockKpis.sparks.activeRentals.deltaPct + deltaShift * 0.5,
        sparkline: scaleSparkline(
          mockKpis.sparks.activeRentals.sparkline,
          sparkPoints,
          seed + 1,
        ),
      },
      cancellations: {
        deltaPct: mockKpis.sparks.cancellations.deltaPct - deltaShift * 0.4,
        sparkline: scaleSparkline(
          mockKpis.sparks.cancellations.sparkline,
          sparkPoints,
          seed + 2,
        ),
      },
      activeVendors: {
        ...mockKpis.sparks.activeVendors,
        sparkline: scaleSparkline(
          mockKpis.sparks.activeVendors.sparkline,
          sparkPoints,
          seed + 3,
        ),
      },
    },
    bookingsTrend: scaleSparkline(
      mockKpis.bookingsTrend.map((d) => d.count),
      clamp(Math.min(days, 7), 3, 7),
      seed + 4,
    ).map((count, i) => ({
      label: mockKpis.bookingsTrend[i]?.label ?? `D${i + 1}`,
      count,
    })),
    monthBookingSeries: scaleSparkline(
      mockKpis.monthBookingSeries.map((d) => d.gmvInr),
      sparkPoints,
      seed + 5,
    ).map((gmvInr, i) => ({
      label: mockKpis.monthBookingSeries[i]?.label ?? String(i + 1),
      gmvInr: Math.round(gmvInr * factor),
    })),
  };
}
