import { BotContext } from '../types'
import { logger } from '../utils/logger'

export async function errorHandlerMiddleware(ctx: BotContext, next: () => Promise<void>) {
  try {
    await next()
  } catch (error) {
    logger.error(error, 'Error in middleware')
    try {
      await ctx.reply('Xatolik yuz berdi. Iltimos keyinroq urinib ko\'ring.')
    } catch {}
  }
}

export async function handleError(error: unknown, ctx?: BotContext) {
  logger.error(error, 'Unhandled error')
  if (ctx) {
    try {
      await ctx.reply('Xatolik yuz berdi. Iltimos keyinroq urinib ko\'ring.')
    } catch {}
  }
}
