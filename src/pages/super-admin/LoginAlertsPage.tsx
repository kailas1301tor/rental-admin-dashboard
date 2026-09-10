import { useMemo, useState } from 'react';
import { useApiSWR } from '@/api/swr-helpers';
import { ENDPOINTS } from '@/api/endpoints';
import { ListFilterBar } from '@/components/filters/ListFilterBar';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { Table, TableShell, Td, Th } from '@/components/ui/Table';
import { cn, formatDateTime } from '@/lib/utils';
import { useListFilters } from '@/hooks/useListFilters';
import { LoginAlertMobileCard } from '@/pages/super-admin/login-alerts/LoginAlertMobileCard';
import type { LoginAttempt } from '@/types';

type RoleTab =
  | 'all'
  | 'super_admin'
  | 'general_admin'
  | 'department_admin'
  | 'staff'
  | 'rbo'
  | 'customer'
  | 'unknown';

const ROLE_TABS: { id: RoleTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'super_admin', label: 'Super Admin' },
  { id: 'general_admin', label: 'General Admin' },
  { id: 'department_admin', label: 'Department Admin' },
  { id: 'staff', label: 'Staff' },
  { id: 'rbo', label: 'RBO' },
  { id: 'customer', label: 'Customer' },
  { id: 'unknown', label: 'Unknown' },
];

function classifyRole(role: string): Exclude<RoleTab, 'all'> {
  const r = role.trim().toLowerCase();
  if (!r || r === '—' || r === '-' || r === 'unknown') return 'unknown';
  if (r.includes('super admin') || r === 'super_admin') return 'super_admin';
  if (r.includes('general admin') || r === 'general_admin') return 'general_admin';
  if (r.includes('hod') || r.includes('department admin') || r === 'department_admin') return 'department_admin';
  if (r.includes('staff')) return 'staff';
  if (r === 'rbo' || r.includes('rbo') || r.includes('vendor')) return 'rbo';
  if (r.includes('customer')) return 'customer';
  return 'unknown';
}

export function LoginAlertsPage() {
  const [roleTab, setRoleTab] = useState<RoleTab>('all');
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (roleTab !== 'all') params.set('role', roleTab);
    return params;
  }, [query, from, to, roleTab]);

  const statsParams = useMemo(() => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return params;
  }, [query, from, to]);

  const { data: statsData } = useApiSWR<Record<RoleTab, number>>(
    `${ENDPOINTS.loginAlertsStats}?${statsParams.toString()}`,
  );

  const { data, error, isLoading, mutate } = useApiSWR<LoginAttempt[]>(
    `${ENDPOINTS.loginAlerts}?${searchParams.toString()}`,
  );
  const { filters, setFilters, reset } = useListFilters();

  const filtered = data ?? [];

  const roleCounts = useMemo(() => {
    return statsData ?? {
      all: 0,
      super_admin: 0,
      general_admin: 0,
      department_admin: 0,
      staff: 0,
      rbo: 0,
      customer: 0,
      unknown: 0,
    };
  }, [statsData]);

  if (isLoading && !data) return <ListPageSkeleton showKpis={false} />;
  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={() => {
          void mutate();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Login Alerts"
        description="Immutable stream of platform login attempts. Super Admin receives SMTP alerts for each attempt."
      />

      <ListFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onReset={reset}
        showTaxonomy={false}
        showDistrict={false} // District filter disabled per requirements
        search={
          <Input
            label="Search"
            placeholder="User, IP, location"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        }
      >
        <Input
          label="From"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </ListFilterBar>

      <div className="space-y-4">
        <div
          role="tablist"
          className="mobile-scroll-x border-b border-border"
        >
          {ROLE_TABS.map((item) => {
            const active = roleTab === item.id;
            const count = roleCounts[item.id] || 0;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setRoleTab(item.id)}
                className={cn(
                  'relative min-h-11 shrink-0 px-4 text-sm font-medium transition-colors',
                  active
                    ? 'text-accent'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                {item.label}
                <span
                  className={cn(
                    'ml-1.5 tabular-nums',
                    active ? 'text-accent' : 'text-text-muted',
                  )}
                >
                  ({count})
                </span>
                {active ? (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent" />
                ) : null}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No login attempts match filters" />
        ) : (
          <>
            <div className="space-y-3 lg:hidden">
              {filtered.map((row) => (
                <LoginAlertMobileCard key={row.id} row={row} />
              ))}
            </div>

            <TableShell className="hidden lg:block">
            <Table>
              <thead>
                <tr>
                  <Th>User</Th>
                  <Th>IP / Location</Th>
                  <Th>Result</Th>
                  <Th>Email alert</Th>
                  <Th>When</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-accent-muted/30">
                    <Td>
                      <div className="font-medium">{row.userName}</div>
                      <div className="text-xs text-text-muted">{row.role}</div>
                    </Td>
                    <Td>
                      <div>{row.ip}</div>
                      <div className="text-xs text-text-muted">
                        {row.location}
                      </div>
                    </Td>
                    <Td>
                      <Badge
                        tone={
                          row.result === 'success'
                            ? 'success'
                            : row.result === 'blocked'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {row.result}
                      </Badge>
                    </Td>
                    <Td>
                      {row.emailAlertSent ? (
                        <Badge tone="accent">Sent</Badge>
                      ) : (
                        <Badge>Pending</Badge>
                      )}
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
        )}
      </div>
    </div>
  );
}
