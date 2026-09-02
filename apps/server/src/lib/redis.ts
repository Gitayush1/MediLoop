import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  retryStrategy: () => null, // Don't crash on connection failure when Redis is offline
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (_err) => {
  // Suppress unhandled redis connection errors when Redis is not running locally
});

// ─────────────────────────────────────────────────────────────
// Cache helpers (failsafe – bypass cache if Redis is offline)
// ─────────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (redis.status !== 'ready') return null;
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try {
    if (redis.status !== 'ready') return;
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Ignore cache set error if offline
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    if (redis.status !== 'ready') return;
    await redis.del(key);
  } catch {
    // Ignore cache del error if offline
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    if (redis.status !== 'ready') return;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Ignore cache del pattern error if offline
  }
}
