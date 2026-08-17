import { type ReactNode } from 'react';
import { MoreVertical, Pencil, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NavigableListCard } from '@/components/ui/NavigableListCard';
import { cn, formatInr } from '@/lib/utils';
import type { Product, ProductStatus } from '@/types';

const CAT_TONES = [
  'border-accent/40 bg-accent-muted text-accent',
  'border-success/40 bg-success-muted text-success',
  'border-warning/40 bg-warning-muted text-warning',
  'border-border bg-canvas text-text-secondary',
] as const;

export function ProductMobileCard({
  product,
  rboName,
  categoryName,
  categoryToneIdx,
  onMore,
}: {
  product: Product;
  rboName: string;
  categoryName: string;
  categoryToneIdx: number;
  onMore: () => void;
}) {
  return (
    <NavigableListCard
      to={`/listings/products/${product.id}`}
      label={`View ${product.name}`}
      summary={
        <div className="flex items-start gap-3">
          <img
            src={product.images[0]}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-medium text-text-primary">
              {product.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-text-muted">
              {product.id.toUpperCase()}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <CategoryBadge label={categoryName} toneIdx={categoryToneIdx} />
              <StatusPill status={product.status} />
            </div>
            <p className="mt-2 truncate text-sm text-text-secondary">
              {rboName}
            </p>
            <p className="mt-1 text-sm font-medium tabular-nums text-text-primary">
              {formatInr(product.pricePerDayInr)}
              <span className="font-normal text-text-muted"> / day</span>
            </p>
          </div>
        </div>
      }
      details={
        <>
          <DetailField label="RBO">
            <Link
              to={`/rbos/${product.rboId}`}
              className="text-sm text-accent hover:underline"
            >
              {rboName}
            </Link>
          </DetailField>
          <DetailField label="Category">
            <CategoryBadge label={categoryName} toneIdx={categoryToneIdx} />
          </DetailField>
          <DetailField
            label="Price per day"
            value={formatInr(product.pricePerDayInr)}
          />
          <DetailField
            label="Bookings"
            value={product.bookingCount.toLocaleString('en-IN')}
          />
          <DetailField label="Rating">
            <StarRating value={product.ratingAvg} />
          </DetailField>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              to={`/listings/products/${product.id}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-medium text-text-secondary hover:border-accent hover:text-accent"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Edit
            </Link>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-secondary hover:border-accent hover:text-text-primary"
              aria-label={`More actions for ${product.name}`}
              onClick={onMore}
            >
              <MoreVertical className="h-4 w-4" aria-hidden />
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
  children,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      {children ?? (
        <p className="mt-0.5 text-sm text-text-primary">{value}</p>
      )}
    </div>
  );
}

function CategoryBadge({
  label,
  toneIdx,
}: {
  label: string;
  toneIdx: number;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        CAT_TONES[toneIdx % CAT_TONES.length],
      )}
    >
      {label}
    </span>
  );
}

function StarRating({ value }: { value: number }) {
  if (!value) return <span className="text-sm text-text-muted">—</span>;
  const full = Math.floor(value);
  return (
    <div className="mt-0.5 flex items-center gap-1.5">
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

function StatusPill({ status }: { status: ProductStatus }) {
  const tone =
    status === 'active'
      ? 'border-success/40 bg-success-muted text-success'
      : status === 'pending_review'
        ? 'border-warning/40 bg-warning-muted text-warning'
        : status === 'frozen'
          ? 'border-warning/40 bg-warning-muted text-warning'
          : status === 'rejected'
            ? 'border-danger/40 bg-danger-muted text-danger'
            : 'border-border bg-canvas text-text-secondary';
  const dot =
    status === 'active'
      ? 'bg-success'
      : status === 'pending_review' || status === 'frozen'
        ? 'bg-warning'
        : status === 'rejected'
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
      {status.replace('_', ' ')}
    </span>
  );
}
