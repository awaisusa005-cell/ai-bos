import { Router, type Router as RouterType } from 'express';
import { authRouter } from './auth.routes';
import { organizationRouter } from './organization.routes';
import { healthRouter } from './health.routes';

const router: RouterType = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/organizations', organizationRouter);

export { router as apiRouter };
