import Favorite from '../models/Favorite'
import Movie from '../models/Movie'
import Series from '../models/Series'
import { IFavorite } from '../types'
import { logger } from '../utils/logger'

export class FavoriteService {
  static async add(userId: number, contentId: string, contentType: 'movie' | 'series'): Promise<IFavorite | null> {
    const existing = await Favorite.findOne({ userId, contentId })
    if (existing) return existing.toObject()

    const fav = await Favorite.create({ userId, contentId, contentType })
    logger.info(`Favorite added: user ${userId} - ${contentType} ${contentId}`)
    return fav.toObject()
  }

  static async remove(userId: number, contentId: string): Promise<boolean> {
    const result = await Favorite.findOneAndDelete({ userId, contentId })
    if (result) {
      logger.info(`Favorite removed: user ${userId} - ${contentId}`)
      return true
    }
    return false
  }

  static async getAll(userId: number, page: number = 1, limit: number = 10): Promise<{
    favorites: any[]
    total: number
    page: number
    totalPages: number
  }> {
    const skip = (page - 1) * limit
    const [favs, total] = await Promise.all([
      Favorite.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Favorite.countDocuments({ userId }),
    ])

    const movieIds = favs.filter((f) => f.contentType === 'movie').map((f) => f.contentId)
    const seriesIds = favs.filter((f) => f.contentType === 'series').map((f) => f.contentId)

    const [movies, seriesList] = await Promise.all([
      movieIds.length > 0 ? Movie.find({ _id: { $in: movieIds } }).lean() : [],
      seriesIds.length > 0 ? Series.find({ _id: { $in: seriesIds } }).lean() : [],
    ])

    const movieMap = new Map(movies.map((m) => [m._id.toString(), m]))
    const seriesMap = new Map(seriesList.map((s) => [s._id.toString(), s]))

    const favorites = favs.map((f) => ({
      ...f,
      content: f.contentType === 'movie' ? movieMap.get(f.contentId) : seriesMap.get(f.contentId),
    }))

    return { favorites, total, page, totalPages: Math.ceil(total / limit) }
  }

  static async isFavorite(userId: number, contentId: string): Promise<boolean> {
    const fav = await Favorite.findOne({ userId, contentId })
    return fav !== null
  }

  static async getCount(userId: number): Promise<number> {
    return Favorite.countDocuments({ userId })
  }
}
