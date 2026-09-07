import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { env, hasSmtpConfigured } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { generateRawToken, hashRawToken, signAccessToken } from './token.service';
import { sendMail } from './mail.service';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: PublicUser; token: string }> {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'EMAIL_ALREADY_REGISTERED', 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: input.name.trim(), email, passwordHash },
  });

  const token = signAccessToken(user.id);
  return { user: toPublicUser(user), token };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user: PublicUser; token: string }> {
  const email = input.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordOk = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
  if (!user || !passwordOk) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const token = signAccessToken(user.id);
  return { user: toPublicUser(user), token };
}

export async function requestPasswordReset(emailInput: string): Promise<{ resetUrl?: string }> {
  const email = emailInput.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return {};
  }

  const rawToken = generateRawToken();
  const tokenHash = hashRawToken(rawToken);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${env.appUrl}/reset-password?token=${rawToken}`;
  const sent = await sendMail({
    to: user.email,
    subject: 'Reset your LinkForge password',
    text: `A password reset was requested for your LinkForge account.\n\nReset your password here: ${resetUrl}\n\nThis link is valid for 60 minutes. If you did not request this, you can safely ignore this email.`,
    html: `<p>A password reset was requested for your LinkForge account.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link is valid for 60 minutes. If you did not request this, you can safely ignore this email.</p>`,
  });

  const mailConfigured = hasSmtpConfigured();
  if (!sent && !env.isProduction) {
    logger.info(`Password reset link (dev only): ${resetUrl}`);
    return { resetUrl: mailConfigured ? undefined : resetUrl };
  }
  return {};
}

export async function resetUserPassword(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashRawToken(rawToken);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new ApiError(400, 'INVALID_RESET_TOKEN', 'This password reset link is invalid or has expired.');
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.');
  }
  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    throw new ApiError(400, 'INCORRECT_CURRENT_PASSWORD', 'Your current password is incorrect.');
  }
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export function toPublicUserSafe(user: { id: string; name: string; email: string; createdAt: Date; updatedAt: Date }): PublicUser {
  return toPublicUser(user);
}