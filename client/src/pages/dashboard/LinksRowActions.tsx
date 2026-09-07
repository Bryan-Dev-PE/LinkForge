import { Link } from 'react-router-dom';
import { BarChart3, Pencil, Power, QrCode, Trash2 } from 'lucide-react';
import type { Link as LinkRow } from '../../types';
import { cn } from '../../lib/cn';

function actionClass(className?: string) {
  return cn(
    'flex h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900',
    className,
  );
}

export function LinkRowActions({
  link,
  onEdit,
  onToggle,
  onDelete,
}: {
  link: LinkRow;
  onEdit: (link: LinkRow) => void;
  onToggle: (link: LinkRow) => void;
  onDelete: () => void;
}) {
  const disabled = link.effectiveStatus === 'DISABLED';

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Link to={`/dashboard/links/${link.id}/analytics`} className={actionClass()} title="Analytics">
        <BarChart3 className="h-4 w-4" />
        <span className="hidden sm:inline">Analytics</span>
      </Link>
      <Link to={`/dashboard/links/${link.id}/qr`} className={actionClass()} title="QR code">
        <QrCode className="h-4 w-4" />
        <span className="hidden sm:inline">QR</span>
      </Link>
      <button type="button" onClick={() => onEdit(link)} className={actionClass()} title="Edit">
        <Pencil className="h-4 w-4" />
        <span className="hidden sm:inline">Edit</span>
      </button>
      <button
        type="button"
        onClick={() => onToggle(link)}
        className={cn(actionClass(), disabled ? 'text-emerald-600 hover:text-emerald-700' : 'text-amber-600 hover:text-amber-700')}
        title={disabled ? 'Enable' : 'Disable'}
      >
        <Power className="h-4 w-4" />
        <span className="hidden sm:inline">{disabled ? 'Enable' : 'Disable'}</span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className={cn(actionClass(), 'text-rose-600 hover:bg-rose-50 hover:text-rose-700')}
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
        <span className="hidden sm:inline">Delete</span>
      </button>
    </div>
  );
}