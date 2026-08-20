# MediLoop – Product Requirements Document

**Version:** 1.0.0  
**Date:** 2026-08-20  
**Status:** Active

---

## 1. Product Vision

MediLoop is a smart medication-management platform that converts a paper or digital prescription into an ongoing, guided medication workflow — from scanning to adherence tracking to refill prediction.

### Problem Statement

Millions of people receive prescriptions daily and face the same downstream problems:

- Cannot read or remember complex medication schedules
- Miss doses due to lack of reminders
- Run out of medicine unexpectedly because they don't track quantity
- Don't know when to reorder
- Manage medications for elderly parents with no visibility
- Lose prescriptions and medication history

MediLoop solves all of this in a single, intelligent app.

---

## 2. Core User Journey

```
Prescription Image/PDF
        ↓
      OCR
        ↓
 AI Structured Extraction
        ↓
  User Confirmation
        ↓
 Medication Schedule Created
        ↓
    Dose Reminders
        ↓
  Consumption Tracking
        ↓
Remaining Quantity Estimation
        ↓
   Refill Prediction
        ↓
   Reorder Reminder
```

---

## 3. User Roles

### Patient
- Manage own medications
- Upload and process prescriptions
- Track daily doses
- Manage inventory and refills
- Invite caregivers

### Caregiver
- View authorized family member schedules
- See missed-dose alerts
- See refill alerts
- Cannot modify instructions without explicit authorization

---

## 4. Feature Requirements

### 4.1 Authentication
- Email/password registration with verification
- JWT + refresh token authentication
- Secure token storage (Expo SecureStore)
- Forgot password / OTP flow

### 4.2 Prescription Management
- Upload JPG / PNG / PDF
- OCR extraction pipeline
- AI structured data extraction
- Confidence scoring per field
- User confirmation before schedule creation
- Prescription vault (view, search, delete)

### 4.3 Medication Management
- Create medication from prescription or manually
- Fields: name, dosage, form, frequency, timing, start/end date, quantity, notes
- Active / Completed / Paused status
- Soft delete

### 4.4 Dose Scheduling Engine
- Generate all dose events from medication definition
- Statuses: scheduled, taken, skipped, missed, snoozed
- Record scheduled time vs actual time
- Handle timezone correctly

### 4.5 Dose Tracking
- Mark as Taken / Skipped / Snoozed
- Offline support with sync
- Adherence calculation (daily, weekly, monthly)
- Streak tracking

### 4.6 Refill Prediction
- Track initial + purchased quantity
- Subtract confirmed doses
- Estimate run-out date
- Account for real adherence rate (not assumed perfect)
- Show reorder warning at configurable threshold

### 4.7 Notifications
- Dose reminders (at scheduled time)
- Upcoming reminders (15 min before)
- Missed dose alerts
- Refill warnings
- Caregiver alerts
- Configurable preferences per notification type

### 4.8 Caregiver System
- Invitation flow (patient → caregiver)
- Explicit permissions: VIEW_MEDICATIONS, VIEW_ADHERENCE, VIEW_REFILL_STATUS, VIEW_MISSED_DOSES
- Authorization middleware for all caregiver reads

### 4.9 Offline-First
- Cache today's schedule, medication list, recent doses
- Queue offline actions
- Auto-sync on connectivity restoration
- Conflict resolution strategy

### 4.10 AI Explanation
- Explain prescription abbreviations (OD, BD, TDS, SOS, HS, etc.)
- Explain medication instructions in plain language
- Based only on prescription data — no medical advice
- Clearly labeled as informational

---

## 5. Safety Requirements

MediLoop is an information and management tool only.

**The app MUST NOT:**
- Diagnose diseases
- Prescribe medication
- Recommend changing dosage
- Recommend stopping medication
- Override a doctor's prescription
- Make medical decisions autonomously

**Always display:**
> "MediLoop is a medication-management and information tool. It does not replace medical advice from a qualified healthcare professional."

**AI constraints:**
- Only extracts structured information
- Must return confidence score per field
- Uncertain fields must be flagged for user confirmation
- Never silently create a schedule from uncertain output

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | API p95 < 300ms for standard endpoints |
| Security | HTTPS, JWT, bcrypt, rate limiting, input validation |
| Reliability | Retry logic for OCR/AI failures |
| Scalability | Stateless API, Redis caching layer |
| Accessibility | WCAG AA contrast, accessible labels |
| Privacy | No unnecessary PII in logs, data export, delete account |
| Compliance | Healthcare data handled with appropriate care |

---

## 7. Admin Dashboard Requirements

- Aggregated metrics only (no individual health data)
- Total users, active medications, prescriptions processed
- OCR success rate, AI extraction correction rate
- Missed dose rate, refill reminder stats
- Notification delivery statistics
