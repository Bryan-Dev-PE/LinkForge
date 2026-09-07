import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeft,
  CalendarClock,
  Chrome,
  Cpu,
  ExternalLink,
  Globe2,
  Monitor,
  MousePointerClick,
  Smartphone,
  Tablet,
  Users,
} from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import type { AnalyticsSummary, BreakdownRow, Link as LinkRow, SeriesPoint } from '../../types';
import { formatNumber } from '../../lib/format';
import { Alert, Button, Card, StatusBadge } from '../../components/ui';
import { Spinner } from '../../components/Spinner';
import { StatCard } from '../../components/StatCard';

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#64748b', '#84cc16', '#14b8a6'];

interface PieDatum {
  name: string;
  value: number;
  count: number;
}

function DonutCard({ title, subtitle, data, icon }: { title: string; subtitle?: string; data: BreakdownRow[]; icon: React.ReactNode }) {
  const isEmpty = data.length === 0;
  const chartData: PieDatum[] = isEmpty
    ? [{ name: 'No data', value: 100, count: 0 }]
    : data.map((row) => ({ name: row.name, value: row.value, count: Math.max(0, Math.round(row.value)) }));

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {isEmpty ? <p className="mt-6 text-sm text-slate-500">No {title.toLowerCase()} recorded yet.</p> : null}
      <div className="mt-2 flex items-center gap-2">
        <div className="h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72} paddingAngle={2} strokeWidth={0}>
                {chartData.map((entry, index) => (
                  <Cell key={entry.name} fill={entry.name === 'No data' ? '#e2e8f0' : PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | string) => [`${value}%`, 'Share']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="min-w-0 flex-1 space-y-1.5">
          {data.slice(0, 5).map((row) => (
            <li key={row.name} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-slate-600">{row.name}</span>
              <span className="font-semibold text-slate-900">{row.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function BarPanel({ title, subtitle, data, icon }: { title: string; subtitle?: string; data: BreakdownRow[]; icon: React.ReactNode }) {
  const isEmpty = data.length === 0;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {isEmpty ? (
        <p className="mt-6 text-sm text-slate-500">No {title.toLowerCase()} recorded yet.</p>
      ) : (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tickFormatter={(value: number) => `${value}%`} axisLine={false} tickLine={false} fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                width={96}
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickFormatter={(name: string) => (name.length > 16 ? `${name.slice(0, 15)}…` : name)}
              />
              <Tooltip formatter={(value: number | string) => [`${value}%`, 'Share']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                {data.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function LinkAnalytics() {
  const { id } = useParams<{ id: string }>();
  const [link, setLink] = useState<LinkRow | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [days, setDays] = useState(30);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [devices, setDevices] = useState<BreakdownRow[]>([]);
  const [browsers, setBrowsers] = useState<BreakdownRow[]>([]);
  const [systems, setSystems] = useState<BreakdownRow[]>([]);
  const [countries, setCountries] = useState<BreakdownRow[]>([]);
  const [referrers, setReferrers] = useState<BreakdownRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    Promise.all([
      api.get<{ link: LinkRow }>(`/api/links/${id}`).then((data) => data.link),
      api.get<{ summary: AnalyticsSummary }>(`/api/links/${id}/analytics/summary`).then((data) => data.summary),
      api.get<{ breakdown: BreakdownRow[] }>(`/api/links/${id}/analytics/devices`).then((data) => data.breakdown),
      api.get<{ breakdown: BreakdownRow[] }>(`/api/links/${id}/analytics/browsers`).then((data) => data.breakdown),
      api.get<{ breakdown: BreakdownRow[] }>(`/api/links/${id}/analytics/operating-systems`).then((data) => data.breakdown),
      api.get<{ breakdown: BreakdownRow[] }>(`/api/links/${id}/analytics/countries`).then((data) => data.breakdown),
      api.get<{ breakdown: BreakdownRow[] }>(`/api/links/${id}/analytics/referrers`).then((data) => data.breakdown),
    ])
      .then(([linkResult, summaryResult, d, b, os, c, r]) => {
        if (!active) return;
        setLink(linkResult);
        setSummary(summaryResult);
        setDevices(d);
        setBrowsers(b);
        setSystems(os);
        setCountries(c);
        setReferrers(r);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiRequestError ? err.message : 'Could not load analytics.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    api
      .get<{ series: SeriesPoint[] }>(`/api/links/${id}/analytics/clicks?days=${days}`)
      .then((data) => {
        if (active) setSeries(data.series);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [id, days]);

  const areaData = useMemo(
    () =>
      series.map((point) => ({
        ...point,
        label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${point.date}T00:00:00`)),
      })),
    [series],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-28">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard/links" className="text-sm font-medium text-slate-500 transition hover:text-slate-800">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Back to links
        </Link>
        <Alert tone="error">{error ?? 'Link not found.'}</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard/links" className="text-slate-400 transition hover:text-slate-600" aria-label="Back to links">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              /{link.customAlias ?? link.shortCode}
            </h1>
            <StatusBadge status={link.effectiveStatus} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-500">
            <a href={link.shortUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline">
              {link.shortUrl}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <span className="inline-flex items-center gap-1 font-mono">{link.originalUrl}</span>
            {link.expiresAt ? (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-4 w-4" />
                Expires {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(link.expiresAt))}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/dashboard/links/${link.id}/qr`}>
            <Button variant="secondary">QR code</Button>
          </Link>
        </div>
      </div>

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total clicks" value={formatNumber(summary.totalClicks)} icon={<MousePointerClick className="h-5 w-5" />} accent="brand" />
          <StatCard label="Unique visitors" value={formatNumber(summary.uniqueVisitors)} icon={<Users className="h-5 w-5" />} accent="emerald" />
          <StatCard label="Clicks today" value={formatNumber(summary.todayClicks)} icon={<Smartphone className="h-5 w-5" />} accent="sky" />
          <StatCard label="Last 7 days" value={formatNumber(summary.last7DaysClicks)} icon={<CalendarClock className="h-5 w-5" />} accent="amber" />
        </div>
      ) : null}

      <Card className="p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">Clicks over time</h2>
            <p className="text-sm text-slate-500">Daily clicks for the last {days} days</p>
          </div>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {[7, 14, 30, 90].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDays(option)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  days === option ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {option}d
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={11} minTickGap={24} />
              <YAxis axisLine={false} tickLine={false} fontSize={11} allowDecimals={false} />
              <Tooltip
                formatter={(value: number | string) => [formatNumber(Number(value)), 'Clicks']}
                labelStyle={{ fontWeight: 700, color: '#0f172a' }}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2.5} fill="url(#clicksGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <DonutCard title="Devices" data={devices} icon={<Monitor className="h-4 w-4" />} />
        <DonutCard title="Browsers" data={browsers} icon={<Chrome className="h-4 w-4" />} />
        <DonutCard title="Operating systems" data={systems} icon={<Cpu className="h-4 w-4" />} />
        <BarPanel title="Countries" data={countries} icon={<Globe2 className="h-4 w-4" />} />
      </div>

      <BarPanel title="Referrers" data={referrers} subtitle="Where your clicks come from" icon={<Tablet className="h-4 w-4" />} />
    </div>
  );
}