import Redis from 'ioredis'
import { config } from './index'
import { logger } from '../utils/logger'

let redis: Redis | null = null
let redisAvailable = true

function createRedis(): void {
  if (redis) return
  if (!config.redis.url) {
    redisAvailable = false
    logger.warn('REDIS_URL not set — caching disabled')
    return
  }

  redis = new Redis(config.redis.url, {
    password: config.redis.password,
    retryStrategy: (times) => {
      if (times > 3) {
        redisAvailable = false
        return null
      }
      return Math.min(times * 50, 2000)
    },
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
  })

  redis.on('connect', () => {
    redisAvailable = true
    logger.info('Redis connected')
  })
  redis.on('error', (err) => {
    redisAvailable = false
    logger.error(err, 'Redis error:')
  })
  redis.on('close', () => {
    redisAvailable = false
    logger.warn('Redis connection closed')
  })
}

export async function initRedis(): Promise<void> {
  createRedis()
  if (!redis) return
  try {
    await redis.connect()
    redisAvailable = true
  } catch (err) {
    redisAvailable = false
    logger.warn('Redis connection failed — caching disabled')
  }
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    redisAvailable = false
    await redis.quit()
    redis = null
    logger.info('Redis disconnected')
  }
}

export function getRedis(): Redis | null {
  return redis
}

export function isRedisAvailable(): boolean {
  return redisAvailable
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redisAvailable || !redis) return null
  try {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch {
    redisAvailable = false
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttl: number = 300): Promise<void> {
  if (!redisAvailable || !redis) return
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl)
  } catch {
    redisAvailable = false
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redisAvailable || !redis) return
  try {
    await redis.del(key)
  } catch {
    redisAvailable = false
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  if (!redisAvailable || !redis) return
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch {
    redisAvailable = false
  }
}
