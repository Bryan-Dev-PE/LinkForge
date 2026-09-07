import type { NextFunction, Response, RequestHandler } from 'express';

type Handler = (req: Parameters<RequestHandler>[0], res: Response, next: NextFunction) => Promise<unknown> | unknown;

export function asyncHandler(handler: Handler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}