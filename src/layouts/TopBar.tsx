import { Bell, LogOut, Menu, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export function TopBar({
  title,
  alertCount = 0,
  onMenuClick,
}: {
  title: string;
  alertCount?: number;
  onMenuClick: () => void;
}) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const initials =
    user?.name
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'SA';

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
      <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 shrink-0 rounded-full border border-border p-0 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </Button>

        <div className="min-w-0 flex-1 lg:flex-none lg:shrink-0">
          <h1 className="truncate text-base font-semibold text-text-primary sm:text-lg">
            {title}
          </h1>
          <p className="hidden text-[11px] text-text-muted sm:block">
            Home <span className="mx-1 text-border-strong">/</span> {title}
          </p>
        </div>

        <label className="relative mx-auto hidden max-w-md flex-1 md:block">
          <span className="sr-only">Search</span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search anything…"
            className="h-10 w-full rounded-full border border-border bg-canvas py-0 pl-11 pr-14 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            onFocus={() => toast('Search connects when the API ships', 'info')}
            readOnly
          />
          <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-muted sm:inline">
            ⌘K
          </kbd>
        </label>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-secondary transition-colors active:bg-accent-muted md:hidden"
            aria-label="Search"
            onClick={() => toast('Search connects when the API ships', 'info')}
          >
            <Search className="h-4 w-4" aria-hidden />
          </button>
          <Link
            to="/login-alerts"
            className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:border-accent/40 hover:bg-accent-muted hover:text-text-primary sm:inline-flex"
            aria-label={
              alertCount > 0 ? `${alertCount} login alerts` : 'Login alerts'
            }
          >
            <Bell className="h-4 w-4" aria-hidden />
            {alertCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            ) : null}
          </Link>
          <div className="hidden items-center gap-2.5 border-l border-border pl-2 md:flex">
            <div className="text-right">
              <p className="text-xs font-medium text-text-primary">
                {user?.name ?? 'Super Admin'}
              </p>
              <p className="text-[11px] text-text-muted">{user?.email}</p>
            </div>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent"
              aria-hidden
            >
              {initials}
            </span>
          </div>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent md:hidden"
            aria-hidden
          >
            {initials}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="h-10 w-10 min-h-10 gap-2 rounded-full border border-border bg-canvas p-0 text-text-secondary hover:border-danger/40 hover:bg-danger-muted hover:text-danger sm:w-auto sm:px-4"
            aria-label="Log out"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
