import { CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import {
  DATE_RANGE_PRESETS,
  formatDateRangeLabel,
  getPresetRange,
  isValidDateRange,
  type DateRange,
  type DateRangePreset,
} from '@/lib/date-range';
import { cn } from '@/lib/utils';

interface DashboardDateRangeFilterProps {
  range: DateRange;
  onRangeChange: (next: DateRange) => void;
}

export function DashboardDateRangeFilter({
  range,
  onRangeChange,
}: DashboardDateRangeFilterProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(range);

  useEffect(() => {
    if (open) setDraft(range);
  }, [open, range]);

  function setPreset(preset: DateRangePreset) {
    if (preset === 'custom') {
      setDraft((current) => ({ ...current, preset }));
      return;
    }
    setDraft({ preset, ...getPresetRange(preset) });
  }

  function applyRange() {
    if (!isValidDateRange(draft.from, draft.to)) {
      toast('Choose a valid date range', 'error');
      return;
    }
    onRangeChange(draft);
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 gap-2"
        onClick={() => setOpen(true)}
        aria-label={`Date range: ${formatDateRangeLabel(range.from, range.to)}`}
      >
        <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
        <span className="max-w-[12rem] truncate sm:max-w-none">
          {formatDateRangeLabel(range.from, range.to)}
        </span>
      </Button>

      <Modal
        open={open}
        title="Select date range"
        description="Filter dashboard metrics for the chosen period."
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyRange}>Apply</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {DATE_RANGE_PRESETS.filter((item) => item.id !== 'custom').map(
              (item) => {
                const active = draft.preset === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreset(item.id)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      active
                        ? 'border-accent bg-accent-muted text-accent'
                        : 'border-border text-text-secondary hover:border-accent/40 hover:text-text-primary',
                    )}
                  >
                    {item.label}
                  </button>
                );
              },
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-muted">From</span>
              <input
                type="date"
                value={draft.from}
                onChange={(e) =>
                  setDraft({
                    from: e.target.value,
                    to: draft.to,
                    preset: 'custom',
                  })
                }
                className="h-11 w-full rounded-xl border border-border bg-canvas px-3 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-muted">To</span>
              <input
                type="date"
                value={draft.to}
                onChange={(e) =>
                  setDraft({
                    from: draft.from,
                    to: e.target.value,
                    preset: 'custom',
                  })
                }
                className="h-11 w-full rounded-xl border border-border bg-canvas px-3 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
          </div>
        </div>
      </Modal>
    </>
  );
}
