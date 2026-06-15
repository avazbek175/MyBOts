import mongoose, { Schema, Document } from 'mongoose'
import { IUser } from '../types'

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    telegramId: { type: Number, required: true, unique: true, index: true },
    username: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    languageCode: { type: String },
    isPremium: { type: Boolean, default: false },
    premiumUntil: { type: Date },
    premiumLifetime: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ['owner', 'superadmin', 'admin', 'moderator', 'support', 'user'],
      default: 'user',
    },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
    lastActivity: { type: Date, default: Date.now },
    lastSubscriptionCheck: { type: Date },
  },
  { timestamps: true }
)

export default mongoose.model<IUserDocument>('User', userSchema)
