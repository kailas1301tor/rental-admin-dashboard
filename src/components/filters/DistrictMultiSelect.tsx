import { useState } from 'react';
import { ChevronDown, MapPin, X } from 'lucide-react';
import { KERALA_DISTRICTS } from '@/lib/kerala-districts';
import { cn } from '@/lib/utils';

export function DistrictMultiSelect({
  value,
  onChange,
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const label =
    value.length === 0
      ? 'All districts'
      : value.length === 1
        ? KERALA_DISTRICTS.find((d) => d.id === value[0])?.name ?? '1 district'
        : `${value.length} districts`;

  function toggle(id: string) {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="ui-select inline-flex h-11 w-full min-w-0 items-center gap-2 rounded-full border border-border bg-surface py-0 pl-4 pr-12 text-left text-sm text-text-primary transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <MapPin className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
        <span className="truncate">{label}</span>
        <ChevronDown
          className="pointer-events-none absolute right-4 h-4 w-4 text-text-muted"
          aria-hidden
        />
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close district filter"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            aria-multiselectable
            className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-lg"
          >
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-xs font-medium text-text-muted">
                Kerala districts
              </span>
              {value.length > 0 ? (
                <button
                  type="button"
                  className="text-xs text-accent hover:underline"
                  onClick={() => onChange([])}
                >
                  Clear
                </button>
              ) : null}
            </div>
            {KERALA_DISTRICTS.map((d) => {
              const checked = value.includes(d.id);
              return (
                <label
                  key={d.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-accent-muted/40"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(d.id)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-text-primary">{d.name}</span>
                </label>
              );
            })}
          </div>
        </>
      ) : null}
      {value.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((id) => {
            const name = KERALA_DISTRICTS.find((d) => d.id === id)?.name ?? id;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2 py-0.5 text-xs text-accent"
              >
                {name}
                <button
                  type="button"
                  aria-label={`Remove ${name}`}
                  onClick={() => toggle(id)}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
