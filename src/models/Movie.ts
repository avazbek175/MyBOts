import mongoose, { Schema, Document } from 'mongoose'
import { IMovie } from '../types'

export interface IMovieDocument extends IMovie, Document {}

const movieSchema = new Schema<IMovieDocument>(
  {
    movieCode: { type: String, required: true, unique: true, index: true },
    movieName: { type: String, required: true },
    description: { type: String },
    genre: { type: [String] },
    country: { type: String },
    year: { type: Number, index: true },
    duration: { type: Number },
    rating: { type: Number },
    poster: { type: String },
    language: { type: String },
    fileId: { type: String, required: true },
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    categoryId: { type: String },
  },
  { timestamps: true }
)

movieSchema.index({ movieName: 'text', description: 'text' })
movieSchema.index({ genre: 'text' })

export default mongoose.model<IMovieDocument>('Movie', movieSchema)
