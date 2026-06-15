import { BotContext } from '../types'
import User from '../models/User'
import { config } from '../config'
import mongoose from 'mongoose'

export async function authMiddleware(ctx: BotContext, next: () => Promise<void>) {
  if (!ctx.from) return await next()
  const telegramId = ctx.from.id

  try {
    if (mongoose.connection.readyState !== 1) {
      await ctx.reply('🔄 Server ishga tushmoqda... Bir ozdan so\'ng /start ni bosing.')
      return
    }

    let user = await User.findOne({ telegramId })
    if (!user) {
      user = await User.create({
        telegramId,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        languageCode: ctx.from.language_code,
      })
    }
    if (user.isBanned) {
      await ctx.reply('🚫 Siz botdan foydalanishdan bloklangansiz.')
      return
    }
    if (config.owner.ids.includes(telegramId) && user.role !== 'owner') {
      user.role = 'owner'
    }
    user.lastActivity = new Date()
    await user.save()
    ctx.session = ctx.session || {}
    ctx.session.user = user
  } catch (error: any) {
    const msg = (error?.message || '').toLowerCase()
    if (msg.includes('connect') || msg.includes('timeout') || msg.includes('dns')) {
      await ctx.reply('🚫 Ma\'lumotlar bazasiga ulanishda xatolik.\n\n💡 MongoDB Atlas → Network Access → 0.0.0.0/0 qo\'shing.')
      return
    }
    throw error
  }

  await next()
}
