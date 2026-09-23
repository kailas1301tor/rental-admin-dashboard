export function HeroRow({
  greeting,
  name,
  dateLabel,
}: {
  greeting: string;
  name: string;
  dateLabel: string;
}) {
  return (
    <header className="rounded-2xl border border-border/70 bg-surface px-3.5 py-3.5 shadow-sm sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted sm:text-sm sm:normal-case sm:tracking-normal">
            {greeting}
          </p>
          <h1 className="mt-0.5 truncate font-display text-xl font-semibold leading-tight tracking-tight text-text-primary sm:mt-0.5 sm:text-xl">
            {name}
          </h1>
        </div>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-text-secondary sm:mt-1 sm:text-xs sm:text-text-muted">
        {dateLabel}
      </p>
    </header>
  );
}
