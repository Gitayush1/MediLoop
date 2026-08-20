import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  (prisma as any).$on?.('query', (e: { query: string; duration: number }) => {
    if (process.env.LOG_QUERIES === 'true') {
      logger.debug({ query: e.query, duration: `${e.duration}ms` }, 'DB Query');
    }
  });
  globalForPrisma.prisma = prisma;
}
