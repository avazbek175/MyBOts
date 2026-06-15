import Movie from '../models/Movie'
import WatchHistory from '../models/WatchHistory'
import { IMovie } from '../types'
import { cacheGet, cacheSet, cacheDelPattern } from '../utils/cache'
import { logger } from '../utils/logger'
import Fuse from 'fuse.js'
import { config } from '../config'

const CACHE_PREFIX = 'movies:'

export class MovieService {
  static async create(data: Partial<IMovie>): Promise<IMovie> {
    const movie = await Movie.create(data)
    await cacheDelPattern(`${CACHE_PREFIX}*`)
    logger.info(`Movie created: ${movie.movieCode}`)
    return movie.toObject()
  }

  static async getByCode(code: string): Promise<IMovie | null> {
    const cacheKey = `${CACHE_PREFIX}${code}`
    const cached = await cacheGet<IMovie>(cacheKey)
    if (cached) return cached

    const movie = await Movie.findOne({ movieCode: code })
    if (movie) {
      await cacheSet(cacheKey, movie.toObject(), config.cache.movieTtl)
    }
    return movie ? movie.toObject() : null
  }

  static async getById(id: string): Promise<IMovie | null> {
    const movie = await Movie.findById(id)
    return movie ? movie.toObject() : null
  }

  static async getAll(
    page: number = 1,
    limit: number = 10,
    filters?: { genre?: string; year?: number }
  ): Promise<{ movies: IMovie[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, unknown> = { isActive: true }
    if (filters?.genre) query.genre = { $in: [filters.genre] }
    if (filters?.year) query.year = filters.year

    const skip = (page - 1) * limit
    const [movies, total] = await Promise.all([
      Movie.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Movie.countDocuments(query),
    ])
    return { movies, total, page, totalPages: Math.ceil(total / limit) }
  }

  static async search(query: string, page: number = 1, limit: number = 10): Promise<{ movies: IMovie[]; total: number }> {
    const skip = (page - 1) * limit
    const [movies, total] = await Promise.all([
      Movie.find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .lean(),
      Movie.countDocuments({ $text: { $search: query } }),
    ])
    return { movies, total }
  }

  static async fuzzySearch(query: string): Promise<IMovie[]> {
    const movies = await Movie.find({ isActive: true }).lean()
    const fuse = new Fuse(movies, {
      keys: ['movieName'],
      threshold: 0.4,
      includeScore: true,
    })
    return fuse.search(query).map((r) => r.item)
  }

  static async incrementViews(movieCode: string): Promise<void> {
    await Movie.findOneAndUpdate({ movieCode }, { $inc: { views: 1 } })
  }

  static async incrementDownloads(movieCode: string): Promise<void> {
    await Movie.findOneAndUpdate({ movieCode }, { $inc: { downloads: 1 } })
  }

  static async getTopRated(limit: number = 10): Promise<IMovie[]> {
    const cacheKey = `${CACHE_PREFIX}top_rated`
    const cached = await cacheGet<IMovie[]>(cacheKey)
    if (cached) return cached

    const movies = await Movie.find({ isActive: true })
      .sort({ rating: -1 })
      .limit(limit)
      .lean()
    await cacheSet(cacheKey, movies, config.cache.topTtl)
    return movies
  }

  static async getMostViewed(limit: number = 10): Promise<IMovie[]> {
    const cacheKey = `${CACHE_PREFIX}most_viewed`
    const cached = await cacheGet<IMovie[]>(cacheKey)
    if (cached) return cached

    const movies = await Movie.find({ isActive: true })
      .sort({ views: -1 })
      .limit(limit)
      .lean()
    await cacheSet(cacheKey, movies, config.cache.topTtl)
    return movies
  }

  static async getTrending(days: number = 7, limit: number = 10): Promise<IMovie[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const aggregation = await WatchHistory.aggregate([
      { $match: { contentType: 'movie', watchedAt: { $gte: since } } },
      { $group: { _id: '$contentId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ])

    const contentIds = aggregation.map((a) => a._id)
    if (contentIds.length === 0) return []

    const movies = await Movie.find({ _id: { $in: contentIds } }).lean()
    const movieMap = new Map(movies.map((m) => [m._id.toString(), m]))
    return aggregation
      .map((a) => movieMap.get(a._id))
      .filter((m): m is NonNullable<typeof m> => m != null)
  }

  static async update(movieCode: string, data: Partial<IMovie>): Promise<IMovie | null> {
    const movie = await Movie.findOneAndUpdate({ movieCode }, data, { new: true })
    if (movie) {
      await cacheDelPattern(`${CACHE_PREFIX}*`)
    }
    return movie ? movie.toObject() : null
  }

  static async delete(movieCode: string): Promise<boolean> {
    const result = await Movie.findOneAndDelete({ movieCode })
    if (result) {
      await cacheDelPattern(`${CACHE_PREFIX}*`)
      logger.info(`Movie deleted: ${movieCode}`)
      return true
    }
    return false
  }

  static async getByCategory(categoryId: string, page: number = 1, limit: number = 10): Promise<{ movies: IMovie[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit
    const query = { categoryId, isActive: true }
    const [movies, total] = await Promise.all([
      Movie.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Movie.countDocuments(query),
    ])
    return { movies, total, page, totalPages: Math.ceil(total / limit) }
  }
}
