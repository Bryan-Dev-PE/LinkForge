import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { anonymizeIp, getClientIp } from '../utils/ip';
import { normalizeReferrer, parseClientInfo } from '../utils/userAgent';
import { lookupGeo } from '../utils/geo';
import type { Request } from 'express';
import { getLinkForUser } from './link.service';

export interface ClickRecordInput {
  linkId: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
}

export async function recordClick(input: ClickRecordInput): Promise<void> {
  const clientInfo = parseClientInfo(input.userAgent);
  const geo = lookupGeo(input.ip);
  const hashedIp = input.ip && input.ip !== 'unknown' ? anonymizeIp(input.ip) : null;

  await prisma.clickEvent.create({
    data: {
      linkId: input.linkId,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      deviceType: clientInfo.isBot ? null : clientInfo.deviceType,
      browser: clientInfo.isBot ? null : clientInfo.browser,
      operatingSystem: clientInfo.isBot ? null : clientInfo.operatingSystem,
      referrer: normalizeReferrer(input.referrer),
      anonymizedIp: hashedIp,
    },
  });
}

export function extractClickContext(req: Request): Omit<ClickRecordInput, 'linkId'> {
  return {
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'],
    referrer: typeof req.headers.referer === 'string' ? req.headers.referer : undefined,
  };
}

async function ensureOwnedLink(userId: string, linkId: string): Promise<void> {
  try {
    await getLinkForUser(userId, linkId);
  } catch {
    throw new ApiError(404, 'LINK_NOT_FOUND', 'Link not found.');
  }
}

export interface AnalyticsSummary {
  totalClicks: number;
  uniqueVisitors: number;
  todayClicks: number;
  last7DaysClicks: number;
}

export async function getAnalyticsSummary(userId: string, linkId: string): Promise<AnalyticsSummary> {
  await ensureOwnedLink(userId, linkId);
  const [totalClicks, uniqueVisitorsResult, todayClicks] = await Promise.all([
    prisma.clickEvent.count({ where: { linkId } }),
    prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT COUNT(DISTINCT "anonymizedIp")::int AS count FROM "ClickEvent" WHERE "linkId" = $1`,
      linkId,
    ),
    prisma.clickEvent.count({
      where: {
        linkId,
        timestamp: { gte: startOfDay(new Date()) },
      },
    }),
  ]);

  const last7DaysClicks = await prisma.clickEvent.count({
    where: {
      linkId,
      timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  return {
    totalClicks,
    uniqueVisitors: uniqueVisitorsResult[0]?.count ?? 0,
    todayClicks,
    last7DaysClicks,
  };
}

export interface ClicksPoint {
  date: string;
  clicks: number;
}

export async function getClicksSeries(
  userId: string,
  linkId: string,
  days = 30,
): Promise<ClicksPoint[]> {
  await ensureOwnedLink(userId, linkId);
  const since = startOfDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));

  const rows = await prisma.$queryRawUnsafe<Array<{ day: Date; clicks: number }>>(
    `SELECT date_trunc('day', timestamp)::date AS day, COUNT(*)::int AS clicks
     FROM "ClickEvent"
     WHERE "linkId" = $1 AND timestamp >= $2
     GROUP BY date_trunc('day', timestamp)::date
     ORDER BY day ASC`,
    linkId,
    since,
  );

  const byDate = new Map<string, number>();
  for (const row of rows) {
    const key = toDateKey(new Date(row.day));
    byDate.set(key, row.clicks);
  }

  const points: ClicksPoint[] = [];
  for (let i = 0; i < days; i += 1) {
    const day = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    points.push({ date: toDateKey(day), clicks: byDate.get(toDateKey(day)) ?? 0 });
  }
  return points;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface BreakdownRow {
  name: string;
  value: number;
}

interface ClickGroupRow {
  deviceType: string | null;
  browser: string | null;
  operatingSystem: string | null;
  country: string | null;
  referrer: string | null;
  _count: { _all: number };
}

async function breakdown(
  userId: string,
  linkId: string,
  field: 'deviceType' | 'browser' | 'operatingSystem' | 'country' | 'referrer',
): Promise<BreakdownRow[]> {
  await ensureOwnedLink(userId, linkId);
  const grouped = await prisma.clickEvent.groupBy({
    by: [field],
    where: { linkId },
    _count: { _all: true },
    orderBy: { _count: { [field]: 'desc' } },
  });

  const rows = grouped
    .map((row) => row as unknown as ClickGroupRow)
    .filter((row) => row[field] !== null)
    .map((row) => ({
      name: String(row[field]),
      value: row._count._all,
    }));

  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return rows
    .map((row) => ({
      name: row.name,
      value: total > 0 ? Math.round((row.value / total) * 10000) / 100 : 0,
    }))
    .slice(0, 10);
}

function fieldBreakdown(userId: string, linkId: string, field: 'deviceType'): Promise<BreakdownRow[]>;
function fieldBreakdown(userId: string, linkId: string, field: 'browser'): Promise<BreakdownRow[]>;
function fieldBreakdown(userId: string, linkId: string, field: 'operatingSystem'): Promise<BreakdownRow[]>;
function fieldBreakdown(userId: string, linkId: string, field: 'country'): Promise<BreakdownRow[]>;
function fieldBreakdown(userId: string, linkId: string, field: 'referrer'): Promise<BreakdownRow[]>;
function fieldBreakdown(
  userId: string,
  linkId: string,
  field: 'deviceType' | 'browser' | 'operatingSystem' | 'country' | 'referrer',
): Promise<BreakdownRow[]> {
  return breakdown(userId, linkId, field);
}

export const getDevicesBreakdown = (userId: string, linkId: string) => fieldBreakdown(userId, linkId, 'deviceType');
export const getBrowsersBreakdown = (userId: string, linkId: string) => fieldBreakdown(userId, linkId, 'browser');
export const getOsBreakdown = (userId: string, linkId: string) => fieldBreakdown(userId, linkId, 'operatingSystem');
export const getCountriesBreakdown = (userId: string, linkId: string) => fieldBreakdown(userId, linkId, 'country');
export const getReferrersBreakdown = (userId: string, linkId: string) => fieldBreakdown(userId, linkId, 'referrer');