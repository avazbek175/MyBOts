import { BotContext } from '../types'
import { Markup } from 'telegraf'
import Channel from '../models/Channel'

let channelsCache: any[] | null = null
let channelsCacheTime = 0
const CHANNELS_CACHE_TTL = 30_000

async function getActiveChannels() {
  if (channelsCache && Date.now() - channelsCacheTime < CHANNELS_CACHE_TTL) {
    return channelsCache
  }
  channelsCache = await Channel.find({ isActive: true }).lean()
  channelsCacheTime = Date.now()
  return channelsCache
}

export async function subscriptionMiddleware(ctx: BotContext, next: () => Promise<void>) {
  if (!ctx.session?.user) return await next()
  const user = ctx.session.user

  if (user.isPremium && user.premiumUntil && user.premiumUntil > new Date()) {
    ctx.session.isPremium = true
    return await next()
  }
  if (user.premiumLifetime) {
    ctx.session.isPremium = true
    return await next()
  }

  if (user.lastSubscriptionCheck && Date.now() - new Date(user.lastSubscriptionCheck).getTime() < 300_000) {
    return await next()
  }

  const channels = await getActiveChannels()
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
    channelButtons.push([Markup.button.callback('⭐ Premium olish', 'premium')])
    channelButtons.push([Markup.button.callback('✅ Obuna bo\'ldim', 'check_subscription')])
    await ctx.reply(
      '📢 Botdan foydalanish uchun quyidagi kanallarga obuna bo\'ling:',
      Markup.inlineKeyboard(channelButtons)
    )
    return
  }

  ctx.session.isSubscribed = true
  try {
    const { default: User } = await import('../models/User')
    await User.updateOne({ telegramId: ctx.from!.id }, { $set: { lastSubscriptionCheck: new Date() } })
  } catch {}
  await next()
}
