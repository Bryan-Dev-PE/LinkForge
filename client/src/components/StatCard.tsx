import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Card } from './ui';

export function StatCard({
  label,
  value,
  icon,
  accent = 'brand',
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: 'brand' | 'emerald' | 'amber' | 'sky';
}) {
  const accents = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
  };
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', accents[accent])}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
      </div>
    </Card>
  );
}