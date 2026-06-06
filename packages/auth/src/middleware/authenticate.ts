import type { Request, Response, NextFunction } from 'express';
import { TokenService, type TokenConfig } from '../services/token.service';
import type { TokenPayload } from '@ai-bos/shared';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function createAuthMiddleware(config: TokenConfig) {
  const tokenService = new TokenService(config);

  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' },
      });
      return;
    }

    const token = authHeader.slice(7);

    try {
      const payload = tokenService.verifyAccessToken(token);
      req.user = payload;
      next();
    } catch {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Access token is invalid or expired' },
      });
    }
  };
}
