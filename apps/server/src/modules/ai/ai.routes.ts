import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { sendSuccess } from '../../lib/response';
import { aiService } from './ai.service';

const router = Router();
router.use(authenticate);

/**
 * POST /api/v1/ai/prescriptions/:id/process
 * Trigger the OCR → LLM pipeline for an already-uploaded prescription.
 */
router.post('/prescriptions/:id/process', async (req, res, next) => {
  try {
    await aiService.processPrescription(req.params.id, req.user!.userId);
    sendSuccess(res, { message: 'Prescription processing complete' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/ai/medications/:id/explain
 * Get a plain-language explanation of a medication (informational only, no medical advice).
 */
router.get('/medications/:id/explain', async (req, res, next) => {
  try {
    const result = await aiService.explainMedication(req.user!.userId, req.params.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
