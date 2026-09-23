export type DateRangePreset =
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

export interface DateRange {
  from: string;
  to: string;
  preset: DateRangePreset;
}

export const DATE_RANGE_PRESETS: Array<{
  id: DateRangePreset;
  label: string;
}> = [
  { id: 'last7', label: 'Last 7 days' },
  { id: 'last30', label: 'Last 30 days' },
  { id: 'thisMonth', label: 'This month' },
  { id: 'lastMonth', label: 'Last month' },
  { id: 'custom', label: 'Custom range' },
];

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getPresetRange(
  preset: Exclude<DateRangePreset, 'custom'>,
  now = new Date(),
): Pick<DateRange, 'from' | 'to'> {
  switch (preset) {
    case 'last7':
      return { from: toIsoDate(addDays(now, -6)), to: toIsoDate(now) };
    case 'last30':
      return { from: toIsoDate(addDays(now, -29)), to: toIsoDate(now) };
    case 'thisMonth':
      return {
        from: toIsoDate(startOfMonth(now)),
        to: toIsoDate(now),
      };
    case 'lastMonth': {
      const anchor = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        from: toIsoDate(startOfMonth(anchor)),
        to: toIsoDate(endOfMonth(anchor)),
      };
    }
  }
}

export function defaultDashboardRange(now = new Date()): DateRange {
  const { from, to } = getPresetRange('last30', now);
  return { preset: 'last30', from, to };
}

export function daysInRange(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00`).getTime();
  const end = new Date(`${to}T00:00:00`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return Math.floor((end - start) / 86_400_000) + 1;
}

export function isValidDateRange(from: string, to: string): boolean {
  if (!from || !to) return false;
  const start = new Date(`${from}T00:00:00`).getTime();
  const end = new Date(`${to}T00:00:00`).getTime();
  return !Number.isNaN(start) && !Number.isNaN(end) && end >= start;
}

export function formatDateRangeLabel(from: string, to: string): string {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${iso}T12:00:00`));
  return `${fmt(from)} – ${fmt(to)}`;
}

export function buildDateRangeQuery(from: string, to: string): string {
  const params = new URLSearchParams({ from, to });
  return `?${params.toString()}`;
}

export function bookingValueLabelForRange(from: string, to: string): string {
  const days = daysInRange(from, to);
  if (days <= 1) return 'Booking value (today)';
  if (days <= 7) return 'Booking value (7 days)';
  if (days <= 31) return 'Booking value (this period)';
  return 'Booking value (selected range)';
}

export function cancellationsLabelForRange(from: string, to: string): string {
  const days = daysInRange(from, to);
  if (days <= 7) return `Cancellations (${days} day${days === 1 ? '' : 's'})`;
  return 'Cancellations (period)';
}
