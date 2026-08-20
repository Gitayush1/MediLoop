# MediLoop – Database Schema Document

**Version:** 1.0.0  
**Database:** PostgreSQL via Prisma ORM

---

## Entity Relationship Overview

```
User ──── Profile
 │
 ├── Medication ──── MedicationSchedule
 │       │               │
 │       │           DoseEvent
 │       │
 │       ├── MedicationInventory
 │       └── RefillPrediction
 │
 ├── Prescription ──── PrescriptionMedicine
 │
 ├── CaregiverRelationship (as patient)
 ├── CaregiverRelationship (as caregiver)
 │
 ├── Notification
 ├── NotificationPreference
 ├── Device
 └── AuditLog
```

---

## Table Definitions

### User
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| passwordHash | VARCHAR | NOT NULL |
| emailVerified | BOOLEAN | DEFAULT false |
| role | ENUM(PATIENT, CAREGIVER, ADMIN) | DEFAULT PATIENT |
| createdAt | TIMESTAMPTZ | NOT NULL |
| updatedAt | TIMESTAMPTZ | NOT NULL |
| deletedAt | TIMESTAMPTZ | soft delete |

### Profile
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User, UNIQUE |
| firstName | VARCHAR(100) | NOT NULL |
| lastName | VARCHAR(100) | |
| dateOfBirth | DATE | |
| phone | VARCHAR(20) | |
| avatarUrl | VARCHAR | |
| timezone | VARCHAR(50) | DEFAULT 'Asia/Kolkata' |
| language | VARCHAR(10) | DEFAULT 'en' |

### Medication
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User |
| prescriptionId | UUID | FK → Prescription, nullable |
| name | VARCHAR(255) | NOT NULL |
| genericName | VARCHAR(255) | |
| dosage | VARCHAR(100) | e.g. "500mg" |
| form | ENUM | TABLET, CAPSULE, SYRUP, etc. |
| frequency | ENUM | ONCE_DAILY, TWICE_DAILY, etc. |
| timingInstructions | VARCHAR(255) | e.g. "after meals" |
| startDate | DATE | NOT NULL |
| endDate | DATE | |
| initialQuantity | INTEGER | |
| currentQuantity | INTEGER | |
| unit | VARCHAR(50) | e.g. "tablets" |
| notes | TEXT | |
| status | ENUM | ACTIVE, PAUSED, COMPLETED |
| color | VARCHAR(7) | hex for UI |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |
| deletedAt | TIMESTAMPTZ | soft delete |

### MedicationSchedule
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| medicationId | UUID | FK → Medication |
| timeOfDay | TIME | |
| mealRelation | ENUM | BEFORE_MEAL, AFTER_MEAL, WITH_MEAL, ANY |
| daysOfWeek | INTEGER[] | null = every day |
| isActive | BOOLEAN | |

### DoseEvent
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| medicationId | UUID | FK → Medication |
| scheduleId | UUID | FK → MedicationSchedule |
| userId | UUID | FK → User |
| scheduledAt | TIMESTAMPTZ | NOT NULL |
| takenAt | TIMESTAMPTZ | |
| status | ENUM | SCHEDULED, TAKEN, SKIPPED, MISSED, SNOOZED |
| snoozedUntil | TIMESTAMPTZ | |
| notes | TEXT | |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |

### Prescription
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User |
| fileUrl | VARCHAR | |
| fileKey | VARCHAR | storage key |
| mimeType | VARCHAR(100) | |
| originalName | VARCHAR(255) | |
| fileSize | INTEGER | bytes |
| status | ENUM | UPLOADED, PROCESSING, PROCESSED, FAILED |
| doctorName | VARCHAR(255) | |
| patientName | VARCHAR(255) | |
| prescriptionDate | DATE | |
| notes | TEXT | |
| ocrText | TEXT | raw OCR output |
| processingError | TEXT | |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |
| deletedAt | TIMESTAMPTZ | |

### PrescriptionMedicine
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| prescriptionId | UUID | FK → Prescription |
| medicationId | UUID | FK → Medication, nullable |
| name | VARCHAR(255) | |
| dosage | VARCHAR(100) | |
| form | VARCHAR(100) | |
| frequency | VARCHAR(255) | |
| duration | VARCHAR(255) | |
| instructions | TEXT | |
| confidence | FLOAT | 0.0–1.0 |
| userConfirmed | BOOLEAN | DEFAULT false |
| confirmedAt | TIMESTAMPTZ | |

### MedicationInventory
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| medicationId | UUID | FK → Medication |
| userId | UUID | FK → User |
| type | ENUM | INITIAL, PURCHASE, ADJUSTMENT |
| quantity | INTEGER | |
| note | TEXT | |
| createdAt | TIMESTAMPTZ | |

### RefillPrediction
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| medicationId | UUID | FK → Medication, UNIQUE |
| estimatedRemaining | INTEGER | |
| estimatedRunOutDate | DATE | |
| recommendedReorderDate | DATE | |
| adherenceRate | FLOAT | |
| dailyConsumptionRate | FLOAT | |
| warningThreshold | INTEGER | DEFAULT 7 (days) |
| warningAcknowledged | BOOLEAN | |
| calculatedAt | TIMESTAMPTZ | |

### CaregiverRelationship
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| patientId | UUID | FK → User |
| caregiverId | UUID | FK → User |
| permissions | TEXT[] | enum values |
| status | ENUM | PENDING, ACTIVE, REVOKED |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |

### Invitation
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| patientId | UUID | FK → User |
| inviteeEmail | VARCHAR(255) | |
| token | VARCHAR(255) | UNIQUE, hashed |
| permissions | TEXT[] | |
| status | ENUM | PENDING, ACCEPTED, EXPIRED, REVOKED |
| expiresAt | TIMESTAMPTZ | |
| createdAt | TIMESTAMPTZ | |

### Notification
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User |
| type | ENUM | DOSE_REMINDER, MISSED_DOSE, REFILL, CAREGIVER, SYSTEM |
| title | VARCHAR(255) | |
| body | TEXT | |
| data | JSONB | |
| read | BOOLEAN | DEFAULT false |
| readAt | TIMESTAMPTZ | |
| createdAt | TIMESTAMPTZ | |

### NotificationPreference
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User, UNIQUE |
| doseReminders | BOOLEAN | DEFAULT true |
| missedDoseAlerts | BOOLEAN | DEFAULT true |
| refillAlerts | BOOLEAN | DEFAULT true |
| caregiverAlerts | BOOLEAN | DEFAULT true |
| reminderMinutesBefore | INTEGER | DEFAULT 15 |
| quietHoursStart | TIME | |
| quietHoursEnd | TIME | |

### Device
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User |
| pushToken | VARCHAR(255) | |
| platform | ENUM | IOS, ANDROID |
| deviceId | VARCHAR(255) | |
| isActive | BOOLEAN | |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |

### AuditLog
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User, nullable |
| action | VARCHAR(255) | |
| resource | VARCHAR(255) | |
| resourceId | VARCHAR(255) | |
| metadata | JSONB | |
| ipAddress | VARCHAR(45) | |
| userAgent | TEXT | |
| createdAt | TIMESTAMPTZ | |

---

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_dose_events_user_scheduled ON DoseEvent(userId, scheduledAt);
CREATE INDEX idx_dose_events_medication ON DoseEvent(medicationId, status);
CREATE INDEX idx_medications_user_status ON Medication(userId, status, deletedAt);
CREATE INDEX idx_notifications_user_read ON Notification(userId, read, createdAt);
CREATE INDEX idx_audit_log_user ON AuditLog(userId, createdAt);
CREATE INDEX idx_prescriptions_user ON Prescription(userId, deletedAt);
```

---

## Timezone Strategy

- All TIMESTAMPTZ columns store UTC
- User timezone stored in Profile
- Mobile client displays in user's local timezone
- Dose generation uses user timezone for "8:00 AM" → UTC conversion
- Scheduled dose times stored in UTC
