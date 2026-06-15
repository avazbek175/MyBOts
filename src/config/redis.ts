import Redis from 'ioredis'
import { config } from './index'
import { logger } from '../utils/logger'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.redis.url, {
      password: config.redis.password,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
    })

    redis.on('connect', () => logger.info('Redis connected'))
    redis.on('error', (err) => logger.error(err, 'Redis error:'))
    redis.on('close', () => logger.warn('Redis connection closed'))
  }
  return redis
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
    logger.info('Redis disconnected')
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await getRedis().get(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttl: number = 300): Promise<void> {
  try {
    await getRedis().set(key, JSON.stringify(value), 'EX', ttl)
  } catch {
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await getRedis().del(key)
  } catch {
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const keys = await getRedis().keys(pattern)
    if (keys.length > 0) {
      await getRedis().del(...keys)
    }
  } catch {
  }
}
