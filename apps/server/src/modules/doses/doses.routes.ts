import { Router } from 'express';
import { dosesController } from './doses.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { markDoseTakenSchema, snoozeDoseSchema } from '@mediloop/shared';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

router.get('/today', dosesController.getToday.bind(dosesController));
router.get('/history', dosesController.getHistory.bind(dosesController));
router.get('/adherence', dosesController.getAdherence.bind(dosesController));
router.post('/:id/taken', validate(markDoseTakenSchema), dosesController.markTaken.bind(dosesController));
router.post('/:id/skipped', validate(z.object({ notes: z.string().optional() })), dosesController.markSkipped.bind(dosesController));
router.post('/:id/snooze', validate(snoozeDoseSchema), dosesController.snooze.bind(dosesController));

export default router;
