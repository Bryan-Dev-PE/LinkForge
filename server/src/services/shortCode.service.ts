import { customAlphabet } from 'nanoid';
import { prisma } from '../config/prisma';
import { ALIAS_PATTERN, RESERVED_ROUTES, SHORT_CODE_ALPHABET, SHORT_CODE_LENGTH } from '../constants/links';
import { ApiError } from '../utils/ApiError';

const generateShortCode = customAlphabet(SHORT_CODE_ALPHABET, SHORT_CODE_LENGTH);

const MAX_ATTEMPTS = 10;

export async function generateUniqueShortCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const shortCode = generateShortCode();
    const existing = await prisma.link.findUnique({ where: { shortCode } });
    if (!existing) return shortCode;
  }
  throw new ApiError(500, 'SHORT_CODE_GENERATION_FAILED', 'Could not generate a unique short code.');
}

export function normalizeAlias(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateAlias(raw: string): string {
  const alias = normalizeAlias(raw);
  if (!ALIAS_PATTERN.test(alias)) {
    throw new ApiError(
      422,
      'INVALID_ALIAS',
      'Alias must be 3-30 characters and contain only letters, numbers, hyphens, or underscores.',
    );
  }
  if (RESERVED_ROUTES.has(alias)) {
    throw new ApiError(409, 'RESERVED_ALIAS', 'This alias is reserved and cannot be used.');
  }
  return alias;
}

export async function assertAliasAvailable(alias: string): Promise<void> {
  const [owner, shortCodeOwner] = await Promise.all([
    prisma.link.findUnique({ where: { customAlias: alias } }),
    prisma.link.findUnique({ where: { shortCode: alias } }),
  ]);
  if (owner || shortCodeOwner) {
    throw new ApiError(409, 'ALIAS_ALREADY_EXISTS', 'This custom alias is already in use.');
  }
}

export function isReservedRoute(route: string): boolean {
  return RESERVED_ROUTES.has(route);
}