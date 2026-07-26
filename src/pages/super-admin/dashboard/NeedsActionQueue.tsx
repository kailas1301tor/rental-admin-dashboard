import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import {
  EmptyState,
  ErrorState,
} from '@/components/ui/States';
import { SectionSkeleton } from '@/components/ui/skeletons';
import { Table, TableShell, Td, Th } from '@/components/ui/Table';
import { Tabs } from '@/components/ui/Tabs';
import { cn, formatDateTime } from '@/lib/utils';
import type { ApprovalOverrideItem, LoginAttempt, RboVendor } from '@/types';

const pill =
  'min-h-10 w-full rounded-full px-3.5 text-xs font-semibold tracking-tight shadow-sm transition-all sm:min-h-8 sm:w-auto';
const pillPrimary = `${pill} shadow-accent/20`;
const pillDanger =
  'min-h-10 w-full rounded-full border border-danger/20 bg-danger-muted px-3.5 text-xs font-semibold tracking-tight text-danger shadow-sm hover:bg-danger hover:text-white sm:min-h-8 sm:w-auto';
const pillOutline =
  'min-h-10 w-full rounded-full border border-border bg-transparent px-3.5 text-xs font-semibold tracking-tight text-text-secondary shadow-none hover:border-accent/50 hover:bg-accent-muted hover:text-accent sm:min-h-8 sm:w-auto';

export type NeedsTab = 'overrides' | 'onboarding' | 'security';

export function NeedsActionQueue({
  tab,
  onTabChange,
  overrides,
  overridesLoading,
  overridesError,
  onRetryOverrides,
  onOverrideAct,
  onboarding,
  onboardingLoading,
  onRboAct,
  security,
  securityLoading,
}: {
  tab: NeedsTab;
  onTabChange: (tab: NeedsTab) => void;
  overrides: ApprovalOverrideItem[];
  overridesLoading: boolean;
  overridesError?: string;
  onRetryOverrides: () => void;
  onOverrideAct: (
    item: ApprovalOverrideItem,
    status: ApprovalOverrideItem['status'],
  ) => void;
  onboarding: RboVendor[];
  onboardingLoading: boolean;
  onRboAct: (id: string, status: 'active' | 'rejected') => void;
  security: LoginAttempt[];
  securityLoading: boolean;
}) {
  return (
    <Card className="border-accent/25 bg-surface-elevated !p-3 sm:!p-4" id="needs-action">
      <CardHeader
        title="Needs action"
        description="Overrides · onboarding · security"
        action={
          tab === 'overrides' ? (
            <Link
              className="text-sm font-medium text-accent hover:underline"
              to="/approval-overrides"
            >
              Full queue
            </Link>
          ) : tab === 'onboarding' ? (
            <Link
              className="text-sm font-medium text-accent hover:underline"
              to="/rbos?tab=onboarding"
            >
              All onboarding
            </Link>
          ) : (
            <Link
              className="text-sm font-medium text-accent hover:underline"
              to="/login-alerts"
            >
              View all
            </Link>
          )
        }
      />
      <Tabs
        value={tab}
        onChange={onTabChange}
        className="mb-3"
        items={[
          { id: 'overrides', label: `Overrides (${overrides.length})` },
          { id: 'onboarding', label: `Onboarding (${onboarding.length})` },
          { id: 'security', label: `Security (${security.length})` },
        ]}
      />

      {tab === 'overrides' ? (
        overridesLoading ? (
          <SectionSkeleton rows={3} className="border-0 bg-transparent p-0" />
        ) : overridesError ? (
          <ErrorState message={overridesError} onRetry={onRetryOverrides} />
        ) : overrides.length === 0 ? (
          <EmptyState title="Override queue is clear" />
        ) : (
          <ul className="space-y-3">
            {overrides.slice(0, 5).map((item) => (
              <ActionTile
                key={item.id}
                title={item.title}
                subtitle={`${item.department} · ${item.listingName}`}
              >
                <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                  <Button
                    size="sm"
                    className={pillPrimary}
                    onClick={() => onOverrideAct(item, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={pillDanger}
                    onClick={() => onOverrideAct(item, 'rejected')}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={pillOutline}
                    onClick={() => onOverrideAct(item, 'info_requested')}
                  >
                    Request info
                  </Button>
                </div>
              </ActionTile>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'onboarding' ? (
        onboardingLoading ? (
          <SectionSkeleton rows={3} className="border-0 bg-transparent p-0" />
        ) : onboarding.length === 0 ? (
          <EmptyState title="No vendors waiting for approval" />
        ) : (
          <ul className="space-y-3">
            {onboarding.slice(0, 5).map((vendor) => (
              <ActionTile
                key={vendor.id}
                title={vendor.businessName}
                titleHref={`/rbos/${vendor.id}`}
                subtitle={`${vendor.ownerName} · joined ${formatDateTime(vendor.createdAt)}`}
              >
                <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                  <Button
                    size="sm"
                    className={pillPrimary}
                    onClick={() => onRboAct(vendor.id, 'active')}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={pillDanger}
                    onClick={() => onRboAct(vendor.id, 'rejected')}
                  >
                    Reject
                  </Button>
                  <Link
                    to={`/rbos/${vendor.id}`}
                    className={`inline-flex items-center justify-center ${pillOutline}`}
                  >
                    Review
                  </Link>
                </div>
              </ActionTile>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'security' ? (
        securityLoading ? (
          <SectionSkeleton rows={3} className="border-0 bg-transparent p-0" />
        ) : security.length === 0 ? (
          <EmptyState title="No failed or blocked logins" />
        ) : (
          <>
            <ul className="space-y-3 lg:hidden">
              {security.slice(0, 5).map((row) => (
                <ActionTile
                  key={row.id}
                  title={row.userName}
                  subtitle={`${row.role} · ${row.location}`}
                  badge={
                    <Badge tone={row.result === 'blocked' ? 'danger' : 'warning'}>
                      {row.result}
                    </Badge>
                  }
                  meta={formatDateTime(row.attemptedAt)}
                />
              ))}
            </ul>

            <TableShell className="hidden lg:block">
              <Table>
                <thead>
                  <tr>
                    <Th>User</Th>
                    <Th>Result</Th>
                    <Th>When</Th>
                  </tr>
                </thead>
                <tbody>
                  {security.slice(0, 5).map((row) => (
                    <tr key={row.id} className="bg-warning-muted/40">
                      <Td>
                        <div className="font-medium">{row.userName}</div>
                        <div className="text-xs text-text-muted">
                          {row.role} · {row.location}
                        </div>
                      </Td>
                      <Td>
                        <Badge tone={row.result === 'blocked' ? 'danger' : 'warning'}>
                          {row.result}
                        </Badge>
                      </Td>
                      <Td className="text-text-secondary">
                        {formatDateTime(row.attemptedAt)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableShell>
          </>
        )
      ) : null}
    </Card>
  );
}

function ActionTile({
  title,
  titleHref,
  subtitle,
  badge,
  meta,
  children,
}: {
  title: string;
  titleHref?: string;
  subtitle: string;
  badge?: ReactNode;
  meta?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const expandable = Boolean(children);

  return (
    <li className="overflow-hidden rounded-xl border border-border bg-canvas/40">
      <button
        type="button"
        onClick={() => {
          if (expandable) setOpen((prev) => !prev);
        }}
        disabled={!expandable}
        aria-expanded={expandable ? open : undefined}
        className={cn(
          'flex w-full items-start gap-3 p-3 text-left',
          expandable && 'transition-colors active:bg-accent-muted/20',
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {titleHref ? (
                <Link
                  to={titleHref}
                  className="block text-sm font-medium text-accent hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {title}
                </Link>
              ) : (
                <p className="text-sm font-medium text-text-primary">{title}</p>
              )}
              <p className="mt-0.5 break-words text-xs leading-relaxed text-text-secondary">
                {subtitle}
              </p>
            </div>
            {expandable ? (
              <ChevronDown
                className={cn(
                  'mt-0.5 h-4 w-4 shrink-0 text-text-muted transition-transform duration-200',
                  open && 'rotate-180',
                )}
                aria-hidden
              />
            ) : null}
          </div>

          {(badge || meta) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {badge}
              {meta ? (
                <span className="text-xs text-text-muted">{meta}</span>
              ) : null}
            </div>
          )}
        </div>
      </button>

      {expandable && open ? (
        <div className="border-t border-border px-3 pb-3 pt-2">{children}</div>
      ) : null}
    </li>
  );
}
