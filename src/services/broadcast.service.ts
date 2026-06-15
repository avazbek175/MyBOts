import Broadcast from '../models/Broadcast'
import User from '../models/User'
import { IBroadcast } from '../types'
import { splitArray } from '../utils/helpers'
import { logger } from '../utils/logger'
import { Telegraf } from 'telegraf'

export class BroadcastService {
  static async createBroadcast(
    type: IBroadcast['type'],
    content?: string,
    mediaFileId?: string,
    scheduledFor?: Date,
    createdBy: number = 0
  ): Promise<IBroadcast> {
    const broadcast = await Broadcast.create({
      type,
      content,
      mediaFileId,
      scheduledFor,
      status: 'pending',
      createdBy,
    })
    logger.info(`Broadcast created: ${broadcast._id} (${type})`)
    return broadcast.toObject()
  }

  static async sendToAllUsers(bot: Telegraf, broadcastId: string): Promise<void> {
    const broadcast = await Broadcast.findById(broadcastId)
    if (!broadcast || broadcast.status === 'cancelled') return

    broadcast.status = 'sending'
    await broadcast.save()

    const users = await User.find({ isBanned: false }).sort({ createdAt: -1 }).lean()
    const batches = splitArray(users, 30)

    let sent = 0
    let failed = 0
    let blocked = 0

    for (const batch of batches) {
      for (const user of batch) {
        if ((broadcast as any).status === 'cancelled') break
        try {
          const chatId = user.telegramId
          switch (broadcast.type) {
            case 'text':
              await bot.telegram.sendMessage(chatId, broadcast.content!, { parse_mode: 'HTML' })
              break
            case 'photo':
              await bot.telegram.sendPhoto(chatId, broadcast.mediaFileId!, {
                caption: broadcast.content,
                parse_mode: 'HTML',
              })
              break
            case 'video':
              await bot.telegram.sendVideo(chatId, broadcast.mediaFileId!, {
                caption: broadcast.content,
                parse_mode: 'HTML',
              })
              break
            case 'audio':
              await bot.telegram.sendAudio(chatId, broadcast.mediaFileId!, {
                caption: broadcast.content,
                parse_mode: 'HTML',
              })
              break
            case 'forward':
              if (broadcast.mediaFileId) {
                await bot.telegram.sendMessage(chatId, broadcast.mediaFileId)
              }
              break
          }
          sent++
          broadcast.sentTo.push(user.telegramId)
        } catch (err: any) {
          if (err?.response?.error_code === 403) {
            blocked++
          } else {
            failed++
          }
        }
      }

      if ((broadcast as any).status === 'cancelled') break
    }

    broadcast.totalSent = sent
    broadcast.totalFailed = failed
    broadcast.totalBlocked = blocked
    broadcast.status = (broadcast as any).status === 'cancelled' ? 'cancelled' : 'completed'
    await broadcast.save()
    logger.info(`Broadcast ${broadcastId} completed: sent=${sent}, failed=${failed}, blocked=${blocked}`)
  }

  static async cancelBroadcast(broadcastId: string): Promise<IBroadcast | null> {
    const broadcast = await Broadcast.findByIdAndUpdate(
      broadcastId,
      { status: 'cancelled' },
      { new: true }
    )
    if (broadcast) {
      logger.info(`Broadcast cancelled: ${broadcastId}`)
    }
    return broadcast ? broadcast.toObject() : null
  }

  static async getBroadcasts(page: number = 1, limit: number = 10): Promise<{ broadcasts: IBroadcast[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit
    const [broadcasts, total] = await Promise.all([
      Broadcast.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Broadcast.countDocuments(),
    ])
    return { broadcasts, total, page, totalPages: Math.ceil(total / limit) }
  }

  static async getStats(broadcastId: string): Promise<{ sent: number; failed: number; blocked: number; status: string } | null> {
    const broadcast = await Broadcast.findById(broadcastId)
    if (!broadcast) return null
    return {
      sent: broadcast.totalSent,
      failed: broadcast.totalFailed,
      blocked: broadcast.totalBlocked,
      status: broadcast.status,
    }
  }
}
