import { Link } from 'react-router-dom';
import { BarChart3, Globe2, QrCode, ShieldCheck, Timer, Zap } from 'lucide-react';
import { ShortenForm } from '../components/ShortenForm';

const FEATURES = [
  {
    icon: Zap,
    title: 'Short links in seconds',
    description: 'Turn any long URL into a clean, shareable link that just works.',
  },
  {
    icon: BarChart3,
    title: 'Real click analytics',
    description: 'See who is clicking: devices, browsers, countries, and referrers at a glance.',
  },
  {
    icon: QrCode,
    title: 'Built-in QR codes',
    description: 'Every link can become a customizable QR code — download it in PNG or SVG.',
  },
  {
    icon: Timer,
    title: 'Expiring & disposable links',
    description: 'Set an expiration date for time-limited campaigns and promos.',
  },
  {
    icon: ShieldCheck,
    title: 'Safe by default',
    description: 'Only http(s) destinations, with the ability to disable any link instantly.',
  },
  {
    icon: Globe2,
    title: 'Custom aliases',
    description: 'Pick a memorable alias for your links and build your brand recognition.',
  },
];

const STEPS = [
  { step: '01', title: 'Paste your link', description: 'Drop in any long URL, no account needed.' },
  { step: '02', title: 'Shorten or customize', description: 'Get a random short code or choose your own alias.' },
  { step: '03', title: 'Share & track', description: 'Share anywhere, then watch your analytics grow.' },
];

export function Home() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-50 via-white to-white" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <Zap className="h-3.5 w-3.5" />
              Free. Fast. Private by default.
            </p>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Short links that{' '}
              <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">
                work for you
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              LinkForge turns long URLs into memorable short links, generates crisp QR codes, and
              gives you real-time analytics — all from one clean dashboard.
            </p>
            <div className="mt-8 max-w-xl">
              <ShortenForm />
            </div>
          </div>
          <div className="hidden items-center justify-center lg:flex" aria-hidden="true">
            <div className="relative">
              <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-brand-200 to-violet-200 opacity-60 blur-2xl" />
              <div className="relative rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-slate-900/5">
                <div className="mx-auto mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
                  <QrCode className="h-5 w-5 text-white" />
                </div>
                <AdminDashboardPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to share links
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            A modern URL shortener with the features people actually use, without the bloat.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-3">
          {STEPS.map((item) => (
            <div key={item.step} className="relative">
              <p className="text-sm font-bold text-brand-600">{item.step}</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-slate-900 px-8 py-12 text-center sm:px-12">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready to forge your short links?
            </h2>
            <p className="mt-3 max-w-xl text-slate-300">
              Create a free account to unlock custom aliases, expiring links, QR codes, and full
              analytics.
            </p>
          </div>
          <Link
            to="/register"
            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/30 transition hover:bg-brand-500"
          >
            Create your account
          </Link>
        </div>
      </section>
    </div>
  );
}

function AdminDashboardPreview() {
  const rows = [
    { url: 'landing-page', clicks: 1284, color: 'bg-brand-600' },
    { url: 'summer-sale', clicks: 843, color: 'bg-violet-500' },
    { url: 'ebook-download', clicks: 512, color: 'bg-emerald-500' },
    { url: 'podcast-episode', clicks: 297, color: 'bg-amber-500' },
  ];
  return (
    <div className="w-64">
      <p className="text-sm font-bold text-slate-900">Click performance</p>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.url}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-slate-700">{row.url}</span>
              <span className="font-bold text-slate-900">{row.clicks.toLocaleString()}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100">
              <div className={`h-1.5 rounded-full ${row.color}`} style={{ width: `${(row.clicks / 1284) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-xs">
        <span className="font-medium text-slate-600">Total clicks</span>
        <span className="font-extrabold text-brand-700">2,936</span>
      </div>
    </div>
  );
}