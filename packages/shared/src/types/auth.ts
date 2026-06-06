export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  organizationId?: string;
  roles: string[];
}
