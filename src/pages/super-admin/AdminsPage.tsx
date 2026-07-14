import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiDelete, apiPatch, apiPost } from '@/api/axios-helpers';
import { getErrorMessage } from '@/api/axios-client';
import { ENDPOINTS } from '@/api/endpoints';
import { useApiSWR } from '@/api/swr-helpers';
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
  PageLoader,
} from '@/components/ui/States';
import { Table, TableShell, Td, Th } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import {
  adminTierLabel,
  departmentLabel,
  HOD_DEPARTMENTS,
} from '@/lib/departments';
import { cn, formatDateTime } from '@/lib/utils';
import type {
  AdminTier,
  HodDepartment,
  PlatformAdmin,
  PlatformAdminWrite,
} from '@/types';

const SUPER_CAP = 2;
const GENERAL_CAP = 2;
const HOD_CAP = HOD_DEPARTMENTS.length;

type FormState = {
  tier: 'general_admin' | 'department_admin';
  name: string;
  phone: string;
  email: string;
  address: string;
  password: string;
  department: HodDepartment | '';
};

const emptyForm: FormState = {
  tier: 'general_admin',
  name: '',
  phone: '',
  email: '',
  address: '',
  password: '',
  department: '',
};

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function AdminsPage() {
  const { toast } = useToast();
  const { data, error, isLoading, mutate } = useApiSWR<PlatformAdmin[]>(
    ENDPOINTS.admins,
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformAdmin | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState<PlatformAdmin | null>(
    null,
  );

  const admins = data ?? [];
  const supers = useMemo(
    () => admins.filter((a) => a.tier === 'super_admin'),
    [admins],
  );
  const generals = useMemo(
    () => admins.filter((a) => a.tier === 'general_admin'),
    [admins],
  );
  const departments = useMemo(
    () => admins.filter((a) => a.tier === 'department_admin'),
    [admins],
  );

  const filledDepartments = useMemo(
    () =>
      new Set(
        departments
          .map((d) => d.department)
          .filter((d): d is HodDepartment => Boolean(d)),
      ),
    [departments],
  );

  const vacantDepartments = HOD_DEPARTMENTS.filter(
    (d) =>
      !filledDepartments.has(d) ||
      (editing?.tier === 'department_admin' && editing.department === d),
  );

  const hodSeatsLeft = HOD_CAP - departments.length;
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
      department: admin.department ?? '',
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
          department: form.department || undefined,
        };
        if (form.password) body.password = form.password;
        await apiPatch(`${ENDPOINTS.admins}/${editing.id}`, body);
        toast('Admin updated', 'success');
      } else {
        if (form.tier === 'general_admin' && generals.length >= GENERAL_CAP) {
          throw { message: 'Maximum of 2 General Admin slots' };
        }
        if (form.tier === 'department_admin' && !form.department) {
          throw { message: 'Select a department' };
        }
        const body: PlatformAdminWrite = {
          tier: form.tier,
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          password: form.password,
          department: form.department || undefined,
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

  if (isLoading && !data) return <PageLoader />;
  if (error) {
    return (
      <ErrorState message={error.message} onRetry={() => void mutate()} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Admins</h1>
          <p className="mt-1 max-w-xl text-sm text-text-secondary">
            Manage platform administrators, roles, and access permissions.
          </p>
        </div>
        <Button onClick={openCreate} disabled={!canAdd}>
          <Plus className="h-4 w-4" aria-hidden />
          Add Admin
        </Button>
      </div>

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
          value={`${departments.length} / ${HOD_CAP}`}
          hint={`Seats available: ${Math.max(hodSeatsLeft, 0)}`}
          progress={departments.length / HOD_CAP}
        />
        <SummaryCard
          label="Total Admins"
          value={String(admins.length)}
          hint="Active administrators"
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
            {departments.length}/{HOD_CAP} Seats used
          </Badge>
        }
        countLabel={`${departments.length} Account${departments.length === 1 ? '' : 's'}`}
      >
        <AdminTable
          rows={departments}
          showDepartment
          onEdit={openEdit}
          onFreeze={toggleFreeze}
          onArchive={setConfirmArchive}
        />
        {vacantDepartments.length > 0 && !editing ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {vacantDepartments.map((dept) => (
              <div
                key={dept}
                className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {departmentLabel(dept)}
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
                      department: dept,
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
                  department: '',
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
              value={form.department}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  department: e.target.value as HodDepartment | '',
                }))
              }
              required
            >
              <option value="">Select department</option>
              {vacantDepartments.map((d) => (
                <option key={d} value={d}>
                  {departmentLabel(d)}
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

function AdminTable({
  rows,
  readOnly,
  showDepartment,
  onEdit,
  onFreeze,
  onArchive,
}: {
  rows: PlatformAdmin[];
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
    <TableShell>
      <Table>
        <thead>
          <tr>
            <Th>Admin</Th>
            <Th>Contact</Th>
            <Th>Status</Th>
            <Th>Last active</Th>
            <Th className="text-right">Action</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((admin) => (
            <tr key={admin.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
                    {initials(admin.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">
                      {admin.name}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      {showDepartment && admin.department
                        ? departmentLabel(admin.department)
                        : admin.slot
                          ? `General Admin · Slot ${admin.slot}`
                          : adminTierLabel(admin.tier)}
                    </p>
                  </div>
                </div>
              </Td>
              <Td>
                <p className="text-sm text-text-primary">{admin.email}</p>
                <p className="text-xs text-text-muted">{admin.phone}</p>
              </Td>
              <Td>
                <StatusPill status={admin.status} />
              </Td>
              <Td className="text-sm text-text-secondary">
                {admin.lastActiveAt ? formatDateTime(admin.lastActiveAt) : '—'}
              </Td>
              <Td>
                {readOnly ? (
                  <p className="text-right text-text-muted">—</p>
                ) : (
                  <RowActions
                    admin={admin}
                    onEdit={onEdit}
                    onFreeze={onFreeze}
                    onArchive={onArchive}
                  />
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableShell>
  );
}

function RowActions({
  admin,
  onEdit,
  onFreeze,
  onArchive,
}: {
  admin: PlatformAdmin;
  onEdit: (a: PlatformAdmin) => void;
  onFreeze: (a: PlatformAdmin) => void;
  onArchive: (a: PlatformAdmin) => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <Button
        size="sm"
        variant="outline"
        className="px-2.5"
        onClick={() => onEdit(admin)}
        aria-label={`Edit ${admin.name}`}
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">Edit</span>
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="px-2.5"
        onClick={() => onFreeze(admin)}
        aria-label={
          admin.status === 'frozen'
            ? `Unfreeze ${admin.name}`
            : `Freeze ${admin.name}`
        }
      >
        <Lock className="h-3.5 w-3.5 text-accent" aria-hidden />
        <span className="hidden sm:inline">
          {admin.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
        </span>
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="px-2.5 text-danger hover:border-danger hover:text-danger"
        onClick={() => onArchive(admin)}
        aria-label={`Delete ${admin.name}`}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">Delete</span>
      </Button>
    </div>
  );
}

function StatusPill({ status }: { status: PlatformAdmin['status'] }) {
  const active = status === 'active';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        active
          ? 'border-success/30 bg-success-muted text-success'
          : status === 'frozen'
            ? 'border-warning/30 bg-warning-muted text-warning'
            : 'border-border bg-canvas text-text-secondary',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          active
            ? 'bg-success'
            : status === 'frozen'
              ? 'bg-warning'
              : 'bg-text-muted',
        )}
        aria-hidden
      />
      {status}
    </span>
  );
}
