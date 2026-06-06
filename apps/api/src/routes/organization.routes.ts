import { Router, type Router as RouterType } from 'express';
import { createAuthMiddleware } from '@ai-bos/auth';
import { prisma } from '@ai-bos/database';
import { generateSlug } from '@ai-bos/shared';
import { validate } from '../middleware/validate';
import { env } from '../config';
import { z } from 'zod';
import type { ApiResponse } from '@ai-bos/shared';

const router: RouterType = Router();

const authenticate = createAuthMiddleware({
  jwtSecret: env.JWT_SECRET,
  jwtRefreshSecret: env.JWT_REFRESH_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
});

const createOrgSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).optional(),
});

// All routes require auth
router.use(authenticate);

// POST /organizations
router.post('/', validate(createOrgSchema), async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    const userId = req.user!.userId;

    const orgSlug = slug || generateSlug(name);

    const org = await prisma.organization.create({
      data: { name, slug: orgSlug },
    });

    // Create owner role
    const ownerRole = await prisma.role.create({
      data: {
        name: 'owner',
        description: 'Organization owner with full access',
        organizationId: org.id,
        isSystem: true,
      },
    });

    // Add user as owner
    await prisma.teamMember.create({
      data: {
        userId,
        organizationId: org.id,
        roleId: ownerRole.id,
      },
    });

    const response: ApiResponse = { success: true, data: org };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// GET /organizations
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: { organization: true },
    });

    const organizations = memberships.map((m) => m.organization);
    const response: ApiResponse = { success: true, data: organizations };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// GET /organizations/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const membership = await prisma.teamMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: id } },
      include: { organization: true },
    });

    if (!membership) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Organization not found' },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = { success: true, data: membership.organization };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

export { router as organizationRouter };
