import { Bell, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ThemeToggle } from '@/theme/theme-toggle';

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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-3 backdrop-blur sm:h-16 sm:gap-4 sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        Menu
      </Button>

      <div className="min-w-0 shrink-0">
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
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Search anything…"
          className="h-10 w-full rounded-full border border-border bg-canvas pl-10 pr-14 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          onFocus={() => toast('Search connects when the API ships', 'info')}
          readOnly
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-muted sm:inline">
          ⌘K
        </kbd>
      </label>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <Link
          to="/login-alerts"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:border-accent/40 hover:bg-accent-muted hover:text-text-primary"
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
        <ThemeToggle />
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
        <Button variant="outline" size="sm" onClick={logout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
