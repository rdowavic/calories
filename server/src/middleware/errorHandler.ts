import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ZodError } from 'zod';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: err.flatten().fieldErrors,
      },
    });
  }

  const status = (err as any).status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  res.status(status).json({
    error: { message, code: 'SERVER_ERROR' },
  });
}
