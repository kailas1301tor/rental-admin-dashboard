import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_TOOLTIP_STYLE,
} from '@/components/charts/chart-theme';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import {
  BOOKING_SERIES_GRANULARITY,
  type BookingSeriesGranularity,
} from '@/lib/booking-series';
import {
  bookingVolumeAverageLabel,
  bookingVolumeStats,
  type BookingVolumePoint,
} from '@/lib/booking-volume-series';
import { formatDateRangeLabel } from '@/lib/date-range';
import { cn } from '@/lib/utils';

function VolumeStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-canvas/60 px-3 py-2.5 sm:px-4 sm:py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-text-primary sm:text-xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 truncate text-xs text-text-secondary">{hint}</p>
      ) : null}
    </div>
  );
}

export function BookingVolumeChart({
  series,
  view,
  onViewChange,
  rangeFrom,
  rangeTo,
}: {
  series: BookingVolumePoint[];
  view: BookingSeriesGranularity;
  onViewChange: (view: BookingSeriesGranularity) => void;
  rangeFrom: string;
  rangeTo: string;
}) {
  const stats = bookingVolumeStats(series);
  const isDaily = view === 'day';

  return (
    <Card className="xl:col-span-2">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text-primary sm:text-lg">
            Booking volume
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {formatDateRangeLabel(rangeFrom, rangeTo)}
          </p>
        </div>
        <Tabs
          items={BOOKING_SERIES_GRANULARITY}
          value={view}
          onChange={onViewChange}
          className="w-full sm:w-auto"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        <VolumeStat
          label="Total bookings"
          value={stats.total.toLocaleString('en-IN')}
        />
        <VolumeStat
          label={bookingVolumeAverageLabel(view)}
          value={stats.average.toLocaleString('en-IN')}
        />
        <VolumeStat
          label="Peak period"
          value={stats.peak.toLocaleString('en-IN')}
          hint={stats.peakLabel}
        />
      </div>

      <div className={cn('mt-4 h-56 sm:h-64', series.length === 0 && 'flex items-center justify-center')}>
        {series.length === 0 ? (
          <p className="text-sm text-text-muted">No booking data for this range.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {isDaily ? (
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
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
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={16}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke={CHART_AXIS}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as BookingVolumePoint | undefined;
                    return row?.fullDateLabel ?? '';
                  }}
                  formatter={(value) => [
                    Number(value).toLocaleString('en-IN'),
                    'Bookings',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--accent)"
                  fill="url(#volumeAreaFill)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: 'var(--accent)' }}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={series}
                barCategoryGap="22%"
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  stroke={CHART_GRID}
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke={CHART_AXIS}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={12}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke={CHART_AXIS}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as BookingVolumePoint | undefined;
                    return row?.groupLabel ?? row?.fullDateLabel ?? '';
                  }}
                  formatter={(value) => [
                    Number(value).toLocaleString('en-IN'),
                    'Bookings',
                  ]}
                />
                <Bar
                  dataKey="count"
                  fill="var(--accent)"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={52}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
