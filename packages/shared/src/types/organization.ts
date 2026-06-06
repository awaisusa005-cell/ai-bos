export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  plan: OrganizationPlan;
  createdAt: Date;
  updatedAt: Date;
}

export type OrganizationPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface CreateOrganizationInput {
  name: string;
  slug?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}
