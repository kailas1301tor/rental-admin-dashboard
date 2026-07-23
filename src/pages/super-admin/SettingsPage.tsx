import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  Bell,
  CalendarDays,
  Check,
  Clock3,
  Headset,
  IndianRupee,
  Mail,
  Monitor,
  Moon,
  Palette,
  Plus,
  Save,
  Sun,
} from 'lucide-react';
import { apiPatch } from '@/api/axios-helpers';
import { getErrorMessage } from '@/api/axios-client';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  EmptyState,
  ErrorState,
} from '@/components/ui/States';
import { SettingsSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/Toast';
import {
  ACCENT_SWATCHES,
  formatDateTimeValue,
  type LocalePreferences,
} from '@/lib/preferences-store';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/preferences/PreferencesProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type {
  AccentColorId,
  AppCurrency,
  DateFormatPref,
  PlatformSettings,
} from '@/types';

const DATE_FORMAT_OPTIONS: Array<{ value: DateFormatPref; label: string }> = [
  { value: 'dd_mmm_yyyy', label: '20 May 2025 (DD MMM YYYY)' },
  { value: 'dd_mm_yyyy', label: '20/05/2025 (DD/MM/YYYY)' },
  { value: 'mm_dd_yyyy', label: '05/20/2025 (MM/DD/YYYY)' },
  { value: 'yyyy_mm_dd', label: '2025-05-20 (YYYY-MM-DD)' },
];

const TIMEZONE_OPTIONS = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
] as const;

function timezoneLabel(tz: string): string {
  try {
    const offset = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value;
    return `(${offset ?? 'GMT'}) ${tz}`;
  } catch {
    return tz;
  }
}

export function SettingsPage() {
  const { toast } = useToast();
  const { resolved } = useTheme();
  const { prefs, updatePrefs, savePrefs } = usePreferences();
  const { data, error, isLoading, mutate } = useApiSWR<PlatformSettings>(
    ENDPOINTS.settings,
  );
  const [form, setForm] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewTick, setPreviewTick] = useState(0);

  useEffect(() => {
    if (!data) return;
    setForm({
      ...data,
      language: data.language ?? prefs.language,
      currency: data.currency ?? prefs.currency,
      dateFormat: data.dateFormat ?? prefs.dateFormat,
      timezone: data.timezone || prefs.timezone,
      themeMode: data.themeMode ?? prefs.themeMode,
      accentColor: data.accentColor ?? prefs.accentColor,
      supportPhone: data.supportPhone ?? '+91 98765 43210',
      emailNotifications: data.emailNotifications ?? true,
      inAppNotifications: data.inAppNotifications ?? true,
    });
    // Hydrate once from API; live locale edits update form via patchField.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefs only used as fallback defaults
  }, [data]);

  function patchField<K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function applyLocaleLive(patch: Partial<LocalePreferences>) {
    updatePrefs(patch);
    setPreviewTick((n) => n + 1);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const saved = await apiPatch<PlatformSettings>(ENDPOINTS.settings, form);
      await mutate(saved, false);
      savePrefs({
        language: form.language,
        currency: form.currency,
        dateFormat: form.dateFormat,
        timezone: form.timezone,
        accentColor: form.accentColor,
        themeMode: form.themeMode,
      });
      toast('Settings saved', 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading && !data) return <SettingsSkeleton />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }
  if (!form) return <EmptyState title="No settings" />;

  const previewDate = formatDateTimeValue(
    '2025-05-20T10:30:00.000Z',
    {
      language: form.language,
      currency: form.currency,
      dateFormat: form.dateFormat,
      timezone: form.timezone,
      accentColor: form.accentColor,
      themeMode: form.themeMode,
    },
    { time: true },
  );

  return (
    <form onSubmit={(e) => void onSave(e)} className="space-y-6">
      <div>
        <h1 className="hidden text-2xl font-semibold text-text-primary sm:block">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage platform preferences and configurations.
        </p>
      </div>

      <Card className="space-y-1 !p-2 sm:!p-3">
        <SettingsRow
          icon={<IndianRupee className="h-4 w-4" />}
          iconClass="bg-success-muted text-success"
          title="Currency"
          description="Used across dashboards, tables, and reports."
        >
          <Select
            value={form.currency}
            onChange={(e) => {
              const currency = e.target.value as AppCurrency;
              patchField('currency', currency);
              applyLocaleLive({ currency });
            }}
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="AED">AED (د.إ)</option>
            <option value="EUR">EUR (€)</option>
          </Select>
        </SettingsRow>

        <SettingsRow
          icon={<CalendarDays className="h-4 w-4" />}
          iconClass="bg-warning-muted text-warning"
          title="Date format"
          description={`Preview: ${previewDate}`}
        >
          <Select
            key={previewTick}
            value={form.dateFormat}
            onChange={(e) => {
              const dateFormat = e.target.value as DateFormatPref;
              patchField('dateFormat', dateFormat);
              applyLocaleLive({ dateFormat });
            }}
          >
            {DATE_FORMAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </SettingsRow>

        <SettingsRow
          icon={<Clock3 className="h-4 w-4" />}
          iconClass="bg-accent-muted text-accent"
          title="Timezone"
          description="Applied to timestamps across the admin panel."
        >
          <Select
            value={form.timezone}
            onChange={(e) => {
              const timezone = e.target.value;
              patchField('timezone', timezone);
              applyLocaleLive({ timezone });
            }}
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>
                {timezoneLabel(tz)}
              </option>
            ))}
          </Select>
        </SettingsRow>
      </Card>

      <Card className="!p-4 sm:!p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
            <Palette className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-text-primary">
              Appearance
            </h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              Theme and primary accent for the Super Admin panel.
            </p>

            <p className="mt-5 text-xs font-medium uppercase tracking-wide text-text-muted">
              Theme
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  { id: 'light' as const, label: 'Light', Icon: Sun },
                  { id: 'dark' as const, label: 'Dark', Icon: Moon },
                  { id: 'system' as const, label: 'System', Icon: Monitor },
                ] as const
              ).map(({ id, label, Icon }) => {
                const active = form.themeMode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      patchField('themeMode', id);
                      applyLocaleLive({ themeMode: id });
                    }}
                    className={cn(
                      'inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors',
                      active
                        ? 'border-accent bg-accent-muted text-accent'
                        : 'border-border bg-canvas text-text-secondary hover:border-accent/50 hover:text-text-primary',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-5 text-xs font-medium uppercase tracking-wide text-text-muted">
              Primary color
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {ACCENT_SWATCHES.map((swatch) => {
                const active = form.accentColor === swatch.id;
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    title={swatch.label}
                    aria-label={swatch.label}
                    aria-pressed={active}
                    onClick={() => {
                      const accentColor = swatch.id as AccentColorId;
                      patchField('accentColor', accentColor);
                      applyLocaleLive({ accentColor });
                    }}
                    className={cn(
                      'relative flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-surface transition',
                      active ? 'ring-accent' : 'ring-transparent hover:ring-border',
                    )}
                    style={{ backgroundColor: swatch.swatch }}
                  >
                    {active ? (
                      <Check
                        className={cn(
                          'h-4 w-4',
                          resolved === 'dark' && swatch.id === 'cyan'
                            ? 'text-black'
                            : 'text-white',
                        )}
                        aria-hidden
                      />
                    ) : null}
                  </button>
                );
              })}
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-border text-text-muted hover:border-accent hover:text-accent"
                aria-label="Custom color"
                onClick={() =>
                  toast('Custom accent picker ships with the design API', 'info')
                }
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="!p-4 sm:!p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
            <Headset className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-text-primary">
              Support contact
            </h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              Shown to vendors and customers when they need help.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                label="Support email"
                type="email"
                value={form.supportEmail}
                onChange={(e) => patchField('supportEmail', e.target.value)}
              />
              <Input
                label="Support number"
                value={form.supportPhone}
                onChange={(e) => patchField('supportPhone', e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-1 !p-2 sm:!p-3">
        <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Notification preferences
        </p>
        <ToggleRow
          icon={<Mail className="h-4 w-4" />}
          iconClass="bg-warning-muted text-warning"
          title="Email notifications"
          description="Receive important updates and alerts via email."
          checked={form.emailNotifications}
          onChange={(v) => patchField('emailNotifications', v)}
        />
        <ToggleRow
          icon={<Bell className="h-4 w-4" />}
          iconClass="bg-pink-500/15 text-pink-400"
          title="In-app notifications"
          description="Receive alerts and updates within the admin panel."
          checked={form.inAppNotifications}
          onChange={(v) => patchField('inAppNotifications', v)}
        />
      </Card>

      <div className="flex justify-end gap-2 pb-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => data && setForm({ ...data, ...prefs })}
        >
          Reset
        </Button>
        <Button type="submit" isLoading={saving}>
          <Save className="h-4 w-4" aria-hidden />
          Save Changes
        </Button>
      </div>
    </form>
  );
}

function SettingsRow({
  icon,
  iconClass,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  iconClass: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl px-3 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            iconClass,
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          <p className="mt-0.5 text-sm text-text-secondary">{description}</p>
        </div>
      </div>
      <div className="w-full sm:max-w-xs sm:shrink-0">{children}</div>
    </div>
  );
}

function ToggleRow({
  icon,
  iconClass,
  title,
  description,
  checked,
  onChange,
}: {
  icon: ReactNode;
  iconClass: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-3">
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          iconClass,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-0.5 text-sm text-text-secondary">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-border-strong',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </div>
  );
}
