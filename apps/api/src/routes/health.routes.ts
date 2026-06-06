import { Router, type Router as RouterType } from 'express';

const router: RouterType = Router();

router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.0.1',
    uptime: process.uptime(),
  });
});

export { router as healthRouter };
