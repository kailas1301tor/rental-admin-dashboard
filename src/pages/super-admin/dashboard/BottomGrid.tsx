import { Link } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from '@/components/charts/chart-theme';
import { Card } from '@/components/ui/Card';
import { EmptyState, PageLoader } from '@/components/ui/States';
import { BOOKING_VALUE_LABEL } from '@/lib/metrics';
import { cn, formatDateTime, formatInr, formatInrCrore } from '@/lib/utils';
import type { DashboardKpis, LoginAttempt, ReportOverview } from '@/types';

export function BottomGrid({
  overview,
  overviewLoading,
  vendorIds,
  alerts,
  alertsLoading,
  kpis,
}: {
  kpis: DashboardKpis;
  overview?: ReportOverview;
  overviewLoading: boolean;
  vendorIds: Map<string, string>;
  alerts: LoginAttempt[];
  alertsLoading: boolean;
}) {
  const topRbos = overview?.topRbos ?? [];
  const security = alerts.slice(0, 5);
  const vendorDeltas = [12.4, 8.1, -2.3, 5.6, 3.2];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold text-text-primary">
            Top vendors by {BOOKING_VALUE_LABEL.toLowerCase()}
          </h2>
          <Link to="/rbos" className="text-xs font-medium text-accent hover:underline">
            All
          </Link>
        </div>
        {overviewLoading && !overview ? (
          <PageLoader />
        ) : topRbos.length === 0 ? (
          <EmptyState title="No vendor data" />
        ) : (
          <ol className="space-y-2.5">
            {topRbos.slice(0, 5).map((row, index) => {
              const id = vendorIds.get(row.name);
              const delta = vendorDeltas[index] ?? 0;
              return (
                <li
                  key={row.name}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-muted text-[11px] font-semibold text-accent">
                      {index + 1}
                    </span>
                    {id ? (
                      <Link
                        to={`/rbos/${id}`}
                        className="truncate text-sm font-medium text-text-primary hover:text-accent"
                      >
                        {row.name}
                      </Link>
                    ) : (
                      <span className="truncate text-sm font-medium text-text-primary">
                        {row.name}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-text-primary">
                      {formatInr(row.gmvInr)}
                    </p>
                    <p
                      className={cn(
                        'text-[11px] font-semibold tabular-nums',
                        delta >= 0 ? 'text-success' : 'text-danger',
                      )}
                    >
                      {delta >= 0 ? '+' : ''}
                      {delta}%
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-text-primary">
          {BOOKING_VALUE_LABEL} breakdown
        </h2>
        <div className="relative mx-auto mt-2 h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={kpis.moneyMix}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={74}
                paddingAngle={2}
              >
                {kpis.moneyMix.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Share']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-semibold tabular-nums text-text-primary">
              {formatInrCrore(kpis.revenueInr)}
            </span>
            <span className="text-[11px] text-text-muted">total</span>
          </div>
        </div>
        <ul className="mt-2 space-y-2">
          {kpis.moneyMix.map((slice, i) => (
            <li
              key={slice.name}
              className="flex items-center justify-between gap-2 text-sm text-text-secondary"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="truncate">{slice.name}</span>
              </span>
              <span className="font-semibold tabular-nums text-text-primary">
                {slice.value.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold text-text-primary">
            Recent security events
          </h2>
          <Link
            to="/login-alerts"
            className="text-xs font-medium text-accent hover:underline"
          >
            All
          </Link>
        </div>
        {alertsLoading && alerts.length === 0 ? (
          <PageLoader />
        ) : security.length === 0 ? (
          <EmptyState title="No security events" />
        ) : (
          <ul className="space-y-2.5">
            {security.map((a) => {
              const tone =
                a.result === 'blocked'
                  ? 'bg-danger'
                  : a.result === 'failed'
                    ? 'bg-warning'
                    : 'bg-success';
              return (
                <li
                  key={a.id}
                  className="flex gap-3 rounded-xl border border-border px-3 py-2.5"
                >
                  <span
                    className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', tone)}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {a.userName}
                      </p>
                      <span className="shrink-0 text-[11px] capitalize text-text-muted">
                        {a.result}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-text-muted">
                      {a.ip} · {a.location}
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-muted">
                      {formatDateTime(a.attemptedAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
