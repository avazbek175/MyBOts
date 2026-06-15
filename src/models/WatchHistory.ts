import mongoose, { Schema, Document } from 'mongoose'
import { IWatchHistory } from '../types'

export interface IWatchHistoryDocument extends IWatchHistory, Document {}

const watchHistorySchema = new Schema<IWatchHistoryDocument>(
  {
    userId: { type: Number, required: true, index: true },
    contentId: { type: String, required: true },
    contentType: { type: String, enum: ['movie', 'series'], required: true },
    episodeId: { type: String },
    progress: { type: Number, default: 0 },
    watchedAt: { type: Date, default: Date.now },
  }
)

watchHistorySchema.index({ userId: 1, watchedAt: 1 })

export default mongoose.model<IWatchHistoryDocument>('WatchHistory', watchHistorySchema)
