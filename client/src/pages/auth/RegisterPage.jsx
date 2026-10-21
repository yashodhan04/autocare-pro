import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from './AuthShell.jsx';
import { FieldsForm } from '../../components/common/FieldsForm.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const PHONE = /^[+\d][\d\s-]{6,17}$/;

const FIELDS = [
  { name: 'name', label: 'Full name', required: true, span: 2, autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel', required: true, autoComplete: 'tel', placeholder: '+91 98765 43210', pattern: PHONE, patternMessage: 'Enter a valid phone number' },
  {
    name: 'password', label: 'Password', type: 'password', required: true, span: 2, autoComplete: 'new-password', helper: 'At least 8 characters with a letter and a number',
    validate: (v) => (v.length < 8 ? 'Password must be at least 8 characters' : !/[A-Za-z]/.test(v) || !/\d/.test(v) ? 'Password needs a letter and a number' : null),
  },
  { name: 'confirm', label: 'Confirm password', type: 'password', required: true, span: 2, autoComplete: 'new-password', validate: (v, all) => (v !== all.password ? 'Passwords do not match' : null) },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  return (
    <AuthShell title="Create your account" subtitle="Register vehicles, book services and approve estimates online." footer={<>Already registered? <Link to="/login" className="font-semibold text-text-primary underline underline-offset-2">Sign in</Link></>}>
      <FieldsForm id="register" fields={FIELDS} submitLabel="Create account" onSubmit={({ confirm: _c, ...body }) => register(body)} onSuccess={() => navigate('/app/dashboard', { replace: true })} />
    </AuthShell>
  );
}
