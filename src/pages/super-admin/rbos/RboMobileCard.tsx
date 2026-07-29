import { type ReactNode } from 'react';
import { MoreHorizontal, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NavigableListCard } from '@/components/ui/NavigableListCard';
import { cn, formatDateTime } from '@/lib/utils';
import type { RboStatus, RboVendor } from '@/types';

const CAT_TONES = [
  'border-accent/40 bg-accent-muted text-accent',
  'border-success/40 bg-success-muted text-success',
  'border-warning/40 bg-warning-muted text-warning',
  'border-border bg-canvas text-text-secondary',
] as const;

export function RboMobileCard({
  vendor,
  categoryNames,
  onMore,
}: {
  vendor: RboVendor;
  categoryNames: string[];
  onMore: () => void;
}) {
  return (
    <NavigableListCard
      to={`/rbos/${vendor.id}`}
      label={`View ${vendor.businessName}`}
      summary={
        <>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-xs font-semibold text-accent">
              {initials(vendor.businessName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-medium text-text-primary">
                {vendor.businessName}
              </p>
              <p className="mt-0.5 truncate text-xs text-text-muted">
                {vendor.ownerName}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusPill status={vendor.status} />
                <StarRating value={vendor.ratingAvg} compact />
              </div>
              <p className="mt-2 truncate text-sm text-text-secondary">
                {vendor.phone}
              </p>
            </div>
          </div>
        </>
      }
      details={
        <>
          <DetailField label="Owner" value={vendor.ownerName} />
          <DetailField label="Email" value={vendor.email} breakAll />
          <DetailField label="Phone" value={vendor.phone} />
          <DetailField label="Categories">
            {categoryNames.length === 0 ? (
              <span className="text-sm text-text-muted">—</span>
            ) : (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {categoryNames.map((name, i) => (
                  <span
                    key={`${vendor.id}-${name}`}
                    className={cn(
                      'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium',
                      CAT_TONES[i % CAT_TONES.length],
                    )}
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </DetailField>
          <DetailField label="Rating">
            <StarRating value={vendor.ratingAvg} />
          </DetailField>
          <DetailField
            label="Joined"
            value={formatDateTime(vendor.createdAt)}
          />
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              to={`/rbos/${vendor.id}`}
              className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-3 text-sm font-medium text-text-primary hover:border-accent hover:text-accent"
            >
              View
            </Link>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-secondary hover:border-accent hover:text-text-primary"
              aria-label={`More actions for ${vendor.businessName}`}
              onClick={onMore}
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </>
      }
    />
  );
}

function DetailField({
  label,
  value,
  breakAll,
  children,
}: {
  label: string;
  value?: string;
  breakAll?: boolean;
  children?: ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      {children ?? (
        <p
          className={cn(
            'mt-0.5 text-sm text-text-primary',
            breakAll ? 'break-all' : 'break-words',
          )}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function StarRating({
  value,
  compact = false,
}: {
  value: number;
  compact?: boolean;
}) {
  if (!value) {
    return <span className="text-sm text-text-muted">—</span>;
  }
  const full = Math.floor(value);
  return (
    <div className={cn('flex items-center gap-1.5', !compact && 'mt-0.5')}>
      <span className="text-sm font-semibold tabular-nums text-text-primary">
        {value.toFixed(1)}
      </span>
      <span className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              'h-3 w-3',
              i < full ? 'fill-accent text-accent' : 'text-border-strong',
            )}
          />
        ))}
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: RboStatus }) {
  const tone =
    status === 'active'
      ? 'border-success/30 bg-success-muted text-success'
      : status === 'onboarding'
        ? 'border-warning/30 bg-warning-muted text-warning'
        : status === 'frozen'
          ? 'border-danger/30 bg-danger-muted text-danger'
          : 'border-border bg-canvas text-text-secondary';
  const dot =
    status === 'active'
      ? 'bg-success'
      : status === 'onboarding'
        ? 'bg-warning'
        : status === 'frozen'
          ? 'bg-danger'
          : 'bg-text-muted';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        tone,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} aria-hidden />
      {status}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
