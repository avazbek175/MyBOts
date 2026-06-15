import mongoose from 'mongoose'
import Movie from '../models/Movie'
import Series from '../models/Series'
import Payment from '../models/Payment'
import { getRedis } from '../config/redis'
import { UserService } from './user.service'

export class StatsService {
  static async getDashboardStats(): Promise<{
    totalUsers: number
    todayUsers: number
    weeklyUsers: number
    premiumUsers: number
    activeUsers: number
    totalMovies: number
    totalSeries: number
    totalViews: number
    totalRevenue: number
  }> {
    const [
      totalUsers,
      todayUsers,
      weeklyUsers,
      premiumUsers,
      activeUsers,
      totalMovies,
      totalSeries,
      revenueResult,
    ] = await Promise.all([
      UserService.getCount(),
      UserService.getTodayCount(),
      UserService.getWeeklyCount(),
      UserService.getPremiumCount(),
      UserService.getActiveCount(),
      Movie.countDocuments({ isActive: true }),
      Series.countDocuments({ isActive: true }),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$stars' } } },
      ]),
    ])

    const movieViewsResult = await Movie.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } },
    ])

    const totalViews = movieViewsResult[0]?.total ?? 0
    const totalRevenue = revenueResult[0]?.total ?? 0

    return {
      totalUsers,
      todayUsers,
      weeklyUsers,
      premiumUsers,
      activeUsers,
      totalMovies,
      totalSeries,
      totalViews,
      totalRevenue,
    }
  }

  static async getSystemHealth(): Promise<{
    mongodb: string
    redis: string
    uptime: number
  }> {
    let mongodbStatus = 'disconnected'
    let redisStatus = 'disconnected'

    try {
      const state = mongoose.connection.readyState
      mongodbStatus = state === 1 ? 'connected' : state === 2 ? 'connecting' : 'disconnected'
    } catch {
      mongodbStatus = 'error'
    }

    try {
      const redis = getRedis()
      const pong = await redis.ping()
      redisStatus = pong === 'PONG' ? 'connected' : 'error'
    } catch {
      redisStatus = 'error'
    }

    return {
      mongodb: mongodbStatus,
      redis: redisStatus,
      uptime: process.uptime(),
    }
  }

  static async getTopMovies(limit: number = 10): Promise<any[]> {
    return Movie.find({ isActive: true })
      .sort({ views: -1 })
      .limit(limit)
      .lean()
  }

  static async getTopSeries(limit: number = 10): Promise<any[]> {
    return Series.find({ isActive: true })
      .sort({ views: -1 })
      .limit(limit)
      .lean()
  }
}
