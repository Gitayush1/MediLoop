# MediLoop – Architecture Document

**Version:** 1.0.0  
**Date:** 2026-08-20

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE CLIENT                           │
│              React Native + Expo (TypeScript)                   │
│    Expo Router · React Query · Zustand · Expo Notifications     │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS REST
┌────────────────────────────▼────────────────────────────────────┐
│                        API GATEWAY                              │
│               Express.js + TypeScript + JWT                     │
│    Auth · Rate Limiting · Validation · CORS · Logging           │
└──┬──────────┬──────────┬──────────┬──────────┬─────────────────┘
   │          │          │          │          │
┌──▼───┐  ┌──▼───┐  ┌───▼──┐  ┌───▼──┐  ┌───▼──────────────┐
│ Auth │  │ Med  │  │Dose  │  │Presc │  │   AI Pipeline    │
│Module│  │Module│  │Module│  │Module│  │ OCR → LLM → Zod  │
└──┬───┘  └──┬───┘  └───┬──┘  └───┬──┘  └───────────────────┘
   │          │          │          │
┌──▼──────────▼──────────▼──────────▼────────────────────────────┐
│                      DATA LAYER                                 │
│              PostgreSQL (Prisma ORM) + Redis Cache              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Project Structure

```
mediloop/
├── apps/
│   ├── mobile/                  # React Native / Expo app
│   │   ├── app/                 # Expo Router file-based routing
│   │   │   ├── (auth)/          # Auth screens
│   │   │   ├── (onboarding)/    # Onboarding screens
│   │   │   ├── (tabs)/          # Main tab screens
│   │   │   └── _layout.tsx
│   │   ├── src/
│   │   │   ├── components/      # Reusable UI components
│   │   │   ├── features/        # Feature-specific components
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── services/        # API service layer
│   │   │   ├── store/           # Zustand stores
│   │   │   ├── lib/             # Utilities, constants
│   │   │   └── types/           # Shared TypeScript types
│   │   ├── assets/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── server/                  # Node.js / Express backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── medications/
│       │   │   ├── doses/
│       │   │   ├── prescriptions/
│       │   │   ├── refills/
│       │   │   ├── caregivers/
│       │   │   ├── notifications/
│       │   │   └── ai/
│       │   ├── middleware/
│       │   ├── lib/
│       │   ├── config/
│       │   └── utils/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                  # Shared types/validation
│       ├── src/
│       │   ├── types/
│       │   └── schemas/
│       └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 3. Module Design

### 3.1 Authentication Module
- Register, Login, Refresh, Logout, Forgot Password
- bcrypt password hashing
- JWT access token (15min) + refresh token (7d)
- Refresh token stored in DB (hashed) for revocation

### 3.2 Medications Module
- CRUD for medication definitions
- Status machine: active → paused → completed
- Dose schedule generation on create/update
- Soft delete

### 3.3 Dose Scheduling Engine
```
MedicationDefinition
    │
    ▼
DoseEventGenerator
    │ generates
    ▼
DoseEvent[] (stored in DB)
    │
    ▼
NotificationScheduler
    │ schedules
    ▼
Push Notifications
```

**Generation algorithm:**
1. Expand frequency → times per day
2. For each day in [startDate, endDate]
3. For each time slot, create DoseEvent with scheduledAt = date + time
4. Batch insert

### 3.4 AI Pipeline Module
```
Input (image/PDF)
    │
    ▼
File Validation (MIME, size)
    │
    ▼
OCR Provider (pluggable)
    │ raw text
    ▼
LLM Provider (pluggable)
    │ structured JSON
    ▼
Zod Schema Validation
    │
    ▼
Confidence Assessment
    │
    ▼
PrescriptionExtraction (stored)
    │
    ▼
User Confirmation Required
```

**AI Provider Abstraction:**
```typescript
interface AIProvider {
  extractPrescription(ocrText: string): Promise<PrescriptionExtraction>
  explainMedication(context: MedicationContext): Promise<string>
}

interface OCRProvider {
  extractText(fileBuffer: Buffer, mimeType: string): Promise<string>
}
```

### 3.5 Refill Prediction Engine
```
initialQuantity + purchasedQuantity = totalQuantity
confirmedDoses (taken events) = consumed
estimatedRemaining = totalQuantity - consumed
adherenceRate = taken / (taken + missed) over last 14 days
adjustedDailyConsumption = dailyDose * adherenceRate
estimatedRunOutDate = today + (estimatedRemaining / adjustedDailyConsumption)
```

### 3.6 Caregiver Authorization
```
Every caregiver API request:
    │
    ▼
Extract userId from JWT
    │
    ▼
CaregiverRelationship lookup
    │
    ▼
Check required permission in permissions[]
    │
    ▼
Allow / Deny
```

---

## 4. Data Flow Patterns

### Offline-First Sync
1. Mobile stores pending actions in AsyncStorage queue
2. Each action has: type, payload, timestamp, retryCount
3. NetworkMonitor detects connectivity
4. SyncEngine processes queue FIFO
5. Conflict: server-wins for medical data (safety critical)

### Notification Flow
1. DoseEventGenerator creates events
2. NotificationService schedules local Expo notifications
3. For remote: push via Expo Push API
4. NotificationLog records delivery status

---

## 5. Security Architecture

| Layer | Control |
|---|---|
| Transport | HTTPS only |
| Authentication | JWT Bearer + Refresh |
| Authorization | Role + Permission checks per route |
| Storage | Expo SecureStore for tokens |
| Passwords | bcrypt (rounds=12) |
| File Uploads | MIME validation, size limits, virus-scan-ready |
| Rate Limiting | express-rate-limit per IP + per user |
| Input Validation | Zod schemas on all inputs |
| Audit | AuditLog table for sensitive actions |
| Errors | No stack traces in production responses |

---

## 6. Deployment Architecture

### Local Development
- Docker Compose: PostgreSQL + Redis + Backend
- Mobile: Expo Go / dev client

### Production Ready
- Backend: containerized, 12-factor app
- DB: managed PostgreSQL (RDS/Supabase-ready)
- Cache: managed Redis (ElastiCache-ready)
- Files: S3-compatible object storage
- Mobile: Expo EAS Build
