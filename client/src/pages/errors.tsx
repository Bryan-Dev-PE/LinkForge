import { FileQuestion, Home, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';

function ErrorShell({
  icon,
  code,
  title,
  description,
  actions,
}: {
  icon: React.ReactNode;
  code: string;
  title: string;
  description: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center">
      <div className="w-full max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          {icon}
        </div>
        <p className="mt-6 text-sm font-bold uppercase tracking-widest text-brand-600">{code}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-3 text-slate-600">{description}</p>
        <div className="mt-8 flex justify-center gap-3">{actions}</div>
      </div>
    </div>
  );
}

const linkButton =
  'inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700';
const ghostButton =
  'inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50';

export function NotFound() {
  return (
    <ErrorShell
      icon={<FileQuestion className="h-7 w-7" />}
      code="404"
      title="Page not found"
      description="The page you are looking for doesn't exist or has moved."
      actions={
        <>
          <Link to="/" className={linkButton}>
            <Home className="h-4 w-4" />
            Back to home
          </Link>
          <Link to="/dashboard" className={ghostButton}>
            Go to dashboard
          </Link>
        </>
      }
    />
  );
}

export function InternalError() {
  return (
    <ErrorShell
      icon={<FileQuestion className="h-7 w-7" />}
      code="500"
      title="Something went wrong"
      description="An unexpected error occurred. Please try again in a moment."
      actions={
        <>
          <Link to="/" className={linkButton}>
            <Home className="h-4 w-4" />
            Back to home
          </Link>
          <button type="button" onClick={() => window.location.reload()} className={ghostButton}>
            Reload page
          </button>
        </>
      }
    />
  );
}

export function LinkExpired() {
  return (
    <ErrorShell
      icon={<Link2 className="h-7 w-7" />}
      code="Gone"
      title="This link has expired"
      description="The link you tried to open reached its expiration date and is no longer available."
      actions={
        <>
          <Link to="/" className={linkButton}>
            Shorten your own link
          </Link>
          <Link to="/dashboard" className={ghostButton}>
            Go to dashboard
          </Link>
        </>
      }
    />
  );
}

export function LinkDisabled() {
  return (
    <ErrorShell
      icon={<Link2 className="h-7 w-7" />}
      code="Unavailable"
      title="This link is disabled"
      description="Its owner has paused this link, so it is temporarily unavailable."
      actions={
        <>
          <Link to="/" className={linkButton}>
            Shorten your own link
          </Link>
          <Link to="/dashboard" className={ghostButton}>
            Go to dashboard
          </Link>
        </>
      }
    />
  );
}