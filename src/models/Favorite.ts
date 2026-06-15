import mongoose, { Schema, Document } from 'mongoose'
import { IFavorite } from '../types'

export interface IFavoriteDocument extends IFavorite, Document {}

const favoriteSchema = new Schema<IFavoriteDocument>(
  {
    userId: { type: Number, required: true, index: true },
    contentId: { type: String, required: true },
    contentType: { type: String, enum: ['movie', 'series'], required: true },
    createdAt: { type: Date, default: Date.now },
  }
)

favoriteSchema.index({ userId: 1, contentId: 1 }, { unique: true })

export default mongoose.model<IFavoriteDocument>('Favorite', favoriteSchema)
