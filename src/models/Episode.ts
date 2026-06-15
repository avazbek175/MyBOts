import mongoose, { Schema, Document } from 'mongoose'
import { IEpisode } from '../types'

export interface IEpisodeDocument extends IEpisode, Document {}

const episodeSchema = new Schema<IEpisodeDocument>(
  {
    seasonId: { type: String, required: true, index: true },
    episodeNumber: { type: Number, required: true },
    title: { type: String },
    description: { type: String },
    fileId: { type: String, required: true },
    duration: { type: Number },
    views: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  }
)

episodeSchema.index({ seasonId: 1, episodeNumber: 1 })

export default mongoose.model<IEpisodeDocument>('Episode', episodeSchema)
