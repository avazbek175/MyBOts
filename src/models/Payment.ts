import mongoose, { Schema, Document } from 'mongoose'
import { IPayment } from '../types'

export interface IPaymentDocument extends IPayment, Document {}

const paymentSchema = new Schema<IPaymentDocument>(
  {
    userId: { type: Number, required: true, index: true },
    type: { type: String, required: true },
    provider: { type: String, enum: ['telegram_stars'], default: 'telegram_stars' },
    stars: { type: Number, required: true },
    invoiceId: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'refunded', 'failed'],
      default: 'pending',
    },
    refundedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  }
)

paymentSchema.index({ invoiceId: 1 })

export default mongoose.model<IPaymentDocument>('Payment', paymentSchema)
