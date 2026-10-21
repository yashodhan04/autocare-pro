import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from './AuthShell.jsx';
import { FieldsForm } from '../../components/common/FieldsForm.jsx';
import { post } from '../../services/api.js';
import { SuccessState } from '../../components/ui/States.jsx';

export default function ForgotPasswordPage() {
  const [result, setResult] = useState(null);
  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll generate a reset link." footer={<Link to="/login" className="font-semibold text-text-primary underline underline-offset-2">Back to sign in</Link>}>
      {result ? (
        <div className="space-y-4">
          <SuccessState title="Check your inbox" message={result.message} />
          {result.devResetLink && (
            <p className="rounded-xl border border-dashed border-border-strong p-3 text-caption text-text-secondary">
              <strong>Development only</strong> — email delivery isn't configured in this version, so the link is shown here:{' '}
              <Link className="underline break-all" to={new URL(result.devResetLink).pathname + new URL(result.devResetLink).search}>Open reset page</Link>
            </p>
          )}
        </div>
      ) : (
        <FieldsForm id="forgot" fields={[{ name: 'email', label: 'Email', type: 'email', required: true, span: 2 }]} submitLabel="Send reset link" onSubmit={async (b) => (await post('/auth/forgot-password', b)).data} onSuccess={setResult} />
      )}
    </AuthShell>
  );
}
