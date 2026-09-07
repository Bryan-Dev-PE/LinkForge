import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { getLinkForUser } from './link.service';

export interface QrSettings {
  foregroundColor: string;
  backgroundColor: string;
  size: number;
  margin: number;
  logoUrl: string | null;
}

export const QR_SIZE_MIN = 128;
export const QR_SIZE_MAX = 2048;
export const QR_MARGIN_MIN = 0;
export const QR_MARGIN_MAX = 20;

export function qrDefaults(): QrSettings {
  return {
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    size: 512,
    margin: 4,
    logoUrl: null,
  };
}

export async function getQrSettings(userId: string, linkId: string): Promise<QrSettings> {
  await getLinkForUser(userId, linkId);
  const existing = await prisma.qrCode.findUnique({ where: { linkId } });
  if (!existing) return qrDefaults();
  return {
    foregroundColor: existing.foregroundColor,
    backgroundColor: existing.backgroundColor,
    size: existing.size,
    margin: existing.margin,
    logoUrl: existing.logoUrl,
  };
}

export async function saveQrSettings(
  userId: string,
  linkId: string,
  settings: QrSettings,
): Promise<QrSettings> {
  const link = await getLinkForUser(userId, linkId);
  if (!link) {
    throw new ApiError(404, 'LINK_NOT_FOUND', 'Link not found.');
  }

  const size = Math.min(QR_SIZE_MAX, Math.max(QR_SIZE_MIN, settings.size));
  const margin = Math.min(QR_MARGIN_MAX, Math.max(QR_MARGIN_MIN, settings.margin));

  const saved = await prisma.qrCode.upsert({
    where: { linkId },
    create: {
      linkId,
      foregroundColor: settings.foregroundColor,
      backgroundColor: settings.backgroundColor,
      size,
      margin,
      logoUrl: settings.logoUrl,
    },
    update: {
      foregroundColor: settings.foregroundColor,
      backgroundColor: settings.backgroundColor,
      size,
      margin,
      logoUrl: settings.logoUrl,
    },
  });

  return {
    foregroundColor: saved.foregroundColor,
    backgroundColor: saved.backgroundColor,
    size: saved.size,
    margin: saved.margin,
    logoUrl: saved.logoUrl,
  };
}