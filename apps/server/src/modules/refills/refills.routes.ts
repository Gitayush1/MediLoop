import { Router } from 'express';
import { refillsService } from './refills.service';
import { authenticate } from '../../middleware/authenticate';
import { sendSuccess } from '../../lib/response';
import { validate } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const result = await refillsService.getAll(req.user!.userId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/:medicationId', async (req, res, next) => {
  try {
    const result = await refillsService.getByMedication(req.user!.userId, req.params.medicationId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/:medicationId/acknowledge', async (req, res, next) => {
  try {
    await refillsService.acknowledge(req.user!.userId, req.params.medicationId);
    sendSuccess(res, { message: 'Refill warning acknowledged' });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/:medicationId/inventory',
  validate(
    z.object({
      quantity: z.number().int().positive(),
      type: z.enum(['INITIAL', 'PURCHASE', 'ADJUSTMENT']).optional(),
      note: z.string().optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      const result = await refillsService.addInventory(
        req.user!.userId,
        req.params.medicationId,
        req.body as { quantity: number; type?: string; note?: string },
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
