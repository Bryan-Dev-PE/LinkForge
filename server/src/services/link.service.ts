import { LinkStatus, Prisma, type Link } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { isSafeUrl } from '../utils/url';
import {
  assertAliasAvailable,
  generateUniqueShortCode,
  validateAlias,
} from './shortCode.service';

export const SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'originalUrl', 'title', 'clicks']);

export interface CreateLinkInput {
  originalUrl: string;
  customAlias?: string;
  title?: string;
  expiresAt?: string | Date | null;
}

export interface ListLinksFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: LinkStatus;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export type ResolveOutcome =
  | { outcome: 'active'; link: Link }
  | { outcome: 'not_found' }
  | { outcome: 'expired'; link: Link }
  | { outcome: 'disabled'; link: Link };

export interface LinkWithCount extends Link {
  clickCount: number;
  effectiveStatus: LinkStatus;
  shortUrl: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function createLink(
  input: CreateLinkInput,
  ctx: { userId?: string; ip?: string; isAuthenticated: boolean },
): Promise<Link> {
  const originalUrl = input.originalUrl.trim();
  if (!isSafeUrl(originalUrl)) {
    throw new ApiError(422, 'INVALID_URL', 'Please provide a valid http:// or https:// URL.');
  }

  if (isObject(input.expiresAt)) {
    throw new ApiError(422, 'INVALID_DATES', 'Invalid expiration date.');
  }
  if (typeof input.expiresAt === 'string' && Number.isNaN(Date.parse(input.expiresAt))) {
    throw new ApiError(422, 'INVALID_DATES', 'Invalid expiration date.');
  }

  let expiresAt: Date | null = null;
  if (input.expiresAt) {
    expiresAt = new Date(input.expiresAt);
    if (expiresAt <= new Date()) {
      throw new ApiError(422, 'INVALID_DATES', 'Expiration date must be in the future.');
    }
    if (ctx.isAuthenticated && expiresAt.getTime() - Date.now() > 10 * 365 * 24 * 60 * 60 * 1000) {
      throw new ApiError(422, 'INVALID_DATES', 'Expiration date is too far in the future.');
    }
  } else if (!ctx.isAuthenticated) {
    expiresAt = new Date(Date.now() + env.guestLinkTtlMs);
  }

  if (input.customAlias !== undefined && input.customAlias !== null && input.customAlias.trim() !== '') {
    if (!ctx.isAuthenticated) {
      throw new ApiError(403, 'AUTH_REQUIRED', 'Custom aliases require an account.');
    }
    const alias = validateAlias(input.customAlias);
    await assertAliasAvailable(alias);
    await enforceUserHourlyLimit(ctx);
    return prisma.link.create({
      data: {
        userId: ctx.userId ?? null,
        originalUrl,
        shortCode: alias,
        customAlias: alias,
        title: input.title?.trim() || null,
        expiresAt,
      },
    });
  }

  const shortCode = await generateUniqueShortCode();
  await enforceUserHourlyLimit(ctx);
  return prisma.link.create({
    data: {
      userId: ctx.userId ?? null,
      originalUrl,
      shortCode,
      customAlias: null,
      title: input.title?.trim() || null,
      expiresAt,
    },
  });
}

async function enforceUserHourlyLimit(ctx: {
  userId?: string;
  isAuthenticated: boolean;
}): Promise<void> {
  if (!ctx.isAuthenticated || !ctx.userId) return;
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.link.count({
    where: { userId: ctx.userId, createdAt: { gte: since } },
  });
  if (count >= env.userLinkLimitPerHour) {
    throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', `You have reached the limit of ${env.userLinkLimitPerHour} links per hour.`);
  }
}

export async function listLinks(
  userId: string,
  filters: ListLinksFilters,
): Promise<{ items: LinkWithCount[]; total: number; page: number; limit: number; totalPages: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(50, Math.max(1, filters.limit ?? 10));
  const sortBy = filters.sortBy && SORT_FIELDS.has(filters.sortBy) ? filters.sortBy : 'createdAt';
  const order = filters.order === 'asc' ? 'asc' : 'desc';

  const where: Record<string, unknown> = { userId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search && filters.search.trim() !== '') {
    where.OR = [
      { originalUrl: { contains: filters.search.trim(), mode: 'insensitive' as const } },
      { shortCode: { contains: filters.search.trim(), mode: 'insensitive' as const } },
      { customAlias: { contains: filters.search.trim(), mode: 'insensitive' as const } },
      { title: { contains: filters.search.trim(), mode: 'insensitive' as const } },
    ];
  }

  const orderBy: Prisma.LinkOrderByWithRelationInput =
    sortBy === 'clicks'
      ? { clicks: { _count: order } }
      : ({ [sortBy]: order } as Prisma.LinkOrderByWithRelationInput);

  const [items, total] = await Promise.all([
    prisma.link.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        ...linkFields,
        _count: { select: { clicks: true } },
      },
    }),
    prisma.link.count({ where }),
  ]);

  return {
    items: items.map((item) => serializeLink(item)),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

const linkFields = {
  id: true,
  userId: true,
  originalUrl: true,
  shortCode: true,
  customAlias: true,
  title: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function serializeLink(item: (typeof linkFields) extends infer T ? { id: string } & { [K in keyof T]: unknown } & { _count?: { clicks?: number } } : never): LinkWithCount {
  const raw = item as unknown as Link & { _count?: { clicks?: number } };
  const effectiveStatus = computeEffectiveStatus(raw);
  return {
    ...raw,
    clickCount: raw._count?.clicks ?? 0,
    effectiveStatus,
    shortUrl: buildShortUrl(raw.shortCode),
  };
}

export function computeEffectiveStatus(link: Link): LinkStatus {
  if (link.expiresAt && link.expiresAt <= new Date()) return 'EXPIRED';
  return link.status;
}

export function buildShortUrl(codeOrAlias: string): string {
  return `${env.baseUrl}/${codeOrAlias}`;
}

export async function getLinkForUser(userId: string, linkId: string): Promise<LinkWithCount> {
  const link = await prisma.link.findFirst({
    where: { id: linkId, userId },
    select: { ...linkFields, _count: { select: { clicks: true } } },
  });
  if (!link) {
    throw new ApiError(404, 'LINK_NOT_FOUND', 'Link not found.');
  }
  return serializeLink(link);
}

export async function updateLink(
  userId: string,
  linkId: string,
  data: {
    originalUrl?: string;
    title?: string | null;
    expiresAt?: string | Date | null;
    customAlias?: string | null;
  },
): Promise<LinkWithCount> {
  const existing = await getLinkForUser(userId, linkId);

  const updates: Record<string, unknown> = {};

  if (data.originalUrl !== undefined) {
    if (!isSafeUrl(data.originalUrl)) {
      throw new ApiError(422, 'INVALID_URL', 'Please provide a valid http:// or https:// URL.');
    }
    updates.originalUrl = data.originalUrl.trim();
  }

  if (data.title !== undefined) {
    updates.title = data.title === null ? null : data.title.trim().slice(0, 120) || null;
  }

  if (data.expiresAt !== undefined) {
    if (data.expiresAt === null) {
      updates.expiresAt = null;
    } else {
      const date = new Date(String(data.expiresAt));
      if (Number.isNaN(date.getTime())) {
        throw new ApiError(422, 'INVALID_DATES', 'Invalid expiration date.');
      }
      updates.expiresAt = date;
    }
  }

  if (data.customAlias !== undefined) {
    if (data.customAlias === null || data.customAlias.trim() === '') {
      updates.customAlias = null;
    } else {
      const alias = validateAlias(data.customAlias);
      if (alias !== existing.customAlias) {
        await assertAliasAvailable(alias);
      }
      updates.customAlias = alias;
    }
  }

  const updated = await prisma.link.update({
    where: { id: linkId },
    data: updates,
    select: { ...linkFields, _count: { select: { clicks: true } } },
  });
  return serializeLink(updated);
}

export async function deleteLink(userId: string, linkId: string): Promise<void> {
  const existing = await getLinkForUser(userId, linkId);
  await prisma.link.delete({ where: { id: existing.id } });
}

export async function setLinkStatus(userId: string, linkId: string, status: LinkStatus): Promise<LinkWithCount> {
  if (!['ACTIVE', 'DISABLED'].includes(status)) {
    throw new ApiError(422, 'INVALID_STATUS', 'Status can only be set to ACTIVE or DISABLED.');
  }
  const existing = await getLinkForUser(userId, linkId);
  const updated = await prisma.link.update({
    where: { id: existing.id },
    data: { status },
    select: { ...linkFields, _count: { select: { clicks: true } } },
  });
  return serializeLink(updated);
}

export async function resolveForRedirect(code: string): Promise<ResolveOutcome> {
  const trimmed = code.trim();
  if (!trimmed) return { outcome: 'not_found' };

  let link = await prisma.link.findUnique({ where: { shortCode: trimmed } });
  if (!link) {
    link = await prisma.link.findUnique({ where: { customAlias: trimmed.toLowerCase() } });
  }
  if (!link) {
    return { outcome: 'not_found' };
  }

  if (link.expiresAt && link.expiresAt <= new Date()) {
    if (link.status !== 'EXPIRED') {
      link = await prisma.link.update({
        where: { id: link.id },
        data: { status: 'EXPIRED' },
      });
    }
    return { outcome: 'expired', link };
  }

  if (link.status === 'DISABLED') {
    return { outcome: 'disabled', link };
  }

  return { outcome: 'active', link };
}