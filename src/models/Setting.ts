import mongoose, { Schema, Document } from 'mongoose'
import { ISetting } from '../types'

export interface ISettingDocument extends ISetting, Document {}

const settingSchema = new Schema<ISettingDocument>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    description: { type: String },
    updatedAt: { type: Date, default: Date.now },
  }
)

export default mongoose.model<ISettingDocument>('Setting', settingSchema)
