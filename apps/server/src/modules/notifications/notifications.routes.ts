import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { updateNotificationPreferenceSchema } from '@mediloop/shared';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

// ─── Notification list ───────────────────────────────────────
router.get('/', notificationsController.getAll.bind(notificationsController));

router.patch('/read-all', notificationsController.markAllRead.bind(notificationsController));

router.patch('/:id/read', notificationsController.markRead.bind(notificationsController));

// ─── Preferences ─────────────────────────────────────────────
router.get('/preferences', notificationsController.getPreferences.bind(notificationsController));

router.patch(
  '/preferences',
  validate(updateNotificationPreferenceSchema),
  notificationsController.updatePreferences.bind(notificationsController),
);

// ─── Device token management ─────────────────────────────────
router.post(
  '/devices',
  validate(
    z.object({
      pushToken: z.string().min(1),
      platform: z.enum(['IOS', 'ANDROID', 'WEB']),
      deviceId: z.string().min(1),
    }),
  ),
  notificationsController.registerDevice.bind(notificationsController),
);

router.delete(
  '/devices/:deviceId',
  notificationsController.deregisterDevice.bind(notificationsController),
);

export default router;
