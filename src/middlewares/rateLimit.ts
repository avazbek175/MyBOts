import { BotContext } from '../types'
import { config } from '../config'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<number, RateLimitEntry>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now >= entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 60000)

export async function rateLimitMiddleware(ctx: BotContext, next: () => Promise<void>) {
  if (!ctx.from) return await next()

  const userId = ctx.from.id
  const now = Date.now()
  const windowMs = config.app.rateWindow
  const maxRequests = config.app.rateLimit

  let entry = rateLimitMap.get(userId)

  if (!entry || now >= entry.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs })
    return await next()
  }

  entry.count++

  if (entry.count > maxRequests) {
    return
  }

  await next()
}
