import mongoose, { Schema, Document } from 'mongoose'
import { ISeries } from '../types'

export interface ISeriesDocument extends ISeries, Document {}

const seriesSchema = new Schema<ISeriesDocument>(
  {
    seriesCode: { type: String, required: true, unique: true, index: true },
    seriesName: { type: String, required: true },
    description: { type: String },
    genre: { type: [String] },
    country: { type: String },
    year: { type: Number },
    rating: { type: Number },
    poster: { type: String },
    language: { type: String },
    isActive: { type: Boolean, default: true },
    totalSeasons: { type: Number, default: 0 },
    categoryId: { type: String },
  },
  { timestamps: true }
)

seriesSchema.index({ seriesName: 'text', description: 'text' })
seriesSchema.index({ genre: 'text' })

export default mongoose.model<ISeriesDocument>('Series', seriesSchema)
