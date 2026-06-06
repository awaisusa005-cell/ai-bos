import jwt from 'jsonwebtoken';
import type { TokenPayload } from '@ai-bos/shared';

export interface TokenConfig {
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
}

export class TokenService {
  constructor(private config: TokenConfig) {}

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn,
    } as jwt.SignOptions);
  }

  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.config.jwtRefreshSecret, {
      expiresIn: this.config.jwtRefreshExpiresIn,
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.config.jwtSecret) as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.config.jwtRefreshSecret) as TokenPayload;
  }
}
