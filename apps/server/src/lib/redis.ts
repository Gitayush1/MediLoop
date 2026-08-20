import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error({ err }, 'Redis error'));
redis.on('close', () => logger.warn('Redis connection closed'));

// Cache helpers

export async function cacheGet<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  if (!value) return null;
  return JSON.parse(value) as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDel(key: string): Promise<void> {
  await redis.del(key);
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
