import { prisma } from '../../lib/prisma';
import { config } from '../../config';
import { logger } from '../../lib/logger';

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  type: string;
}

export class NotificationsService {
  async sendPush(payload: PushPayload): Promise<void> {
    // Store in DB
    await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type as never,
        title: payload.title,
        body: payload.body,
        data: (payload.data as object) ?? undefined,
      },
    });

    // Get active push tokens
    const devices = await prisma.device.findMany({
      where: { userId: payload.userId, isActive: true },
    });

    if (devices.length === 0) return;

    // Check notification preferences
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId: payload.userId },
    });

    if (prefs) {
      const typeMap: Record<string, keyof typeof prefs> = {
        DOSE_REMINDER: 'doseReminders',
        UPCOMING_DOSE: 'doseReminders',
        MISSED_DOSE: 'missedDoseAlerts',
        REFILL_WARNING: 'refillAlerts',
        CAREGIVER_ALERT: 'caregiverAlerts',
      };

      const prefKey = typeMap[payload.type];
      if (prefKey && prefs[prefKey] === false) {
        logger.debug({ userId: payload.userId, type: payload.type }, 'Notification suppressed by user preference');
        return;
      }

      // Check quiet hours
      if (prefs.quietHoursStart && prefs.quietHoursEnd) {
        const now = new Date();
        const currentTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
        if (this.isInQuietHours(currentTime, prefs.quietHoursStart, prefs.quietHoursEnd)) {
          logger.debug({ userId: payload.userId }, 'Notification suppressed: quiet hours');
          return;
        }
      }
    }

    // Send via Expo Push API
    if (config.EXPO_ACCESS_TOKEN) {
      await this.sendExpoNotifications(
        devices.map((d: { pushToken: string }) => d.pushToken),
        payload,
      );
    } else {
      logger.debug({ tokens: devices.length }, '[MOCK PUSH] Would send push notifications');
    }
  }

  async getNotifications(
    userId: string,
    params: { unreadOnly?: boolean; page?: number; limit?: number },
  ) {
    const { unreadOnly = false, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unreadOnly ? { read: false } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return { items, total, unreadCount, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }

  async getPreferences(userId: string) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async updatePreferences(userId: string, data: Partial<{
    doseReminders: boolean;
    missedDoseAlerts: boolean;
    refillAlerts: boolean;
    caregiverAlerts: boolean;
    reminderMinutesBefore: number;
    quietHoursStart: string;
    quietHoursEnd: string;
  }>) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  private isInQuietHours(current: string, start: string, end: string): boolean {
    if (start <= end) {
      return current >= start && current <= end;
    }
    // Overnight quiet hours (e.g., 22:00 – 07:00)
    return current >= start || current <= end;
  }

  async registerDevice(
    userId: string,
    data: { pushToken: string; platform: 'IOS' | 'ANDROID' | 'WEB'; deviceId: string },
  ) {
    return prisma.device.upsert({
      where: { userId_deviceId: { userId, deviceId: data.deviceId } },
      create: {
        userId,
        pushToken: data.pushToken,
        platform: data.platform,
        deviceId: data.deviceId,
        isActive: true,
      },
      update: {
        pushToken: data.pushToken,
        isActive: true,
      },
    });
  }

  async deregisterDevice(userId: string, deviceId: string): Promise<void> {
    await prisma.device.updateMany({
      where: { userId, deviceId },
      data: { isActive: false },
    });
  }

  private async sendExpoNotifications(tokens: string[], payload: PushPayload): Promise<void> {
    try {
      const messages = tokens.map((token) => ({
        to: token,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sound: 'default',
        priority: 'high',
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.EXPO_ACCESS_TOKEN}`,
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        logger.error({ status: response.status }, 'Expo push failed');
      } else {
        logger.debug({ count: tokens.length }, 'Push notifications sent');
      }
    } catch (err) {
      logger.error({ err }, 'Failed to send Expo push notifications');
    }
  }
}

export const notificationsService = new NotificationsService();
