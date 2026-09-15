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
