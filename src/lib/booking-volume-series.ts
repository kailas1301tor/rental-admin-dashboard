import { addDays, toIsoDate } from '@/lib/date-range';
import type { BookingSeriesGranularity } from '@/lib/booking-series';

export interface BookingVolumePoint {
  date: string;
  count: number;
  label: string;
  groupLabel: string;
  fullDateLabel: string;
}

export interface BookingVolumeStats {
  total: number;
  average: number;
  peak: number;
  peakLabel: string;
}

function fullDateLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${iso}T12:00:00`));
}

function weekStart(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  return toIsoDate(addDays(d, offset));
}

function weekRangeLabel(weekStartIso: string): string {
  const start = new Date(`${weekStartIso}T12:00:00`);
  const end = addDays(start, 6);
  const fmt = (date: Date) =>
    new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
    }).format(date);
  return `${fmt(start)} – ${fmt(end)}`;
}

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-');
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(Number(y), Number(m) - 1, 1));
}

function dailyAxisLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${iso}T12:00:00`));
}

/** Map API daily volume points into chart points (no invented values). */
export function toBookingVolumePoints(
  rows: Array<{ date?: string; label?: string; count: number }>,
): BookingVolumePoint[] {
  return rows
    .filter((row) => Boolean(row.date) || Boolean(row.label))
    .map((row) => {
      const date = row.date || row.label || '';
      return {
        date,
        count: row.count,
        label: row.date ? dailyAxisLabel(row.date) : row.label || '',
        groupLabel: row.date ? fullDateLabel(row.date) : row.label || '',
        fullDateLabel: row.date ? fullDateLabel(row.date) : row.label || '',
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateBookingVolume(
  daily: BookingVolumePoint[],
  view: BookingSeriesGranularity,
): BookingVolumePoint[] {
  if (view === 'day') return daily;

  const buckets = new Map<string, BookingVolumePoint>();

  for (const point of daily) {
    if (!/^\d{4}-\d{2}-\d{2}/.test(point.date)) {
      continue;
    }
    const key =
      view === 'week' ? weekStart(point.date) : point.date.slice(0, 7);
    const label =
      view === 'week' ? weekRangeLabel(key) : monthLabel(key);
    const groupLabel =
      view === 'week'
        ? `Week of ${weekRangeLabel(key)}`
        : monthLabel(key);

    const existing = buckets.get(key);
    if (existing) {
      existing.count += point.count;
    } else {
      buckets.set(key, {
        date: key,
        count: point.count,
        label,
        groupLabel,
        fullDateLabel: label,
      });
    }
  }

  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildBookingVolumeSeries(
  rows: Array<{ date?: string; label?: string; count: number }>,
  view: BookingSeriesGranularity,
): BookingVolumePoint[] {
  return aggregateBookingVolume(toBookingVolumePoints(rows), view);
}

export function bookingVolumeStats(
  series: BookingVolumePoint[],
): BookingVolumeStats {
  if (series.length === 0) {
    return { total: 0, average: 0, peak: 0, peakLabel: '—' };
  }

  const total = series.reduce((sum, point) => sum + point.count, 0);
  const peak = series.reduce(
    (best, point) => (point.count > best.count ? point : best),
    series[0],
  );

  return {
    total,
    average: Math.round(total / series.length),
    peak: peak.count,
    peakLabel: peak.fullDateLabel,
  };
}

export function bookingVolumeAverageLabel(
  view: BookingSeriesGranularity,
): string {
  switch (view) {
    case 'week':
      return 'Avg / week';
    case 'month':
      return 'Avg / month';
    default:
      return 'Avg / day';
  }
}
