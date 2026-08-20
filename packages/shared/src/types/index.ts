// ─────────────────────────────────────────────────────────────
// Shared Types – MediLoop
// ─────────────────────────────────────────────────────────────

export type UserRole = 'PATIENT' | 'CAREGIVER' | 'ADMIN';

export type MedicationStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export type MedicationForm =
  | 'TABLET'
  | 'CAPSULE'
  | 'SYRUP'
  | 'INJECTION'
  | 'DROPS'
  | 'CREAM'
  | 'INHALER'
  | 'PATCH'
  | 'POWDER'
  | 'OTHER';

export type MedicationFrequency =
  | 'ONCE_DAILY'
  | 'TWICE_DAILY'
  | 'THREE_TIMES_DAILY'
  | 'FOUR_TIMES_DAILY'
  | 'EVERY_OTHER_DAY'
  | 'WEEKLY'
  | 'AS_NEEDED'
  | 'CUSTOM';

export type MealRelation = 'BEFORE_MEAL' | 'AFTER_MEAL' | 'WITH_MEAL' | 'ANY';

export type DoseStatus = 'SCHEDULED' | 'TAKEN' | 'SKIPPED' | 'MISSED' | 'SNOOZED';

export type PrescriptionStatus = 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';

export type CaregiverRelationshipStatus = 'PENDING' | 'ACTIVE' | 'REVOKED';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export type NotificationType =
  | 'DOSE_REMINDER'
  | 'UPCOMING_DOSE'
  | 'MISSED_DOSE'
  | 'REFILL_WARNING'
  | 'CAREGIVER_ALERT'
  | 'SYSTEM';

export type CaregiverPermission =
  | 'VIEW_MEDICATIONS'
  | 'VIEW_ADHERENCE'
  | 'VIEW_REFILL_STATUS'
  | 'VIEW_MISSED_DOSES';

export type InventoryEntryType = 'INITIAL' | 'PURCHASE' | 'ADJUSTMENT';

export type DevicePlatform = 'IOS' | 'ANDROID' | 'WEB';

// ─────────────────────────────────────────────────────────────
// API Response Shapes
// ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// ─────────────────────────────────────────────────────────────
// AI / OCR Types
// ─────────────────────────────────────────────────────────────

export interface ExtractedMedicine {
  name: string;
  dosage?: string;
  form?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  confidence: number; // 0.0 – 1.0
  requiresConfirmation: boolean;
}

export interface PrescriptionExtraction {
  doctorName?: string;
  patientName?: string;
  prescriptionDate?: string;
  hospitalClinic?: string;
  medicines: ExtractedMedicine[];
  rawText: string;
  overallConfidence: number;
}

// ─────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
