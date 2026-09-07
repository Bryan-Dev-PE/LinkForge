import { useState, type FormEvent } from 'react';
import { CheckCircle2, Link2, Sparkles } from 'lucide-react';
import { api, ApiRequestError } from '../lib/api';
import type { Link } from '../types';
import { baseUrl, hostnameOf } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Alert, Button, CopyButton, Field, Input } from './ui';

export function ShortenForm() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Link | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.post<{ link: Link }>('/api/links', {
        originalUrl: url,
        customAlias: alias.trim() || undefined,
      });
      setResult(data.link);
      setUrl('');
      setAlias('');
      setShowAdvanced(false);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const apiBase = baseUrl();

  return (
    <div className="w-full">
      {result ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-left shadow-sm">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-semibold">Your short link is ready</p>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all text-lg font-bold text-brand-700 hover:underline"
              >
                {result.shortUrl}
              </a>
              <p className="mt-1 flex items-center gap-1 truncate text-sm text-slate-500">
                <Link2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {hostnameOf(result.originalUrl)} — {result.originalUrl}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <CopyButton text={result.shortUrl} label="Copy" className="px-3 py-2" />
              <Button size="sm" onClick={() => setResult(null)}>
                Shorten another
              </Button>
            </div>
          </div>
          {user ? (
            <p className="mt-4 text-sm text-slate-600">
              Track clicks in your{' '}
              <a href="/dashboard/links" className="font-semibold text-brand-700 hover:underline">
                dashboard
              </a>
              .
            </p>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              Create{' '}
              <a href="/register" className="font-semibold text-brand-700 hover:underline">
                a free account
              </a>{' '}
              to use custom aliases and see analytics.
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 text-left">
          <Field label="Paste a long URL" htmlFor="shorten-url" required>
            <Input
              id="shorten-url"
              type="url"
              placeholder="https://example.com/very/long/path"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={loading}
            />
          </Field>
          {showAdvanced ? (
            <Field
              label="Custom alias"
              htmlFor="shorten-alias"
              hint={user ? 'Lowercase letters, numbers, hyphens, and underscores.' : 'Requires a free account.'}
            >
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-2.5 text-sm text-slate-500">
                  {apiBase ? `${apiBase}/` : 'your-link.xyz/'}
                </span>
                <Input
                  id="shorten-alias"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="my-alias"
                  disabled={loading || !user}
                />
              </div>
            </Field>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 transition hover:text-brand-800"
            >
              <Sparkles className="h-4 w-4" />
              {showAdvanced ? 'Hide advanced options' : 'Custom alias'}
            </button>
            <Button type="submit" loading={loading} disabled={!url.trim()}>
              Shorten URL
            </Button>
          </div>
          {error ? <Alert tone="error">{error}</Alert> : null}
        </form>
      )}
    </div>
  );
}