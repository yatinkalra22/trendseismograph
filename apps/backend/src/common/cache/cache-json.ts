import type Redis from 'ioredis';
import type { LoggerService } from '@nestjs/common';

export async function getCachedJson<T>(
  redis: Redis,
  key: string,
  logger?: LoggerService,
): Promise<T | null> {
  const cached = await redis.get(key);
  if (!cached) {
    return null;
  }

  try {
    return JSON.parse(cached) as T;
  } catch {
    logger?.warn?.(`Invalid JSON cache payload for key: ${key}`);
    await redis.del(key);
    return null;
  }
}

export async function setCachedJson(
  redis: Redis,
  key: string,
  ttlSeconds: number,
  value: unknown,
  logger?: LoggerService,
): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    logger?.warn?.(`Failed to write cache key ${key}: ${message}`);
  }
}