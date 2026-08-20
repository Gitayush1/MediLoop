import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import {
  NotFoundError,
  AuthorizationError,
  ConflictError,
  BadRequestError,
} from '../../lib/errors';
import { emailService } from '../notifications/email.service';
import { CaregiverPermission } from '@mediloop/shared';
import { logger } from '../../lib/logger';

export class CaregiversService {
  async invite(
    patientId: string,
    data: { email: string; permissions: CaregiverPermission[] },
  ) {
    // Check if relationship already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email, deletedAt: null },
    });

    if (existingUser) {
      const existing = await prisma.caregiverRelationship.findUnique({
        where: { patientId_caregiverId: { patientId, caregiverId: existingUser.id } },
      });

      if (existing && existing.status === 'ACTIVE') {
        throw new ConflictError('CAREGIVER_ALREADY_EXISTS', 'This person is already your caregiver');
      }
    }

    // Create invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const patient = await prisma.profile.findUnique({ where: { userId: patientId } });
    const patientName = patient ? `${patient.firstName} ${patient.lastName ?? ''}`.trim() : 'Someone';

    await prisma.invitation.create({
      data: {
        patientId,
        inviteeEmail: data.email,
        tokenHash,
        permissions: data.permissions,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send email
    void emailService.sendCaregiverInvitation(data.email, patientName, token);

    return { message: 'Invitation sent successfully' };
  }

  async acceptInvitation(token: string, caregiverId: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash },
      include: { patient: { include: { profile: true } } },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      throw new NotFoundError('INVITATION_NOT_FOUND', 'Invitation not found or already used');
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { tokenHash },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestError('This invitation has expired');
    }

    // Check caregiver email matches
    const caregiver = await prisma.user.findUnique({
      where: { id: caregiverId, deletedAt: null },
    });

    if (!caregiver) {
      throw new NotFoundError('NOT_FOUND', 'User not found');
    }

    if (caregiver.email !== invitation.inviteeEmail) {
      throw new AuthorizationError('This invitation was sent to a different email address');
    }

    // Create relationship
    await prisma.$transaction([
      prisma.caregiverRelationship.upsert({
        where: { patientId_caregiverId: { patientId: invitation.patientId, caregiverId } },
        create: {
          patientId: invitation.patientId,
          caregiverId,
          permissions: invitation.permissions,
          status: 'ACTIVE',
        },
        update: {
          permissions: invitation.permissions,
          status: 'ACTIVE',
        },
      }),
      prisma.invitation.update({
        where: { tokenHash },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    logger.info({ patientId: invitation.patientId, caregiverId }, 'Caregiver relationship created');

    return { message: 'You are now connected as a caregiver' };
  }

  async getCaregivers(patientId: string) {
    return prisma.caregiverRelationship.findMany({
      where: { patientId, status: 'ACTIVE' },
      include: {
        caregiver: {
          include: {
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  async getPatients(caregiverId: string) {
    return prisma.caregiverRelationship.findMany({
      where: { caregiverId, status: 'ACTIVE' },
      include: {
        patient: {
          include: {
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  async revoke(patientId: string, caregiverId: string): Promise<void> {
    const relationship = await prisma.caregiverRelationship.findUnique({
      where: { patientId_caregiverId: { patientId, caregiverId } },
    });

    if (!relationship) {
      throw new NotFoundError('CAREGIVER_NOT_FOUND', 'Caregiver relationship not found');
    }

    await prisma.caregiverRelationship.update({
      where: { patientId_caregiverId: { patientId, caregiverId } },
      data: { status: 'REVOKED' },
    });
  }

  async checkPermission(
    caregiverId: string,
    patientId: string,
    permission: CaregiverPermission,
  ): Promise<boolean> {
    const relationship = await prisma.caregiverRelationship.findUnique({
      where: { patientId_caregiverId: { patientId, caregiverId } },
    });

    if (!relationship || relationship.status !== 'ACTIVE') return false;
    return relationship.permissions.includes(permission);
  }

  async getPatientMedications(caregiverId: string, patientId: string) {
    const hasPermission = await this.checkPermission(caregiverId, patientId, 'VIEW_MEDICATIONS');
    if (!hasPermission) throw new AuthorizationError();

    return prisma.medication.findMany({
      where: { userId: patientId, status: 'ACTIVE', deletedAt: null },
      include: {
        schedules: true,
        refillPrediction: true,
      },
    });
  }

  async getPatientAdherence(caregiverId: string, patientId: string) {
    const hasPermission = await this.checkPermission(caregiverId, patientId, 'VIEW_ADHERENCE');
    if (!hasPermission) throw new AuthorizationError();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const events = await prisma.doseEvent.groupBy({
      by: ['status'],
      where: {
        userId: patientId,
        scheduledAt: { gte: thirtyDaysAgo, lte: new Date() },
        status: { in: ['TAKEN', 'MISSED', 'SKIPPED'] },
      },
      _count: { status: true },
    });

    const counts = events.reduce(
      (acc: Record<string, number>, e: { status: string; _count: { status: number } }) => {
        acc[e.status] = e._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );

    const taken = counts.TAKEN ?? 0;
    const total = taken + (counts.MISSED ?? 0) + (counts.SKIPPED ?? 0);

    return {
      adherenceRate: total > 0 ? Math.round((taken / total) * 100) : 100,
      taken,
      missed: counts.MISSED ?? 0,
      skipped: counts.SKIPPED ?? 0,
      total,
      period: '30d',
    };
  }
}

export const caregiversService = new CaregiversService();
