import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// Auth Schemas
// ─────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});

// ─────────────────────────────────────────────────────────────
// Medication Schemas
// ─────────────────────────────────────────────────────────────

export const medicationFormSchema = z.enum([
  'TABLET',
  'CAPSULE',
  'SYRUP',
  'INJECTION',
  'DROPS',
  'CREAM',
  'INHALER',
  'PATCH',
  'POWDER',
  'OTHER',
]);

export const medicationFrequencySchema = z.enum([
  'ONCE_DAILY',
  'TWICE_DAILY',
  'THREE_TIMES_DAILY',
  'FOUR_TIMES_DAILY',
  'EVERY_OTHER_DAY',
  'WEEKLY',
  'AS_NEEDED',
  'CUSTOM',
]);

export const mealRelationSchema = z.enum(['BEFORE_MEAL', 'AFTER_MEAL', 'WITH_MEAL', 'ANY']);

export const createMedicationSchema = z.object({
  name: z.string().min(1).max(255),
  genericName: z.string().max(255).optional(),
  dosage: z.string().max(100).optional(),
  form: medicationFormSchema.optional(),
  frequency: medicationFrequencySchema,
  timingInstructions: z.string().max(255).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  scheduleTimes: z
    .array(
      z.object({
        time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
        mealRelation: mealRelationSchema.optional(),
      }),
    )
    .min(1),
  initialQuantity: z.number().int().positive().optional(),
  unit: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
  prescriptionId: z.string().uuid().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const updateMedicationSchema = createMedicationSchema.partial();

// ─────────────────────────────────────────────────────────────
// Dose Schemas
// ─────────────────────────────────────────────────────────────

export const markDoseTakenSchema = z.object({
  takenAt: z.string().datetime().optional(),
  notes: z.string().max(255).optional(),
});

export const snoozeDoseSchema = z.object({
  snoozeMinutes: z.number().int().min(5).max(120).default(15),
});

// ─────────────────────────────────────────────────────────────
// AI Extraction Schema (Zod validation of AI output)
// ─────────────────────────────────────────────────────────────

export const extractedMedicineSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().optional(),
  form: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  instructions: z.string().optional(),
  confidence: z.number().min(0).max(1),
  requiresConfirmation: z.boolean(),
});

export const prescriptionExtractionSchema = z.object({
  doctorName: z.string().optional(),
  patientName: z.string().optional(),
  prescriptionDate: z.string().optional(),
  hospitalClinic: z.string().optional(),
  medicines: z.array(extractedMedicineSchema).min(1),
  overallConfidence: z.number().min(0).max(1),
});

// ─────────────────────────────────────────────────────────────
// Caregiver Schemas
// ─────────────────────────────────────────────────────────────

export const caregiverPermissionSchema = z.enum([
  'VIEW_MEDICATIONS',
  'VIEW_ADHERENCE',
  'VIEW_REFILL_STATUS',
  'VIEW_MISSED_DOSES',
]);

export const inviteCaregiverSchema = z.object({
  email: z.string().email(),
  permissions: z.array(caregiverPermissionSchema).min(1),
});

// ─────────────────────────────────────────────────────────────
// Profile Schemas
// ─────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/)
    .optional(),
  timezone: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
// Notification Preference Schemas
// ─────────────────────────────────────────────────────────────

export const updateNotificationPreferenceSchema = z.object({
  doseReminders: z.boolean().optional(),
  missedDoseAlerts: z.boolean().optional(),
  refillAlerts: z.boolean().optional(),
  caregiverAlerts: z.boolean().optional(),
  reminderMinutesBefore: z.number().int().min(5).max(60).optional(),
  quietHoursStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  quietHoursEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});
