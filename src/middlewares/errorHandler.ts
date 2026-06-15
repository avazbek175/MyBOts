import { BotContext } from '../types'
import { logger } from '../utils/logger'
import mongoose from 'mongoose'
import { config } from '../config'

async function reportToOwner(error: any, ctx?: BotContext) {
  const owners = config.owner.ids
  const stack = error?.stack || error?.message || String(error)
  const text = [
    '🚨 *BOT XATOLIK*',
    '',
    `\`\`\`${stack.slice(0, 1500)}\`\`\``,
    '',
    `• User: ${ctx?.from?.id || '?'} (@${ctx?.from?.username || '?'})`,
    `• Chat: ${ctx?.chat?.id || '?'}`,
    `• Time: ${new Date().toISOString()}`,
  ].join('\n')

  for (const ownerId of owners) {
    try {
      if (ctx?.telegram) {
        await ctx.telegram.sendMessage(ownerId, text, { parse_mode: 'Markdown' })
      }
    } catch {
      try {
        const { default: bot } = await import('../bot')
        await bot.telegram.sendMessage(ownerId, text, { parse_mode: 'Markdown' })
      } catch {}
    }
  }
}

export async function errorHandlerMiddleware(ctx: BotContext, next: () => Promise<void>) {
  try {
    await next()
  } catch (error: any) {
    logger.error(error, 'Middleware error')
    await reportToOwner(error, ctx)
    const msg = getErrorMessage(error)
    try {
      await ctx.reply(msg, { parse_mode: 'Markdown' })
    } catch {}
  }
}

export async function handleError(error: unknown, ctx?: BotContext) {
  logger.error(error, 'Unhandled error')
  await reportToOwner(error, ctx)
  if (ctx) {
    try {
      await ctx.reply(getErrorMessage(error), { parse_mode: 'Markdown' })
    } catch {}
  }
}

function getErrorMessage(error: any): string {
  const code = error?.code || error?.name || ''
  const msg = (error?.message || '').toLowerCase()

  if (code === 'ECONNREFUSED' || msg.includes('connect') || msg.includes('mongoose')) {
    return '🚫 Server bilan bog\'lanishda xatolik. Administratorga murojaat qiling.'
  }
  if (msg.includes('etimedout') || msg.includes('timeout') || msg.includes('timed out')) {
    return '⏱ Server juda sekin javob berdi. Qayta urinib ko\'ring.'
  }
  if (code === 'EFATAL' || msg.includes('fatal')) {
    return '❌ Jiddiy xatolik. Iltimos keyinroq urinib ko\'ring.'
  }
  if (mongoose.connection.readyState !== 1) {
    return '🔄 Ma\'lumotlar bazasiga ulanmoqda... Bir ozdan so\'ng qayta urinib ko\'ring.'
  }
  return '❌ Xatolik yuz berdi. Iltimos qayta urinib ko\'ring.'
}
