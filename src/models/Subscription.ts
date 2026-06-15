import mongoose, { Schema, Document } from 'mongoose'
import { ISubscription } from '../types'

export interface ISubscriptionDocument extends ISubscription, Document {}

const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    userId: { type: Number, required: true, index: true },
    type: { type: String, enum: ['premium', 'channel'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  }
)

subscriptionSchema.index({ userId: 1, type: 1 })

export default mongoose.model<ISubscriptionDocument>('Subscription', subscriptionSchema)
