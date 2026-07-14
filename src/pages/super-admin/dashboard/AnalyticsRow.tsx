import {
  ClipboardCheck,
  Server,
  ShieldAlert,
  Store,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHART_AXIS,
  CHART_COLORS,
  CHART_GRID,
  CHART_TOOLTIP_STYLE,
} from '@/components/charts/chart-theme';
import { Card } from '@/components/ui/Card';
import { BOOKING_VALUE_LABEL } from '@/lib/metrics';
import { cn, formatInr, formatInrCrore } from '@/lib/utils';
import type { DashboardKpis, ReportOverview } from '@/types';

/**
 * Two-row analytics layout:
 * 1) Booking value (wide) + alerts
 * 2) Bookings trend + distribution (equal)
 * Avoids the cramped 4-across row.
 */
export function AnalyticsRow({
  kpis,
  overview,
}: {
  kpis: DashboardKpis;
  overview?: ReportOverview;
}) {
  const distribution = overview?.salesByCategory ?? [];
  const totalBookings = kpis.bookingsTrend.reduce((s, d) => s + d.count, 0);
  const distTotal = distribution.reduce((s, d) => s + d.value, 0);

  const liveAlerts = [
    {
      title: `${kpis.loginAlertsToday} new login attempts`,
      ago: '12 min ago',
      to: '/login-alerts',
      icon: ShieldAlert,
      tone: 'danger' as const,
    },
    {
      title: `${kpis.rbosOnboarding} vendors awaiting approval`,
      ago: '28 min ago',
      to: '/rbos?tab=onboarding',
      icon: Store,
      tone: 'warning' as const,
    },
    {
      title: `${kpis.pendingListings} listings pending review`,
      ago: '1 hr ago',
      to: '/approval-overrides',
      icon: ClipboardCheck,
      tone: 'warning' as const,
    },
    {
      title: `${kpis.pendingOverrides} override requests open`,
      ago: '2 hr ago',
      to: '/approval-overrides',
      icon: Server,
      tone: 'accent' as const,
    },
  ];

  const toneWrap = {
    danger: 'bg-danger-muted text-danger',
    warning: 'bg-warning-muted text-warning',
    accent: 'bg-accent-muted text-accent',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                {BOOKING_VALUE_LABEL} overview
              </h2>
              <p className="mt-1.5 text-3xl font-semibold tabular-nums text-accent">
                {formatInrCrore(kpis.revenueInr)}
              </p>
            </div>
            <div className="flex gap-1.5">
              <span className="rounded-full border border-accent/40 bg-accent-muted px-3 py-1 text-xs font-medium text-accent">
                This month
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted">
                Daily
              </span>
            </div>
          </div>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpis.monthBookingSeries}>
                <defs>
                  <linearGradient id="monthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke={CHART_GRID}
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke={CHART_AXIS}
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke={CHART_AXIS}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${Number(v) / 1e5}L`}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v) => [formatInr(Number(v)), BOOKING_VALUE_LABEL]}
                />
                <Area
                  type="monotone"
                  dataKey="gmvInr"
                  name={BOOKING_VALUE_LABEL}
                  stroke="var(--accent)"
                  fill="url(#monthFill)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="xl:col-span-4">
          <h2 className="text-base font-semibold text-text-primary">
            Real-time alerts
          </h2>
          <ul className="mt-4 space-y-3">
            {liveAlerts.map((a) => {
              const Icon = a.icon;
              return (
                <li key={`${a.to}-${a.title}`}>
                  <Link
                    to={a.to}
                    className="flex gap-3 rounded-xl border border-border px-3 py-3 transition-colors hover:border-accent/40 hover:bg-accent-muted/40"
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        toneWrap[a.tone],
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium leading-snug text-text-primary">
                        {a.title}
                      </span>
                      <span className="mt-1 block text-xs text-text-muted">
                        {a.ago}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Bookings trend
              </h2>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums text-text-primary">
                {totalBookings.toLocaleString('en-IN')}
                <span className="ml-2 text-sm font-medium text-text-muted">
                  bookings
                </span>
              </p>
            </div>
            <span className="text-sm font-semibold text-success">
              +{kpis.bookingsTrendDeltaPct.toFixed(1)}%
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpis.bookingsTrend}>
                <defs>
                  <linearGradient id="bookingsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--success)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--success)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke={CHART_GRID}
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke={CHART_AXIS}
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis stroke={CHART_AXIS} fontSize={11} tickLine={false} width={36} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Bookings"
                  stroke="var(--success)"
                  fill="url(#bookingsFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-text-primary">
            Booking distribution
          </h2>
          <div className="mt-2 grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
            <div className="relative mx-auto h-48 w-full max-w-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={74}
                    paddingAngle={2}
                  >
                    {distribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(v) => {
                      const pct =
                        distTotal > 0
                          ? Math.round((Number(v) / distTotal) * 100)
                          : 0;
                      return [`${pct}%`, 'Share'];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold tabular-nums text-text-primary">
                  {totalBookings.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-text-muted">total</span>
              </div>
            </div>
            <ul className="space-y-3">
              {distribution.map((d, i) => (
                <li
                  key={d.name}
                  className="flex items-center justify-between gap-3 text-sm text-text-secondary"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="truncate">{d.name}</span>
                  </span>
                  <span className="font-semibold tabular-nums text-text-primary">
                    {distTotal > 0 ? Math.round((d.value / distTotal) * 100) : 0}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
