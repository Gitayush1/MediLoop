import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { prescriptionsController } from './prescriptions.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import { config } from '../../config';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.STORAGE_LOCAL_PATH);
  },
  filename: (_req, file, cb) => {
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

router.use(authenticate);

// Upload a prescription file
router.post('/upload', upload.single('file'), prescriptionsController.upload.bind(prescriptionsController));

// Process a prescription with OCR + AI
router.post('/:id/process', prescriptionsController.process.bind(prescriptionsController));

// Get extraction review (after processing)
router.get('/:id/review', prescriptionsController.getExtractionReview.bind(prescriptionsController));

// Confirm/edit extracted medicines
router.post(
  '/:id/confirm',
  validate(
    z.object({
      confirmations: z.array(
        z.object({
          prescriptionMedicineId: z.string().uuid(),
          confirmed: z.boolean(),
          overrides: z
            .object({
              name: z.string().optional(),
              dosage: z.string().optional(),
              form: z.string().optional(),
              frequency: z.string().optional(),
              duration: z.string().optional(),
              instructions: z.string().optional(),
            })
            .optional(),
        }),
      ),
    }),
  ),
  prescriptionsController.confirmMedicines.bind(prescriptionsController),
);

// Explain a medication in plain language
router.post(
  '/explain',
  validate(
    z.object({
      medicationName: z.string().min(1),
      dosage: z.string().optional(),
      frequency: z.string().optional(),
      instructions: z.string().optional(),
      duration: z.string().optional(),
    }),
  ),
  prescriptionsController.explain.bind(prescriptionsController),
);

router.get('/', prescriptionsController.list.bind(prescriptionsController));
router.get('/:id', prescriptionsController.getById.bind(prescriptionsController));
router.delete('/:id', prescriptionsController.delete.bind(prescriptionsController));

export default router;
