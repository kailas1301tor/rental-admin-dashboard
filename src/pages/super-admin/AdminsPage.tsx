import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
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
import { Sparkline } from '@/components/ui/Sparkline';
import {
  EmptyState,
  ErrorState,
} from '@/components/ui/States';
import { ListPageSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/Toast';
import { useListFilters } from '@/hooks/useListFilters';
import { AdminCard } from '@/pages/super-admin/admins/AdminCard';
import { adminTierLabel, departmentLabel } from '@/lib/departments';
import { districtLabel } from '@/lib/kerala-districts';
import { cn } from '@/lib/utils';
import type {
  AdminTier,
  Department,
  PlatformAdmin,
  PlatformAdminWrite,
} from '@/types';

const SUPER_CAP = 2;
const GENERAL_CAP = 2;

type FormState = {
  tier: 'general_admin' | 'department_admin';
  name: string;
  phone: string;
  email: string;
  address: string;
  password: string;
  departmentId: string;
};

const emptyForm: FormState = {
  tier: 'general_admin',
  name: '',
  phone: '',
  email: '',
  address: '',
  password: '',
  departmentId: '',
};

export function AdminsPage() {
  const { toast } = useToast();
  const { data, error, isLoading, mutate } = useApiSWR<PlatformAdmin[]>(
    ENDPOINTS.admins,
  );
  const { data: deptData } = useApiSWR<Department[]>(ENDPOINTS.departments);
  const { filters, setFilters, reset, matchesDistrict } = useListFilters();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformAdmin | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState<PlatformAdmin | null>(
    null,
  );

  const deptList = deptData ?? [];
  const HOD_CAP = deptList.length;

  const admins = useMemo(() => {
    return (data ?? []).filter((a) => matchesDistrict(a.districtId));
  }, [data, matchesDistrict]);

  const supers = useMemo(
    () => admins.filter((a) => a.tier === 'super_admin'),
    [admins],
  );
  const generals = useMemo(
    () => admins.filter((a) => a.tier === 'general_admin'),
    [admins],
  );
  const departmentAdmins = useMemo(
    () => admins.filter((a) => a.tier === 'department_admin'),
    [admins],
  );

  const filledDepartmentIds = useMemo(
    () =>
      new Set(
        departmentAdmins
          .map((d) => d.departmentId)
          .filter((id): id is string => Boolean(id)),
      ),
    [departmentAdmins],
  );

  const vacantDepartments = deptList.filter(
    (d) =>
      d.status === 'active' &&
      (!d.hodAdminId ||
        !filledDepartmentIds.has(d.id) ||
        (editing?.tier === 'department_admin' &&
          editing.departmentId === d.id)),
  );

  const hodSeatsLeft = HOD_CAP - departmentAdmins.length;
  const canAdd =
    generals.length < GENERAL_CAP || vacantDepartments.length > 0;

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(admin: PlatformAdmin) {
    if (admin.tier === 'super_admin') return;
    setEditing(admin);
    setForm({
      tier: admin.tier as 'general_admin' | 'department_admin',
      name: admin.name,
      phone: admin.phone,
      email: admin.email,
      address: admin.address,
      password: '',
      departmentId: admin.departmentId ?? '',
    });
    setOpen(true);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const body: Partial<PlatformAdminWrite> = {
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          departmentId: form.departmentId || undefined,
        };
        if (form.password) body.password = form.password;
        await apiPatch(`${ENDPOINTS.admins}/${editing.id}`, body);
        toast('Admin updated', 'success');
      } else {
        if (form.tier === 'general_admin' && generals.length >= GENERAL_CAP) {
          throw { message: 'Maximum of 2 General Admin slots' };
        }
        if (form.tier === 'department_admin' && !form.departmentId) {
          throw { message: 'Select a department' };
        }
        const body: PlatformAdminWrite = {
          tier: form.tier,
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          password: form.password,
          departmentId: form.departmentId || undefined,
        };
        if (!form.password) throw { message: 'Password is required' };
        await apiPost(ENDPOINTS.admins, body);
        toast('Admin created', 'success');
      }
      await mutate();
      setOpen(false);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleFreeze(admin: PlatformAdmin) {
    if (admin.tier === 'super_admin') return;
    try {
      await apiPatch(`${ENDPOINTS.admins}/${admin.id}`, {
        status: admin.status === 'frozen' ? 'active' : 'frozen',
      });
      await mutate();
      toast(
        admin.status === 'frozen' ? 'Admin unfrozen' : 'Admin frozen',
        'success',
      );
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  async function archiveAdmin() {
    if (!confirmArchive) return;
    try {
      await apiDelete(`${ENDPOINTS.admins}/${confirmArchive.id}`);
      await mutate();
      toast('Admin archived', 'success');
      setConfirmArchive(null);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }

  if (isLoading && !data) return <ListPageSkeleton kpiCount={4} />;
  if (error) {
    return (
      <ErrorState message={error.message} onRetry={() => void mutate()} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="hidden text-2xl font-semibold text-text-primary sm:block">Admins</h1>
          <p className="mt-1 max-w-xl text-sm text-text-secondary">
            Manage platform administrators, roles, and access permissions.
          </p>
        </div>
        <Button onClick={openCreate} disabled={!canAdd}>
          <Plus className="h-4 w-4" aria-hidden />
          Add Admin
        </Button>
      </div>

      <ListFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onReset={reset}
        showTaxonomy={false}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Super Admins"
          value={`${supers.length} / ${SUPER_CAP}`}
          hint={
            supers.length >= SUPER_CAP
              ? 'Maximum limit reached'
              : `${SUPER_CAP - supers.length} seat(s) open`
          }
          progress={supers.length / SUPER_CAP}
          filled
        />
        <SummaryCard
          label="General Admins"
          value={`${generals.length} / ${GENERAL_CAP}`}
          hint={
            generals.length >= GENERAL_CAP
              ? 'Slots filled'
              : `${GENERAL_CAP - generals.length} slot(s) open`
          }
          progress={generals.length / GENERAL_CAP}
          filled={generals.length >= GENERAL_CAP}
        />
        <SummaryCard
          label="Department HODs"
          value={`${departmentAdmins.length} / ${HOD_CAP}`}
          hint={`Seats available: ${Math.max(hodSeatsLeft, 0)}`}
          progress={HOD_CAP ? departmentAdmins.length / HOD_CAP : 0}
        />
        <SummaryCard
          label="Total Admins"
          value={String(admins.length)}
          hint="Matching filters"
          spark
        />
      </div>

      <TierSection
        title="Super Admins"
        badge={<Badge tone="accent">View only</Badge>}
        countLabel={`${supers.length} Accounts`}
      >
        <AdminTable
          rows={supers}
          deptList={deptList}
          readOnly
          onEdit={openEdit}
          onFreeze={toggleFreeze}
          onArchive={setConfirmArchive}
        />
      </TierSection>

      <TierSection
        title="General Admins"
        description="Both seats are freezeable."
        badge={
          <Badge tone={generals.length >= GENERAL_CAP ? 'warning' : 'accent'}>
            {generals.length}/{GENERAL_CAP} Slots filled
          </Badge>
        }
        countLabel={`${generals.length} Accounts`}
      >
        <AdminTable
          rows={generals}
          deptList={deptList}
          onEdit={openEdit}
          onFreeze={toggleFreeze}
          onArchive={setConfirmArchive}
        />
      </TierSection>

      <TierSection
        title="Department Admins (HODs)"
        description="One seat per department. Vacant seats can be assigned via Add Admin."
        badge={
          <Badge tone="accent">
            {departmentAdmins.length}/{HOD_CAP} Seats used
          </Badge>
        }
        countLabel={`${departmentAdmins.length} Account${departmentAdmins.length === 1 ? '' : 's'}`}
      >
        <AdminTable
          rows={departmentAdmins}
          deptList={deptList}
          showDepartment
          onEdit={openEdit}
          onFreeze={toggleFreeze}
          onArchive={setConfirmArchive}
        />
        {vacantDepartments.length > 0 && !editing ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {vacantDepartments.map((dept) => (
              <div
                key={dept.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {dept.name}
                  </p>
                  <p className="text-xs text-text-muted">Vacant seat</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setForm({
                      ...emptyForm,
                      tier: 'department_admin',
                      departmentId: dept.id,
                    });
                    setOpen(true);
                  }}
                >
                  Assign
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </TierSection>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit admin' : 'Add admin'}
        description="General Admin or Department HOD. Super Admins cannot be created here."
        className="sm:max-w-xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="admin-form" isLoading={saving}>
              {editing ? 'Save' : 'Create'}
            </Button>
          </>
        }
      >
        <form
          id="admin-form"
          className="space-y-3"
          onSubmit={(e) => void onSave(e)}
        >
          {!editing ? (
            <Select
              label="Admin type"
              value={form.tier}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  tier: e.target.value as FormState['tier'],
                  departmentId: '',
                }))
              }
            >
              <option
                value="general_admin"
                disabled={generals.length >= GENERAL_CAP}
              >
                General Admin{' '}
                {generals.length >= GENERAL_CAP ? '(full)' : ''}
              </option>
              <option
                value="department_admin"
                disabled={vacantDepartments.length === 0}
              >
                Department Admin (HOD)
              </option>
            </Select>
          ) : (
            <p className="text-sm text-text-secondary">
              Type: {adminTierLabel(editing.tier as AdminTier)}
            </p>
          )}
          {form.tier === 'department_admin' ? (
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
              <option value="">Select department</option>
              {vacantDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          ) : null}
          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
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
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            required={!editing}
            hint={editing ? 'Leave blank to keep current password' : undefined}
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
            required
          />
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmArchive)}
        onClose={() => setConfirmArchive(null)}
        title="Archive admin?"
        description="Soft-delete for audit. Account will no longer appear in active hierarchy."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmArchive(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void archiveAdmin()}>
              Archive
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Archive <strong>{confirmArchive?.name}</strong> (
          {confirmArchive?.email})?
        </p>
      </Modal>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  progress,
  filled,
  spark,
}: {
  label: string;
  value: string;
  hint: string;
  progress?: number;
  filled?: boolean;
  spark?: boolean;
}) {
  return (
    <Card className="!p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
        {value}
      </p>
      <p className="mt-1 text-xs text-text-secondary">{hint}</p>
      {typeof progress === 'number' ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-canvas">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              filled ? 'bg-accent' : 'bg-border-strong',
            )}
            style={{ width: `${Math.min(progress, 1) * 100}%` }}
          />
        </div>
      ) : null}
      {spark ? (
        <Sparkline
          values={[3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5]}
          className="mt-3 h-8"
        />
      ) : null}
    </Card>
  );
}

function TierSection({
  title,
  description,
  badge,
  countLabel,
  children,
}: {
  title: string;
  description?: string;
  badge: ReactNode;
  countLabel: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-text-primary sm:text-lg">
              {title}
            </h2>
            {badge}
          </div>
          {description ? (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          ) : null}
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-canvas px-3 py-1 text-xs font-medium text-text-secondary">
          {countLabel}
        </span>
      </div>
      {children}
    </Card>
  );
}

function adminSubtitle(
  admin: PlatformAdmin,
  deptList: Department[],
  showDepartment?: boolean,
) {
  if (showDepartment && admin.departmentId) {
    return departmentLabel(admin.departmentId, deptList);
  }
  if (admin.districtId) {
    return districtLabel(admin.districtId);
  }
  if (admin.slot) {
    return `General Admin · Slot ${admin.slot}`;
  }
  return adminTierLabel(admin.tier);
}

function AdminTable({
  rows,
  deptList,
  readOnly,
  showDepartment,
  onEdit,
  onFreeze,
  onArchive,
}: {
  rows: PlatformAdmin[];
  deptList: Department[];
  readOnly?: boolean;
  showDepartment?: boolean;
  onEdit: (a: PlatformAdmin) => void;
  onFreeze: (a: PlatformAdmin) => void;
  onArchive: (a: PlatformAdmin) => void;
}) {
  if (rows.length === 0) {
    return <EmptyState title="No admins in this tier" />;
  }

  return (
    <div className="space-y-3">
      {rows.map((admin) => (
        <AdminCard
          key={admin.id}
          admin={admin}
          subtitle={adminSubtitle(admin, deptList, showDepartment)}
          readOnly={readOnly}
          onEdit={onEdit}
          onFreeze={onFreeze}
          onArchive={onArchive}
        />
      ))}
    </div>
  );
}
