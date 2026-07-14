import type {
  AccentColorId,
  AppCurrency,
  AppLanguage,
  DateFormatPref,
  ThemeMode,
} from '@/types';

export interface LocalePreferences {
  language: AppLanguage;
  currency: AppCurrency;
  dateFormat: DateFormatPref;
  timezone: string;
  accentColor: AccentColorId;
  themeMode: ThemeMode;
}

export const DEFAULT_LOCALE_PREFERENCES: LocalePreferences = {
  language: 'en',
  currency: 'INR',
  dateFormat: 'dd_mmm_yyyy',
  timezone: 'Asia/Kolkata',
  accentColor: 'gold',
  themeMode: 'system',
};

export const PREFS_STORAGE_KEY = 'rental_admin_preferences';

let activePrefs: LocalePreferences = { ...DEFAULT_LOCALE_PREFERENCES };

export function getLocalePreferences(): LocalePreferences {
  return activePrefs;
}

export function setLocalePreferences(next: Partial<LocalePreferences>): void {
  activePrefs = { ...activePrefs, ...next };
}

export function loadStoredPreferences(): LocalePreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LOCALE_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<LocalePreferences>;
    return { ...DEFAULT_LOCALE_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_LOCALE_PREFERENCES };
  }
}

export function persistPreferences(prefs: LocalePreferences): void {
  localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  setLocalePreferences(prefs);
}

const CURRENCY_LOCALE: Record<AppCurrency, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  AED: 'en-AE',
  EUR: 'en-IE',
};

const LANGUAGE_LOCALE: Record<AppLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
};

export function currencyLocale(currency: AppCurrency): string {
  return CURRENCY_LOCALE[currency];
}

export function languageLocale(language: AppLanguage): string {
  return LANGUAGE_LOCALE[language];
}

export function formatMoneyValue(
  value: number,
  prefs: LocalePreferences = activePrefs,
): string {
  return new Intl.NumberFormat(currencyLocale(prefs.currency), {
    style: 'currency',
    currency: prefs.currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMoneyCroreValue(
  value: number,
  prefs: LocalePreferences = activePrefs,
): string {
  const symbol =
    prefs.currency === 'INR'
      ? '₹'
      : prefs.currency === 'USD'
        ? '$'
        : prefs.currency === 'EUR'
          ? '€'
          : 'AED ';
  return `${symbol}${(value / 1e7).toFixed(2)} Cr`;
}

export function formatDateTimeValue(
  iso: string,
  prefs: LocalePreferences = activePrefs,
  options?: { time?: boolean },
): string {
  const date = new Date(iso);
  const includeTime = options?.time !== false;
  const locale = languageLocale(prefs.language);

  if (prefs.dateFormat === 'dd_mmm_yyyy') {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(includeTime
        ? { hour: '2-digit', minute: '2-digit', hour12: true }
        : {}),
      timeZone: prefs.timezone,
    }).format(date);
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime
      ? { hour: '2-digit', minute: '2-digit', hour12: true }
      : {}),
    timeZone: prefs.timezone,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';

  const day = get('day');
  const month = get('month');
  const year = get('year');
  const hour = get('hour');
  const minute = get('minute');
  const dayPeriod = get('dayPeriod');
  const timeBit = includeTime
    ? `, ${hour}:${minute}${dayPeriod ? ` ${dayPeriod}` : ''}`
    : '';

  if (prefs.dateFormat === 'dd_mm_yyyy') {
    return `${day}/${month}/${year}${timeBit}`;
  }
  if (prefs.dateFormat === 'mm_dd_yyyy') {
    return `${month}/${day}/${year}${timeBit}`;
  }
  return `${year}-${month}-${day}${timeBit}`;
}

type AccentTone = { accent: string; hover: string; muted: string; onAccent: string };

export const ACCENT_SWATCHES: Array<{
  id: AccentColorId;
  label: string;
  swatch: string;
  light: AccentTone;
  dark: AccentTone;
}> = [
  {
    id: 'gold',
    label: 'Champagne gold',
    swatch: '#d4af37',
    light: {
      accent: '#c9a227',
      hover: '#b8911f',
      muted: 'rgba(201, 162, 39, 0.14)',
      onAccent: '#1a1a1a',
    },
    dark: {
      accent: '#d4af37',
      hover: '#e0c04a',
      muted: 'rgba(212, 175, 55, 0.16)',
      onAccent: '#1a1a1a',
    },
  },
  {
    id: 'blue',
    label: 'Blue',
    swatch: '#3b82f6',
    light: {
      accent: '#2563eb',
      hover: '#1d4ed8',
      muted: 'rgba(37, 99, 235, 0.14)',
      onAccent: '#ffffff',
    },
    dark: {
      accent: '#3b82f6',
      hover: '#60a5fa',
      muted: 'rgba(59, 130, 246, 0.18)',
      onAccent: '#ffffff',
    },
  },
  {
    id: 'purple',
    label: 'Purple',
    swatch: '#a855f7',
    light: {
      accent: '#7c3aed',
      hover: '#6d28d9',
      muted: 'rgba(124, 58, 237, 0.14)',
      onAccent: '#ffffff',
    },
    dark: {
      accent: '#a855f7',
      hover: '#c084fc',
      muted: 'rgba(168, 85, 247, 0.18)',
      onAccent: '#ffffff',
    },
  },
  {
    id: 'cyan',
    label: 'Cyan',
    swatch: '#06b6d4',
    light: {
      accent: '#0891b2',
      hover: '#0e7490',
      muted: 'rgba(8, 145, 178, 0.14)',
      onAccent: '#ffffff',
    },
    dark: {
      accent: '#22d3ee',
      hover: '#67e8f9',
      muted: 'rgba(34, 211, 238, 0.18)',
      onAccent: '#0a0a0a',
    },
  },
  {
    id: 'green',
    label: 'Green',
    swatch: '#22c55e',
    light: {
      accent: '#16a34a',
      hover: '#15803d',
      muted: 'rgba(22, 163, 74, 0.14)',
      onAccent: '#ffffff',
    },
    dark: {
      accent: '#34d399',
      hover: '#6ee7b7',
      muted: 'rgba(52, 211, 153, 0.18)',
      onAccent: '#0a0a0a',
    },
  },
  {
    id: 'orange',
    label: 'Orange',
    swatch: '#f97316',
    light: {
      accent: '#ea580c',
      hover: '#c2410c',
      muted: 'rgba(234, 88, 12, 0.14)',
      onAccent: '#ffffff',
    },
    dark: {
      accent: '#fb923c',
      hover: '#fdba74',
      muted: 'rgba(251, 146, 60, 0.18)',
      onAccent: '#0a0a0a',
    },
  },
  {
    id: 'red',
    label: 'Red',
    swatch: '#ef4444',
    light: {
      accent: '#dc2626',
      hover: '#b91c1c',
      muted: 'rgba(220, 38, 38, 0.14)',
      onAccent: '#ffffff',
    },
    dark: {
      accent: '#f87171',
      hover: '#fca5a5',
      muted: 'rgba(248, 113, 113, 0.18)',
      onAccent: '#0a0a0a',
    },
  },
];

export function applyAccentColor(
  id: AccentColorId,
  resolved: 'light' | 'dark',
): void {
  const entry = ACCENT_SWATCHES.find((s) => s.id === id) ?? ACCENT_SWATCHES[0];
  const tone = resolved === 'dark' ? entry.dark : entry.light;
  const root = document.documentElement;
  root.style.setProperty('--accent', tone.accent);
  root.style.setProperty('--accent-hover', tone.hover);
  root.style.setProperty('--accent-muted', tone.muted);
  root.style.setProperty('--text-on-accent', tone.onAccent);
  root.style.setProperty('--focus-ring', tone.accent);
}
