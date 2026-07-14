import { useMemo, useState } from 'react';
import { useApiSWR } from '@/api/swr-helpers';
import { ENDPOINTS } from '@/api/endpoints';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  EmptyState,
  ErrorState,
  PageHeader,
  PageLoader,
} from '@/components/ui/States';
import { Table, TableShell, Td, Th } from '@/components/ui/Table';
import { formatDateTime } from '@/lib/utils';
import type { LoginAttempt } from '@/types';

export function LoginAlertsPage() {
  const { data, error, isLoading, mutate } = useApiSWR<LoginAttempt[]>(
    ENDPOINTS.loginAlerts,
  );
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filtered = useMemo(() => {
    const rows = data ?? [];
    return rows.filter((row) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        row.userName.toLowerCase().includes(q) ||
        row.role.toLowerCase().includes(q) ||
        row.ip.includes(q) ||
        row.location.toLowerCase().includes(q);
      const ts = new Date(row.attemptedAt).getTime();
      const afterFrom = !from || ts >= new Date(from).getTime();
      const beforeTo =
        !to || ts <= new Date(`${to}T23:59:59`).getTime();
      return matchesQuery && afterFrom && beforeTo;
    });
  }, [data, query, from, to]);

  if (isLoading && !data) return <PageLoader />;
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
    <div>
      <PageHeader
        title="Login Alerts"
        description="Immutable stream of platform login attempts. Super Admin receives SMTP alerts for each attempt."
      />
      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            label="Search"
            placeholder="User, role, IP, location"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
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
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No login attempts match filters" />
      ) : (
        <TableShell>
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
                <tr key={row.id}>
                  <Td>
                    <div className="font-medium">{row.userName}</div>
                    <div className="text-xs text-text-muted">{row.role}</div>
                  </Td>
                  <Td>
                    <div>{row.ip}</div>
                    <div className="text-xs text-text-muted">{row.location}</div>
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
      )}
    </div>
  );
}
