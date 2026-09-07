import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export async function updateUserProfile(
  userId: string,
  data: { name?: string; email?: string },
): Promise<{ id: string; name: string; email: string; createdAt: Date; updatedAt: Date }> {
  const updates: Record<string, string> = {};

  if (data.name !== undefined) {
    const name = data.name.trim();
    if (name.length < 2 || name.length > 60) {
      throw new ApiError(422, 'INVALID_NAME', 'Name must be between 2 and 60 characters.');
    }
    updates.name = name;
  }

  if (data.email !== undefined) {
    const email = data.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(422, 'INVALID_EMAIL', 'Please provide a valid email address.');
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== userId) {
      throw new ApiError(409, 'EMAIL_ALREADY_REGISTERED', 'An account with this email already exists.');
    }
    updates.email = email;
  }

  if (Object.keys(updates).length === 0) {
    const current = await prisma.user.findUnique({ where: { id: userId } });
    if (!current) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.');
    return current;
  }

  return prisma.user.update({ where: { id: userId }, data: updates });
}