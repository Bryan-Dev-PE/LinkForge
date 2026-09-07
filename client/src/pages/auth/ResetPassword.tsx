import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import { Alert, Button, Field, Input } from '../../components/ui';
import { AuthShell } from './AuthShell';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, password });
      navigate('/login', { replace: true });
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Pick something strong — you will use it to sign in.">
      {!token ? (
        <Alert tone="warning">This link is missing its reset token. Please request a new reset link.</Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="New password" htmlFor="reset-password" hint="At least 8 characters." required>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              disabled={loading}
            />
          </Field>
          <Field label="Confirm password" htmlFor="reset-confirm" required>
            <Input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
              disabled={loading}
            />
          </Field>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Button type="submit" className="w-full" loading={loading}>
            <KeyRound className="h-4 w-4" />
            Reset password
          </Button>
        </form>
      )}
      <Link
        to="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </AuthShell>
  );
}