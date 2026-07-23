import { addDays, toIsoDate } from '@/lib/date-range';

export type BookingSeriesGranularity = 'day' | 'week' | 'month';

export interface BookingSeriesPoint {
  label: string;
  date: string;
  gmvInr: number;
}

export const BOOKING_SERIES_GRANULARITY: Array<{
  id: BookingSeriesGranularity;
  label: string;
}> = [
  { id: 'day', label: 'Daily' },
  { id: 'week', label: 'Weekly' },
  { id: 'month', label: 'Monthly' },
];

function dayWeight(from: string, to: string, index: number): number {
  let seed = 0;
  for (const ch of `${from}${to}${index}`) {
    seed = (seed * 31 + ch.charCodeAt(0)) % 997;
  }
  return 0.75 + (seed % 50) / 100;
}

export function enumerateDays(from: string, to: string): string[] {
  const out: string[] = [];
  let cursor = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  while (cursor <= end) {
    out.push(toIsoDate(cursor));
    cursor = addDays(cursor, 1);
  }
  return out;
}

function formatDayLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${iso}T12:00:00`));
}

function formatWeekLabel(weekStart: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${weekStart}T12:00:00`));
}

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-');
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(Number(y), Number(m) - 1, 1));
}

function weekStart(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  return toIsoDate(addDays(d, offset));
}

export function buildDailyBookingSeries(
  from: string,
  to: string,
  totalInr: number,
): BookingSeriesPoint[] {
  const days = enumerateDays(from, to);
  if (days.length === 0) return [];

  const weights = days.map((_, i) => dayWeight(from, to, i));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;

  const points = days.map((date, i) => ({
    date,
    label: formatDayLabel(date),
    gmvInr: Math.round((totalInr * weights[i]) / sum),
  }));

  const actual = points.reduce((s, p) => s + p.gmvInr, 0);
  const drift = totalInr - actual;
  if (points.length > 0 && drift !== 0) {
    points[points.length - 1].gmvInr += drift;
  }

  return points;
}

export function groupBookingSeries(
  daily: BookingSeriesPoint[],
  granularity: BookingSeriesGranularity,
): BookingSeriesPoint[] {
  if (granularity === 'day') return daily;

  const buckets = new Map<string, BookingSeriesPoint>();

  for (const point of daily) {
    const key =
      granularity === 'week' ? weekStart(point.date) : point.date.slice(0, 7);
    const label =
      granularity === 'week'
        ? formatWeekLabel(key)
        : formatMonthLabel(key);

    const existing = buckets.get(key);
    if (existing) {
      existing.gmvInr += point.gmvInr;
    } else {
      buckets.set(key, { date: key, label, gmvInr: point.gmvInr });
    }
  }

  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}
