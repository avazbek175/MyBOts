import pino from 'pino'
import { config } from '../config'

export const logger = pino({
  transport: config.app.nodeEnv === 'development' ? { target: 'pino-pretty' } : undefined,
  level: config.app.nodeEnv === 'development' ? 'debug' : 'info',
})
