import Series from '../models/Series'
import Season from '../models/Season'
import Episode from '../models/Episode'
import WatchHistory from '../models/WatchHistory'
import { ISeries } from '../types'
import { cacheGet, cacheSet, cacheDelPattern } from '../utils/cache'
import { logger } from '../utils/logger'
import Fuse from 'fuse.js'
import { config } from '../config'

const CACHE_PREFIX = 'series:'

export class SeriesService {
  static async create(data: Partial<ISeries>): Promise<ISeries> {
    const series = await Series.create(data)
    logger.info(`Series created: ${series.seriesCode}`)
    return series.toObject()
  }

  static async getByCode(code: string): Promise<ISeries | null> {
    const cacheKey = `${CACHE_PREFIX}${code}`
    const cached = await cacheGet<ISeries>(cacheKey)
    if (cached) return cached

    const series = await Series.findOne({ seriesCode: code })
    if (series) {
      await cacheSet(cacheKey, series.toObject(), config.cache.movieTtl)
    }
    return series ? series.toObject() : null
  }

  static async getById(id: string): Promise<ISeries | null> {
    const series = await Series.findById(id)
    return series ? series.toObject() : null
  }

  static async getAll(page: number = 1, limit: number = 10): Promise<{ seriesList: ISeries[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit
    const [seriesList, total] = await Promise.all([
      Series.find({ isActive: true }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Series.countDocuments({ isActive: true }),
    ])
    return { seriesList, total, page, totalPages: Math.ceil(total / limit) }
  }

  static async search(query: string): Promise<ISeries[]> {
    return Series.find({ $text: { $search: query }, isActive: true })
      .sort({ score: { $meta: 'textScore' } })
      .lean()
  }

  static async fuzzySearch(query: string): Promise<ISeries[]> {
    const seriesList = await Series.find({ isActive: true }).lean()
    const fuse = new Fuse(seriesList, {
      keys: ['seriesName'],
      threshold: 0.4,
      includeScore: true,
    })
    return fuse.search(query).map((r) => r.item)
  }

  static async incrementViews(seriesId: string): Promise<void> {
    await Series.findByIdAndUpdate(seriesId, { $inc: { views: 1 } })
  }

  static async getTopRated(limit: number = 10): Promise<ISeries[]> {
    const cacheKey = `${CACHE_PREFIX}top_rated`
    const cached = await cacheGet<ISeries[]>(cacheKey)
    if (cached) return cached

    const seriesList = await Series.find({ isActive: true })
      .sort({ rating: -1 })
      .limit(limit)
      .lean()
    await cacheSet(cacheKey, seriesList, config.cache.topTtl)
    return seriesList
  }

  static async getMostViewed(limit: number = 10): Promise<ISeries[]> {
    const cacheKey = `${CACHE_PREFIX}most_viewed`
    const cached = await cacheGet<ISeries[]>(cacheKey)
    if (cached) return cached

    const seriesList = await Series.find({ isActive: true })
      .sort({ views: -1 })
      .limit(limit)
      .lean()
    await cacheSet(cacheKey, seriesList, config.cache.topTtl)
    return seriesList
  }

  static async getTrending(days: number = 7, limit: number = 10): Promise<ISeries[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const aggregation = await WatchHistory.aggregate([
      { $match: { contentType: 'series', watchedAt: { $gte: since } } },
      { $group: { _id: '$contentId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ])

    const contentIds = aggregation.map((a) => a._id)
    if (contentIds.length === 0) return []

    const seriesList = await Series.find({ _id: { $in: contentIds } }).lean()
    const seriesMap = new Map(seriesList.map((s) => [s._id.toString(), s]))
    return aggregation
      .map((a) => seriesMap.get(a._id))
      .filter((s): s is NonNullable<typeof s> => s != null)
  }

  static async update(seriesCode: string, data: Partial<ISeries>): Promise<ISeries | null> {
    const series = await Series.findOneAndUpdate({ seriesCode }, data, { new: true })
    if (series) {
      await cacheDelPattern(`${CACHE_PREFIX}*`)
    }
    return series ? series.toObject() : null
  }

  static async delete(seriesCode: string): Promise<boolean> {
    const result = await Series.findOneAndDelete({ seriesCode })
    if (result) {
      await cacheDelPattern(`${CACHE_PREFIX}*`)
      logger.info(`Series deleted: ${seriesCode}`)
      return true
    }
    return false
  }

  static async getSeasons(seriesId: string): Promise<any[]> {
    return Season.find({ seriesId }).sort({ seasonNumber: 1 }).lean()
  }

  static async getEpisodes(seasonId: string, page: number = 1, limit: number = 10): Promise<{ episodes: any[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit
    const [episodes, total] = await Promise.all([
      Episode.find({ seasonId, isActive: true }).sort({ episodeNumber: 1 }).skip(skip).limit(limit).lean(),
      Episode.countDocuments({ seasonId, isActive: true }),
    ])
    return { episodes, total, page, totalPages: Math.ceil(total / limit) }
  }
}
