import { Router, type Router as RouterType } from 'express';
import { authRouter } from './auth.routes';
import { organizationRouter } from './organization.routes';
import { healthRouter } from './health.routes';
import { aiBrainRouter } from './ai-brain.routes';

const router: RouterType = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/organizations', organizationRouter);
router.use('/ai-brain', aiBrainRouter);

export { router as apiRouter };
