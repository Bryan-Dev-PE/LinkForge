import type { Request, Response } from 'express';
import { getQrSettings, saveQrSettings } from '../services/qr.service';
import type { QrSettings } from '../services/qr.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/sendSuccess';

function normalizeSettings(body: Record<string, unknown>): QrSettings {
  return {
    foregroundColor: String(body.foregroundColor),
    backgroundColor: String(body.backgroundColor),
    size: Number(body.size),
    margin: Number(body.margin),
    logoUrl: (body.logoUrl as string) || null,
  };
}

export const getQrHandler = asyncHandler(async (req: Request, res: Response) => {
  const settings = await getQrSettings(req.user!.id, req.params.id);
  sendSuccess(res, { settings });
});

export const saveQrHandler = asyncHandler(async (req: Request, res: Response) => {
  const settings = await saveQrSettings(req.user!.id, req.params.id, normalizeSettings(req.body));
  sendSuccess(res, { settings });
});