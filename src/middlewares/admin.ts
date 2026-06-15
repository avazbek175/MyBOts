import { BotContext } from '../types'
import Admin from '../models/Admin'

const adminRoles = ['owner', 'superadmin', 'admin', 'moderator', 'support']

export async function adminMiddleware(ctx: BotContext, next: () => Promise<void>) {
  if (!ctx.session?.user) return

  if (!adminRoles.includes(ctx.session.user.role)) {
    await ctx.reply('Bu funksiya faqat adminlar uchun')
    return
  }

  ctx.session.isAdmin = true
  await next()
}

export function requirePermission(permission: string) {
  return async (ctx: BotContext, next: () => Promise<void>) => {
    if (!ctx.session?.user) return

    if (!adminRoles.includes(ctx.session.user.role)) {
      await ctx.reply('Bu funksiya faqat adminlar uchun')
      return
    }

    const admin = await Admin.findOne({ userId: ctx.session.user.telegramId, isActive: true })
    if (!admin || !admin.permissions.includes(permission)) {
      await ctx.reply('Sizda bu amalni bajarish uchun ruxsat yo\'q')
      return
    }

    await next()
  }
}
