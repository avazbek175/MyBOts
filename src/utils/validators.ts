import { z } from 'zod'
import { PREMIUM_PLANS } from '../config/constants'

export const movieCodeSchema = z.string().regex(/^[A-Z0-9]{3,10}$/, 'Code must be 3-10 uppercase alphanumeric characters')

export const movieInputSchema = z.object({
  movieName: z.string().min(1, 'Movie name is required').max(200, 'Movie name must be at most 200 characters'),
  description: z.string().max(2000, 'Description must be at most 2000 characters').optional(),
  genre: z.array(z.string()).optional(),
  country: z.string().optional(),
  year: z.number().int().min(1900, 'Year must be at least 1900').max(2030, 'Year must be at most 2030').optional(),
  duration: z.number().int().positive('Duration must be positive').optional(),
  rating: z.number().min(0, 'Rating must be at least 0').max(10, 'Rating must be at most 10').optional(),
  language: z.string().optional(),
})

export const seriesInputSchema = z.object({
  seriesName: z.string().min(1, 'Series name is required').max(200, 'Series name must be at most 200 characters'),
  description: z.string().max(2000, 'Description must be at most 2000 characters').optional(),
  genre: z.array(z.string()).optional(),
  country: z.string().optional(),
  year: z.number().int().min(1900, 'Year must be at least 1900').max(2030, 'Year must be at most 2030').optional(),
  rating: z.number().min(0, 'Rating must be at least 0').max(10, 'Rating must be at most 10').optional(),
  language: z.string().optional(),
})

export const paymentTypeSchema = z.enum(
  PREMIUM_PLANS.map((p) => p.key) as [string, ...string[]]
)

export const channelIdSchema = z.string().refine(
  (val) => val.startsWith('@') || /^\d+$/.test(val),
  'Channel ID must start with @ or be a numeric ID'
)
