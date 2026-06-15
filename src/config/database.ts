import mongoose from 'mongoose'
import { config } from './index'
import { logger } from '../utils/logger'

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set('strictQuery', true)
    const conn = await mongoose.connect(config.mongodb.uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
    })
    logger.info(`MongoDB connected: ${conn.connection.host}`)

    mongoose.connection.on('error', (err) => {
      logger.error(err, 'MongoDB connection error:')
    })

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Reconnecting...')
    })
  } catch (error) {
    logger.error(error, 'MongoDB connection failed:')
    process.exit(1)
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect()
  logger.info('MongoDB disconnected')
}
