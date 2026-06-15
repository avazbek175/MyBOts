import WatchHistory from '../models/WatchHistory'
import { IWatchHistory } from '../types'

export class WatchHistoryService {
  static async add(userId: number, contentId: string, contentType: 'movie' | 'series', progress: number = 0): Promise<IWatchHistory> {
    const entry = await WatchHistory.findOneAndUpdate(
      { userId, contentId, contentType },
      { progress, watchedAt: new Date() },
      { upsert: true, new: true }
    )
    return entry.toObject()
  }

  static async getRecent(userId: number, limit: number = 10): Promise<IWatchHistory[]> {
    return WatchHistory.find({ userId })
      .sort({ watchedAt: -1 })
      .limit(limit)
      .lean()
  }

  static async getAll(userId: number, page: number = 1, limit: number = 10): Promise<{ history: IWatchHistory[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit
    const [history, total] = await Promise.all([
      WatchHistory.find({ userId }).sort({ watchedAt: -1 }).skip(skip).limit(limit).lean(),
      WatchHistory.countDocuments({ userId }),
    ])
    return { history, total, page, totalPages: Math.ceil(total / limit) }
  }

  static async clear(userId: number): Promise<void> {
    await WatchHistory.deleteMany({ userId })
  }

  static async getTrendingContent(days: number = 7, limit: number = 10): Promise<{ contentId: string; contentType: string; count: number }[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const result = await WatchHistory.aggregate([
      { $match: { watchedAt: { $gte: since } } },
      { $group: { _id: { contentId: '$contentId', contentType: '$contentType' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ])
    return result.map((r) => ({
      contentId: r._id.contentId,
      contentType: r._id.contentType,
      count: r.count,
    }))
  }
}
