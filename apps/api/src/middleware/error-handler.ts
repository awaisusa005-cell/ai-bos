import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AuthError } from '@ai-bos/auth';
import type { ApiResponse } from '@ai-bos/shared';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.');
      if (!details[path]) details[path] = [];
      details[path].push(issue.message);
    }

    const response: ApiResponse = {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details },
    };
    res.status(400).json(response);
    return;
  }

  // Auth errors
  if (err instanceof AuthError) {
    const statusMap: Record<string, number> = {
      USER_EXISTS: 409,
      INVALID_CREDENTIALS: 401,
      ACCOUNT_INACTIVE: 403,
      INVALID_TOKEN: 401,
    };

    const response: ApiResponse = {
      success: false,
      error: { code: err.code, message: err.message },
    };
    res.status(statusMap[err.code] ?? 400).json(response);
    return;
  }

  // Unknown errors
  console.error('Unhandled error:', err);
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  };
  res.status(500).json(response);
}
