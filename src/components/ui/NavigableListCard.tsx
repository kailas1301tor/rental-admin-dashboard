import { useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function NavigableListCard({
  to,
  onActivate,
  label,
  summary,
  details,
}: {
  to?: string;
  onActivate?: () => void;
  label: string;
  summary: ReactNode;
  details?: ReactNode;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function activate() {
    if (to) {
      navigate(to);
      return;
    }
    onActivate?.();
  }

  function onSummaryKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-start gap-3 p-4">
        <div
          role={to ? 'link' : 'button'}
          tabIndex={0}
          aria-label={label}
          className="min-w-0 flex-1 cursor-pointer rounded-lg text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 active:bg-accent-muted/30"
          onClick={activate}
          onKeyDown={onSummaryKeyDown}
        >
          {summary}
        </div>
        {details ? (
          <button
            type="button"
            aria-expanded={open}
            aria-label={`More details for ${label}`}
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-canvas hover:text-text-primary"
            onClick={() => setOpen((prev) => !prev)}
          >
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                open && 'rotate-180',
              )}
              aria-hidden
            />
          </button>
        ) : null}
      </div>
      {open && details ? (
        <div
          className="space-y-3 border-t border-border bg-canvas/40 px-4 py-3"
          onClick={(event: MouseEvent) => event.stopPropagation()}
        >
          {details}
        </div>
      ) : null}
    </div>
  );
}
