import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { createLLMProvider } from './providers/llm.provider';
import { createOCRProvider } from './providers/ocr.provider';
import { NotFoundError, BadRequestError } from '../../lib/errors';

// Pluggable provider instances
const ocrProvider = createOCRProvider();
const llmProvider = createLLMProvider();

export class AIService {
  /**
   * Run the full OCR → LLM → Zod extraction pipeline on an uploaded prescription file.
   * Stores raw OCR text and extracted medicines on the Prescription record.
   */
  async processPrescription(prescriptionId: string, userId: string): Promise<void> {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });

    if (!prescription) throw new NotFoundError('PRESCRIPTION_NOT_FOUND', 'Prescription not found');
    if (prescription.userId !== userId) {
      throw new BadRequestError('Not authorized to process this prescription');
    }
    if (!prescription.fileUrl && !prescription.fileKey) {
      throw new BadRequestError('No file attached to this prescription');
    }

    // Mark as processing
    await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { status: 'PROCESSING', processingError: null },
    });

    try {
      // ── Step 1: OCR ──────────────────────────────────────────
      let ocrText = prescription.ocrText;
      if (!ocrText) {
        const fileBuffer = await this.fetchFileBuffer(prescription.fileUrl!);
        ocrText = await ocrProvider.extractText(fileBuffer, prescription.mimeType ?? 'image/jpeg');

        await prisma.prescription.update({
          where: { id: prescriptionId },
          data: { ocrText },
        });
      }

      // ── Step 2: LLM extraction ────────────────────────────────
      const extraction = await llmProvider.extractPrescription(ocrText);

      // ── Step 3: Store extracted medicines ─────────────────────
      // Delete previous extractions (re-process case)
      await prisma.prescriptionMedicine.deleteMany({ where: { prescriptionId } });

      if (extraction.medicines && extraction.medicines.length > 0) {
        await prisma.prescriptionMedicine.createMany({
          data: extraction.medicines.map((med: { name: string; dosage?: string; form?: string; frequency?: string; duration?: string; instructions?: string; confidence?: number }) => ({
            prescriptionId,
            name: med.name,
            dosage: med.dosage ?? null,
            form: med.form ?? null,
            frequency: med.frequency ?? null,
            duration: med.duration ?? null,
            instructions: med.instructions ?? null,
            confidence: med.confidence ?? 0.5,
            userConfirmed: false,
          })),
        });
      }

      // Update prescription metadata from extraction
      await prisma.prescription.update({
        where: { id: prescriptionId },
        data: {
          status: 'PROCESSED',
          doctorName: extraction.doctorName ?? prescription.doctorName,
          patientName: extraction.patientName ?? prescription.patientName,
          prescriptionDate: extraction.prescriptionDate
            ? new Date(extraction.prescriptionDate)
            : prescription.prescriptionDate,
        },
      });

      logger.info({ prescriptionId, medicineCount: extraction.medicines?.length ?? 0 }, 'Prescription processed successfully');
    } catch (err) {
      logger.error({ prescriptionId, err }, 'AI pipeline failed');

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

  /**
   * Explain a medication in plain language based on prescription data.
   * Does NOT provide medical advice — informational only.
   */
  async explainMedication(
    userId: string,
    medicationId: string,
  ): Promise<{ explanation: string; disclaimer: string }> {
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId, deletedAt: null },
      include: {
        schedules: true,
        prescription: { select: { ocrText: true } },
      },
    });

    if (!medication) throw new NotFoundError('MEDICATION_NOT_FOUND', 'Medication not found');
    if (medication.userId !== userId) throw new BadRequestError('Not authorized');

    const explanation = await llmProvider.explainMedication({
      medicationName: medication.name,
      dosage: medication.dosage ?? undefined,
      frequency: medication.frequency,
      instructions: medication.timingInstructions ?? undefined,
    });

    return {
      explanation,
      disclaimer:
        'MediLoop is a medication-management and information tool. It does not replace medical advice from a qualified healthcare professional.',
    };
  }

  /**
   * Fetch a file buffer from a local uploads path or URL.
   */
  private async fetchFileBuffer(fileUrl: string): Promise<Buffer> {
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    // Local file path (e.g. /uploads/...)
    const fs = await import('fs/promises');
    const path = await import('path');
    const localPath = path.join(process.cwd(), fileUrl);
    return fs.readFile(localPath);
  }
}

export const aiService = new AIService();
