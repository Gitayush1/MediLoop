import { prisma } from '../../lib/prisma';
import { NotFoundError, AuthorizationError } from '../../lib/errors';
import { medicationsService } from '../medications/medications.service';

export class RefillsService {
  async getAll(userId: string) {
    const refills = await prisma.refillPrediction.findMany({
      where: {
        medication: {
          userId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      },
      include: {
        medication: {
          select: {
            id: true,
            name: true,
            dosage: true,
            form: true,
            color: true,
            unit: true,
            currentQuantity: true,
          },
        },
      },
      orderBy: { estimatedRunOutDate: 'asc' },
    });

    // Classify urgency
    const now = new Date();
    return refills.map((r) => {
      const daysLeft = r.estimatedRunOutDate
        ? Math.ceil((r.estimatedRunOutDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...r,
        daysLeft,
        urgency: daysLeft === null ? 'UNKNOWN' : daysLeft <= 3 ? 'CRITICAL' : daysLeft <= 7 ? 'HIGH' : daysLeft <= 14 ? 'MEDIUM' : 'LOW',
        isRunningLow: daysLeft !== null && daysLeft <= r.warningThreshold,
      };
    });
  }

  async getByMedication(userId: string, medicationId: string) {
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId, deletedAt: null },
    });

    if (!medication) throw new NotFoundError('MEDICATION_NOT_FOUND', 'Medication not found');
    if (medication.userId !== userId) throw new AuthorizationError();

    // Recalculate first
    await medicationsService.recalculateRefill(medicationId);

    return prisma.refillPrediction.findUnique({
      where: { medicationId },
      include: {
        medication: {
          select: {
            id: true,
            name: true,
            dosage: true,
            currentQuantity: true,
            unit: true,
          },
        },
      },
    });
  }

  async acknowledge(userId: string, medicationId: string): Promise<void> {
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId, deletedAt: null },
    });

    if (!medication) throw new NotFoundError('MEDICATION_NOT_FOUND', 'Medication not found');
    if (medication.userId !== userId) throw new AuthorizationError();

    await prisma.refillPrediction.update({
      where: { medicationId },
      data: { warningAcknowledged: true },
    });
  }

  async addInventory(
    userId: string,
    medicationId: string,
    data: { quantity: number; type?: string; note?: string },
  ) {
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId, deletedAt: null },
    });

    if (!medication) throw new NotFoundError('MEDICATION_NOT_FOUND', 'Medication not found');
    if (medication.userId !== userId) throw new AuthorizationError();

    await prisma.$transaction([
      prisma.medicationInventory.create({
        data: {
          medicationId,
          userId,
          type: (data.type as 'INITIAL' | 'PURCHASE' | 'ADJUSTMENT') ?? 'PURCHASE',
          quantity: data.quantity,
          note: data.note,
        },
      }),
      prisma.medication.update({
        where: { id: medicationId },
        data: { currentQuantity: { increment: data.quantity } },
      }),
    ]);

    await medicationsService.recalculateRefill(medicationId);

    return prisma.refillPrediction.findUnique({ where: { medicationId } });
  }
}

export const refillsService = new RefillsService();
