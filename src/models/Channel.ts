import mongoose, { Schema, Document } from 'mongoose'
import { IChannel } from '../types'

export interface IChannelDocument extends IChannel, Document {}

const channelSchema = new Schema<IChannelDocument>(
  {
    channelId: { type: String, required: true, unique: true },
    channelName: { type: String, required: true },
    channelUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  }
)
channelSchema.index({ isActive: 1 })

export default mongoose.model<IChannelDocument>('Channel', channelSchema)
