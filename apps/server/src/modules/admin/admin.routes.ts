import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { sendSuccess } from '../../lib/response';
import { config } from '../../config';
import { AuthorizationError } from '../../lib/errors';

const router = Router();

// Admin secret key middleware (replace with proper admin JWT in production)
function adminAuth(req: Request, _res: Response, next: NextFunction): void {
  const secret = req.headers['x-admin-secret'];
  if (secret !== config.ADMIN_SECRET) {
    return next(new AuthorizationError('Invalid admin credentials'));
  }
  next();
}

router.use(adminAuth);

/**
 * @route GET /admin/stats
 * Aggregated platform statistics – anonymized
 */
router.get('/stats', async (_req, res, next) => {
  try {
    const [
      totalUsers,
      verifiedUsers,
      activeMedications,
      prescriptionsProcessed,
      totalDosesTaken,
      totalDosesMissed,
      refillWarnings,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { emailVerified: true, deletedAt: null } }),
      prisma.medication.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.prescription.count({ where: { status: 'PROCESSED' } }),
      prisma.doseEvent.count({ where: { status: 'TAKEN' } }),
      prisma.doseEvent.count({ where: { status: 'MISSED' } }),
      prisma.refillPrediction.count({ where: { warningAcknowledged: false } }),
    ]);

    // OCR success rate
    const [ocrTotal, ocrFailed] = await Promise.all([
      prisma.prescription.count({ where: { status: { in: ['PROCESSED', 'FAILED'] } } }),
      prisma.prescription.count({ where: { status: 'FAILED' } }),
    ]);

    const ocrSuccessRate = ocrTotal > 0 ? Math.round(((ocrTotal - ocrFailed) / ocrTotal) * 100) : 0;

    // Missed dose rate
    const totalDoses = totalDosesTaken + totalDosesMissed;
    const missedDoseRate = totalDoses > 0 ? Math.round((totalDosesMissed / totalDoses) * 100) : 0;

    // New users this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await prisma.user.count({
      where: { createdAt: { gte: weekAgo }, deletedAt: null },
    });

    sendSuccess(res, {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        newThisWeek: newUsersThisWeek,
      },
      medications: {
        active: activeMedications,
      },
      prescriptions: {
        processed: prescriptionsProcessed,
        ocrSuccessRate,
      },
      doses: {
        taken: totalDosesTaken,
        missed: totalDosesMissed,
        missedDoseRate,
      },
      refills: {
        pendingWarnings: refillWarnings,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /admin/daily-stats
 * Daily aggregated stats for charts (last 30 days)
 */
router.get('/daily-stats', async (_req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // New user registrations per day
    const usersByDay = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= ${thirtyDaysAgo} AND deleted_at IS NULL
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Dose events per day
    const dosesByDay = await prisma.$queryRaw<Array<{ date: string; status: string; count: bigint }>>`
      SELECT DATE(scheduled_at) as date, status, COUNT(*) as count
      FROM dose_events
      WHERE scheduled_at >= ${thirtyDaysAgo}
        AND status IN ('TAKEN', 'MISSED')
      GROUP BY DATE(scheduled_at), status
      ORDER BY date ASC
    `;

    sendSuccess(res, {
      userRegistrations: usersByDay.map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
      doseAdherence: dosesByDay.map((r) => ({
        date: r.date,
        status: r.status,
        count: Number(r.count),
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /admin/health
 * System health check
 */
router.get('/health', async (_req, res, next) => {
  try {
    // Test DB connection
    await prisma.$queryRaw`SELECT 1`;

    sendSuccess(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: { database: 'ok' },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
