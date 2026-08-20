import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import path from 'path';
import { config } from './config';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import medicationsRoutes from './modules/medications/medications.routes';
import dosesRoutes from './modules/doses/doses.routes';
import prescriptionsRoutes from './modules/prescriptions/prescriptions.routes';
import refillsRoutes from './modules/refills/refills.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import caregiversRoutes from './modules/caregivers/caregivers.routes';
import adminRoutes from './modules/admin/admin.routes';
import aiRoutes from './modules/ai/ai.routes';

const app = express();

// ─────────────────────────────────────────────────────────────
// Security middleware
// ─────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin: config.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Admin-Secret'],
  }),
);

// ─────────────────────────────────────────────────────────────
// Request parsing
// ─────────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─────────────────────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res) => {
      if (res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        id: req.id,
      }),
    },
  }),
);

// ─────────────────────────────────────────────────────────────
// Rate limiting
// ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  },
});

const authLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
});

app.use(globalLimiter);

// ─────────────────────────────────────────────────────────────
// Static files (uploaded prescriptions)
// ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
app.use(`${API_PREFIX}/users`, usersRoutes);
app.use(`${API_PREFIX}/medications`, medicationsRoutes);
app.use(`${API_PREFIX}/doses`, dosesRoutes);
app.use(`${API_PREFIX}/prescriptions`, prescriptionsRoutes);
app.use(`${API_PREFIX}/refills`, refillsRoutes);
app.use(`${API_PREFIX}/notifications`, notificationsRoutes);
app.use(`${API_PREFIX}/caregivers`, caregiversRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);

// ─────────────────────────────────────────────────────────────
// Error handling (must be last)
// ─────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
