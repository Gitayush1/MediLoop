import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { cacheDel, cacheGet, cacheSet } from '../../lib/redis';

interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  timezone?: string;
  avatarUrl?: string;
}

export class UsersService {
  async getMe(userId: string) {
    const cacheKey = `user:${userId}:profile`;
    const cached = await cacheGet<object>(cacheKey);
    if (cached) return cached;

    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        profile: true,
        notificationPreference: true,
        _count: {
          select: {
            medications: { where: { status: 'ACTIVE', deletedAt: null } },
            prescriptions: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!user) throw new NotFoundError('NOT_FOUND', 'User not found');

    const result = {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      profile: user.profile,
      notificationPreference: user.notificationPreference,
      stats: {
        activeMedications: user._count.medications,
        prescriptions: user._count.prescriptions,
      },
    };

    await cacheSet(cacheKey, result, 300);
    return result;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.findUnique({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundError('NOT_FOUND', 'User not found');

    const profile = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        firstName: input.firstName ?? '',
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        phone: input.phone,
        timezone: input.timezone ?? 'Asia/Kolkata',
        avatarUrl: input.avatarUrl,
      },
      update: {
        ...(input.firstName !== undefined && { firstName: input.firstName }),
        ...(input.lastName !== undefined && { lastName: input.lastName }),
        ...(input.dateOfBirth !== undefined && { dateOfBirth: new Date(input.dateOfBirth) }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.timezone !== undefined && { timezone: input.timezone }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
      },
    });

    await cacheDel(`user:${userId}:profile`);
    return profile;
  }

  async deleteAccount(userId: string): Promise<void> {
    // Soft delete
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    // Revoke all tokens
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await cacheDel(`user:${userId}:profile`);
  }

  async registerDevice(
    userId: string,
    data: { pushToken: string; platform: string; deviceId: string },
  ) {
    return prisma.device.upsert({
      where: { userId_deviceId: { userId, deviceId: data.deviceId } },
      create: {
        userId,
        pushToken: data.pushToken,
        platform: data.platform as 'IOS' | 'ANDROID' | 'WEB',
        deviceId: data.deviceId,
        isActive: true,
      },
      update: {
        pushToken: data.pushToken,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }
}

export const usersService = new UsersService();
