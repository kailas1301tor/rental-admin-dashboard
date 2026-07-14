import { Crown } from 'lucide-react';
import { SUPER_ADMIN_NAV, NAV_SECTIONS } from '@/layouts/nav';
import { cn } from '@/lib/utils';
import { NavLink } from 'react-router-dom';

export function Sidebar({
  onNavigate,
  badges,
}: {
  onNavigate?: () => void;
  badges?: Partial<Record<string, number>>;
}) {
  return (
    <div className="flex h-full flex-col border-r border-border bg-chrome text-text-on-chrome">
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-muted text-accent">
            <Crown className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="font-display text-lg tracking-wide text-accent">
              Ornaments
            </p>
            <p className="text-[11px] text-text-muted">Super Admin</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto p-3" aria-label="Primary">
        {NAV_SECTIONS.map((section) => {
          const items = SUPER_ADMIN_NAV.filter((item) => item.section === section.id);
          if (items.length === 0) return null;
          return (
            <div key={section.id}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const badge = badges?.[item.to];
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-gradient-to-r from-accent-muted to-transparent text-text-primary ring-1 ring-accent/30'
                            : 'text-text-secondary hover:bg-chrome-muted hover:text-text-primary',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive ? (
                            <span
                              className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-accent"
                              aria-hidden
                            />
                          ) : null}
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0',
                              isActive
                                ? 'text-accent'
                                : 'text-text-muted group-hover:text-text-secondary',
                            )}
                            aria-hidden
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {badge != null && badge > 0 ? (
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                                isActive
                                  ? 'bg-accent text-text-on-accent'
                                  : 'bg-accent-muted text-accent',
                              )}
                            >
                              {badge > 99 ? '99+' : badge}
                            </span>
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="rounded-xl border border-border bg-chrome-muted px-3 py-2.5 text-xs text-text-muted">
          Marketplace admin · INR
        </div>
      </div>
    </div>
  );
}
