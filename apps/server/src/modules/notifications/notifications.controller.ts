import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { sendSuccess } from '../../lib/response';

export class NotificationsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { unreadOnly, page, limit } = req.query as Record<string, string>;
      const result = await notificationsService.getNotifications(req.user!.userId, {
        unreadOnly: unreadOnly === 'true',
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      });
      sendSuccess(res, result.items, 200, {
        total: result.total,
        unreadCount: result.unreadCount,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (err) {
      next(err);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationsService.markRead(req.user!.userId, req.params.id);
      sendSuccess(res, { message: 'Notification marked as read' });
    } catch (err) {
      next(err);
    }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationsService.markAllRead(req.user!.userId);
      sendSuccess(res, { message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  }

  async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prefs = await notificationsService.getPreferences(req.user!.userId);
      sendSuccess(res, prefs);
    } catch (err) {
      next(err);
    }
  }

  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prefs = await notificationsService.updatePreferences(
        req.user!.userId,
        req.body as Parameters<typeof notificationsService.updatePreferences>[1],
      );
      sendSuccess(res, prefs);
    } catch (err) {
      next(err);
    }
  }

  async registerDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pushToken, platform, deviceId } = req.body as {
        pushToken: string;
        platform: 'IOS' | 'ANDROID' | 'WEB';
        deviceId: string;
      };
      const device = await notificationsService.registerDevice(req.user!.userId, {
        pushToken,
        platform,
        deviceId,
      });
      sendSuccess(res, device, 201);
    } catch (err) {
      next(err);
    }
  }

  async deregisterDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationsService.deregisterDevice(req.user!.userId, req.params.deviceId);
      sendSuccess(res, { message: 'Device deregistered' });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationsController = new NotificationsController();
