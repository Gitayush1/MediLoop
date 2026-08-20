// MediLoop – Development Seed Data
// Run: npx ts-node prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding MediLoop database...');

  // ─────────────────────────────────────────────────────────────
  // Demo Patient User
  // ─────────────────────────────────────────────────────────────
  const patientPasswordHash = await bcrypt.hash('Demo@1234', 12);

  const patient = await prisma.user.upsert({
    where: { email: 'demo@mediloop.app' },
    update: {},
    create: {
      email: 'demo@mediloop.app',
      passwordHash: patientPasswordHash,
      emailVerified: true,
      role: 'PATIENT',
      profile: {
        create: {
          firstName: 'Ayush',
          lastName: 'Sharma',
          dateOfBirth: new Date('1990-05-15'),
          phone: '+91 98765 43210',
          timezone: 'Asia/Kolkata',
        },
      },
      notificationPreference: {
        create: {
          doseReminders: true,
          missedDoseAlerts: true,
          refillAlerts: true,
          caregiverAlerts: true,
          reminderMinutesBefore: 15,
        },
      },
    },
  });

  console.log(`✅ Patient user created: ${patient.email} (password: Demo@1234)`);

  // ─────────────────────────────────────────────────────────────
  // Demo Caregiver User
  // ─────────────────────────────────────────────────────────────
  const caregiverPasswordHash = await bcrypt.hash('Demo@1234', 12);

  const caregiver = await prisma.user.upsert({
    where: { email: 'caregiver@mediloop.app' },
    update: {},
    create: {
      email: 'caregiver@mediloop.app',
      passwordHash: caregiverPasswordHash,
      emailVerified: true,
      role: 'CAREGIVER',
      profile: {
        create: {
          firstName: 'Priya',
          lastName: 'Sharma',
          timezone: 'Asia/Kolkata',
        },
      },
      notificationPreference: {
        create: {},
      },
    },
  });

  console.log(`✅ Caregiver user created: ${caregiver.email}`);

  // Create caregiver relationship
  await prisma.caregiverRelationship.upsert({
    where: {
      patientId_caregiverId: {
        patientId: patient.id,
        caregiverId: caregiver.id,
      },
    },
    update: {},
    create: {
      patientId: patient.id,
      caregiverId: caregiver.id,
      permissions: ['VIEW_MEDICATIONS', 'VIEW_ADHERENCE', 'VIEW_REFILL_STATUS', 'VIEW_MISSED_DOSES'],
      status: 'ACTIVE',
    },
  });

  console.log('✅ Caregiver relationship created');

  // ─────────────────────────────────────────────────────────────
  // Demo Prescription
  // ─────────────────────────────────────────────────────────────
  const prescription = await prisma.prescription.create({
    data: {
      userId: patient.id,
      originalName: 'prescription_demo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 204800,
      status: 'PROCESSED',
      doctorName: 'Dr. Rajesh Kumar',
      patientName: 'Ayush Sharma',
      prescriptionDate: new Date('2026-08-15'),
      ocrText: 'Sample OCR text for demo prescription',
    },
  });

  // ─────────────────────────────────────────────────────────────
  // Demo Medications
  // ─────────────────────────────────────────────────────────────
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAhead = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sixtyDaysAhead = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

  // Medication 1: Vitamin D (long-term, running low)
  const vitaminD = await prisma.medication.create({
    data: {
      userId: patient.id,
      name: 'Vitamin D3',
      genericName: 'Cholecalciferol',
      dosage: '60000 IU',
      form: 'TABLET',
      frequency: 'WEEKLY',
      timingInstructions: 'After breakfast',
      startDate: thirtyDaysAgo,
      initialQuantity: 12,
      currentQuantity: 5,
      unit: 'tablets',
      status: 'ACTIVE',
      color: '#F59E0B',
      prescriptionId: prescription.id,
    },
  });

  // Medication 2: Metformin (diabetes, twice daily)
  const metformin = await prisma.medication.create({
    data: {
      userId: patient.id,
      name: 'Metformin',
      genericName: 'Metformin Hydrochloride',
      dosage: '500mg',
      form: 'TABLET',
      frequency: 'TWICE_DAILY',
      timingInstructions: 'With meals',
      startDate: thirtyDaysAgo,
      initialQuantity: 60,
      currentQuantity: 8,
      unit: 'tablets',
      status: 'ACTIVE',
      color: '#EF4444',
      notes: 'Take with food to reduce stomach upset',
    },
  });

  // Medication 3: Atorvastatin (cholesterol, once daily)
  const atorvastatin = await prisma.medication.create({
    data: {
      userId: patient.id,
      name: 'Atorvastatin',
      dosage: '10mg',
      form: 'TABLET',
      frequency: 'ONCE_DAILY',
      timingInstructions: 'At bedtime',
      startDate: thirtyDaysAgo,
      initialQuantity: 30,
      currentQuantity: 22,
      unit: 'tablets',
      status: 'ACTIVE',
      color: '#8B5CF6',
    },
  });

  // Medication 4: Completed medication
  await prisma.medication.create({
    data: {
      userId: patient.id,
      name: 'Amoxicillin',
      dosage: '500mg',
      form: 'CAPSULE',
      frequency: 'THREE_TIMES_DAILY',
      startDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      initialQuantity: 21,
      currentQuantity: 0,
      unit: 'capsules',
      status: 'COMPLETED',
      color: '#10B981',
    },
  });

  console.log('✅ Medications created');

  // ─────────────────────────────────────────────────────────────
  // Medication Schedules
  // ─────────────────────────────────────────────────────────────
  const vitaminDSchedule = await prisma.medicationSchedule.create({
    data: {
      medicationId: vitaminD.id,
      timeOfDay: '08:00',
      mealRelation: 'AFTER_MEAL',
      isActive: true,
    },
  });

  const metforminSchedule1 = await prisma.medicationSchedule.create({
    data: {
      medicationId: metformin.id,
      timeOfDay: '08:00',
      mealRelation: 'WITH_MEAL',
      isActive: true,
    },
  });

  const metforminSchedule2 = await prisma.medicationSchedule.create({
    data: {
      medicationId: metformin.id,
      timeOfDay: '20:00',
      mealRelation: 'WITH_MEAL',
      isActive: true,
    },
  });

  const atorvastatinSchedule = await prisma.medicationSchedule.create({
    data: {
      medicationId: atorvastatin.id,
      timeOfDay: '22:00',
      mealRelation: 'ANY',
      isActive: true,
    },
  });

  // ─────────────────────────────────────────────────────────────
  // Dose Events (historical + today)
  // ─────────────────────────────────────────────────────────────
  const doseEvents = [];

  // Generate 30 days of dose events for Metformin (realistic adherence ~85%)
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    // Morning dose
    const morningTime = new Date(`${dateStr}T08:00:00.000Z`);
    const morningStatus = i === 0 ? 'SCHEDULED' : Math.random() > 0.15 ? 'TAKEN' : 'MISSED';

    doseEvents.push({
      medicationId: metformin.id,
      scheduleId: metforminSchedule1.id,
      userId: patient.id,
      scheduledAt: morningTime,
      takenAt: morningStatus === 'TAKEN' ? new Date(morningTime.getTime() + Math.floor(Math.random() * 30) * 60000) : null,
      status: morningStatus as 'SCHEDULED' | 'TAKEN' | 'MISSED',
    });

    // Evening dose
    const eveningTime = new Date(`${dateStr}T20:00:00.000Z`);
    const eveningStatus = i === 0 ? 'SCHEDULED' : Math.random() > 0.12 ? 'TAKEN' : 'MISSED';

    doseEvents.push({
      medicationId: metformin.id,
      scheduleId: metforminSchedule2.id,
      userId: patient.id,
      scheduledAt: eveningTime,
      takenAt: eveningStatus === 'TAKEN' ? new Date(eveningTime.getTime() + Math.floor(Math.random() * 30) * 60000) : null,
      status: eveningStatus as 'SCHEDULED' | 'TAKEN' | 'MISSED',
    });
  }

  // Today's atorvastatin dose (upcoming)
  const todayStr = today.toISOString().split('T')[0];
  doseEvents.push({
    medicationId: atorvastatin.id,
    scheduleId: atorvastatinSchedule.id,
    userId: patient.id,
    scheduledAt: new Date(`${todayStr}T22:00:00.000Z`),
    takenAt: null,
    status: 'SCHEDULED' as const,
  });

  await prisma.doseEvent.createMany({ data: doseEvents, skipDuplicates: true });

  console.log(`✅ ${doseEvents.length} dose events created`);

  // ─────────────────────────────────────────────────────────────
  // Inventory entries
  // ─────────────────────────────────────────────────────────────
  await prisma.medicationInventory.createMany({
    data: [
      { medicationId: vitaminD.id, userId: patient.id, type: 'INITIAL', quantity: 12 },
      { medicationId: metformin.id, userId: patient.id, type: 'INITIAL', quantity: 60 },
      { medicationId: atorvastatin.id, userId: patient.id, type: 'INITIAL', quantity: 30 },
    ],
  });

  // ─────────────────────────────────────────────────────────────
  // Refill predictions
  // ─────────────────────────────────────────────────────────────
  await prisma.refillPrediction.createMany({
    data: [
      {
        medicationId: vitaminD.id,
        estimatedRemaining: 5,
        estimatedRunOutDate: new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000),
        recommendedReorderDate: new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000),
        adherenceRate: 0.9,
        dailyConsumptionRate: 1 / 7,
        warningThreshold: 7,
        warningAcknowledged: false,
        calculatedAt: new Date(),
      },
      {
        medicationId: metformin.id,
        estimatedRemaining: 8,
        estimatedRunOutDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
        recommendedReorderDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        adherenceRate: 0.87,
        dailyConsumptionRate: 1.74,
        warningThreshold: 7,
        warningAcknowledged: false,
        calculatedAt: new Date(),
      },
      {
        medicationId: atorvastatin.id,
        estimatedRemaining: 22,
        estimatedRunOutDate: new Date(today.getTime() + 22 * 24 * 60 * 60 * 1000),
        recommendedReorderDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
        adherenceRate: 0.93,
        dailyConsumptionRate: 1,
        warningThreshold: 7,
        warningAcknowledged: false,
        calculatedAt: new Date(),
      },
    ],
  });

  // ─────────────────────────────────────────────────────────────
  // Sample notifications
  // ─────────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: patient.id,
        type: 'REFILL_WARNING',
        title: 'Metformin running low',
        body: 'You have approximately 8 tablets remaining. Consider reordering soon.',
        data: { medicationId: metformin.id },
        read: false,
      },
      {
        userId: patient.id,
        type: 'DOSE_REMINDER',
        title: 'Time for Atorvastatin',
        body: 'Your 10:00 PM medication is due.',
        data: { medicationId: atorvastatin.id },
        read: true,
        readAt: new Date(today.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        userId: patient.id,
        type: 'SYSTEM',
        title: 'Welcome to MediLoop!',
        body: 'Your medication management journey starts here. Scan a prescription to get started.',
        read: true,
        readAt: new Date(today.getTime() - 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Notifications created');
  console.log('\n🎉 Seeding complete!');
  console.log('\nDemo credentials:');
  console.log('  Patient:   demo@mediloop.app / Demo@1234');
  console.log('  Caregiver: caregiver@mediloop.app / Demo@1234');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
