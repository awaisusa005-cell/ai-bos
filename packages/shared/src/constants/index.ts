export const APP_NAME = 'AI Business Operating System';
export const APP_SHORT_NAME = 'AI BOS';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

export const PERMISSIONS = {
  // Organization
  ORG_READ: 'org:read',
  ORG_UPDATE: 'org:update',
  ORG_DELETE: 'org:delete',
  ORG_MANAGE_MEMBERS: 'org:manage_members',

  // Workspace
  WORKSPACE_CREATE: 'workspace:create',
  WORKSPACE_READ: 'workspace:read',
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_DELETE: 'workspace:delete',

  // AI Employees
  AI_EMPLOYEE_CREATE: 'ai_employee:create',
  AI_EMPLOYEE_READ: 'ai_employee:read',
  AI_EMPLOYEE_UPDATE: 'ai_employee:update',
  AI_EMPLOYEE_DELETE: 'ai_employee:delete',

  // Integrations
  INTEGRATION_CREATE: 'integration:create',
  INTEGRATION_READ: 'integration:read',
  INTEGRATION_UPDATE: 'integration:update',
  INTEGRATION_DELETE: 'integration:delete',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];
export type PermissionType = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<RoleType, PermissionType[]> = {
  [ROLES.OWNER]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: Object.values(PERMISSIONS).filter((p) => p !== PERMISSIONS.ORG_DELETE),
  [ROLES.MEMBER]: [
    PERMISSIONS.ORG_READ,
    PERMISSIONS.WORKSPACE_READ,
    PERMISSIONS.AI_EMPLOYEE_READ,
    PERMISSIONS.AI_EMPLOYEE_CREATE,
    PERMISSIONS.INTEGRATION_READ,
    PERMISSIONS.SETTINGS_READ,
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.ORG_READ,
    PERMISSIONS.WORKSPACE_READ,
    PERMISSIONS.AI_EMPLOYEE_READ,
    PERMISSIONS.INTEGRATION_READ,
  ],
};
