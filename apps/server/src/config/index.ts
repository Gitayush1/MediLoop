import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  AI_PROVIDER: z.enum(['openai', 'anthropic', 'gemini', 'mock']).default('openai'),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('gpt-4o'),
  AI_MAX_RETRIES: z.coerce.number().default(3),
  OCR_PROVIDER: z.enum(['tesseract', 'google-vision', 'aws-textract', 'mock']).default('mock'),
  OCR_API_KEY: z.string().optional(),
  STORAGE_PROVIDER: z.enum(['local', 's3', 'gcs']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_S3_BUCKET: z.string().optional(),
  EMAIL_PROVIDER: z.enum(['smtp', 'mock']).default('mock'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM_NAME: z.string().default('MediLoop'),
  EMAIL_FROM_ADDRESS: z.string().default('noreply@mediloop.app'),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(10),
  CORS_ORIGINS: z.string().default('http://localhost:8081,http://localhost:5173'),
  ADMIN_SECRET: z.string().default('change_me_in_production'),
  ANALYTICS_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const config = parsed.data;

export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';
export const isDevelopment = config.NODE_ENV === 'development';
