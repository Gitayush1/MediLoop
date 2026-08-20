import { Router } from 'express';
import { notificationsService } from './notifications.service';
import { authenticate } from '../../middleware/authenticate';
import { sendSuccess } from '../../lib/response';
import { validate } from '../../middleware/validate';
import { updateNotificationPreferenceSchema } from '@mediloop/shared';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { unreadOnly, page, limit } = req.query as Record<string, string>;
    const result = await notificationsService.getNotifications(req.user!.userId, {
      unreadOnly: unreadOnly === 'true',
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
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
});

router.patch('/read-all', async (req, res, next) => {
  try {
    await notificationsService.markAllRead(req.user!.userId);
    sendSuccess(res, { message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    await notificationsService.markRead(req.user!.userId, req.params.id);
    sendSuccess(res, { message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
});

router.get('/preferences', async (req, res, next) => {
  try {
    const prefs = await notificationsService.getPreferences(req.user!.userId);
    sendSuccess(res, prefs);
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/preferences',
  validate(updateNotificationPreferenceSchema),
  async (req, res, next) => {
    try {
      const prefs = await notificationsService.updatePreferences(req.user!.userId, req.body as Parameters<typeof notificationsService.updatePreferences>[1]);
      sendSuccess(res, prefs);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
