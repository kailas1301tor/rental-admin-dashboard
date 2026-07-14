import { cn } from '@/lib/utils';
import { useId } from 'react';

/** Tiny sparkline for KPI cards — soft fill, no heavy chart dependency. */
export function Sparkline({
  values,
  className,
  tone = 'accent',
}: {
  values: number[];
  className?: string;
  tone?: 'accent' | 'success' | 'danger' | 'warning';
}) {
  const reactId = useId().replace(/:/g, '');
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 120;
  const h = 36;
  const coords = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return { x, y };
  });
  const line = coords.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  const gradId = `spark-${reactId}`;

  const stroke =
    tone === 'success'
      ? 'var(--success)'
      : tone === 'danger'
        ? 'var(--danger)'
        : tone === 'warning'
          ? 'var(--warning)'
          : 'var(--accent)';

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn('h-9 w-full', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon fill={`url(#${gradId})`} points={area} />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={line}
      />
    </svg>
  );
}
