import { Router } from 'express';
import { refillsController } from './refills.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

router.get('/', refillsController.getAll.bind(refillsController));

router.get('/:medicationId', refillsController.getByMedication.bind(refillsController));

router.post('/:medicationId/acknowledge', refillsController.acknowledge.bind(refillsController));

router.post(
  '/:medicationId/inventory',
  validate(
    z.object({
      quantity: z.number().int().positive(),
      type: z.enum(['INITIAL', 'PURCHASE', 'ADJUSTMENT']).optional(),
      note: z.string().optional(),
    }),
  ),
  refillsController.addInventory.bind(refillsController),
);

export default router;
