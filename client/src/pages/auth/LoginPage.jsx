import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from './AuthShell.jsx';
import { FieldsForm } from '../../components/common/FieldsForm.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const FIELDS = [
  { name: 'email', label: 'Email', type: 'email', required: true, span: 2, autoComplete: 'email', placeholder: 'you@example.com' },
  { name: 'password', label: 'Password', type: 'password', required: true, span: 2, autoComplete: 'current-password' },
];

// Development fixtures from `npm run seed` in server/. Only rendered by the dev server, never in production builds.
const DEV_ACCOUNTS = [
  ['Super Admin', 'super@autocare.dev'], ['Workshop Admin', 'admin@autocare.dev'], ['Service Advisor', 'advisor@autocare.dev'],
  ['Mechanic', 'mechanic@autocare.dev'], ['Inventory', 'inventory@autocare.dev'], ['Cashier', 'cashier@autocare.dev'], ['Customer', 'customer@autocare.dev'],
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [prefill, setPrefill] = useState({});
  const dest = location.state?.from ?? '/app/dashboard';

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your vehicles and services." footer={<>New here? <Link to="/register" className="font-semibold text-text-primary underline underline-offset-2">Create a customer account</Link></>}>
      <FieldsForm key={prefill.email ?? 'blank'} id="login" fields={FIELDS} initial={prefill} submitLabel="Sign in" onSubmit={({ email, password }) => login(email, password)} onSuccess={() => navigate(dest, { replace: true })} />
      <div className="mt-3 text-right"><Link to="/forgot-password" className="text-caption text-text-secondary hover:text-text-primary underline underline-offset-2">Forgot password?</Link></div>

      {import.meta.env.DEV && (
        <details className="mt-8 rounded-xl border border-dashed border-border-strong p-3 text-caption">
          <summary className="cursor-pointer font-medium text-text-secondary">Development demo accounts</summary>
          <p className="mt-2 text-text-muted">Created by <code>npm run seed</code>. Password: <code>Password123</code></p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DEV_ACCOUNTS.map(([label, email]) => (
              <button key={email} type="button" onClick={() => setPrefill({ email, password: 'Password123' })} className="px-2 py-1 rounded-md bg-surface-muted hover:bg-brand-lime-muted border border-border">{label}</button>
            ))}
          </div>
        </details>
      )}
    </AuthShell>
  );
}
