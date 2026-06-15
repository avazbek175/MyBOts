import { BotContext } from '../types'
import User from '../models/User'
import { config } from '../config'

export async function authMiddleware(ctx: BotContext, next: () => Promise<void>) {
  if (!ctx.from) return
  const telegramId = ctx.from.id
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
  await next()
}
