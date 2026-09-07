import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

interface ErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

type KnownError = ApiError | Error | Prisma.PrismaClientKnownRequestError | undefined;

export function errorHandler(
  raw: KnownError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let status = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Something went wrong. Please try again later.';
  let details: unknown;

  if (raw instanceof ApiError) {
    status = raw.status;
    code = raw.code;
    message = raw.message;
    details = raw.details;
  } else if (raw instanceof Prisma.PrismaClientKnownRequestError) {
    if (raw.code === 'P2002') {
      status = 409;
      code = 'DUPLICATE_RESOURCE';
      message = 'A record with this value already exists.';
    } else if (raw.code === 'P2025') {
      status = 404;
      code = 'NOT_FOUND';
      message = 'The requested resource was not found.';
    } else {
      logger.error('Prisma error', { code: raw.code, message: raw.message });
    }
  }

  if (status === 500) {
    logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, raw instanceof Error ? (raw.stack ?? raw.message) : String(raw));
  }

  const body: ErrorBody = { success: false, error: { code, message } };
  if (details !== undefined) {
    body.error.details = details;
  }

  if (res.headersSent) {
    res.end();
    return;
  }
  res.status(status).json(body);
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'This endpoint does not exist.' },
  });
}