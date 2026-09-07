const ALLOWED_PROTOCOLS = new Set(['http', 'https']);

export function extractProtocol(url: string): string | null {
  const match = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//.exec(url);
  return match?.[1]?.toLowerCase() ?? null;
}

export function isSafeUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) return false;
  if (trimmed.includes(' ')) return false;
  const protocol = extractProtocol(trimmed);
  if (!protocol || !ALLOWED_PROTOCOLS.has(protocol)) return false;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  if (!parsed.hostname || parsed.hostname.length > 253) return false;
  if (parsed.username || parsed.password) return false;
  return true;
}