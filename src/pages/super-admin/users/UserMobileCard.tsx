import { type ReactNode } from 'react';
import { MapPin, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NavigableListCard } from '@/components/ui/NavigableListCard';
import { cn, formatDateTime } from '@/lib/utils';
import type { MarketplaceUser, MarketplaceUserStatus } from '@/types';

export function UserMobileCard({
  user,
  avatarTone,
  rboName,
  onMore,
}: {
  user: MarketplaceUser;
  avatarTone: string;
  rboName: string | null;
  onMore: () => void;
}) {
  return (
    <NavigableListCard
      to={`/users/${user.id}`}
      label={`View ${user.name}`}
      summary={
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
              avatarTone,
            )}
            aria-hidden
          >
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-text-primary">
              {user.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-text-muted">
              {user.id.toUpperCase()}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill status={user.status} />
              <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                {user.city}, {user.state}
              </span>
            </div>
            <p className="mt-2 truncate text-sm text-text-secondary">
              {user.email}
            </p>
          </div>
        </div>
      }
      details={
        <>
          <DetailField label="Email" value={user.email} breakAll />
          <DetailField label="Phone" value={user.phone} />
          <DetailField
            label="Location"
            value={`${user.city}, ${user.state} · ${user.pincode}`}
          />
          <DetailField label="RBO">
            {user.rboId ? (
              <Link
                to={`/rbos/${user.rboId}`}
                className="text-sm text-accent hover:underline"
              >
                {rboName ?? user.rboId}
              </Link>
            ) : (
              <span className="text-sm text-text-muted">No RBO linked</span>
            )}
          </DetailField>
          <DetailField
            label="Joined"
            value={formatDateTime(user.joinedAt)}
          />
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              to={`/users/${user.id}`}
              className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-3 text-sm font-medium text-text-secondary hover:border-accent hover:text-accent"
            >
              View profile
            </Link>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-secondary hover:border-accent hover:text-text-primary"
              aria-label={`More actions for ${user.name}`}
              onClick={onMore}
            >
              <MoreVertical className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </>
      }
    />
  );
}

function DetailField({
  label,
  value,
  breakAll,
  children,
}: {
  label: string;
  value?: string;
  breakAll?: boolean;
  children?: ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      {children ?? (
        <p
          className={cn(
            'mt-0.5 text-sm text-text-primary',
            breakAll ? 'break-all' : 'break-words',
          )}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: MarketplaceUserStatus }) {
  const active = status === 'active';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        active
          ? 'border-success/30 bg-success-muted text-success'
          : 'border-danger/30 bg-danger-muted text-danger',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          active ? 'bg-success' : 'bg-danger',
        )}
        aria-hidden
      />
      {status}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
