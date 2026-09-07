import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';

export function Logo({ className, to = '/' }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2', className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-sm">
        <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
          <rect x="1" y="1" width="30" height="30" rx="7" fill="none" />
          <path d="M10 12l6 6 6-6" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M10 19l6 6 6-6" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </span>
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        Link<span className="text-brand-600">Forge</span>
      </span>
    </Link>
  );
}