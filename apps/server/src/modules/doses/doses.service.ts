import { prisma } from '../../lib/prisma';
import { NotFoundError, AuthorizationError, BadRequestError } from '../../lib/errors';
import { medicationsService } from '../medications/medications.service';

interface TodayDosesResult {
  upcoming: unknown[];
  past: unknown[];
  total: number;
  takenCount: number;
  missedCount: number;
}

export class DosesService {
  async getToday(userId: string): Promise<TodayDosesResult> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const doses = await prisma.doseEvent.findMany({
      where: {
        userId,
        scheduledAt: { gte: startOfDay, lte: endOfDay },
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
          },
        },
        schedule: {
          select: {
            timeOfDay: true,
            mealRelation: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // Auto-mark scheduled doses as missed if past by more than 1 hour
    const missedThreshold = new Date(now.getTime() - 60 * 60 * 1000);
    const toMark = doses.filter(
      (d) => d.status === 'SCHEDULED' && d.scheduledAt < missedThreshold,
    );

    if (toMark.length > 0) {
      await prisma.doseEvent.updateMany({
        where: { id: { in: toMark.map((d) => d.id) } },
        data: { status: 'MISSED' },
      });
      toMark.forEach((d) => {
        d.status = 'MISSED';
      });
    }

    const upcoming = doses.filter((d) => d.status === 'SCHEDULED' || d.status === 'SNOOZED');
    const past = doses.filter((d) => d.status !== 'SCHEDULED' && d.status !== 'SNOOZED');

    return {
      upcoming,
      past,
      total: doses.length,
      takenCount: doses.filter((d) => d.status === 'TAKEN').length,
      missedCount: doses.filter((d) => d.status === 'MISSED').length,
    };
  }

  async getHistory(userId: string, params: { medicationId?: string; from?: string; to?: string; page?: number; limit?: number }) {
    const { medicationId, from, to, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(medicationId ? { medicationId } : {}),
      ...(from || to
        ? {
            scheduledAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [events, total] = await Promise.all([
      prisma.doseEvent.findMany({
        where,
        include: {
          medication: {
            select: { id: true, name: true, dosage: true, color: true },
          },
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.doseEvent.count({ where }),
    ]);

    return { items: events, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markTaken(userId: string, doseId: string, data: { takenAt?: string; notes?: string }) {
    const dose = await this.findAndAuthorize(userId, doseId);

    if (dose.status === 'TAKEN') {
      throw new BadRequestError('This dose has already been marked as taken');
    }

    const takenAt = data.takenAt ? new Date(data.takenAt) : new Date();

    const updated = await prisma.doseEvent.update({
      where: { id: doseId },
      data: {
        status: 'TAKEN',
        takenAt,
        notes: data.notes,
      },
      include: {
        medication: { select: { id: true, name: true } },
      },
    });

    // Update medication current quantity
    if (dose.medication.currentQuantity !== null && dose.medication.currentQuantity > 0) {
      await prisma.medication.update({
        where: { id: dose.medicationId },
        data: { currentQuantity: { decrement: 1 } },
      });
    }

    // Recalculate refill prediction
    void medicationsService.recalculateRefill(dose.medicationId);

    return updated;
  }

  async markSkipped(userId: string, doseId: string, data: { notes?: string }) {
    const dose = await this.findAndAuthorize(userId, doseId);

    if (dose.status === 'TAKEN') {
      throw new BadRequestError('Cannot skip a dose that has already been taken');
    }

    return prisma.doseEvent.update({
      where: { id: doseId },
      data: { status: 'SKIPPED', notes: data.notes },
    });
  }

  async snooze(userId: string, doseId: string, snoozeMinutes: number) {
    const dose = await this.findAndAuthorize(userId, doseId);

    if (dose.status !== 'SCHEDULED' && dose.status !== 'SNOOZED') {
      throw new BadRequestError('Only scheduled or snoozed doses can be snoozed');
    }

    const snoozedUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000);

    return prisma.doseEvent.update({
      where: { id: doseId },
      data: { status: 'SNOOZED', snoozedUntil },
    });
  }

  async getAdherence(userId: string, period: '7d' | '30d' | '90d' = '30d') {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await prisma.doseEvent.groupBy({
      by: ['status'],
      where: {
        userId,
        scheduledAt: { gte: from, lte: new Date() },
        status: { in: ['TAKEN', 'MISSED', 'SKIPPED'] },
      },
      _count: { status: true },
    });

    const counts = events.reduce(
      (acc, e) => {
        acc[e.status] = e._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );

    const taken = counts.TAKEN ?? 0;
    const missed = counts.MISSED ?? 0;
    const skipped = counts.SKIPPED ?? 0;
    const total = taken + missed + skipped;
    const adherenceRate = total > 0 ? Math.round((taken / total) * 100) : 100;

    // Calculate streak
    const streak = await this.calculateStreak(userId);

    return {
      period,
      taken,
      missed,
      skipped,
      total,
      adherenceRate,
      streak,
    };
  }

  private async calculateStreak(userId: string): Promise<number> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    let streak = 0;
    let date = new Date(today);

    for (let i = 0; i < 365; i++) {
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setUTCHours(23, 59, 59, 999);

      const dayEvents = await prisma.doseEvent.findFirst({
        where: {
          userId,
          scheduledAt: { gte: dayStart, lte: dayEnd },
          status: { in: ['SCHEDULED', 'SNOOZED'] },
        },
      });

      const missed = await prisma.doseEvent.findFirst({
        where: {
          userId,
          scheduledAt: { gte: dayStart, lte: dayEnd },
          status: 'MISSED',
        },
      });

      if (missed) break; // streak broken
      if (dayEvents && i === 0) break; // today not completed yet, don't break streak

      streak++;
      date = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    }

    return streak;
  }

  private async findAndAuthorize(userId: string, doseId: string) {
    const dose = await prisma.doseEvent.findUnique({
      where: { id: doseId },
      include: {
        medication: { select: { id: true, name: true, currentQuantity: true } },
      },
    });

    if (!dose) throw new NotFoundError('DOSE_NOT_FOUND', 'Dose not found');
    if (dose.userId !== userId) throw new AuthorizationError();

    return dose;
  }
}

export const dosesService = new DosesService();
