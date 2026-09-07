import { z } from 'zod';
import { LinkStatus } from '@prisma/client';

const urlSchema = z
  .string()
  .trim()
  .min(6, 'Please enter a valid URL.')
  .max(2048, 'URL is too long.');

export const createLinkSchema = z.object({
  originalUrl: urlSchema,
  customAlias: z
    .string()
    .trim()
    .min(3, 'Alias must be at least 3 characters.')
    .max(30, 'Alias must be at most 30 characters.')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Alias may only contain letters, numbers, hyphens, and underscores.')
    .optional()
    .or(z.literal('')),
  title: z.string().trim().max(120, 'Title must be at most 120 characters.').optional().or(z.literal('')),
  expiresAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable()
    .or(z.literal(''))
    .optional(),
});

export const updateLinkSchema = createLinkSchema.partial();

export const listLinksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().trim().max(120).optional(),
  status: z.enum([LinkStatus.ACTIVE, LinkStatus.EXPIRED, LinkStatus.DISABLED]).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'originalUrl', 'title', 'clicks']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const codeParamSchema = z.object({
  code: z.string().min(1).max(60),
});