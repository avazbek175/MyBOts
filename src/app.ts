import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { Telegraf } from 'telegraf'
import mongoose from 'mongoose'
import { config } from './config'
import { getRedis, closeRedis } from './config/redis'
import { logger } from './utils/logger'

let bot: Telegraf | null = null
let dbConnected = false
let appInitialized = false

async function ensureDbConnection(): Promise<void> {
  if (dbConnected && mongoose.connection.readyState === 1) return
  try {
    mongoose.set('strictQuery', true)
    await mongoose.connect(config.mongodb.uri, {
      maxPoolSize: 5,
      minPoolSize: 0,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 8000,
      retryWrites: true,
      connectTimeoutMS: 8000,
    })
    dbConnected = true
    logger.info('MongoDB connected')
  } catch (error) {
    dbConnected = false
    logger.error(error, 'MongoDB connection failed')
    throw error
  }
}

async function lazyInit(): Promise<void> {
  if (appInitialized) {
    if (mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connect(config.mongodb.uri)
      } catch {}
    }
    return
  }
  try {
    await ensureDbConnection()
    getRedis()
    const { default: botInstance } = await import('./bot')
    bot = botInstance
    appInitialized = true
  } catch (error) {
    logger.error(error, 'App initialization failed')
    throw error
  }
}

export async function createApp(): Promise<express.Application> {
  const app = express()

  app.use(helmet())
  app.use(cors())
  app.use(express.json())

  app.get('/', (_req, res) => {
    res.json({
      status: dbConnected ? 'ok' : 'starting',
      name: 'Ultimate Movie Stream Bot',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    })
  })

  app.get('/health', async (_req, res) => {
    const mongoState = ['disconnected', 'connected', 'connecting', 'disconnecting']
    res.json({
      status: dbConnected ? 'healthy' : 'degraded',
      mongo: mongoState[mongoose.connection.readyState] || 'unknown',
      bot: bot !== null,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    })
  })

  app.post('/api/webhook', async (req, res) => {
    try {
      await lazyInit()
      if (!bot) {
        res.sendStatus(200)
        return
      }
      await bot.handleUpdate(req.body)
      res.sendStatus(200)
    } catch (err) {
      logger.error(err, 'Webhook error:')
      res.sendStatus(200)
    }
  })

  return app
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received')
  await closeRedis()
  await mongoose.disconnect()
})

process.on('unhandledRejection', (reason) => {
  logger.error(reason, 'Unhandled Rejection:')
})

if (require.main === module) {
  (async () => {
    try {
      await lazyInit()
      const app = await createApp()
      app.listen(config.app.port, () => {
        logger.info(`Server running on port ${config.app.port}`)
        logger.info(`Bot: @${config.bot.username}`)
      })
    } catch (error) {
      logger.error(error, 'Failed to start:')
      process.exit(1)
    }
  })()
}

export { lazyInit }
