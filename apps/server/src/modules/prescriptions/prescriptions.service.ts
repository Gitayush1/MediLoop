import path from 'path';
import fs from 'fs/promises';
import { prisma } from '../../lib/prisma';
import { NotFoundError, AuthorizationError, BadRequestError, AppError } from '../../lib/errors';
import { ocrProvider } from '../ai/providers/ocr.provider';
import { llmProvider } from '../ai/providers/llm.provider';
import { logger } from '../../lib/logger';
import type { PrescriptionExtraction } from '@mediloop/shared';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  filename: string;
}

interface ConfirmMedicineInput {
  prescriptionMedicineId: string;
  confirmed: boolean;
  overrides?: {
    name?: string;
    dosage?: string;
    form?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  };
}

export class PrescriptionsService {
  async upload(userId: string, file: UploadedFile) {
    // Validate file
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      await this.cleanupFile(file.path);
      throw new BadRequestError(
        `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      await this.cleanupFile(file.path);
      throw new AppError('FILE_TOO_LARGE', 'File size exceeds 10MB limit', 413);
    }

    const prescription = await prisma.prescription.create({
      data: {
        userId,
        fileKey: file.filename,
        fileUrl: `/uploads/${file.filename}`,
        mimeType: file.mimetype,
        originalName: file.originalname,
        fileSize: file.size,
        status: 'UPLOADED',
      },
    });

    return prescription;
  }

  async process(userId: string, prescriptionId: string): Promise<PrescriptionExtraction & { prescriptionId: string }> {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId, deletedAt: null },
    });

    if (!prescription) throw new NotFoundError('PRESCRIPTION_NOT_FOUND', 'Prescription not found');
    if (prescription.userId !== userId) throw new AuthorizationError();

    if (prescription.status === 'PROCESSING') {
      throw new BadRequestError('Prescription is already being processed');
    }

    // Mark as processing
    await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { status: 'PROCESSING' },
    });

    try {
      // 1. Read file
      const filePath = path.join(process.cwd(), 'uploads', prescription.fileKey ?? '');
      let fileBuffer: Buffer;

      try {
        fileBuffer = await fs.readFile(filePath);
      } catch {
        throw new AppError('PRESCRIPTION_PROCESSING_FAILED', 'Could not read uploaded file', 422);
      }

      // 2. OCR extraction
      logger.info({ prescriptionId }, 'Starting OCR extraction');
      let ocrText: string;

      try {
        ocrText = await ocrProvider.extractText(fileBuffer, prescription.mimeType ?? 'image/jpeg');
      } catch (err) {
        logger.error({ err, prescriptionId }, 'OCR failed');
        throw new AppError('OCR_FAILED', 'Failed to extract text from the prescription image', 422);
      }

      if (!ocrText.trim()) {
        throw new AppError('OCR_FAILED', 'No text could be extracted from the image. Please ensure the image is clear and well-lit.', 422);
      }

      // 3. AI extraction
      logger.info({ prescriptionId }, 'Starting AI extraction');
      const extraction = await llmProvider.extractPrescription(ocrText);

      // 4. Store extraction results
      await prisma.$transaction(async (tx) => {
        // Update prescription
        await tx.prescription.update({
          where: { id: prescriptionId },
          data: {
            status: 'PROCESSED',
            ocrText,
            doctorName: extraction.doctorName,
            patientName: extraction.patientName,
            prescriptionDate: extraction.prescriptionDate
              ? new Date(extraction.prescriptionDate)
              : null,
          },
        });

        // Store extracted medicines
        await tx.prescriptionMedicine.createMany({
          data: extraction.medicines.map((med) => ({
            prescriptionId,
            name: med.name,
            dosage: med.dosage,
            form: med.form,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions,
            confidence: med.confidence,
            userConfirmed: false,
          })),
        });
      });

      logger.info({ prescriptionId, medicineCount: extraction.medicines.length }, 'Prescription processed successfully');

      return { ...extraction, prescriptionId };
    } catch (err) {
      // Mark as failed
      await prisma.prescription.update({
        where: { id: prescriptionId },
        data: {
          status: 'FAILED',
          processingError: err instanceof Error ? err.message : 'Unknown error',
        },
      });
      throw err;
    }
  }

  async getExtractionReview(userId: string, prescriptionId: string) {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId, deletedAt: null },
      include: {
        medicines: {
          orderBy: { confidence: 'desc' },
        },
      },
    });

    if (!prescription) throw new NotFoundError('PRESCRIPTION_NOT_FOUND', 'Prescription not found');
    if (prescription.userId !== userId) throw new AuthorizationError();

    return prescription;
  }

  async confirmMedicines(
    userId: string,
    prescriptionId: string,
    confirmations: ConfirmMedicineInput[],
  ) {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId, deletedAt: null },
    });

    if (!prescription) throw new NotFoundError('PRESCRIPTION_NOT_FOUND', 'Prescription not found');
    if (prescription.userId !== userId) throw new AuthorizationError();

    const confirmedMeds = [];

    for (const conf of confirmations) {
      if (!conf.confirmed) continue;

      const prescMed = await prisma.prescriptionMedicine.findUnique({
        where: { id: conf.prescriptionMedicineId },
      });

      if (!prescMed || prescMed.prescriptionId !== prescriptionId) continue;

      // Apply user overrides
      await prisma.prescriptionMedicine.update({
        where: { id: conf.prescriptionMedicineId },
        data: {
          ...(conf.overrides ?? {}),
          userConfirmed: true,
          confirmedAt: new Date(),
        },
      });

      confirmedMeds.push({
        ...prescMed,
        ...(conf.overrides ?? {}),
      });
    }

    return confirmedMeds;
  }

  async list(userId: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.prescription.findMany({
        where: { userId, deletedAt: null },
        include: {
          medicines: {
            select: { id: true, name: true, userConfirmed: true },
          },
          _count: { select: { medicines: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.prescription.count({ where: { userId, deletedAt: null } }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(userId: string, prescriptionId: string) {
    return this.getExtractionReview(userId, prescriptionId);
  }

  async delete(userId: string, prescriptionId: string): Promise<void> {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId, deletedAt: null },
    });

    if (!prescription) throw new NotFoundError('PRESCRIPTION_NOT_FOUND', 'Prescription not found');
    if (prescription.userId !== userId) throw new AuthorizationError();

    await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { deletedAt: new Date() },
    });
  }

  async explain(userId: string, data: { medicationName: string; dosage?: string; frequency?: string; instructions?: string; duration?: string }) {
    // Safety check: user must own a medication with this name
    const explanation = await llmProvider.explainMedication({
      medicationName: data.medicationName,
      dosage: data.dosage,
      frequency: data.frequency,
      instructions: data.instructions,
      duration: data.duration,
    });

    return {
      explanation,
      disclaimer: 'This explanation is for informational purposes only and does not constitute medical advice. Always follow your doctor\'s instructions.',
    };
  }

  private async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

export const prescriptionsService = new PrescriptionsService();
