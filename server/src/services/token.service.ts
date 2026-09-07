import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    issuer: 'linkforge',
    audience: 'linkforge-client',
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret, {
    issuer: 'linkforge',
    audience: 'linkforge-client',
  }) as jwt.JwtPayload;
  if (typeof decoded.sub !== 'string') {
    throw new Error('Invalid token payload');
  }
  return { sub: decoded.sub };
}

export function getTokenExpiryInMs(): number {
  const match = /^(\d+)([smhd])$/.exec(env.jwtExpiresIn);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number.parseInt(match[1] ?? '7', 10);
  const unit = match[2];
  const multiplier = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return value * multiplier;
}

export function extractToken(req: Request): string | null {
  const fromCookie = req.cookies?.[env.cookieName];
  if (fromCookie) return String(fromCookie);

  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: res.req.secure,
    maxAge: getTokenExpiryInMs(),
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: res.req.secure,
    path: '/',
  });
}

export function hashRawToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function generateRawToken(): string {
  return randomBytes(32).toString('hex');
}