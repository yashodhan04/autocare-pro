import { Page, DetailList } from '../components/common/Page.jsx';
import { FieldsForm } from '../components/common/FieldsForm.jsx';
import { SectionCard } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { post } from '../services/api.js';
import { PHONE_PATTERN } from '../config/options.js';
import { ROLE_LABELS, formatDate } from '../utils/format.js';

const PASSWORD_RULE = (v) => (v.length < 8 ? 'Password must be at least 8 characters' : !/[A-Za-z]/.test(v) || !/\d/.test(v) ? 'Needs a letter and a number' : null);

export default function ProfilePage() {
  const { user, customer, updateProfile } = useAuth();
  const toast = useToast();
  return (
    <Page title="My profile" description="Update your details and password." badge={<Badge variant="lime">{ROLE_LABELS[user.role]}</Badge>}>
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Personal details">
          <FieldsForm id="profile" key={user.updatedAt} initial={user} submitLabel="Save changes"
            fields={[{ name: 'name', label: 'Full name', required: true }, { name: 'phone', label: 'Phone', type: 'tel', pattern: PHONE_PATTERN, patternMessage: 'Enter a valid phone number' }, { name: 'email', label: 'Email', type: 'email', disabled: true, span: 2, helper: 'Contact an administrator to change your sign-in email' }]}
            onSubmit={({ name, phone }) => updateProfile({ name, phone })} onSuccess={() => toast.success('Profile updated')} />
          <div className="mt-6 pt-5 border-t border-border"><DetailList items={[['Member since', formatDate(user.createdAt)], ['Last sign-in', formatDate(user.lastLoginAt)], customer && ['Customer address', customer.address]]} /></div>
        </SectionCard>
        <SectionCard title="Change password">
          <FieldsForm id="password" key="pw" submitLabel="Update password"
            fields={[
              { name: 'currentPassword', label: 'Current password', type: 'password', required: true, span: 2, autoComplete: 'current-password' },
              { name: 'newPassword', label: 'New password', type: 'password', required: true, span: 2, autoComplete: 'new-password', validate: PASSWORD_RULE, helper: 'At least 8 characters with a letter and a number' },
              { name: 'confirm', label: 'Confirm new password', type: 'password', required: true, span: 2, validate: (v, all) => (v !== all.newPassword ? 'Passwords do not match' : null) }]}
            onSubmit={({ currentPassword, newPassword }) => post('/auth/change-password', { currentPassword, newPassword })} onSuccess={() => toast.success('Password changed')} />
        </SectionCard>
      </div>
    </Page>
  );
}
