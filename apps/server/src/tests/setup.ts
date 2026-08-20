import { execSync } from 'child_process';
import path from 'path';

// Point to test database
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://mediloop:mediloop_password@localhost:5432/mediloop_test';
process.env.JWT_SECRET = 'test_jwt_secret_minimum_32_characters_here';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_minimum_32_chars_here';
process.env.REDIS_URL = process.env.TEST_REDIS_URL ?? 'redis://localhost:6379';
process.env.AI_PROVIDER = 'mock';
process.env.OCR_PROVIDER = 'mock';
process.env.EMAIL_PROVIDER = 'mock';
process.env.ADMIN_SECRET = 'test_admin_secret';
process.env.STORAGE_LOCAL_PATH = './test-uploads';

export default async function globalSetup() {
  // Run migrations on test DB
  try {
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
      stdio: 'pipe',
    });
  } catch {
    // Migrations might already be applied
  }
}
