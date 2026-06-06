import { Router, type Router as RouterType } from 'express';
import {
  AuthService,
  createAuthMiddleware,
  registerSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '@ai-bos/auth';
import { validate } from '../middleware/validate';
import { authRateLimit } from '../middleware/rate-limiter';
import { env } from '../config';
import type { ApiResponse } from '@ai-bos/shared';

const router: RouterType = Router();

const authService = new AuthService({
  jwtSecret: env.JWT_SECRET,
  jwtRefreshSecret: env.JWT_REFRESH_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
});

const authenticate = createAuthMiddleware({
  jwtSecret: env.JWT_SECRET,
  jwtRefreshSecret: env.JWT_REFRESH_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
});

// POST /auth/register
router.post('/register', authRateLimit, validate(registerSchema), async (req, res, next) => {
  try {
    const tokens = await authService.register(req.body);
    const response: ApiResponse = { success: true, data: tokens };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// POST /auth/login
router.post('/login', authRateLimit, validate(loginSchema), async (req, res, next) => {
  try {
    const tokens = await authService.login(req.body);
    const response: ApiResponse = { success: true, data: tokens };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// POST /auth/refresh
router.post('/refresh', validate(refreshTokenSchema), async (req, res, next) => {
  try {
    const tokens = await authService.refreshTokens(req.body.refreshToken);
    const response: ApiResponse = { success: true, data: tokens };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// POST /auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    const response: ApiResponse = { success: true, data: { message: 'Logged out successfully' } };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// POST /auth/password-reset/request
router.post(
  '/password-reset/request',
  authRateLimit,
  validate(resetPasswordRequestSchema),
  async (req, res, next) => {
    try {
      await authService.requestPasswordReset(req.body.email);
      const response: ApiResponse = {
        success: true,
        data: { message: 'If the email exists, a reset link has been sent' },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
);

// POST /auth/password-reset
router.post('/password-reset', validate(resetPasswordSchema), async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    const response: ApiResponse = { success: true, data: { message: 'Password reset successful' } };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req, res) => {
  const response: ApiResponse = { success: true, data: { user: req.user } };
  res.status(200).json(response);
});

export { router as authRouter };
