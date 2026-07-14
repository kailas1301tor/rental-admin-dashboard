import { clsx, type ClassValue } from 'clsx';
import {
  formatDateTimeValue,
  formatMoneyCroreValue,
  formatMoneyValue,
} from '@/lib/preferences-store';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** Formats money using active Settings preferences (currency / locale). */
export function formatInr(value: number): string {
  return formatMoneyValue(value);
}

/** Compact crore-style display using active currency symbol. */
export function formatInrCrore(value: number): string {
  return formatMoneyCroreValue(value);
}

/** Formats date/time using active language, date format, and timezone. */
export function formatDateTime(iso: string): string {
  return formatDateTimeValue(iso);
}

export function taxonomyLabel(root: string): string {
  switch (root) {
    case 'products_gadgets':
      return 'Products & Gadgets';
    case 'properties_spaces':
      return 'Properties & Spaces';
    case 'human_resources':
      return 'Human Resources';
    case 'sales_booking':
      return 'Sales Booking';
    default:
      return root;
  }
}
