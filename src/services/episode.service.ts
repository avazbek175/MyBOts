import Episode from '../models/Episode'
import Season from '../models/Season'
import { IEpisode } from '../types'
import { logger } from '../utils/logger'

export class EpisodeService {
  static async create(data: Partial<IEpisode>): Promise<IEpisode> {
    const episode = await Episode.create(data)
    await Season.findByIdAndUpdate(data.seasonId, { $inc: { totalEpisodes: 1 } })
    logger.info(`Episode created: ${data.seasonId} - Episode ${data.episodeNumber}`)
    return episode.toObject()
  }

  static async getById(id: string): Promise<IEpisode | null> {
    const episode = await Episode.findById(id)
    return episode ? episode.toObject() : null
  }

  static async getBySeason(seasonId: string, page: number = 1, limit: number = 10): Promise<{ episodes: IEpisode[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit
    const [episodes, total] = await Promise.all([
      Episode.find({ seasonId, isActive: true }).sort({ episodeNumber: 1 }).skip(skip).limit(limit).lean(),
      Episode.countDocuments({ seasonId, isActive: true }),
    ])
    return { episodes, total, page, totalPages: Math.ceil(total / limit) }
  }

  static async getByNumber(seasonId: string, episodeNumber: number): Promise<IEpisode | null> {
    const episode = await Episode.findOne({ seasonId, episodeNumber })
    return episode ? episode.toObject() : null
  }

  static async incrementViews(episodeId: string): Promise<void> {
    await Episode.findByIdAndUpdate(episodeId, { $inc: { views: 1 } })
  }

  static async update(id: string, data: Partial<IEpisode>): Promise<IEpisode | null> {
    const episode = await Episode.findByIdAndUpdate(id, data, { new: true })
    return episode ? episode.toObject() : null
  }

  static async delete(id: string): Promise<boolean> {
    const episode = await Episode.findById(id)
    if (!episode) return false

    await Season.findByIdAndUpdate(episode.seasonId, { $inc: { totalEpisodes: -1 } })
    await Episode.findByIdAndDelete(id)
    logger.info(`Episode deleted: ${id}`)
    return true
  }
}
