import mongoose, { Schema, Document } from 'mongoose'
import { IBroadcast } from '../types'

export interface IBroadcastDocument extends IBroadcast, Document {}

const broadcastSchema = new Schema<IBroadcastDocument>(
  {
    type: { type: String, enum: ['text', 'photo', 'video', 'audio', 'forward'], required: true },
    content: { type: String },
    mediaFileId: { type: String },
    totalSent: { type: Number, default: 0 },
    totalFailed: { type: Number, default: 0 },
    totalBlocked: { type: Number, default: 0 },
    sentTo: { type: [Number], default: [] },
    status: {
      type: String,
      enum: ['pending', 'sending', 'completed', 'cancelled'],
      default: 'pending',
    },
    scheduledFor: { type: Date },
    createdBy: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  }
)

export default mongoose.model<IBroadcastDocument>('Broadcast', broadcastSchema)
