import type { Request, Response, NextFunction } from 'express';
import { ROLE_PERMISSIONS, type PermissionType } from '@ai-bos/shared';

export function requirePermission(...permissions: PermissionType[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const userPermissions = new Set<string>();
    for (const role of user.roles) {
      const rolePerms = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
      if (rolePerms) {
        for (const perm of rolePerms) {
          userPermissions.add(perm);
        }
      }
    }

    const hasPermission = permissions.every((p) => userPermissions.has(p));
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
      return;
    }

    next();
  };
}
