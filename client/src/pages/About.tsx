import { ArrowRight, BarChart3, Link2, QrCode, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Privacy-minded analytics',
    description:
      'We never store full IP addresses. Visitor IPs are one-way hashed with a secret pepper before they touch the database, and raw location data stays at the region/city level.',
  },
  {
    icon: Link2,
    title: 'Made for real campaigns',
    description:
      'Whether you are sharing a single link or orchestrating hundreds, LinkForge gives you aliases, expiration dates, and instant disable to control every link you publish.',
  },
  {
    icon: BarChart3,
    title: 'Transparent by design',
    description:
      'No opaque pricing tiers. Short links, QR codes, and analytics are free. Run LinkForge yourself with the included Docker setup, or host it anywhere Node runs.',
  },
  {
    icon: QrCode,
    title: 'QR codes that match your brand',
    description:
      'Change colors, add a logo, pick a size — then download a pixel-perfect PNG or a scalable SVG for print and web.',
  },
];

const STACK = [
  'React 18',
  'TypeScript',
  'Tailwind CSS',
  'Vite',
  'Express',
  'Prisma ORM',
  'PostgreSQL',
  'Docker',
];

export function About() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">About LinkForge</h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-600">
          LinkForge is a full-featured URL shortener built from the ground up as a modern web
          application. It combines the simplicity of shortening a link with the power tools you
          expect from a production service — click analytics, QR generation, custom aliases, and
          link lifecycle controls.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          The project is fully open source. You can read the code, understand exactly how your data
          flows through the system, and even deploy your own instance using the included Docker
          Compose setup — your links, your infrastructure.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {VALUES.map((value) => (
          <div key={value.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <value.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">{value.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{value.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-3xl border border-slate-200 bg-slate-50 p-8">
        <h2 className="text-xl font-bold text-slate-900">Built with modern, boring tools</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {STACK.map((item) => (
            <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-14 flex flex-col items-center gap-4 rounded-3xl bg-slate-900 px-8 py-12 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Try it right now</h2>
        <p className="max-w-lg text-slate-300">
          Shorten your first link in seconds — no account required.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-500"
        >
          Shorten a link
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}