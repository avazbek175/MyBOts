import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { Telegraf } from 'telegraf'
import { config } from './config'
import { connectDatabase } from './config/database'
import { getRedis, closeRedis } from './config/redis'
import { logger } from './utils/logger'

let bot: Telegraf

export async function createApp(): Promise<express.Application> {
  await connectDatabase()
  getRedis()

  const { default: botInstance } = await import('./bot')
  bot = botInstance

  const app = express()

  app.use(helmet())
  app.use(cors())
  app.use(express.json())

  app.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      name: 'Ultimate Movie Stream Bot',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    })
  })

  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    })
  })

  app.post('/api/webhook', async (req, res) => {
    try {
      await bot.handleUpdate(req.body)
      res.sendStatus(200)
    } catch (err) {
      logger.error(err, 'Webhook error:')
      res.sendStatus(200)
    }
  })

  if (config.app.nodeEnv === 'development') {
    app.post('/api/clear-webhook', async (_req, res) => {
      await bot.telegram.deleteWebhook()
      res.json({ message: 'Webhook cleared' })
    })
  }

  return app
}

async function startServer(): Promise<void> {
  try {
    const app = await createApp()

    if (config.app.nodeEnv === 'development') {
      await bot.telegram.deleteWebhook()
      await bot.telegram.setWebhook(`${config.bot.webhookUrl}/api/webhook`)
      logger.info(`Webhook set to ${config.bot.webhookUrl}/api/webhook`)
    }

    app.listen(config.app.port, () => {
      logger.info(`Server running on port ${config.app.port}`)
      logger.info(`Environment: ${config.app.nodeEnv}`)
      logger.info(`Bot: @${config.bot.username}`)
    })
  } catch (error) {
    logger.error(error, 'Failed to start server:')
    process.exit(1)
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...')
  await closeRedis()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...')
  await closeRedis()
  process.exit(0)
})

process.on('unhandledRejection', (reason) => {
  logger.error(reason, 'Unhandled Rejection:')
})

process.on('uncaughtException', (error) => {
  logger.error(error, 'Uncaught Exception:')
  process.exit(1)
})

if (require.main === module) {
  startServer()
}

export { startServer }
