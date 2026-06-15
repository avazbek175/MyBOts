import mongoose, { Schema, Document } from 'mongoose'
import { IAdmin } from '../types'

export interface IAdminDocument extends IAdmin, Document {}

const adminSchema = new Schema<IAdminDocument>(
  {
    userId: { type: Number, required: true, unique: true, index: true },
    username: { type: String },
    role: {
      type: String,
      enum: ['owner', 'superadmin', 'admin', 'moderator', 'support'],
      default: 'admin',
    },
    permissions: { type: [String], default: [] },
    addedBy: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.model<IAdminDocument>('Admin', adminSchema)
