import mongoose, { Schema, Document } from 'mongoose'
import { ISeason } from '../types'

export interface ISeasonDocument extends ISeason, Document {}

const seasonSchema = new Schema<ISeasonDocument>(
  {
    seriesId: { type: String, required: true, index: true },
    seasonNumber: { type: Number, required: true },
    title: { type: String },
    totalEpisodes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  }
)

seasonSchema.index({ seriesId: 1, seasonNumber: 1 })

export default mongoose.model<ISeasonDocument>('Season', seasonSchema)
