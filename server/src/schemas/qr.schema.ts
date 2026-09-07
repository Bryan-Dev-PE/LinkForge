import { z } from 'zod';

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a six-digit hex value.');

export const saveQrSchema = z.object({
  foregroundColor: hexColor,
  backgroundColor: hexColor,
  size: z.coerce.number().int().min(0).max(100_000),
  margin: z.coerce.number().int().min(0).max(1000),
  logoUrl: z
    .string()
    .max(2_000_000, 'Logo image must be smaller than 2MB.')
    .optional()
    .nullable(),
});