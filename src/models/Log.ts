import mongoose, { Schema, Document } from 'mongoose'
import { ILog } from '../types'

export interface ILogDocument extends ILog, Document {}

const logSchema = new Schema<ILogDocument>(
  {
    adminId: { type: Number, required: true, index: true },
    adminName: { type: String },
    action: { type: String, required: true, index: true },
    targetId: { type: String },
    targetName: { type: String },
    details: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  }
)

export default mongoose.model<ILogDocument>('Log', logSchema)
