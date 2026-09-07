import type { Request, Response, NextFunction } from 'express';
import type { User } from '@prisma/client';
import { prisma } from '../config/prisma';
import { extractToken, verifyAccessToken } from '../services/token.service';
import { ApiError } from '../utils/ApiError';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required.');
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new ApiError(401, 'INVALID_SESSION', 'Your session is invalid or has expired. Please sign in again.');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new ApiError(401, 'INVALID_SESSION', 'Your account no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (token) {
      try {
        const payload = verifyAccessToken(token);
        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (user) req.user = user;
      } catch {
        // An invalid optional token is ignored.
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}