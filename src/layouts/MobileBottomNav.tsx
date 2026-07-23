import { Menu } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { MOBILE_BOTTOM_NAV } from '@/layouts/nav';
import { cn } from '@/lib/utils';

function isPrimaryMobileRoute(pathname: string): boolean {
  return MOBILE_BOTTOM_NAV.some((item) =>
    item.end
      ? pathname === item.to
      : pathname === item.to || pathname.startsWith(`${item.to}/`),
  );
}

export function MobileBottomNav({
  alertCount = 0,
  onMoreClick,
}: {
  alertCount?: number;
  onMoreClick: () => void;
}) {
  const { pathname } = useLocation();
  const moreActive = !isPrimaryMobileRoute(pathname);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
      aria-label="Primary mobile"
    >
      <div className="grid h-16 grid-cols-5">
        {MOBILE_BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const showBadge = item.to === '/login-alerts' && alertCount > 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium tracking-tight transition-colors',
                  isActive
                    ? 'text-accent'
                    : 'text-text-muted active:text-text-primary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        isActive ? 'text-accent' : 'text-text-muted',
                      )}
                      aria-hidden
                    />
                    {showBadge ? (
                      <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-0.5 text-[9px] font-semibold text-white">
                        {alertCount > 99 ? '99+' : alertCount}
                      </span>
                    ) : null}
                  </span>
                  <span>{item.label}</span>
                  {isActive ? (
                    <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-accent" />
                  ) : null}
                </>
              )}
            </NavLink>
          );
        })}
        <button
          type="button"
          onClick={onMoreClick}
          className={cn(
            'relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium tracking-tight transition-colors',
            moreActive
              ? 'text-accent'
              : 'text-text-muted active:text-text-primary',
          )}
          aria-label="More navigation"
        >
          <Menu className="h-5 w-5" aria-hidden />
          <span>More</span>
          {moreActive ? (
            <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-accent" />
          ) : null}
        </button>
      </div>
    </nav>
  );
}
