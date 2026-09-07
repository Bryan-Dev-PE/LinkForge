import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

type Source = 'body' | 'query' | 'params';

function makeValidator(source: Source) {
  return (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      (req as unknown as Record<string, unknown>)[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const key = issue.path.join('.') || 'value';
          details[key] = details[key] ? [...details[key], issue.message] : [issue.message];
        }
        next(new ApiError(422, 'VALIDATION_ERROR', 'The provided input is invalid.', details));
        return;
      }
      next(error);
    }
  };
}

export const validateBody = makeValidator('body');
export const validateQuery = makeValidator('query');
export const validateParams = makeValidator('params');