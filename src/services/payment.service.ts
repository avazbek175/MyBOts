import Payment from '../models/Payment'
import { IPayment } from '../types'
import { SubscriptionService } from './subscription.service'
import { logger } from '../utils/logger'

export class PaymentService {
  static async createPayment(userId: number, type: string, stars: number): Promise<IPayment> {
    const payment = await Payment.create({
      userId,
      type,
      provider: 'telegram_stars',
      stars,
      status: 'pending',
    })
    logger.info(`Payment created for user ${userId}: ${stars} stars (${type})`)
    return payment.toObject()
  }

  static async completePayment(invoiceId: string): Promise<IPayment | null> {
    const payment = await Payment.findOneAndUpdate(
      { invoiceId },
      { status: 'completed' },
      { new: true }
    )
    if (!payment) return null

    await SubscriptionService.createPremium(payment.userId, payment.type)
    logger.info(`Payment completed: ${invoiceId} for user ${payment.userId}`)
    return payment.toObject()
  }

  static async refundPayment(invoiceId: string): Promise<IPayment | null> {
    const payment = await Payment.findOneAndUpdate(
      { invoiceId },
      { status: 'refunded', refundedAt: new Date() },
      { new: true }
    )
    if (!payment) return null

    await SubscriptionService.cancelSubscription(payment.userId)
    logger.info(`Payment refunded: ${invoiceId} for user ${payment.userId}`)
    return payment.toObject()
  }

  static async getUserPayments(userId: number, page: number = 1, limit: number = 10): Promise<{ payments: IPayment[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit
    const [payments, total] = await Promise.all([
      Payment.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments({ userId }),
    ])
    return { payments, total, page, totalPages: Math.ceil(total / limit) }
  }

  static async getAllPayments(page: number = 1, limit: number = 10): Promise<{ payments: IPayment[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit
    const [payments, total] = await Promise.all([
      Payment.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments(),
    ])
    return { payments, total, page, totalPages: Math.ceil(total / limit) }
  }

  static async getTotalRevenue(): Promise<number> {
    const result = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$stars' } } },
    ])
    return result[0]?.total ?? 0
  }

  static async getStarsRevenue(): Promise<number> {
    return this.getTotalRevenue()
  }

  static async getRefundHistory(): Promise<IPayment[]> {
    return Payment.find({ status: 'refunded' }).sort({ refundedAt: -1 }).lean()
  }
}
