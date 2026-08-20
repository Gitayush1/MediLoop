import { Router } from 'express';
import { medicationsController } from './medications.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { createMedicationSchema, updateMedicationSchema } from '@mediloop/shared';

const router = Router();

router.use(authenticate);

router.get('/', medicationsController.list.bind(medicationsController));
router.post('/', validate(createMedicationSchema), medicationsController.create.bind(medicationsController));
router.get('/:id', medicationsController.getById.bind(medicationsController));
router.patch('/:id', validate(updateMedicationSchema), medicationsController.update.bind(medicationsController));
router.delete('/:id', medicationsController.delete.bind(medicationsController));

export default router;
