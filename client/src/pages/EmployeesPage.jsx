import { useState } from 'react';
import { Plus, Pencil, UserX, UserCheck } from 'lucide-react';
import { Page } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { FilterBar } from '../components/common/FilterBar.jsx';
import { FormDialog } from '../components/common/FormDialog.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ROLE_OPTIONS, PHONE_PATTERN } from '../config/options.js';
import { useList } from '../hooks/useList.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { patch, post, parseError } from '../services/api.js';
import { ROLE_LABELS, formatDate } from '../utils/format.js';

const PASSWORD_RULE = (v) => (v.length < 8 ? 'Password must be at least 8 characters' : !/[A-Za-z]/.test(v) || !/\d/.test(v) ? 'Needs a letter and a number' : null);

export default function EmployeesPage() {
  const list = useList('/users', { role: '' });
  const { user: me, role: myRole } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const privileged = ['super_admin', 'workshop_admin'];
  // only a super admin can hand out / change admin roles (also enforced by the API)
  const assignable = ROLE_OPTIONS.filter((o) => myRole === 'super_admin' || !privileged.includes(o.value));

  async function toggle(u) {
    try { await patch(`/users/${u._id}`, { isActive: !u.isActive }); toast.success(u.isActive ? 'Account deactivated' : 'Account reactivated'); list.reload(); } catch (e) { toast.error('Update failed', parseError(e).message); }
  }

  const editing = Boolean(form?._id);
  const fields = [
    { name: 'name', label: 'Full name', required: true }, { name: 'email', label: 'Email', type: 'email', required: true, disabled: editing },
    { name: 'role', label: 'Role', type: 'select', required: true, options: assignable },
    { name: 'phone', label: 'Phone', type: 'tel', pattern: PHONE_PATTERN, patternMessage: 'Enter a valid phone number' },
    ...(editing ? [] : [{ name: 'password', label: 'Temporary password', type: 'password', required: true, span: 2, helper: 'Share securely; the user can change it from their profile', validate: PASSWORD_RULE }]),
  ];

  const columns = [
    { key: 'name', header: 'User', render: (u) => <div><p className="font-medium text-text-primary">{u.name}{u._id === me._id && <span className="text-text-muted font-normal"> (you)</span>}</p><p className="text-caption text-text-muted">{u.email}</p></div> },
    { key: 'role', header: 'Role', render: (u) => <Badge variant={privileged.includes(u.role) ? 'lime' : 'neutral'} size="sm">{ROLE_LABELS[u.role]}</Badge> },
    { key: 'phone', header: 'Phone', hideBelow: 'md' }, { key: 'lastLoginAt', header: 'Last sign-in', hideBelow: 'lg', render: (u) => formatDate(u.lastLoginAt) },
    { key: 'isActive', header: 'Status', render: (u) => <StatusBadge status={u.isActive ? 'active' : 'inactive'} /> },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', render: (u) => {
      const locked = (privileged.includes(u.role) && myRole !== 'super_admin') || u._id === me._id;
      return (<div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" iconOnly aria-label={`Edit ${u.name}`} icon={<Pencil size={15} />} disabled={locked} onClick={() => setForm(u)} />
        <Button size="sm" variant="ghost" iconOnly aria-label={`${u.isActive ? 'Deactivate' : 'Reactivate'} ${u.name}`} icon={u.isActive ? <UserX size={15} /> : <UserCheck size={15} />} disabled={locked} onClick={() => toggle(u)} />
      </div>);
    } },
  ];

  return (
    <Page title="Staff & users" description="Create staff accounts, assign roles and deactivate access. Role changes are written to the audit log." actions={<Button icon={<Plus size={16} />} onClick={() => setForm({ role: 'service_advisor' })}>Add staff account</Button>}>
      <FilterBar list={list} placeholder="Search name, email or phone…" selects={[{ name: 'role', label: 'All roles', options: ROLE_OPTIONS.map((o) => ({ ...o, label: ROLE_LABELS[o.value] })) }]} />
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} pagination={list.pagination} onPageChange={list.setPage} caption="Users" emptyTitle="No users found" />
      <FormDialog open={Boolean(form)} onClose={() => setForm(null)} title={editing ? `Edit ${form.name}` : 'Add staff account'} fields={fields} initial={form ?? {}} key={form?._id ?? 'new'} submitLabel={editing ? 'Save changes' : 'Create account'}
        onSubmit={async (v) => { await (editing ? patch(`/users/${form._id}`, { name: v.name, role: v.role, phone: v.phone }) : post('/users', v)); toast.success(editing ? 'User updated' : 'Account created'); list.reload(); }} />
    </Page>
  );
}
