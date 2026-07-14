import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/States';
import { Table, TableShell, Td, Th } from '@/components/ui/Table';
import { Tabs } from '@/components/ui/Tabs';
import { formatDateTime } from '@/lib/utils';
import type { ApprovalOverrideItem, LoginAttempt, RboVendor } from '@/types';

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
          <PageLoader />
        ) : overridesError ? (
          <ErrorState message={overridesError} onRetry={onRetryOverrides} />
        ) : overrides.length === 0 ? (
          <EmptyState title="Override queue is clear" />
        ) : (
          <ul className="divide-y divide-border">
            {overrides.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">{item.title}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {item.department} · {item.listingName}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => onOverrideAct(item, 'approved')}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onOverrideAct(item, 'rejected')}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOverrideAct(item, 'info_requested')}
                  >
                    Request info
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'onboarding' ? (
        onboardingLoading ? (
          <PageLoader />
        ) : onboarding.length === 0 ? (
          <EmptyState title="No vendors waiting for approval" />
        ) : (
          <ul className="divide-y divide-border">
            {onboarding.slice(0, 5).map((vendor) => (
              <li
                key={vendor.id}
                className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    to={`/rbos/${vendor.id}`}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    {vendor.businessName}
                  </Link>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {vendor.ownerName} · joined {formatDateTime(vendor.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => onRboAct(vendor.id, 'active')}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onRboAct(vendor.id, 'rejected')}
                  >
                    Reject
                  </Button>
                  <Link
                    to={`/rbos/${vendor.id}`}
                    className="inline-flex min-h-9 items-center rounded-lg border border-border-strong px-3 text-sm font-medium text-text-primary hover:border-accent"
                  >
                    Review
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'security' ? (
        securityLoading ? (
          <PageLoader />
        ) : security.length === 0 ? (
          <EmptyState title="No failed or blocked logins" />
        ) : (
          <TableShell>
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
        )
      ) : null}
    </Card>
  );
}
