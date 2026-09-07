import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  CalendarClock,
  ExternalLink,
  Link2,
  PenLine,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import type { Link as LinkRow, LinkPage, LinkStatus } from '../../types';
import { formatDateTime, formatRelative, hostnameOf, truncate } from '../../lib/format';
import {
  Alert,
  Button,
  Card,
  CopyButton,
  EmptyState,
  Field,
  Input,
  Modal,
  Pagination,
  Select,
  StatusBadge,
} from '../../components/ui';
import { Spinner } from '../../components/Spinner';
import { LinkRowActions } from './LinksRowActions';

type Sortable = 'createdAt' | 'clicks' | 'title' | 'originalUrl';

interface LinkFormValues {
  originalUrl: string;
  customAlias: string;
  title: string;
  expiresAt: string;
}

const emptyForm: LinkFormValues = { originalUrl: '', customAlias: '', title: '', expiresAt: '' };

export function Links() {
  const [data, setData] = useState<LinkPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | LinkStatus>('ALL');
  const [sortBy, setSortBy] = useState<Sortable>('createdAt');
  const ORDER = 'desc';

  const [createOpen, setCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState<LinkFormValues>(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [editTarget, setEditTarget] = useState<LinkRow | null>(null);
  const [editValues, setEditValues] = useState<LinkFormValues>(emptyForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<LinkRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const searchTimer = useRef<number | null>(null);

  useEffect(() => {
    if (searchTimer.current !== null) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => {
      if (searchTimer.current !== null) window.clearTimeout(searchTimer.current);
    };
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
      sortBy,
      order: ORDER,
    });
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (status !== 'ALL') params.set('status', status);
    api
      .get<LinkPage>(`/api/links?${params.toString()}`)
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof ApiRequestError ? err.message : 'Could not load your links.');
      })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, status, sortBy]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setCreateValues(emptyForm);
    setCreateError(null);
    setCreateOpen(true);
  };

  const createLink = async (event: FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    try {
      await api.post('/api/links', {
        originalUrl: createValues.originalUrl,
        customAlias: createValues.customAlias.trim() || undefined,
        title: createValues.title.trim() || undefined,
        expiresAt: createValues.expiresAt || undefined,
      });
      setCreateOpen(false);
      setPage(1);
      setDebouncedSearch('');
      setSearch('');
      await load();
    } catch (err) {
      setCreateError(err instanceof ApiRequestError ? err.message : 'Could not create the link.');
    } finally {
      setCreateLoading(false);
    }
  };

  const openEdit = (link: LinkRow) => {
    setEditTarget(link);
    setEditValues({
      originalUrl: link.originalUrl,
      customAlias: link.customAlias ?? '',
      title: link.title ?? '',
      expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : '',
    });
    setEditError(null);
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editTarget) return;
    setEditError(null);
    setEditLoading(true);
    try {
      await api.put(`/api/links/${editTarget.id}`, {
        originalUrl: editValues.originalUrl,
        customAlias: editValues.customAlias.trim() || null,
        title: editValues.title.trim() || null,
        expiresAt: editValues.expiresAt || null,
      });
      setEditTarget(null);
      await load();
    } catch (err) {
      setEditError(err instanceof ApiRequestError ? err.message : 'Could not update the link.');
    } finally {
      setEditLoading(false);
    }
  };

  const toggleStatus = async (link: LinkRow) => {
    const next = link.effectiveStatus === 'DISABLED' ? 'enable' : 'disable';
    try {
      await api.post(`/api/links/${link.id}/${next}`);
      await load();
    } catch {
      setError('Could not update the link status.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.del(`/api/links/${deleteTarget.id}`);
      setDeleteTarget(null);
      await load();
    } catch {
      setError('Could not delete the link.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalClicks = data?.items.reduce((sum, link) => sum + link.clickCount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Your links</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data ? `${data.total} link${data.total === 1 ? '' : 's'}` : '…'} · {totalClicks} total clicks
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New link
        </Button>
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by URL, alias, or title…"
              className="pl-9"
              aria-label="Search links"
            />
          </div>
          <div className="flex gap-3">
            <Select value={status} onChange={(e) => { setStatus(e.target.value as 'ALL' | LinkStatus); setPage(1); }} className="w-40" aria-label="Filter by status">
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
              <option value="EXPIRED">Expired</option>
            </Select>
            <Select value={sortBy} onChange={(e) => { setSortBy(e.target.value as Sortable); }} className="w-44" aria-label="Sort by">
              <option value="createdAt">Newest</option>
              <option value="clicks">Most clicks</option>
              <option value="title">Title</option>
              <option value="originalUrl">URL</option>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Spinner className="h-8 w-8 text-brand-600" />
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert tone="error">{error}</Alert>
          </div>
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState
            icon={<Link2 className="h-6 w-6" />}
            title={debouncedSearch || status !== 'ALL' ? 'No links match your filters' : 'No links yet'}
            description={
              debouncedSearch || status !== 'ALL'
                ? 'Try adjusting your search or filters.'
                : 'Create your first short link to start tracking clicks.'
            }
            action={
              debouncedSearch || status !== 'ALL' ? (
                <Button variant="secondary" onClick={() => { setSearch(''); setStatus('ALL'); }}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Create a link
                </Button>
              )
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {data?.items.map((link) => (
              <li key={link.id} className="px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={link.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline"
                      >
                        {link.customAlias ?? link.shortCode}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <StatusBadge status={link.effectiveStatus} />
                      <CopyButton text={link.shortUrl} label="Copy" />
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {link.title ?? hostnameOf(link.originalUrl)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400 font-mono">{truncate(link.originalUrl, 90)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-slate-900 font-bold">{link.clickCount}</span> clicks
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {formatRelative(link.createdAt)}
                      </span>
                      {link.expiresAt ? (
                        <span className="inline-flex items-center gap-1">
                          Expires {formatDateTime(link.expiresAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <LinkRowActions
                    link={link}
                    onEdit={openEdit}
                    onToggle={toggleStatus}
                    onDelete={deleteTarget ? () => undefined : () => setDeleteTarget(link)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {data && data.totalPages > 1 ? (
          <div className="border-t border-slate-100">
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </div>
        ) : null}
      </Card>

      <CreateLinkModal
        open={createOpen}
        values={createValues}
        onChange={setCreateValues}
        error={createError}
        loading={createLoading}
        onClose={() => setCreateOpen(false)}
        onSubmit={createLink}
      />

      <EditLinkModal
        target={editTarget}
        values={editValues}
        onChange={setEditValues}
        error={editError}
        loading={editLoading}
        onClose={() => setEditTarget(null)}
        onSubmit={saveEdit}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this link?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleteLoading}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          <span className="font-bold text-slate-900">{deleteTarget ? `/${deleteTarget.customAlias ?? deleteTarget.shortCode}` : ''}</span>{' '}
          will be deleted permanently along with its click history and QR settings. This cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
}

function LinkFormFields({ values, onChange }: { values: LinkFormValues; onChange: (values: LinkFormValues) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Destination URL" htmlFor="linkForm-url" required>
        <Input
          id="linkForm-url"
          type="url"
          placeholder="https://example.com/long/page"
          value={values.originalUrl}
          onChange={(e) => onChange({ ...values, originalUrl: e.target.value })}
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Custom alias" htmlFor="linkForm-alias" hint="Optional, 3-30 chars.">
          <Input
            id="linkForm-alias"
            placeholder="my-alias"
            value={values.customAlias}
            onChange={(e) => onChange({ ...values, customAlias: e.target.value })}
          />
        </Field>
        <Field label="Title" htmlFor="linkForm-title" hint="Optional.">
          <Input
            id="linkForm-title"
            placeholder="Marketing campaign"
            value={values.title}
            onChange={(e) => onChange({ ...values, title: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Expires at" htmlFor="linkForm-expires" hint="Leave empty for no expiration.">
        <Input
          id="linkForm-expires"
          type="datetime-local"
          value={values.expiresAt}
          onChange={(e) => onChange({ ...values, expiresAt: e.target.value })}
        />
      </Field>
    </div>
  );
}

function CreateLinkModal({
  open,
  values,
  onChange,
  error,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  values: LinkFormValues;
  onChange: (values: LinkFormValues) => void;
  error: string | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a short link"
      description="Turn a long URL into a short, shareable link."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={loading}>
            <Plus className="h-4 w-4" />
            Create link
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <LinkFormFields values={values} onChange={onChange} />
        {error ? <Alert tone="error">{error}</Alert> : null}
      </form>
    </Modal>
  );
}

function EditLinkModal({
  target,
  values,
  onChange,
  error,
  loading,
  onClose,
  onSubmit,
}: {
  target: LinkRow | null;
  values: LinkFormValues;
  onChange: (values: LinkFormValues) => void;
  error: string | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Modal
      open={Boolean(target)}
      onClose={onClose}
      title={target ? `Edit /${target.customAlias ?? target.shortCode}` : 'Edit link'}
      description="Update the destination, alias, title, or expiration."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={loading}>
            <PenLine className="h-4 w-4" />
            Save changes
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <LinkFormFields values={values} onChange={onChange} />
        <Alert tone="warning">Changing the alias changes the short URL. Previously shared links will stop working.</Alert>
        {error ? <Alert tone="error">{error}</Alert> : null}
      </form>
    </Modal>
  );
}