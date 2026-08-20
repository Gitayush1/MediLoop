import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';
import { isProduction } from '../config';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(
        { err, requestId: req.headers['x-request-id'], path: req.path },
        'Operational error',
      );
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && !isProduction ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Unknown errors – don't leak internals
  logger.error(
    { err, requestId: req.headers['x-request-id'], path: req.path, method: req.method },
    'Unhandled error',
  );

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
