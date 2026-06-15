import { BotContext } from '../types'

interface AntiSpamEntry {
  lastStart: number
  lastMessage: string
  lastMessageTime: number
}

const spamMap = new Map<number, AntiSpamEntry>()

setInterval(() => {
  const cutoff = Date.now() - 10000
  for (const [key, entry] of spamMap) {
    if (entry.lastMessageTime < cutoff && entry.lastStart < cutoff) {
      spamMap.delete(key)
    }
  }
}, 30000)

export async function antiSpamMiddleware(ctx: BotContext, next: () => Promise<void>) {
  if (!ctx.from) return await next()

  const userId = ctx.from.id
  const now = Date.now()

  let entry = spamMap.get(userId)
  if (!entry) {
    entry = { lastStart: 0, lastMessage: '', lastMessageTime: 0 }
    spamMap.set(userId, entry)
  }

  if (ctx.message && 'text' in ctx.message) {
    if (ctx.message.text === '/start') {
      if (now - entry.lastStart < 3000) {
        return
      }
      entry.lastStart = now
    }

    if (ctx.message.text !== '/start') {
      if (ctx.message.text === entry.lastMessage && now - entry.lastMessageTime < 1000) {
        return
      }
      entry.lastMessage = ctx.message.text
      entry.lastMessageTime = now
    }
  }

  await next()
}
