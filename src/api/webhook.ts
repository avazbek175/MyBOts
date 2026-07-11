process.noDeprecation = true

import { logger } from '../utils/logger'

interface VercelRequest {
  method: string
  body: unknown
  headers: Record<string, string | string[] | undefined>
  query: Record<string, string | string[] | undefined>
}

interface VercelResponse {
  status: (code: number) => VercelResponse
  json: (data: unknown) => void
  send: (data: unknown) => void
  sendStatus: (code: number) => void
}

let bot: import('telegraf').Telegraf | null = null
let initPromise: Promise<void> | null = null
let initError: string | null = null

async function ensureBot(): Promise<void> {
  if (bot) return

  if (initError) {
    initError = null
    initPromise = null
  }

  if (!initPromise) {
    initPromise = (async () => {
      try {
        const { default: mongoose } = await import('mongoose')
        const { config } = await import('../config')
        const { initRedis } = await import('../config/redis')

        await mongoose.connect(config.mongodb.uri, {
          maxPoolSize: 1,
          socketTimeoutMS: 30000,
          serverSelectionTimeoutMS: 8000,
          connectTimeoutMS: 8000,
        }).catch((err: unknown) => {
          logger.warn(err, 'MongoDB unavailable - continuing without DB')
        })

        await initRedis().catch((err: unknown) => {
          logger.warn(err, 'Redis unavailable - continuing without cache')
        })

        const { default: botInstance } = await import('../bot')
        bot = botInstance
        logger.info('Vercel bot initialized successfully')
      } catch (err: unknown) {
        initError = err instanceof Error ? err.message : 'Unknown error'
        logger.error(err, 'Vercel bot init failed')
        initPromise = null
      }
    })()
  }

  await initPromise
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'GET') {
    const status = bot ? 'running' : initError ? 'error' : 'initializing'
    res.status(200).json({
      ok: true,
      status,
      webhook: '/api/webhook',
      method: req.method,
      timestamp: new Date().toISOString(),
    })
    return
  }

  if (req.method === 'POST') {
    ensureBot().catch(() => {})

    if (bot) {
      try {
        await bot.handleUpdate(req.body as any)
      } catch (err: unknown) {
        logger.error(err, 'Update handling failed')
        if (err instanceof Error && err.message?.includes('ETELEGRAM')) {
          logger.warn('Telegram API error - webhook URL may need reset')
        }
      }
    }

    res.status(200).json({ ok: true })
    return
  }

  res.status(200).json({ ok: true })
}
