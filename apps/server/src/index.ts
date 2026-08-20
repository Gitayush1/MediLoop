import fs from 'fs';
import path from 'path';
import { app } from './app';
import { config } from './config';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { logger } from './lib/logger';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), config.STORAGE_LOCAL_PATH.replace('./', ''));
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

async function bootstrap(): Promise<void> {
  // Connect to Redis
  await redis.connect();

  // Verify database connection
  await prisma.$connect();
  logger.info('Database connected');

  // Start server
  const server = app.listen(config.PORT, () => {
    logger.info(
      {
        port: config.PORT,
        env: config.NODE_ENV,
        version: '1.0.0',
      },
      `🚀 MediLoop API server started`,
    );
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down gracefully...');
    server.close(async () => {
      await prisma.$disconnect();
      await redis.quit();
      logger.info('Server closed');
      process.exit(0);
    });

    // Force shutdown after 10s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
    process.exit(1);
  });
}

void bootstrap();
