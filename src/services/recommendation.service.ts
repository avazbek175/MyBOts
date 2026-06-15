import WatchHistory from '../models/WatchHistory'
import Movie from '../models/Movie'
import { MovieService } from './movie.service'

export class RecommendationService {
  static async getForUser(userId: number, limit: number = 10): Promise<any[]> {
    const watched = await WatchHistory.find({ userId, contentType: 'movie' })
      .sort({ watchedAt: -1 })
      .lean()

    const watchedIds = watched.map((w) => w.contentId)
    const watchedMovies = await Movie.find({ _id: { $in: watchedIds } }).lean()
    const genres = new Set<string>()
    for (const m of watchedMovies) {
      if (m.genre) {
        for (const g of m.genre) {
          genres.add(g)
        }
      }
    }

    if (genres.size === 0 || watchedIds.length === 0) {
      return MovieService.getMostViewed(limit)
    }

    const recommendations = await Movie.find({
      _id: { $nin: watchedIds },
      isActive: true,
      genre: { $in: Array.from(genres) },
    })
      .sort({ rating: -1, views: -1 })
      .limit(limit)
      .lean()

    return recommendations
  }

  static async getTrending(limit: number = 10): Promise<any[]> {
    return MovieService.getTrending(7, limit)
  }

  static async getPopular(limit: number = 10): Promise<any[]> {
    return MovieService.getMostViewed(limit)
  }
}
