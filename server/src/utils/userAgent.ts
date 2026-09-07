import { UAParser } from 'ua-parser-js';

export interface ClientInfo {
  deviceType: string;
  browser: string | null;
  operatingSystem: string | null;
  isBot: boolean;
}

const BOT_PATTERNS = /bot|crawl|spider|slurp|monitor|preview|facebookexternalhit|whatsapp|telegram|slackbot|twitterbot|discordbot|curl|wget|python-requests|headless/i;

export function parseClientInfo(userAgent?: string): ClientInfo {
  const ua = userAgent ?? '';
  const parser = new UAParser(ua);
  const device = parser.getDevice().type;
  const browser = parser.getBrowser().name ?? null;
  const operatingSystem = parser.getOS().name ?? null;

  const deviceType =
    device === 'tablet' ? 'tablet' : device === 'mobile' ? 'mobile' : 'desktop';

  return {
    deviceType,
    browser,
    operatingSystem,
    isBot: BOT_PATTERNS.test(ua) && browser === null,
  };
}

export function normalizeReferrer(referrer?: string): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.hostname === 'localhost') return url.hostname;
    const parts = url.hostname.split('.').filter(Boolean);
    const lastTwo = parts.slice(-2);
    if (lastTwo.length !== 2) return url.hostname;
    const topLevel = lastTwo[lastTwo.length - 1] ?? '';
    if (!/^[a-z]{2,}$/i.test(topLevel)) return String(url.hostname);
    return lastTwo.join('.');
  } catch {
    return null;
  }
}