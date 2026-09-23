import { useMemo, useState, type FormEvent } from 'react';
import { Building2, Plus, Users } from 'lucide-react';
import { apiDelete, apiPut, apiPost } from '@/api/axios-helpers';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
import { CanAccess } from '@/components/auth/CanAccess';
import { ListFilterBar } from '@/components/filters/ListFilterBar';
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
import { useToast } from '@/components/ui/Toast';
import { DepartmentCard } from '@/pages/super-admin/departments/DepartmentCard';
import { useListFilters } from '@/hooks/useListFilters';
import {
  apiFailureFieldErrors,
  clearFieldError,
  emptyFieldErrors,
  requireFields,
  scrollToFirstError,
  type FieldErrors,
} from '@/lib/form-errors';
import { cn } from '@/lib/utils';
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
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'frozen' | 'archived'
  >('all');

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    return params;
  }, [query, statusFilter]);

  const { data, error, isLoading, mutate } = useApiSWR<Department[]>(
    `${ENDPOINTS.departments}?${searchParams.toString()}`,
  );
  const { data: deptAdmins } = useApiSWR<PlatformAdmin[]>(ENDPOINTS.departmentAdmins);
  const { data: staff } = useApiSWR<PlatformStaff[]>(ENDPOINTS.staff);
  const { filters, setFilters, reset } = useListFilters();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyFieldErrors);
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState<Department | null>(null);

  const adminMap = useMemo(() => {
    const m = new Map<string, PlatformAdmin>();
    for (const a of deptAdmins ?? []) m.set(a.id, a);
    return m;
  }, [deptAdmins]);

  const staffCountByDept = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of staff ?? []) {
      m.set(s.departmentId, (m.get(s.departmentId) ?? 0) + 1);
    }
    return m;
  }, [staff]);

  const rows = useMemo(() => {
    return data ?? [];
  }, [data]);

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
    setFieldErrors(emptyFieldErrors());
    setOpen(true);
  }

  function openEdit(dept: Department) {
    setEditing(dept);
    setForm({
      name: dept.name,
      description: dept.description ?? '',
    });
    setFieldErrors(emptyFieldErrors());
    setOpen(true);
  }

  function patchForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((m) => clearFieldError(m, key));
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const { fieldErrors: next, message } = requireFields(
      { ...form },
      [{ field: 'name', label: 'Name' }],
    );
    if (message) {
      setFieldErrors(next);
      toast(message, 'error');
      scrollToFirstError(next);
      return;
    }
    setFieldErrors(emptyFieldErrors());
    setSaving(true);
    try {
      const body: DepartmentWrite = {
        name: form.name,
        description: form.description || undefined,
      };
      if (editing) {
        await apiPut(`${ENDPOINTS.departments}/${editing.id}`, body);
        toast('Department updated', 'success');
      } else {
        await apiPost(ENDPOINTS.departments, body);
        toast('Department created', 'success');
      }
      await mutate();
      setOpen(false);
    } catch (err) {
      const failure = apiFailureFieldErrors(err);
      setFieldErrors(failure.fieldErrors);
      toast(failure.message, 'error');
      scrollToFirstError(failure.fieldErrors);
    } finally {
      setSaving(false);
    }
  }

  async function toggleFreeze(dept: Department) {
    try {
      await apiPut(`${ENDPOINTS.departments}/${dept.id}`, {
        status: dept.status === 'frozen' ? 'active' : 'frozen',
      });
      await mutate();
      toast(
        dept.status === 'frozen' ? 'Department enabled' : 'Department frozen',
        'success',
      );
    } catch (err) {
      toast(apiFailureFieldErrors(err).message, 'error');
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
      toast(apiFailureFieldErrors(err).message, 'error');
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
        description="Manage platform departments."
        actions={
          <CanAccess permission="change_department">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              Add department
            </Button>
          </CanAccess>
        }
      />

      <ListFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onReset={reset}
        showDistrict={false}
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
          action={
            <CanAccess permission="change_department">
              <Button className="mt-3" onClick={openCreate}>
                Add department
              </Button>
            </CanAccess>
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((dept) => {
            const hod = dept.hodAdminId
              ? adminMap.get(dept.hodAdminId)
              : undefined;
            const staffCount = staffCountByDept.get(dept.id) ?? 0;
            return (
              <DepartmentCard
                key={dept.id}
                dept={dept}
                hod={hod}
                staffCount={staffCount}
                onEdit={openEdit}
                onToggleFreeze={(d) => void toggleFreeze(d)}
                onArchive={setConfirmArchive}
              />
            );
          })}
        </div>
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
            name="name"
            value={form.name}
            onChange={(e) => patchForm('name', e.target.value)}
            error={fieldErrors.name}
            required
          />
          <Input
            label="Description"
            name="description"
            value={form.description}
            onChange={(e) => patchForm('description', e.target.value)}
            error={fieldErrors.description}
          />
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
