import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { updateProfileSchema } from '@mediloop/shared';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

/**
 * @route GET /users/me
 */
router.get('/me', usersController.getMe.bind(usersController));

/**
 * @route PATCH /users/me
 */
router.patch(
  '/me',
  validate(updateProfileSchema),
  usersController.updateProfile.bind(usersController),
);

/**
 * @route DELETE /users/me
 */
router.delete('/me', usersController.deleteAccount.bind(usersController));

/**
 * @route POST /users/devices
 */
router.post(
  '/devices',
  validate(
    z.object({
      pushToken: z.string().min(1),
      platform: z.enum(['IOS', 'ANDROID', 'WEB']),
      deviceId: z.string().min(1),
    }),
  ),
  usersController.registerDevice.bind(usersController),
);

export default router;
