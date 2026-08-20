import { Router } from 'express';
import { caregiversController } from './caregivers.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { inviteCaregiverSchema } from '@mediloop/shared';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

// Patient invites a caregiver
router.post(
  '/invite',
  validate(inviteCaregiverSchema),
  caregiversController.invite.bind(caregiversController),
);

// Caregiver accepts an invitation
router.post(
  '/accept',
  validate(z.object({ token: z.string().min(1) })),
  caregiversController.acceptInvitation.bind(caregiversController),
);

// Get my caregivers (as patient)
router.get('/', caregiversController.getCaregivers.bind(caregiversController));

// Get patients I care for (as caregiver)
router.get('/patients', caregiversController.getPatients.bind(caregiversController));

// View patient medications (as caregiver — requires VIEW_MEDICATIONS permission)
router.get(
  '/patients/:patientId/medications',
  caregiversController.getPatientMedications.bind(caregiversController),
);

// View patient adherence (as caregiver — requires VIEW_ADHERENCE permission)
router.get(
  '/patients/:patientId/adherence',
  caregiversController.getPatientAdherence.bind(caregiversController),
);

// Revoke a caregiver relationship (as patient)
router.delete(
  '/:caregiverId',
  caregiversController.revoke.bind(caregiversController),
);

export default router;
