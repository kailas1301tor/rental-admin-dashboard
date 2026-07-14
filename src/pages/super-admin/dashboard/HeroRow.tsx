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
    <header className="flex flex-col gap-1">
      <p className="text-sm text-text-secondary">
        {greeting}, <span className="font-medium text-text-primary">{name}</span>
      </p>
      <p className="text-xs text-text-muted">{dateLabel}</p>
    </header>
  );
}
