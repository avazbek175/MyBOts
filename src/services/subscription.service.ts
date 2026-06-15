import Subscription from '../models/Subscription'
import User from '../models/User'
import { ISubscription } from '../types'
import { logger } from '../utils/logger'

export class SubscriptionService {
  static async createPremium(userId: number, plan: string): Promise<ISubscription | null> {
    const user = await User.findOne({ telegramId: userId })
    if (!user) return null

    const isLifetime = plan === 'lifetime' || plan === 'premium_lifetime'
    const now = new Date()

    if (isLifetime) {
      user.isPremium = true
      user.premiumLifetime = true
      user.premiumUntil = undefined
      await user.save()

      const sub = await Subscription.create({
        userId,
        type: 'premium',
        startDate: now,
        endDate: new Date('2100-01-01'),
        isActive: true,
      })
      logger.info(`Lifetime premium created for user ${userId}`)
      return sub.toObject()
    }

    const durationMatch = plan.match(/(\d+)/)
    if (!durationMatch) return null
    const days = parseInt(durationMatch[1]!)
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    user.isPremium = true
    user.premiumLifetime = false
    user.premiumUntil = endDate
    await user.save()

    const sub = await Subscription.create({
      userId,
      type: 'premium',
      startDate: now,
      endDate,
      isActive: true,
    })
    logger.info(`Premium created for user ${userId}: ${days} days`)
    return sub.toObject()
  }

  static async getActive(userId: number): Promise<ISubscription[]> {
    const subscriptions = await Subscription.find({
      userId,
      type: 'premium',
      isActive: true,
      endDate: { $gte: new Date() },
    }).lean()
    return subscriptions
  }

  static async isPremium(userId: number): Promise<boolean> {
    const user = await User.findOne({ telegramId: userId })
    if (!user) return false
    if (!user.isPremium) return false
    if (user.premiumLifetime) return true
    if (user.premiumUntil && user.premiumUntil > new Date()) return true
    if (user.premiumUntil && user.premiumUntil <= new Date()) {
      user.isPremium = false
      user.premiumUntil = undefined
      await user.save()
      await Subscription.updateMany(
        { userId, type: 'premium', isActive: true },
        { isActive: false }
      )
      return false
    }
    return false
  }

  static async getExpiringSoon(days: number): Promise<ISubscription[]> {
    const target = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    return Subscription.find({
      type: 'premium',
      isActive: true,
      endDate: { $lte: target, $gte: new Date() },
    }).lean()
  }

  static async cancelSubscription(userId: number): Promise<boolean> {
    const user = await User.findOne({ telegramId: userId })
    if (user) {
      user.isPremium = false
      user.premiumLifetime = false
      user.premiumUntil = undefined
      await user.save()
    }

    const result = await Subscription.updateMany(
      { userId, type: 'premium', isActive: true },
      { isActive: false }
    )
    logger.info(`Subscription cancelled for user ${userId}`)
    return result.modifiedCount > 0
  }
}
