import type { Request } from 'express';
import { rateLimit, type RateLimitRequestHandler } from 'express-rate-limit';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export function createRateLimiter(options: {
  windowMs?: number;
  limit?: number | ((req: Request) => number);
  standardHeaders?: boolean;
  message?: string;
  keyGenerator?: (req: Request) => string | Promise<string>;
}): RateLimitRequestHandler {
  const keyGenerator = options.keyGenerator
    ? options.keyGenerator
    : (req: Request): string | Promise<string> => req.ip ?? 'unknown';
  return rateLimit({
    windowMs: options.windowMs ?? env.rateLimitWindowMs,
    limit: options.limit ?? env.rateLimitMaxRequests,
    standardHeaders: options.standardHeaders ?? true,
    legacyHeaders: false,
    keyGenerator: async (req) => String(await keyGenerator(req)),
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for ${req.ip ?? 'unknown'} on ${req.originalUrl}`);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message ?? 'Too many requests. Please try again later.',
        },
      });
    },
  });
}

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

export const forgotPasswordRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'Too many password reset requests. Please try again in an hour.',
});

export const linkCreateRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: (req: Request) => (req.user ? env.userLinkLimitPerHour : env.guestLinkLimitPerHour),
  keyGenerator: (req: Request) => (req.user ? `user:${req.user.id}` : `guest:${req.ip ?? 'unknown'}`),
  message: 'You have reached the maximum number of links allowed right now. Please try again later.',
});

export const redirectRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 600,
  message: 'Too many requests.',
});

export const analyticsRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 120,
  message: 'Too many analytics requests. Please slow down.',
});