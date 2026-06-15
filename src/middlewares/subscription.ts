import { BotContext } from '../types'
import { Markup } from 'telegraf'
import Channel from '../models/Channel'

export async function subscriptionMiddleware(ctx: BotContext, next: () => Promise<void>) {
  if (!ctx.session?.user) return await next()
  if (ctx.session.user.isPremium && ctx.session.user.premiumUntil && ctx.session.user.premiumUntil > new Date()) {
    ctx.session.isPremium = true
    return await next()
  }
  if (ctx.session.user.premiumLifetime) {
    ctx.session.isPremium = true
    return await next()
  }

  const channels = await Channel.find({ isActive: true })
  if (channels.length === 0) return await next()

  const unsubscribedChannels: string[] = []
  for (const ch of channels) {
    try {
      const member = await ctx.telegram.getChatMember(ch.channelId, ctx.from!.id)
      if (member.status === 'left' || member.status === 'kicked') {
        unsubscribedChannels.push(ch.channelUrl || ch.channelName)
      }
    } catch {
      unsubscribedChannels.push(ch.channelName)
    }
  }

  if (unsubscribedChannels.length > 0) {
    const channelButtons: any[] = channels.map(ch => [Markup.button.url(`📢 ${ch.channelName}`, ch.channelUrl)])
    channelButtons.push([Markup.button.callback('✅ Obuna bo\'ldim', 'check_subscription')])
    await ctx.reply(
      '📢 Botdan foydalanish uchun quyidagi kanallarga obuna bo\'ling:',
      Markup.inlineKeyboard(channelButtons)
    )
    return
  }
  ctx.session.isSubscribed = true
  await next()
}
