import type { Request, Response } from 'express';
import { LinkStatus } from '@prisma/client';
import {
  createLink,
  deleteLink,
  getLinkForUser,
  listLinks,
  serializeLink,
  setLinkStatus,
  updateLink,
} from '../services/link.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/sendSuccess';

export const createLinkHandler = asyncHandler(async (req: Request, res: Response) => {
  const link = await createLink(
    {
      originalUrl: req.body.originalUrl,
      customAlias: req.body.customAlias && req.body.customAlias.trim() !== '' ? req.body.customAlias : undefined,
      title: req.body.title ?? undefined,
      expiresAt: req.body.expiresAt ?? null,
    },
    {
      userId: req.user?.id,
      isAuthenticated: Boolean(req.user),
    },
  );
  sendSuccess(res, { link: serializeLink({ ...link, _count: { clicks: 0 } }) }, 201);
});

export const listLinksHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, unknown>;
  const asString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

  const result = await listLinks(req.user!.id, {
    page: query.page !== undefined ? Number.parseInt(String(query.page), 10) : undefined,
    limit: query.limit !== undefined ? Number.parseInt(String(query.limit), 10) : undefined,
    search: asString(query.search),
    status: asString(query.status) as LinkStatus | undefined,
    sortBy: asString(query.sortBy),
    order: asString(query.order) as 'asc' | 'desc' | undefined,
  });
  sendSuccess(res, result);
});

export const getLinkHandler = asyncHandler(async (req: Request, res: Response) => {
  const link = await getLinkForUser(req.user!.id, req.params.id);
  sendSuccess(res, { link });
});

export const updateLinkHandler = asyncHandler(async (req: Request, res: Response) => {
  const link = await updateLink(req.user!.id, req.params.id, {
    originalUrl: req.body.originalUrl,
    title: req.body.title,
    expiresAt: req.body.expiresAt,
    customAlias: req.body.customAlias,
  });
  sendSuccess(res, { link });
});

export const deleteLinkHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteLink(req.user!.id, req.params.id);
  sendSuccess(res, { deleted: true });
});

export const disableLinkHandler = asyncHandler(async (req: Request, res: Response) => {
  const link = await setLinkStatus(req.user!.id, req.params.id, 'DISABLED');
  sendSuccess(res, { link });
});

export const enableLinkHandler = asyncHandler(async (req: Request, res: Response) => {
  const link = await setLinkStatus(req.user!.id, req.params.id, 'ACTIVE');
  sendSuccess(res, { link });
});