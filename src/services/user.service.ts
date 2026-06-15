import User from '../models/User'
import { IUser } from '../types'
import { logger } from '../utils/logger'

export class UserService {
  static async findOrCreate(telegramId: number, data: Partial<IUser>): Promise<IUser> {
    const existing = await User.findOne({ telegramId })
    if (existing) {
      if (data.username !== undefined) existing.username = data.username
      if (data.firstName !== undefined) existing.firstName = data.firstName
      if (data.lastName !== undefined) existing.lastName = data.lastName
      if (data.languageCode !== undefined) existing.languageCode = data.languageCode
      existing.lastActivity = new Date()
      await existing.save()
      return existing.toObject()
    }
    const user = await User.create({
      telegramId,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      languageCode: data.languageCode,
      lastActivity: new Date(),
    })
    logger.info(`New user created: ${telegramId}`)
    return user.toObject()
  }

  static async getById(telegramId: number): Promise<IUser | null> {
    const user = await User.findOne({ telegramId })
    return user ? user.toObject() : null
  }

  static async getAll(page: number = 1, limit: number = 10): Promise<{ users: IUser[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit
    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(),
    ])
    return { users, total, page, totalPages: Math.ceil(total / limit) }
  }

  static async getCount(): Promise<number> {
    return User.countDocuments()
  }

  static async getTodayCount(): Promise<number> {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return User.countDocuments({ createdAt: { $gte: start } })
  }

  static async getWeeklyCount(): Promise<number> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return User.countDocuments({ createdAt: { $gte: weekAgo } })
  }

  static async getPremiumCount(): Promise<number> {
    return User.countDocuments({ isPremium: true })
  }

  static async getActiveCount(): Promise<number> {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return User.countDocuments({ lastActivity: { $gte: dayAgo } })
  }

  static async banUser(telegramId: number, reason: string): Promise<IUser | null> {
    const user = await User.findOneAndUpdate(
      { telegramId },
      { isBanned: true, banReason: reason },
      { new: true }
    )
    if (user) logger.warn(`User banned: ${telegramId} - ${reason}`)
    return user ? user.toObject() : null
  }

  static async unbanUser(telegramId: number): Promise<IUser | null> {
    const user = await User.findOneAndUpdate(
      { telegramId },
      { isBanned: false, $unset: { banReason: '' } },
      { new: true }
    )
    if (user) logger.info(`User unbanned: ${telegramId}`)
    return user ? user.toObject() : null
  }

  static async updatePremium(telegramId: number, plan: string): Promise<IUser | null> {
    const user = await User.findOne({ telegramId })
    if (!user) return null

    if (plan === 'lifetime' || plan === 'premium_lifetime') {
      user.isPremium = true
      user.premiumLifetime = true
      user.premiumUntil = undefined
    } else {
      const durationMatch = plan.match(/(\d+)/)
      if (!durationMatch) return null
      const days = parseInt(durationMatch[1]!)
      user.isPremium = true
      user.premiumLifetime = false
      user.premiumUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    }
    await user.save()
    logger.info(`Premium updated for ${telegramId}: ${plan}`)
    return user.toObject()
  }
}
