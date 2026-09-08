import { useState } from 'react';
import { ChevronDown, Star } from 'lucide-react';
import { CanAccess } from '@/components/auth/CanAccess';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Review } from '@/types';

export function RboDetailReviewMobileCard({
  review,
  direction,
  onPatch,
}: {
  review: Review;
  direction: Review['direction'];
  onPatch: (id: string, status: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors active:bg-accent-muted/30"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
          {review.author.slice(0, 2).toUpperCase()}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-text-primary">{review.author}</p>
              {direction === 'posted' && review.targetName ? (
                <p className="mt-0.5 text-xs text-text-muted">
                  → {review.targetName}
                </p>
              ) : null}
            </div>
            <ChevronDown
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0 text-text-muted transition-transform duration-200',
                open && 'rotate-180',
              )}
              aria-hidden
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-sm font-medium tabular-nums text-text-primary">
              {review.rating}
              <Stars value={review.rating} />
            </span>
            <span className="text-xs capitalize text-text-secondary">
              {review.status}
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-sm text-text-secondary">
            {review.body}
          </p>
        </div>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border bg-canvas/40 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Review
            </p>
            <p className="mt-0.5 break-words text-sm text-text-primary">
              {review.body}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Rating
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-text-primary">
              <span className="tabular-nums">{review.rating}</span>
              <Stars value={review.rating} />
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Status
            </p>
            <p className="mt-0.5 text-sm capitalize text-text-primary">
              {review.status}
            </p>
          </div>

          <CanAccess permission="change_rbovendor">
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void onPatch(
                    review.id,
                    review.status === 'frozen' ? 'visible' : 'frozen',
                  )
                }
              >
                {review.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void onPatch(review.id, 'hidden')}
              >
                Hide
              </Button>
            </div>
          </CanAccess>
        </div>
      ) : null}
    </div>
  );
}

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  return (
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
  );
}
