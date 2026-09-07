export const SHORT_CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const SHORT_CODE_LENGTH = 6;

export const ALIAS_PATTERN = /^[a-z0-9_-]{3,30}$/;

export const RESERVED_ROUTES = new Set([
  'login',
  'register',
  'logout',
  'dashboard',
  'admin',
  'api',
  'settings',
  'about',
  'pricing',
  'auth',
  'health',
  'forgot-password',
  'reset-password',
  'link-expired',
  'link-disabled',
  'terms',
  'privacy',
  'links',
  'analytics',
  'qr',
  'status',
  'me',
  'session',
  'assets',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'manifest.json',
]);

export const COUNTRIES = [
  'Peru',
  'United States',
  'Brazil',
  'Chile',
  'Argentina',
  'Colombia',
  'Mexico',
  'Spain',
  'Germany',
  'United Kingdom',
  'France',
  'Canada',
] as const;

export const BROWSERS = ['Chrome', 'Edge', 'Safari', 'Firefox', 'Opera', 'Brave'] as const;
export const DEVICE_TYPES = ['desktop', 'mobile', 'tablet'] as const;
export const OPERATING_SYSTEMS = ['Windows', 'macOS', 'Linux', 'Android', 'iOS'] as const;