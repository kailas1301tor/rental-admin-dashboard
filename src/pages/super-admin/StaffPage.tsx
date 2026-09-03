import { useMemo, useState, type FormEvent } from 'react';
import { apiPatch, apiPost } from '@/api/axios-helpers';
import { getErrorMessage } from '@/api/axios-client';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { ListFilterBar } from '@/components/filters/ListFilterBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { Table, TableShell, Th } from '@/components/ui/Table';
import {
  ClickableTableRow,
  ClickableTd,
  TableActionsCell,
} from '@/components/ui/clickable-row';
import { useToast } from '@/components/ui/Toast';
import { useListFilters } from '@/hooks/useListFilters';
import { StaffMobileCard } from '@/pages/super-admin/staff/StaffMobileCard';
import { departmentLabel } from '@/lib/departments';
import { formatDateTime } from '@/lib/utils';
import type { Department, PlatformStaff, PlatformStaffWrite } from '@/types';

type FormState = {
  name: string;
  email: string;
  phone: string;
  departmentId: string;
};

const empty: FormState = { name: '', email: '', phone: '', departmentId: '' };

export function StaffPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState<'' | 'active' | 'frozen'>('');

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (dept) params.set('department', dept);
    if (status) params.set('status', status);
    // if (filters.district) params.set('district', filters.district); // district filter disabled
    return params;
  }, [query, dept, status]); // removed filters.district

  const { data, error, isLoading, mutate } = useApiSWR<PlatformStaff[]>(
    `${ENDPOINTS.staff}?${searchParams.toString()}`,
  );
  const { data: deptData } = useApiSWR<Department[]>(ENDPOINTS.departments);
  const { filters, setFilters, reset, matchesDistrict } = useListFilters();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformStaff | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);

  const deptList = deptData ?? [];

  const filtered = data ?? [];

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(row: PlatformStaff) {
    setEditing(row);
    setForm({
      name: row.name,
      email: row.email,
      phone: row.phone,
      departmentId: row.department?.id || '',
    });
    setOpen(true);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!form.departmentId) {
      toast('Select a department', 'error');
      return;
    }
    setSaving(true);
    try {
      const body: PlatformStaffWrite = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        departmentId: form.departmentId,
      };
      if (editing) {
        await apiPatch(`${ENDPOINTS.staff}/${editing.id}`, body);
        toast('Staff updated', 'success');
      } else {
        await apiPost(ENDPOINTS.staff, body);
        toast('Staff created', 'success');
      }
      await mutate();
      setOpen(false);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleFreeze(row: PlatformStaff) {
    try {
      await apiPatch(`${ENDPOINTS.staff}/${row.id}`, {
        status: row.status === 'frozen' ? 'active' : 'frozen',
      });
      await mutate();
      toast(row.status === 'frozen' ? 'Staff unfrozen' : 'Staff frozen', 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  if (isLoading && !data) return <ListPageSkeleton showKpis={false} />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Staff"
        description="Platform departmental staff. Separate from RBO sub-staff."
        actions={
          <PermissionGate module="staff">
            <Button onClick={openCreate}>Add staff</Button>
          </PermissionGate>
        }
      />

      <ListFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onReset={reset}
        showTaxonomy={false}
        showDistrict={false}
        search={
          <Input
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, email, phone…"
          />
        }
      >
        <Select
          label="Department"
          value={dept}
          onChange={(e) => setDept(e.target.value)}
        >
          <option value="">All</option>
          {deptList.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as '' | 'active' | 'frozen')}
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="frozen">Frozen</option>
        </Select>
      </ListFilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          title="No staff match filters"
          action={
            <PermissionGate module="staff">
              <Button className="mt-3" onClick={openCreate}>
                Add staff
              </Button>
            </PermissionGate>
          }
        />
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {filtered.map((row) => (
              <StaffMobileCard
                key={row.id}
                staff={row}
                deptList={deptList}
                onEdit={() => openEdit(row)}
                onToggleFreeze={() => void toggleFreeze(row)}
              />
            ))}
          </div>

          <TableShell className="hidden lg:block">
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Contact</Th>
                  <Th>Department</Th>
                  <Th>Status</Th>
                  <Th>Joined</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <ClickableTableRow
                    key={row.id}
                    onActivate={() => openEdit(row)}
                    ariaLabel={`Edit ${row.name}`}
                  >
                    <ClickableTd className="font-medium">{row.name}</ClickableTd>
                    <ClickableTd>
                      <div>{row.email}</div>
                      <div className="text-xs text-text-muted">{row.phone}</div>
                    </ClickableTd>
                    <ClickableTd>{row.department?.name || 'N/A'}</ClickableTd>
                    <ClickableTd>
                      <Badge tone={row.status === 'active' ? 'success' : 'warning'}>
                        {row.status}
                      </Badge>
                    </ClickableTd>
                    <ClickableTd className="text-text-secondary">
                      {formatDateTime(row.createdAt)}
                    </ClickableTd>
                    <TableActionsCell>
                      <PermissionGate module="staff">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => void toggleFreeze(row)}>
                            {row.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                          </Button>
                        </div>
                      </PermissionGate>
                    </TableActionsCell>
                  </ClickableTableRow>
                ))}
              </tbody>
            </Table>
          </TableShell>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit staff' : 'Add staff'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="staff-form" isLoading={saving}>
              Save
            </Button>
          </>
        }
      >
        <form id="staff-form" className="space-y-3" onSubmit={(e) => void onSave(e)}>
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            required
          />
          <Select
            label="Department"
            value={form.departmentId}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                departmentId: e.target.value,
              }))
            }
            required
          >
            <option value="">Select</option>
            {deptList
              .filter((d) => d.status === 'active')
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </Select>
        </form>
      </Modal>
    </div>
  );
}
