# MediLoop API Documentation

Base URL: `/api/v1`

---

## 🔒 Authentication & Headers

All requests except public auth endpoints require a Bearer JWT Token in the HTTP Authorization Header:
`Authorization: Bearer <access_token>`

Admin endpoints require:
`X-Admin-Secret: <admin_secret>`

---

## 1. Authentication (`/auth`)

| Endpoint | Method | Description |
|---|---|---|
| `/auth/register` | POST | Register new patient account |
| `/auth/login` | POST | Login and receive access + refresh token |
| `/auth/refresh` | POST | Obtain new access token using refresh token |
| `/auth/logout` | POST | Revoke refresh token |
| `/auth/verify-email` | POST | Verify user email with token |
| `/auth/forgot-password` | POST | Trigger password reset email |
| `/auth/reset-password` | POST | Reset password using token |

---

## 2. User & Profile (`/users`)

| Endpoint | Method | Description |
|---|---|---|
| `/users/me` | GET | Fetch current user profile |
| `/users/me` | PATCH | Update current user profile |

---

## 3. Medications (`/medications`)

| Endpoint | Method | Description |
|---|---|---|
| `/medications` | GET | List medications (with optional `status` filter) |
| `/medications/:id` | GET | Get single medication details |
| `/medications` | POST | Create medication & generate dose schedule |
| `/medications/:id` | PATCH | Update medication definition |
| `/medications/:id` | DELETE | Soft-delete medication |

---

## 4. Doses (`/doses`)

| Endpoint | Method | Description |
|---|---|---|
| `/doses/today` | GET | Get today's scheduled and past doses |
| `/doses/history` | GET | Get paginated dose history |
| `/doses/:id/taken` | POST | Mark dose as TAKEN |
| `/doses/:id/skipped` | POST | Mark dose as SKIPPED |
| `/doses/:id/snooze` | POST | Snooze a dose by specified minutes |
| `/doses/adherence` | GET | Get adherence statistics and streak |

---

## 5. Prescriptions (`/prescriptions`)

| Endpoint | Method | Description |
|---|---|---|
| `/prescriptions` | GET | List user prescriptions |
| `/prescriptions/upload` | POST | Upload prescription image/PDF file |
| `/prescriptions/:id` | GET | Get prescription & extracted medicines |
| `/prescriptions/:id/confirm` | POST | Confirm extracted medicines & create medications |

---

## 6. Refills & Inventory (`/refills`)

| Endpoint | Method | Description |
|---|---|---|
| `/refills` | GET | Get refill predictions for active medications |
| `/refills/:medicationId` | GET | Get refill prediction for specific medication |
| `/refills/:medicationId/acknowledge` | POST | Acknowledge low refill warning |
| `/refills/:medicationId/inventory` | POST | Add inventory entry (INITIAL / PURCHASE / ADJUSTMENT) |

---

## 7. AI Module (`/ai`)

| Endpoint | Method | Description |
|---|---|---|
| `/ai/prescriptions/:id/process` | POST | Trigger full OCR + LLM extraction pipeline |
| `/ai/medications/:id/explain` | GET | Get plain-language explanation of medication |

---

## 8. Notifications (`/notifications`)

| Endpoint | Method | Description |
|---|---|---|
| `/notifications` | GET | Fetch user in-app notifications |
| `/notifications/read-all` | PATCH | Mark all notifications as read |
| `/notifications/:id/read` | PATCH | Mark single notification as read |
| `/notifications/preferences` | GET | Get user notification preferences |
| `/notifications/preferences` | PATCH | Update notification preferences |
| `/notifications/devices` | POST | Register push notification device token |
| `/notifications/devices/:deviceId` | DELETE | Deregister device push token |

---

## 9. Caregivers (`/caregivers`)

| Endpoint | Method | Description |
|---|---|---|
| `/caregivers/my-caregivers` | GET | List granted caregivers |
| `/caregivers/my-patients` | GET | List accessible patients |
| `/caregivers/invitations` | GET | List pending sent invitations |
| `/caregivers/invite` | POST | Send caregiver invitation email |
| `/caregivers/invitations/:token/accept` | POST | Accept caregiver invitation |
| `/caregivers/:id` | DELETE | Revoke caregiver relationship |
| `/caregivers/:id` | PATCH | Update caregiver permissions |
| `/caregivers/patients/:patientId/medications` | GET | View patient medications (caregiver view) |
| `/caregivers/patients/:patientId/adherence` | GET | View patient adherence (caregiver view) |

---

## 10. Admin (`/admin`)

| Endpoint | Method | Description |
|---|---|---|
| `/admin/stats` | GET | Aggregated system metrics |
| `/admin/daily-stats` | GET | Daily chart data (last 30 days) |
| `/admin/health` | GET | Admin health check |
