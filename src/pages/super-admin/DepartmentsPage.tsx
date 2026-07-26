import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Lock, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { apiDelete, apiPatch, apiPost } from '@/api/axios-helpers';
import { getErrorMessage } from '@/api/axios-client';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { ListFilterBar } from '@/components/filters/ListFilterBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { Table, TableShell, Td, Th } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { useListFilters } from '@/hooks/useListFilters';
import { cn, formatDateTime } from '@/lib/utils';
import type {
  Department,
  DepartmentWrite,
  PlatformAdmin,
  PlatformStaff,
} from '@/types';

type FormState = {
  name: string;
  description: string;
};

const emptyForm: FormState = { name: '', description: '' };

export function DepartmentsPage() {
  const { toast } = useToast();
  const { data, error, isLoading, mutate } = useApiSWR<Department[]>(
    ENDPOINTS.departments,
  );
  const { data: admins } = useApiSWR<PlatformAdmin[]>(ENDPOINTS.admins);
  const { data: staff } = useApiSWR<PlatformStaff[]>(ENDPOINTS.staff);
  const { filters, setFilters, reset } = useListFilters();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'frozen' | 'archived'
  >('all');
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<Department | null>(null);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [hodId, setHodId] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState<Department | null>(null);

  const adminMap = useMemo(() => {
    const m = new Map<string, PlatformAdmin>();
    for (const a of admins ?? []) m.set(a.id, a);
    return m;
  }, [admins]);

  const staffCountByDept = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of staff ?? []) {
      m.set(s.departmentId, (m.get(s.departmentId) ?? 0) + 1);
    }
    return m;
  }, [staff]);

  const eligibleHods = useMemo(() => {
    return (admins ?? []).filter(
      (a) =>
        a.tier === 'department_admin' &&
        a.status === 'active' &&
        (!a.departmentId || a.departmentId === assignOpen?.id),
    );
  }, [admins, assignOpen]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        (d.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [data, query, statusFilter]);

  const kpis = useMemo(() => {
    const list = data ?? [];
    const active = list.filter((d) => d.status === 'active').length;
    const vacant = list.filter((d) => d.status === 'active' && !d.hodAdminId).length;
    const totalStaff = staff?.length ?? 0;
    return { total: list.length, active, vacant, totalStaff };
  }, [data, staff]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(dept: Department) {
    setEditing(dept);
    setForm({
      name: dept.name,
      description: dept.description ?? '',
    });
    setOpen(true);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: DepartmentWrite = {
        name: form.name,
        description: form.description || undefined,
      };
      if (editing) {
        await apiPatch(`${ENDPOINTS.departments}/${editing.id}`, body);
        toast('Department updated', 'success');
      } else {
        await apiPost(ENDPOINTS.departments, body);
        toast('Department created', 'success');
      }
      await mutate();
      setOpen(false);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleFreeze(dept: Department) {
    try {
      await apiPatch(`${ENDPOINTS.departments}/${dept.id}`, {
        status: dept.status === 'frozen' ? 'active' : 'frozen',
      });
      await mutate();
      toast(
        dept.status === 'frozen' ? 'Department enabled' : 'Department frozen',
        'success',
      );
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  async function assignHod(e: FormEvent) {
    e.preventDefault();
    if (!assignOpen || !hodId) return;
    setSaving(true);
    try {
      await apiPatch(`${ENDPOINTS.departments}/${assignOpen.id}`, {
        hodAdminId: hodId,
      });
      await mutate();
      toast('HOD assigned', 'success');
      setAssignOpen(null);
      setHodId('');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function archiveDepartment() {
    if (!confirmArchive) return;
    try {
      await apiDelete(`${ENDPOINTS.departments}/${confirmArchive.id}`);
      await mutate();
      toast('Department archived', 'success');
      setConfirmArchive(null);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  if (isLoading && !data) return <ListPageSkeleton kpiCount={4} />;
  if (error) {
    return <ErrorState message={error.message} onRetry={() => void mutate()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Manage platform departments and assign Department Admins (HODs)."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden />
            Add department
          </Button>
        }
      />

      <ListFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onReset={reset}
        showTaxonomy={false}
        search={
          <Input
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Department name…"
          />
        }
      >
        <Select
          label="Status"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as typeof statusFilter)
          }
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="frozen">Frozen</option>
          <option value="archived">Archived</option>
        </Select>
      </ListFilterBar>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total departments" value={String(kpis.total)} icon={Building2} />
        <KpiCard label="Active" value={String(kpis.active)} icon={Users} />
        <KpiCard label="Vacant HOD seats" value={String(kpis.vacant)} icon={Users} />
        <KpiCard label="Total staff" value={String(kpis.totalStaff)} icon={Users} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No departments"
          actionLabel="Add department"
          onAction={openCreate}
        />
      ) : (
        <TableShell>
          <Table>
            <thead>
              <tr>
                <Th>Department</Th>
                <Th>HOD</Th>
                <Th>Staff</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((dept) => {
                const hod = dept.hodAdminId
                  ? adminMap.get(dept.hodAdminId)
                  : undefined;
                const staffCount = staffCountByDept.get(dept.id) ?? 0;
                return (
                  <tr key={dept.id}>
                    <Td>
                      <p className="font-medium text-text-primary">{dept.name}</p>
                      {dept.description ? (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-text-muted">
                          {dept.description}
                        </p>
                      ) : null}
                    </Td>
                    <Td>
                      {hod ? (
                        <Link
                          to="/admins"
                          className="text-sm text-accent hover:underline"
                        >
                          {hod.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-text-muted">Vacant</span>
                      )}
                    </Td>
                    <Td className="tabular-nums">{staffCount}</Td>
                    <Td>
                      <Badge
                        tone={
                          dept.status === 'active'
                            ? 'success'
                            : dept.status === 'frozen'
                              ? 'warning'
                              : 'neutral'
                        }
                      >
                        {dept.status}
                      </Badge>
                    </Td>
                    <Td className="text-sm text-text-secondary">
                      {formatDateTime(dept.createdAt)}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(dept)}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Edit
                        </Button>
                        {!dept.hodAdminId && dept.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAssignOpen(dept);
                              setHodId('');
                            }}
                          >
                            Assign HOD
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void toggleFreeze(dept)}
                        >
                          <Lock className="h-3.5 w-3.5" aria-hidden />
                          {dept.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-danger hover:border-danger"
                          disabled={staffCount > 0}
                          onClick={() => setConfirmArchive(dept)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Archive
                        </Button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableShell>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit department' : 'Add department'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="dept-form" isLoading={saving}>
              Save
            </Button>
          </>
        }
      >
        <form id="dept-form" className="space-y-3" onSubmit={(e) => void onSave(e)}>
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </form>
      </Modal>

      <Modal
        open={Boolean(assignOpen)}
        onClose={() => setAssignOpen(null)}
        title="Assign HOD"
        description={
          assignOpen
            ? `Select a Department Admin for ${assignOpen.name}.`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssignOpen(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="assign-hod-form"
              isLoading={saving}
              disabled={!hodId}
            >
              Assign
            </Button>
          </>
        }
      >
        <form
          id="assign-hod-form"
          className="space-y-3"
          onSubmit={(e) => void assignHod(e)}
        >
          <Select
            label="Department Admin"
            value={hodId}
            onChange={(e) => setHodId(e.target.value)}
            required
          >
            <option value="">Select admin</option>
            {eligibleHods.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.email})
              </option>
            ))}
          </Select>
          <p className="text-xs text-text-muted">
            Need a new HOD?{' '}
            <Link to="/admins" className="text-accent hover:underline">
              Create on Admins page
            </Link>
          </p>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmArchive)}
        onClose={() => setConfirmArchive(null)}
        title="Archive department?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmArchive(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void archiveDepartment()}>
              Archive
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Archive <strong>{confirmArchive?.name}</strong>? Departments with
          active staff cannot be archived.
        </p>
      </Modal>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Building2;
}) {
  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
            {value}
          </p>
        </div>
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg bg-accent-muted text-accent',
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </Card>
  );
}
