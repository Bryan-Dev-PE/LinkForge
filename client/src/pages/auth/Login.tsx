import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApiRequestError } from '../../lib/api';
import { Alert, Button, Field, Input } from '../../components/ui';
import { AuthShell } from './AuthShell';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your links and analytics.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" htmlFor="login-email" required>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </Field>
        <Field label="Password" htmlFor="login-password" required>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </Field>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <div className="flex items-center justify-between">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-700 transition hover:text-brand-800">
            Forgot your password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        New to LinkForge?{' '}
        <Link to="/register" className="font-semibold text-brand-700 transition hover:text-brand-800">
          Create an account
        </Link>
      </p>
      <Link
        to="/"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
    </AuthShell>
  );
}