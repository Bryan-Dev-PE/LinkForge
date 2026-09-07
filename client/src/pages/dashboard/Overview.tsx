import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, BarChart3, Link2, MousePointerClick, Plus, QrCode, TrendingUp } from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import type { LinkPage } from '../../types';
import { formatCompact } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { Alert, Button, Card, CopyButton, EmptyState, StatusBadge } from '../../components/ui';
import { Spinner } from '../../components/Spinner';
import { StatCard } from '../../components/StatCard';
import { hostnameOf } from '../../lib/format';

export function Overview() {
  const { user } = useAuth();
  const [data, setData] = useState<LinkPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get<LinkPage>('/api/links?page=1&limit=50&sortBy=clicks&order=desc')
      .then((page) => {
        if (active) setData(page);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiRequestError ? err.message : 'Could not load your links.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const items = data?.items ?? [];
    const totalClicks = items.reduce((sum, link) => sum + link.clickCount, 0);
    const active = items.filter((link) => link.effectiveStatus === 'ACTIVE').length;
    const expiringSoon = items.filter((link) => {
      if (!link.expiresAt) return false;
      const remaining = new Date(link.expiresAt).getTime() - Date.now();
      return remaining > 0 && remaining < 7 * 24 * 60 * 60 * 1000;
    }).length;
    return { totalLinks: data?.total ?? 0, totalClicks, active, expiringSoon };
  }, [data]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  if (error) {
    return <Alert tone="error">{error}</Alert>;
  }

  const topLinks = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Welcome back, {user?.name.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here is what is happening with your links.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total links" value={formatCompact(stats.totalLinks)} icon={<Link2 className="h-5 w-5" />} accent="brand" />
        <StatCard label="Total clicks" value={formatCompact(stats.totalClicks)} icon={<MousePointerClick className="h-5 w-5" />} accent="emerald" />
        <StatCard label="Active links" value={stats.active} icon={<Activity className="h-5 w-5" />} accent="sky" />
        <StatCard label="Expiring this week" value={stats.expiringSoon} icon={<TrendingUp className="h-5 w-5" />} accent="amber" />
      </div>

      {stats.totalLinks === 0 ? (
        <Card>
          <EmptyState
            icon={<Link2 className="h-6 w-6" />}
            title="No links yet"
            description="Create your first short link and start tracking clicks in seconds."
            action={
              <Link to="/dashboard/links">
                <Button>
                  <Plus className="h-4 w-4" />
                  Create a link
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Top performing links</h2>
              <p className="text-sm text-slate-500">Ranked by click count</p>
            </div>
            <Link to="/dashboard/links" className="text-sm font-semibold text-brand-600 transition hover:text-brand-700">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {topLinks.slice(0, 5).map((link, index) => (
              <li key={link.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="w-6 text-sm font-extrabold text-slate-400">#{index + 1}</span>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Link2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={link.shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm font-semibold text-slate-900 hover:text-brand-700"
                    >
                      {link.customAlias ?? link.shortCode}
                    </a>
                    <StatusBadge status={link.effectiveStatus} />
                    <CopyButton text={link.shortUrl} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    → {hostnameOf(link.originalUrl)} · {link.originalUrl}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-base font-extrabold text-slate-900">{link.clickCount}</span>
                  <Link
                    to={`/dashboard/links/${link.id}/analytics`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand-600"
                    aria-label="View analytics"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Link>
                  <Link
                    to={`/dashboard/links/${link.id}/qr`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand-600"
                    aria-label="QR code"
                  >
                    <QrCode className="h-4 w-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="flex flex-col items-start justify-between gap-4 bg-gradient-to-br from-brand-600 to-violet-600 p-6 text-white sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold">Create a QR code for any link</h2>
          <p className="mt-1 text-sm text-brand-100">
            Customize colors, add your logo, and download PNG or SVG.
          </p>
        </div>
        <Link to="/dashboard/qr">
          <Button variant="primary" className="bg-white text-brand-700 hover:bg-brand-50">
            <QrCode className="h-4 w-4" />
            Open QR Studio
          </Button>
        </Link>
      </Card>
    </div>
  );
}