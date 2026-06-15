import Channel from '../models/Channel'
import { IChannel } from '../types'
import { cacheGet, cacheSet, cacheDel } from '../utils/cache'
import { logger } from '../utils/logger'
import { config } from '../config'

const CACHE_KEY = 'channels:all'

export class ChannelService {
  static async create(data: Partial<IChannel>): Promise<IChannel> {
    const channel = await Channel.create(data)
    await cacheDel(CACHE_KEY)
    logger.info(`Channel created: ${channel.channelName}`)
    return channel.toObject()
  }

  static async getAll(): Promise<IChannel[]> {
    const cached = await cacheGet<IChannel[]>(CACHE_KEY)
    if (cached) return cached

    const channels = await Channel.find({ isActive: true }).sort({ createdAt: -1 }).lean()
    await cacheSet(CACHE_KEY, channels, config.cache.ttl)
    return channels
  }

  static async getById(id: string): Promise<IChannel | null> {
    const channel = await Channel.findById(id)
    return channel ? channel.toObject() : null
  }

  static async update(id: string, data: Partial<IChannel>): Promise<IChannel | null> {
    const channel = await Channel.findByIdAndUpdate(id, data, { new: true })
    if (channel) {
      await cacheDel(CACHE_KEY)
    }
    return channel ? channel.toObject() : null
  }

  static async delete(id: string): Promise<boolean> {
    const result = await Channel.findByIdAndDelete(id)
    if (result) {
      await cacheDel(CACHE_KEY)
      logger.info(`Channel deleted: ${id}`)
      return true
    }
    return false
  }
}
