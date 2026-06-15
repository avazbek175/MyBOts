import { createApp } from '../app'
import { logger } from '../utils/logger'
import { Request, Response } from 'express'

let app: Awaited<ReturnType<typeof createApp>> | null = null

export default async function handler(req: Request, res: Response) {
  try {
    if (!app) {
      app = await createApp()
    }
    return app(req, res)
  } catch (error) {
    logger.error(error, 'Webhook handler fatal:')
    if (!res.headersSent) {
      res.status(200).json({ ok: true })
    }
  }
}
