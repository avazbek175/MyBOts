import { BotContext } from '../types'
import { Markup } from 'telegraf'

export async function premiumMiddleware(ctx: BotContext, next: () => Promise<void>) {
  if (!ctx.session?.user) return

  const user = ctx.session.user
  const hasPremium = user.isPremium && user.premiumUntil && user.premiumUntil > new Date()
  const hasLifetime = user.premiumLifetime

  if (hasPremium || hasLifetime) {
    ctx.session.isPremium = true
    return await next()
  }

  await ctx.reply(
    '⭐️ Bu funksiyadan foydalanish uchun premium obuna kerak.\n\nPremium imkoniyatlari:\n• Cheksiz qidiruv\n• Reklamasiz foydalanish\n• Yuqori sifatli streaming\n• Eksklyuziv kontent',
    Markup.inlineKeyboard([
      Markup.button.callback('💎 Premium olish', 'premium_plans'),
    ])
  )
}
