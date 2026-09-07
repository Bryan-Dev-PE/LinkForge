import dotenv from 'dotenv';

dotenv.config();

function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: toInt(process.env.PORT, 5000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  cookieName: process.env.ACCESS_COOKIE_NAME ?? 'linkforge_token',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  baseUrl: process.env.BASE_URL ?? 'http://localhost:5000',
  appUrl: process.env.APP_URL ?? 'http://localhost:5173',
  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMaxRequests: toInt(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  guestLinkLimitPerHour: toInt(process.env.GUEST_LINK_LIMIT_PER_HOUR, 10),
  userLinkLimitPerHour: toInt(process.env.USER_LINK_LIMIT_PER_HOUR, 100),
  guestLinkTtlMs: toInt(process.env.GUEST_LINK_TTL_MS, 7 * 24 * 60 * 60 * 1000),
  analyticsPepper: process.env.ANALYTICS_PEPPER ?? 'dev-pepper-change-me',
  trustProxy: toBool(process.env.TRUST_PROXY, false),
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: toInt(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? 'LinkForge <no-reply@example.com>',
  },
} as const;

export function hasSmtpConfigured(): boolean {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}