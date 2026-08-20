# MediLoop – Implementation Plan

**Version:** 1.0.0

---

## Phase 1: Project Scaffolding & Infrastructure
- [x] Planning documents
- [ ] Monorepo structure (apps/mobile, apps/server, packages/shared)
- [ ] Docker Compose (PostgreSQL + Redis)
- [ ] Backend package.json, tsconfig, eslint, prettier
- [ ] Mobile package.json, tsconfig, eslint, prettier
- [ ] Shared package setup

## Phase 2: Database Layer
- [ ] Prisma schema (all models)
- [ ] Migrations
- [ ] Seed data

## Phase 3: Backend Foundation
- [ ] Express app setup
- [ ] Environment config
- [ ] Error handling middleware
- [ ] Logging (winston/pino)
- [ ] Rate limiting
- [ ] CORS
- [ ] File upload (multer)

## Phase 4: Authentication Backend
- [ ] User registration
- [ ] Email verification
- [ ] Login / JWT issuance
- [ ] Refresh token flow
- [ ] Logout / token revocation
- [ ] Forgot password / reset
- [ ] Auth middleware

## Phase 5: Core Backend APIs
- [ ] Users / Profile module
- [ ] Medications CRUD
- [ ] Medication Schedule generation
- [ ] Dose Events CRUD
- [ ] Dose tracking (taken/skipped/snoozed)
- [ ] Adherence calculation

## Phase 6: AI Pipeline Backend
- [ ] OCR provider abstraction
- [ ] LLM provider abstraction
- [ ] Prescription upload handler
- [ ] OCR extraction
- [ ] AI structured extraction
- [ ] Zod validation of AI output
- [ ] Prescription confirmation API

## Phase 7: Refill & Inventory Backend
- [ ] Inventory tracking
- [ ] Refill prediction engine
- [ ] Refill acknowledgment

## Phase 8: Notifications Backend
- [ ] Expo push notification integration
- [ ] Notification scheduling
- [ ] Notification preferences API
- [ ] Device token management

## Phase 9: Caregiver Backend
- [ ] Invitation creation
- [ ] Invitation acceptance
- [ ] Permission middleware
- [ ] Caregiver views

## Phase 10: Mobile Foundation
- [ ] Expo project setup
- [ ] Expo Router navigation
- [ ] Design system (colors, typography, spacing)
- [ ] Reusable component library
- [ ] API service layer (axios + React Query)
- [ ] Zustand stores
- [ ] SecureStore token management

## Phase 11: Mobile Auth Screens
- [ ] Splash screen
- [ ] Welcome screen
- [ ] Login screen
- [ ] Signup screen
- [ ] OTP verification
- [ ] Forgot password

## Phase 12: Mobile Onboarding
- [ ] Profile setup
- [ ] Notification permissions
- [ ] Caregiver setup intro

## Phase 13: Mobile Main App
- [ ] Home Dashboard
- [ ] Medication List
- [ ] Medication Details
- [ ] Add Medication (manual)
- [ ] Medication Schedule (calendar)
- [ ] Dose Tracking
- [ ] Adherence Dashboard

## Phase 14: Prescription Scanner Mobile
- [ ] Camera / Image Picker
- [ ] Upload flow
- [ ] Processing state
- [ ] Extraction review screen
- [ ] Field editing
- [ ] Confirmation flow

## Phase 15: Refill & Inventory Mobile
- [ ] Refill Center screen
- [ ] Running low indicators
- [ ] Reorder CTA

## Phase 16: Notifications Mobile
- [ ] Permission handling
- [ ] Local notification scheduling
- [ ] Notifications Center screen
- [ ] Notification preferences

## Phase 17: Caregiver Mobile
- [ ] Family management screen
- [ ] Invite caregiver flow
- [ ] Caregiver view

## Phase 18: Offline Sync
- [ ] Action queue
- [ ] Network monitor
- [ ] Sync engine
- [ ] Conflict resolution

## Phase 19: Admin Dashboard
- [ ] React web app (Vite)
- [ ] Aggregated metrics API
- [ ] Charts

## Phase 20: Testing
- [ ] Backend unit tests
- [ ] Backend integration tests
- [ ] Mobile component tests
- [ ] E2E flow test

## Phase 21: Documentation & Polish
- [ ] README.md
- [ ] API.md
- [ ] AI_PIPELINE.md
- [ ] TypeScript strict checks
- [ ] ESLint clean
- [ ] Build verification
