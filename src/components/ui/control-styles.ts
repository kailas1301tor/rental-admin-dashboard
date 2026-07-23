/** Shared form control styles — keep padding consistent across the app. */
export const controlClass =
  'h-11 rounded-full border border-border bg-surface px-4 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';

/** Native `<select>` — custom chevron via `.ui-select`, padded clear of the rim. */
export const selectControlClass =
  'ui-select h-11 min-w-[10.5rem] rounded-full border border-border bg-surface py-0 pl-4 pr-12 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';

/** Grid / toolbar selects — fill the cell, no fixed min-width. */
export const filterSelectClass =
  'ui-select h-11 w-full min-w-0 rounded-full border border-border bg-surface py-0 pl-4 pr-12 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';

export const searchControlClass =
  'h-11 w-full rounded-full border border-border bg-canvas py-0 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';
