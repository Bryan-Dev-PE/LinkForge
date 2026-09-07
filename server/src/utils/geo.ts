export interface GeoLocation {
  country: string | null;
  region: string | null;
  city: string | null;
}

const PRIVATE_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1', '0.0.0.0']);

function isPrivate(ip: string): boolean {
  if (PRIVATE_IPS.has(ip)) return true;
  if (ip.startsWith('::ffff:127.') || ip.startsWith('::ffff:10.') || ip.startsWith('::ffff:192.168.')) return true;
  const v4 = ip.includes('::ffff:') ? ip.split('::ffff:')[1] : ip;
  if (!v4 || !v4.includes('.')) return false;
  const parts = v4.split('.').map(Number);
  const [first, second] = parts;
  if (typeof first !== 'number' || typeof second !== 'number') return false;
  if (first === 10) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  if (first === 192 && second === 168) return true;
  return first === 127;
}

export function lookupGeo(ip: string | null | undefined): GeoLocation {
  if (!ip || isPrivate(ip)) {
    return { country: null, region: null, city: null };
  }

  const ipv4 = ip.includes('::ffff:') ? (ip.split('::ffff:')[1] ?? ip) : ip;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const geoip = require('geoip-lite') as {
      lookup(addr: string): { country?: string; region?: string; city?: string } | null;
    };
    const result = geoip.lookup(ipv4);
    if (!result) return { country: null, region: null, city: null };
    return {
      country: result.country ?? null,
      region: result.region ?? null,
      city: result.city ?? null,
    };
  } catch {
    return { country: null, region: null, city: null };
  }
}