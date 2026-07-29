import { Crown } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { portalLabel } from '@/auth/permissions';
import { NAV_SECTIONS } from '@/layouts/nav';
import { useFilteredNav } from '@/layouts/useFilteredNav';
import { cn } from '@/lib/utils';
import { NavLink } from 'react-router-dom';

export function Sidebar({
  onNavigate,
  badges,
}: {
  onNavigate?: () => void;
  badges?: Partial<Record<string, number>>;
}) {
  const { user } = useAuth();
  const navItems = useFilteredNav();

  return (
    <div className="flex h-full flex-col border-r border-border bg-chrome text-text-on-chrome">
      <div className="border-b border-border px-5 py-5 pr-14 lg:pr-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-muted text-accent">
            <Crown className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="font-display text-lg tracking-wide text-accent">
              Rental
            </p>
            <p className="text-[11px] text-text-muted">
              {portalLabel(user?.role)}
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto p-3" aria-label="Primary">
        {NAV_SECTIONS.map((section) => {
          const items = navItems.filter((item) => item.section === section.id);
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
                          'group flex min-h-10 items-center gap-3 rounded-full px-3.5 text-sm font-medium tracking-tight',
                          'transition-all duration-200 ease-out',
                          isActive
                            ? 'bg-gradient-to-r from-accent/20 via-accent/10 to-transparent text-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-accent/35'
                            : 'text-text-secondary hover:bg-accent-muted/50 hover:text-text-primary hover:ring-1 hover:ring-border',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0 transition-transform duration-200',
                              isActive
                                ? 'text-accent'
                                : 'text-text-muted group-hover:scale-105 group-hover:text-accent',
                            )}
                            aria-hidden
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {badge != null && badge > 0 ? (
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums transition-colors',
                                isActive
                                    ? 'bg-accent text-text-on-accent shadow-sm'
                                    : 'bg-accent-muted text-accent group-hover:bg-accent/25',
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
