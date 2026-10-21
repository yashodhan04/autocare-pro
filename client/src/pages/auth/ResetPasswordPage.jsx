import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthShell } from './AuthShell.jsx';
import { FieldsForm } from '../../components/common/FieldsForm.jsx';
import { post } from '../../services/api.js';
import { ErrorState, SuccessState } from '../../components/ui/States.jsx';

const FIELDS = [
  { name: 'password', label: 'New password', type: 'password', required: true, span: 2, helper: 'At least 8 characters with a letter and a number', validate: (v) => (v.length < 8 ? 'Password must be at least 8 characters' : !/[A-Za-z]/.test(v) || !/\d/.test(v) ? 'Password needs a letter and a number' : null) },
  { name: 'confirm', label: 'Confirm new password', type: 'password', required: true, span: 2, validate: (v, all) => (v !== all.password ? 'Passwords do not match' : null) },
];

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [done, setDone] = useState(false);
  const footer = <Link to="/login" className="font-semibold text-text-primary underline underline-offset-2">Back to sign in</Link>;

  return (
    <AuthShell title="Choose a new password" footer={footer}>
      {!token ? <ErrorState title="Missing reset token" message="Open the link from your reset email, or request a new one." />
        : done ? <SuccessState title="Password updated" message="You can now sign in with your new password." />
        : <FieldsForm id="reset" fields={FIELDS} submitLabel="Update password" onSubmit={({ password }) => post('/auth/reset-password', { token, password })} onSuccess={() => setDone(true)} />}
    </AuthShell>
  );
}
