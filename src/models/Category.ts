import mongoose, { Schema, Document } from 'mongoose'
import { ICategory } from '../types'

export interface ICategoryDocument extends ICategory, Document {}

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    icon: { type: String, default: '📁' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  }
)

export default mongoose.model<ICategoryDocument>('Category', categorySchema)
