/** Recharts fills that follow CSS theme tokens. */
export const CHART_COLORS = [
  'var(--accent)',
  'var(--success)',
  'var(--warning)',
  'var(--text-secondary)',
] as const;

export const CHART_GRID = 'var(--border)';
export const CHART_AXIS = 'var(--text-muted)';
export const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'var(--surface-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: 12,
} as const;
