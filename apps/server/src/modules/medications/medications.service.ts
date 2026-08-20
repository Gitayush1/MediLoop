import { prisma } from '../../lib/prisma';
import { NotFoundError, AuthorizationError } from '../../lib/errors';
import { cacheDelPattern } from '../../lib/redis';
import { generateDoseEvents } from './dose-scheduler';
import type { Prisma } from '@prisma/client';
import type { MedicationFrequency, MedicationStatus } from '@mediloop/shared';

interface CreateMedicationInput {
  name: string;
  genericName?: string;
  dosage?: string;
  form?: string;
  frequency: MedicationFrequency;
  timingInstructions?: string;
  startDate: string;
  endDate?: string;
  scheduleTimes: Array<{ time: string; mealRelation?: string }>;
  initialQuantity?: number;
  unit?: string;
  notes?: string;
  prescriptionId?: string;
  color?: string;
}

interface UpdateMedicationInput extends Partial<CreateMedicationInput> {
  status?: MedicationStatus;
}

interface ListMedicationsQuery {
  status?: MedicationStatus;
  page?: number;
  limit?: number;
}

export class MedicationsService {
  async list(userId: string, query: ListMedicationsQuery) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      deletedAt: null,
      ...(status ? { status: status as any } : {}),
    };

    const [medications, total] = await Promise.all([
      prisma.medication.findMany({
        where,
        include: {
          schedules: { where: { isActive: true } },
          refillPrediction: true,
          _count: {
            select: {
              doseEvents: { where: { status: 'TAKEN' } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.medication.count({ where }),
    ]);

    return {
      items: medications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + limit < total,
      hasPrev: page > 1,
    };
  }

  async getById(userId: string, medicationId: string) {
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId, deletedAt: null },
      include: {
        schedules: true,
        prescription: {
          select: { id: true, doctorName: true, prescriptionDate: true, fileUrl: true },
        },
        refillPrediction: true,
        inventoryEntries: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!medication) {
      throw new NotFoundError('MEDICATION_NOT_FOUND', 'Medication not found');
    }

    if (medication.userId !== userId) {
      // Allow caregivers via separate endpoint
      throw new AuthorizationError('You do not have access to this medication');
    }

    // Adherence calculation (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [takenCount, totalDue] = await Promise.all([
      prisma.doseEvent.count({
        where: {
          medicationId,
          status: 'TAKEN',
          scheduledAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.doseEvent.count({
        where: {
          medicationId,
          status: { in: ['TAKEN', 'MISSED', 'SKIPPED'] },
          scheduledAt: { gte: thirtyDaysAgo, lte: new Date() },
        },
      }),
    ]);

    return {
      ...medication,
      adherencePercentage: totalDue > 0 ? Math.round((takenCount / totalDue) * 100) : 100,
    };
  }

  async create(userId: string, input: CreateMedicationInput) {
    // Get user timezone for dose scheduling
    const profile = await prisma.profile.findUnique({ where: { userId } });
    const timezone = profile?.timezone ?? 'Asia/Kolkata';

    const medication = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create medication
      const med = await tx.medication.create({
        data: {
          userId,
          name: input.name,
          genericName: input.genericName,
          dosage: input.dosage,
          form: (input.form as any) ?? undefined,
          frequency: input.frequency as any,
          timingInstructions: input.timingInstructions,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          initialQuantity: input.initialQuantity,
          currentQuantity: input.initialQuantity,
          unit: input.unit ?? 'tablets',
          notes: input.notes,
          prescriptionId: input.prescriptionId,
          color: input.color ?? '#4F46E5',
          status: 'ACTIVE',
        },
      });

      // 2. Add initial inventory entry
      if (input.initialQuantity) {
        await tx.medicationInventory.create({
          data: {
            medicationId: med.id,
            userId,
            type: 'INITIAL',
            quantity: input.initialQuantity,
          },
        });
      }

      // 3. Create schedules and generate dose events
      const startDate = new Date(input.startDate);
      const endDate = input.endDate ? new Date(input.endDate) : null;

      for (const scheduleTime of input.scheduleTimes) {
        const schedule = await tx.medicationSchedule.create({
          data: {
            medicationId: med.id,
            timeOfDay: scheduleTime.time,
            mealRelation: (scheduleTime.mealRelation as any) ?? 'ANY',
            isActive: true,
          },
        });

        // Generate dose events
        const doseInputs = generateDoseEvents({
          medicationId: med.id,
          scheduleId: schedule.id,
          userId,
          startDate,
          endDate,
          frequency: input.frequency,
          scheduledTime: scheduleTime.time,
          timezone,
        });

        if (doseInputs.length > 0) {
          await tx.doseEvent.createMany({ data: doseInputs as any, skipDuplicates: true });
        }
      }

      return med;
    });

    await cacheDelPattern(`user:${userId}:*`);

    // Trigger refill prediction calculation
    await this.recalculateRefill(medication.id);

    return this.getById(userId, medication.id);
  }

  async update(userId: string, medicationId: string, input: UpdateMedicationInput) {
    const existing = await prisma.medication.findUnique({
      where: { id: medicationId, deletedAt: null },
    });

    if (!existing) throw new NotFoundError('MEDICATION_NOT_FOUND', 'Medication not found');
    if (existing.userId !== userId) throw new AuthorizationError();

    await prisma.medication.update({
      where: { id: medicationId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.dosage !== undefined && { dosage: input.dosage }),
        ...(input.form !== undefined && { form: input.form as any }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.status !== undefined && { status: input.status as any }),
        ...(input.endDate !== undefined && { endDate: new Date(input.endDate) }),
      },
    });

    await cacheDelPattern(`user:${userId}:*`);
    return this.getById(userId, medicationId);
  }

  async softDelete(userId: string, medicationId: string): Promise<void> {
    const existing = await prisma.medication.findUnique({
      where: { id: medicationId, deletedAt: null },
    });

    if (!existing) throw new NotFoundError('MEDICATION_NOT_FOUND', 'Medication not found');
    if (existing.userId !== userId) throw new AuthorizationError();

    await prisma.medication.update({
      where: { id: medicationId },
      data: { deletedAt: new Date(), status: 'COMPLETED' },
    });

    await cacheDelPattern(`user:${userId}:*`);
  }

  async recalculateRefill(medicationId: string): Promise<void> {
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
    });

    if (!medication || !medication.initialQuantity) return;

    // Count taken doses
    const takenCount = await prisma.doseEvent.count({
      where: { medicationId, status: 'TAKEN' },
    });

    // Total inventory
    const inventoryAgg = await prisma.medicationInventory.aggregate({
      where: { medicationId },
      _sum: { quantity: true },
    });
    const totalQuantity = inventoryAgg._sum.quantity ?? 0;
    const estimatedRemaining = Math.max(0, totalQuantity - takenCount);

    // Adherence rate (last 14 days)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const [taken14, total14] = await Promise.all([
      prisma.doseEvent.count({
        where: {
          medicationId,
          status: 'TAKEN',
          scheduledAt: { gte: fourteenDaysAgo },
        },
      }),
      prisma.doseEvent.count({
        where: {
          medicationId,
          status: { in: ['TAKEN', 'MISSED'] },
          scheduledAt: { gte: fourteenDaysAgo, lte: new Date() },
        },
      }),
    ]);

    const adherenceRate = total14 > 0 ? taken14 / total14 : 1.0;

    // Daily consumption rate based on frequency
    const scheduleCount = await prisma.medicationSchedule.count({
      where: { medicationId, isActive: true },
    });
    const dailyConsumptionRate = scheduleCount * adherenceRate;

    // Estimated run out
    let estimatedRunOutDate: Date | null = null;
    let recommendedReorderDate: Date | null = null;

    if (dailyConsumptionRate > 0) {
      const daysRemaining = estimatedRemaining / dailyConsumptionRate;
      estimatedRunOutDate = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
      // Reorder 7 days before running out
      recommendedReorderDate = new Date(estimatedRunOutDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    await prisma.refillPrediction.upsert({
      where: { medicationId },
      create: {
        medicationId,
        estimatedRemaining,
        estimatedRunOutDate,
        recommendedReorderDate,
        adherenceRate,
        dailyConsumptionRate: dailyConsumptionRate || 1,
        calculatedAt: new Date(),
      },
      update: {
        estimatedRemaining,
        estimatedRunOutDate,
        recommendedReorderDate,
        adherenceRate,
        dailyConsumptionRate: dailyConsumptionRate || 1,
        calculatedAt: new Date(),
        warningAcknowledged: false,
      },
    });
  }
}

export const medicationsService = new MedicationsService();
