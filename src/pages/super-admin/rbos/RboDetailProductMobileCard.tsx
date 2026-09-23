import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CanAccess } from '@/components/auth/CanAccess';
import { Button } from '@/components/ui/Button';
import { NavigableListCard } from '@/components/ui/NavigableListCard';
import { categoryPathLabel } from '@/lib/category-helpers';
import { cn, formatInr } from '@/lib/utils';
import type { Category, Product } from '@/types';

export function RboDetailProductMobileCard({
  product,
  catList,
  onPatch,
}: {
  product: Product;
  catList: Category[];
  onPatch: (id: string, status: string) => Promise<void>;
}) {
  return (
    <NavigableListCard
      to={`/listings/products/${product.id}`}
      label={`View ${product.name}`}
      summary={
        <div className="flex items-start gap-3">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt=""
              className="h-14 w-14 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-xs font-semibold text-accent">
              {product.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-medium text-text-primary">
              {product.name}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              {categoryPathLabel(catList, product.categoryId)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ProductStatusPill status={product.status} />
              <span className="text-sm font-medium tabular-nums text-text-primary">
                {formatInr(product.pricePerDayInr)}
                <span className="font-normal text-text-muted"> / day</span>
              </span>
            </div>
          </div>
        </div>
      }
      details={
        <>
          <DetailField label="Category">
            {categoryPathLabel(catList, product.categoryId)}
          </DetailField>
          <DetailField
            label="Price per day"
            value={formatInr(product.pricePerDayInr)}
          />
          <DetailField label="Status">
            <ProductStatusPill status={product.status} />
          </DetailField>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              to={`/listings/products/${product.id}`}
              className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-3 text-sm font-medium text-text-secondary hover:border-accent hover:text-accent"
            >
              View product
            </Link>
            <CanAccess permission="change_rbovendor">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void onPatch(
                    product.id,
                    product.status === 'frozen' ? 'active' : 'frozen',
                  )
                }
              >
                {product.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
              </Button>
            </CanAccess>
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
        <p className="mt-0.5 break-words text-sm text-text-primary">{value}</p>
      )}
    </div>
  );
}

function ProductStatusPill({ status }: { status: Product['status'] }) {
  const tone =
    status === 'active'
      ? 'border-success/30 bg-success-muted text-success'
      : status === 'frozen'
        ? 'border-warning/30 bg-warning-muted text-warning'
        : 'border-danger/30 bg-danger-muted text-danger';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        tone,
      )}
    >
      {status}
    </span>
  );
}
