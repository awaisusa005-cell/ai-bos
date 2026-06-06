import { prisma } from '@ai-bos/database';
import type { AuthTokens, RegisterInput, LoginInput, TokenPayload } from '@ai-bos/shared';
import { generateSlug } from '@ai-bos/shared';
import { PasswordService } from './password.service';
import { TokenService, type TokenConfig } from './token.service';

export class AuthService {
  private tokenService: TokenService;

  constructor(config: TokenConfig) {
    this.tokenService = new TokenService(config);
  }

  async register(input: RegisterInput): Promise<AuthTokens> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new AuthError('User with this email already exists', 'USER_EXISTS');
    }

    const passwordHash = await PasswordService.hash(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });

    // Create default organization if name provided
    let organizationId: string | undefined;
    if (input.organizationName) {
      const org = await prisma.organization.create({
        data: {
          name: input.organizationName,
          slug: generateSlug(input.organizationName),
        },
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

      // Add user as team member with owner role
      await prisma.teamMember.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          roleId: ownerRole.id,
        },
      });

      organizationId = org.id;
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      organizationId,
      roles: ['owner'],
    };

    const tokens = this.generateTokens(tokenPayload);
    await this.saveSession(user.id, tokens.refreshToken);

    return tokens;
  }

  async login(input: LoginInput): Promise<AuthTokens> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        teamMembers: {
          include: { role: true, organization: true },
        },
      },
    });

    if (!user) {
      throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AuthError('Account has been deactivated', 'ACCOUNT_INACTIVE');
    }

    const isValid = await PasswordService.verify(input.password, user.passwordHash);
    if (!isValid) {
      throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const primaryMembership = user.teamMembers[0];
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      organizationId: primaryMembership?.organization.id,
      roles: user.teamMembers.map((tm) => tm.role.name),
    };

    const tokens = this.generateTokens(tokenPayload);
    await this.saveSession(user.id, tokens.refreshToken);

    return tokens;
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);

    const session = await prisma.session.findUnique({
      where: { refreshToken },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new AuthError('Invalid or expired refresh token', 'INVALID_TOKEN');
    }

    // Delete old session
    await prisma.session.delete({ where: { id: session.id } });

    const newTokens = this.generateTokens(payload);
    await this.saveSession(payload.userId, newTokens.refreshToken);

    return newTokens;
  }

  async logout(refreshToken: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { refreshToken },
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal whether user exists
      return;
    }

    const token = crypto.randomUUID();
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // TODO: Send password reset email via email service
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      throw new AuthError('Invalid or expired reset token', 'INVALID_TOKEN');
    }

    const passwordHash = await PasswordService.hash(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
      // Invalidate all sessions
      prisma.session.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);
  }

  private generateTokens(payload: TokenPayload): AuthTokens {
    return {
      accessToken: this.tokenService.generateAccessToken(payload),
      refreshToken: this.tokenService.generateRefreshToken(payload),
    };
  }

  private async saveSession(userId: string, refreshToken: string): Promise<void> {
    await prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
