import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ImageIcon, Link2, Palette, QrCode, Save, Settings2 } from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import type { Link as LinkRow, LinkPage, QrSettings as QrSettingsRow, QrSettingsInput } from '../../types';
import { clamp } from '../../lib/format';
import { renderQrPng, renderQrSvg, downloadDataUrl, downloadText } from '../../lib/qr';
import { Alert, Button, Card, CopyButton, EmptyState, Field, Input, Select } from '../../components/ui';
import { Spinner } from '../../components/Spinner';

const DEFAULT_SETTINGS: QrSettingsInput = {
  foregroundColor: '#0f172a',
  backgroundColor: '#ffffff',
  size: 512,
  margin: 4,
  logoUrl: null,
};

function normalizeColor(value: string): string {
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(value) ? value : DEFAULT_SETTINGS.foregroundColor;
}

export function QrStudio() {
  const { id: routeId } = useParams<{ id: string }>();
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settings, setSettings] = useState<QrSettingsInput>(DEFAULT_SETTINGS);
  const [preview, setPreview] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const renderTimer = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<LinkPage>('/api/links?page=1&limit=50')
      .then((page) => {
        if (!active) return;
        setLinks(page.items);
        const initial = routeId && page.items.some((link) => link.id === routeId) ? routeId : (page.items[0]?.id ?? null);
        setSelectedId(initial);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [routeId]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    api
      .get<{ settings: QrSettingsRow }>(`/api/links/${selectedId}/qr`)
      .then((data) => {
        if (!active) return;
        setSettings({
          foregroundColor: normalizeColor(data.settings.foregroundColor),
          backgroundColor: normalizeColor(data.settings.backgroundColor),
          size: clamp(data.settings.size, 128, 2048),
          margin: clamp(data.settings.margin, 0, 12),
          logoUrl: data.settings.logoUrl,
        });
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiRequestError ? err.message : 'Could not load QR settings.');
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    if (renderTimer.current !== null) window.clearTimeout(renderTimer.current);
    setRendering(true);
    renderTimer.current = window.setTimeout(() => {
      const target = links.find((l) => l.id === selectedId);
      if (!target) return;
      renderQrPng({
        text: target.shortUrl,
        size: settings.size,
        margin: settings.margin,
        foreground: settings.foregroundColor,
        background: settings.backgroundColor,
        logoUrl: settings.logoUrl,
      })
        .then(setPreview)
        .catch(() => setPreview(null))
        .finally(() => setRendering(false));
    }, 250);
    return () => {
      if (renderTimer.current !== null) window.clearTimeout(renderTimer.current);
    };
  }, [selectedId, settings, links]);

  const selectedLink = links.find((link) => link.id === selectedId) ?? null;

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      await api.post<{ settings: QrSettingsRow }>(`/api/links/${selectedId}/qr`, settings);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1800);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not save QR settings.');
    } finally {
      setSaving(false);
    }
  };

  const download = useCallback(
    async (format: 'png' | 'svg') => {
      if (!selectedLink || !preview) return;
      const filename = `linkforge-${selectedLink.customAlias ?? selectedLink.shortCode}.${format}`;
      if (format === 'png') {
        downloadDataUrl(preview, filename);
        return;
      }
      const svg = await renderQrSvg({
        text: selectedLink.shortUrl,
        size: settings.size,
        margin: settings.margin,
        foreground: settings.foregroundColor,
        background: settings.backgroundColor,
        logoUrl: settings.logoUrl,
      });
      downloadText(svg, filename, 'image/svg+xml');
    },
    [selectedLink, preview, settings],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-28">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<QrCode className="h-6 w-6" />}
          title="No links to create QR codes for"
          description="Create a short link first, then generate a QR code for it here."
          action={
            <Link to="/dashboard/links">
              <Button>
                <Link2 className="h-4 w-4" />
                Go to links
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {routeId ? (
          <Link to="/dashboard/links" className="text-slate-400 transition hover:text-slate-600" aria-label="Back to links">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        ) : null}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">QR Studio</h1>
          <p className="mt-1 text-sm text-slate-500">Style a QR code and download it for your campaign.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card className="flex flex-col gap-5 p-6">
          <Field label="Link" htmlFor="qr-link">
            <Select id="qr-link" value={selectedId ?? ''} onChange={(e) => setSelectedId(e.target.value)}>
              {links.map((link) => (
                <option key={link.id} value={link.id}>
                  /{link.customAlias ?? link.shortCode} — {link.title ?? link.originalUrl.slice(0, 60)}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Foreground" hint={settings.foregroundColor}>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.foregroundColor}
                  onChange={(e) => setSettings({ ...settings, foregroundColor: e.target.value })}
                  className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-1 ring-1 ring-inset ring-slate-300"
                  aria-label="Foreground color"
                />
                <Input
                  value={settings.foregroundColor}
                  onChange={(e) => setSettings({ ...settings, foregroundColor: normalizeColor(e.target.value) })}
                  className="font-mono"
                />
              </div>
            </Field>
            <Field label="Background" hint={settings.backgroundColor}>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                  className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-1 ring-1 ring-inset ring-slate-300"
                  aria-label="Background color"
                />
                <Input
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings({ ...settings, backgroundColor: normalizeColor(e.target.value) })}
                  className="font-mono"
                />
              </div>
            </Field>
          </div>

          <div className="space-y-4">
            <SliderField
              label="Size"
              value={settings.size}
              display={`${settings.size}px`}
              min={128}
              max={2048}
              step={16}
              onChange={(size) => setSettings({ ...settings, size })}
            />
            <SliderField
              label="Quiet zone"
              value={settings.margin}
              display={`${settings.margin} modules`}
              min={0}
              max={12}
              step={1}
              onChange={(margin) => setSettings({ ...settings, margin })}
            />
          </div>

          <Field
            label="Logo image URL (optional)"
            htmlFor="qr-logo"
            hint="A square logo is cropped into the center of the QR code."
          >
            <Input
              id="qr-logo"
              placeholder="https://example.com/logo.png"
              value={settings.logoUrl ?? ''}
              onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value.trim() || null })}
            />
          </Field>

          {error ? <Alert tone="error">{error}</Alert> : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={save} loading={saving}>
              <Save className="h-4 w-4" />
              {savedFlash ? 'Saved!' : 'Save settings'}
            </Button>
            <Button variant="secondary" onClick={() => void download('png')} disabled={!preview}>
              <Download className="h-4 w-4" />
              PNG
            </Button>
            <Button variant="secondary" onClick={() => void download('svg')} disabled={!preview}>
              <Download className="h-4 w-4" />
              SVG
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Palette className="h-4 w-4 text-brand-600" />
              Preview
            </h2>
            {selectedLink ? (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="max-w-56 truncate font-mono">{selectedLink.shortUrl}</span>
                <CopyButton text={selectedLink.shortUrl} />
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex flex-1 items-center justify-center rounded-xl bg-slate-100 p-6 ring-1 ring-inset ring-slate-200">
            {rendering || !preview ? (
              <Spinner className="h-8 w-8 text-brand-600" />
            ) : (
              <img
                src={preview}
                alt="QR code preview"
                className="h-72 w-72 rounded-md ring-1 ring-slate-200"
                style={{ imageRendering: 'pixelated' }}
              />
            )}
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <Settings2 className="h-3.5 w-3.5" />
            QR codes use error correction level H, so a centered logo can be scanned reliably.
            <ImageIcon className="ml-1 h-3.5 w-3.5" />
          </p>
        </Card>
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <label className="font-medium text-slate-700">{label}</label>
        <span className="text-slate-500">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600"
      />
    </div>
  );
}