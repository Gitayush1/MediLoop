import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { config } from '../../config';
import {
  AuthenticationError,
  ConflictError,
  BadRequestError,
} from '../../lib/errors';
import { logger } from '../../lib/logger';
import { emailService } from '../notifications/email.service';

const BCRYPT_ROUNDS = 12;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  private signAccessToken(payload: { userId: string; email: string; role: string }): string {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRY as any,
    });
  }

  private signRefreshToken(payload: { userId: string }): string {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRY as any,
    });
  }

  async register(input: RegisterInput): Promise<{ user: { id: string; email: string }; tokens: TokenPair }> {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictError('USER_ALREADY_EXISTS', 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        profile: {
          create: {
            firstName: input.firstName,
            lastName: input.lastName ?? '',
          },
        },
        notificationPreference: {
          create: {},
        },
      },
      include: { profile: true },
    });

    // Send verification email (fire and forget)
    void this.sendVerificationEmail(user.id, user.email);

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);

    logger.info({ userId: user.id, email: user.email }, 'User registered');

    return {
      user: { id: user.id, email: user.email },
      tokens,
    };
  }

  async login(input: LoginInput): Promise<{ user: { id: string; email: string; role: string; emailVerified: boolean }; tokens: TokenPair }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email, deletedAt: null },
    });

    if (!user) {
      throw new AuthenticationError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new AuthenticationError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);

    logger.info({ userId: user.id }, 'User logged in');

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: { userId: string };

    try {
      payload = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as { userId: string };
    } catch {
      throw new AuthenticationError('TOKEN_INVALID', 'Invalid refresh token');
    }

    const tokenHash = this.hashToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AuthenticationError('TOKEN_EXPIRED', 'Refresh token is invalid or expired');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId, deletedAt: null },
    });

    if (!user) {
      throw new AuthenticationError('UNAUTHORIZED', 'User not found');
    }

    // Rotate refresh token
    await prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });

    return this.generateTokenPair(user.id, user.email, user.role);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.type !== 'EMAIL_VERIFICATION' || record.usedAt) {
      throw new BadRequestError('Invalid or already used verification token');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestError('Verification token has expired');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email: record.email },
        data: { emailVerified: true },
      }),
      prisma.verificationToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  async forgotPassword(email: string): Promise<void> {
    // Always respond with success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email, deletedAt: null } });
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);

    await prisma.verificationToken.create({
      data: {
        email,
        tokenHash,
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
      },
    });

    void emailService.sendPasswordReset(email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.type !== 'PASSWORD_RESET' || record.usedAt) {
      throw new BadRequestError('Invalid or already used reset token');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestError('Reset token has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: record.email },
        data: { passwordHash },
      }),
      prisma.verificationToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      }),
      // Revoke all existing refresh tokens for security
      prisma.refreshToken.updateMany({
        where: {
          user: { email: record.email },
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  private async generateTokenPair(userId: string, email: string, role: string): Promise<TokenPair> {
    const accessToken = this.signAccessToken({ userId, email, role });
    const refreshToken = this.signRefreshToken({ userId });
    const tokenHash = this.hashToken(refreshToken);

    // Parse expiry (e.g., "7d" → milliseconds)
    const expiresAt = new Date(Date.now() + this.parseExpiry(config.JWT_REFRESH_EXPIRY));

    await prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[unit] ?? 1000);
  }

  private async sendVerificationEmail(userId: string, email: string): Promise<void> {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(token);

      await prisma.verificationToken.create({
        data: {
          email,
          tokenHash,
          type: 'EMAIL_VERIFICATION',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
        },
      });

      await emailService.sendEmailVerification(email, token);
    } catch (err) {
      logger.warn({ err, userId }, 'Failed to send verification email');
    }
  }
}

export const authService = new AuthService();
