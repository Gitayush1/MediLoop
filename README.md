# MediLoop

MediLoop is a smart medication-management platform that converts paper or digital prescriptions into an ongoing, guided medication workflow — from scanning to adherence tracking to refill prediction.

---

## 🏗️ Architecture & Monorepo Structure

MediLoop is built as an **npm workspaces monorepo**:

```
mediloop/
├── apps/
│   ├── mobile/        # React Native / Expo app (patient mobile client)
│   ├── server/        # Node.js / Express backend (REST API + Prisma + Redis)
│   └── admin/         # Vite / React admin dashboard (aggregated metrics)
├── packages/
│   └── shared/        # Shared TypeScript types & Zod validation schemas
├── docker-compose.yml # PostgreSQL + Redis setup
└── package.json
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: `v18+`
- **npm**: `v7+`
- **Docker & Docker Compose** (for local PostgreSQL & Redis)

### 2. Environment Setup
Copy the `.env.example` file in `apps/server`:
```bash
cp apps/server/.env.example apps/server/.env
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Local Infrastructure
```bash
docker-compose up -d
```

### 5. Database Setup (Migrations & Seed)
```bash
npm run db:migrate
npm run db:seed
```

### 6. Run Development Servers
- **Backend Server**: `npm run dev:server` (running on `http://localhost:3000`)
- **Mobile Client**: `npm run dev:mobile` (Expo Dev Tools)
- **Admin Web Dashboard**: `npm run dev:admin` (Vite dev server)

---

## 🧪 Testing & Verification

```bash
# Run backend test suite (Jest + Supertest)
npm run test:server

# Run mobile test suite (Jest + React Native Testing Library)
npm run test:mobile

# Type checking across all workspaces
npm run type-check

# Lint checking across all workspaces
npm run lint
```

---

## 📋 Features

- 📸 **Prescription Scanning & AI Pipeline**: OCR text extraction and structured parsing via LLM with confidence scoring.
- 💊 **Dose Scheduling Engine**: Automatic dose event generation based on frequency and user timing preferences.
- 📉 **Refill Prediction Engine**: Consumed inventory calculation adjusted for real-world adherence rate.
- 👨‍👩‍👧 **Caregiver Authorisation System**: Granular permission-based access sharing (View medications, adherence, refill status, missed doses).
- 🔔 **Notifications System**: In-app log, push reminders via Expo Push API, quiet hours, and preference settings.
- 📊 **Anonymised Admin Dashboard**: Aggregated operational metrics without PII exposure.

---

## 📄 Documentation

- [Architecture Overview](file:///d:/MediLoop/ARCHITECTURE.md)
- [Product Requirements (PRD)](file:///d:/MediLoop/PRODUCT_REQUIREMENTS.md)
- [API Documentation](file:///d:/MediLoop/API.md)
- [AI Pipeline Specifications](file:///d:/MediLoop/AI_PIPELINE.md)
