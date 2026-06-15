import { createApp } from '../app'
import { logger } from '../utils/logger'
import { Request, Response } from 'express'

let app: Awaited<ReturnType<typeof createApp>> | null = null

export default async function handler(req: Request, res: Response) {
  if (!app) {
    try {
      app = await createApp()
    } catch (error) {
      logger.error(error, 'Failed to initialize webhook handler:')
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  return app(req, res)
}
