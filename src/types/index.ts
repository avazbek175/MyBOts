export interface IUser {
  telegramId: number
  username?: string
  firstName?: string
  lastName?: string
  languageCode?: string
  isPremium: boolean
  premiumUntil?: Date
  premiumLifetime: boolean
  role: 'owner' | 'superadmin' | 'admin' | 'moderator' | 'support' | 'user'
  isBanned: boolean
  banReason?: string
  lastActivity: Date
  createdAt: Date
  updatedAt: Date
}

export interface IMovie {
  movieCode: string
  movieName: string
  description?: string
  genre?: string[]
  country?: string
  year?: number
  duration?: number
  rating?: number
  poster?: string
  lang?: string
  fileId: string
  views: number
  downloads: number
  isActive: boolean
  categoryId?: string
  createdAt: Date
  updatedAt: Date
}

export interface ISeries {
  seriesCode: string
  seriesName: string
  description?: string
  genre?: string[]
  country?: string
  year?: number
  rating?: number
  poster?: string
  lang?: string
  isActive: boolean
  totalSeasons: number
  categoryId?: string
  createdAt: Date
  updatedAt: Date
}

export interface ISeason {
  seriesId: string
  seasonNumber: number
  title?: string
  totalEpisodes: number
  createdAt: Date
}

export interface IEpisode {
  seasonId: string
  episodeNumber: number
  title?: string
  description?: string
  fileId: string
  duration?: number
  views: number
  isActive: boolean
  createdAt: Date
}

export interface ICategory {
  name: string
  slug: string
  icon: string
  isActive: boolean
  order: number
  createdAt: Date
}

export interface IChannel {
  channelId: string
  channelName: string
  channelUrl: string
  isActive: boolean
  createdAt: Date
}

export interface ISubscription {
  userId: number
  type: 'premium' | 'channel'
  startDate: Date
  endDate: Date
  isActive: boolean
  createdAt: Date
}

export interface IPayment {
  userId: number
  type: string
  provider: 'telegram_stars'
  stars: number
  invoiceId?: string
  status: 'pending' | 'completed' | 'refunded' | 'failed'
  refundedAt?: Date
  createdAt: Date
}

export interface IFavorite {
  userId: number
  contentId: string
  contentType: 'movie' | 'series'
  createdAt: Date
}

export interface IWatchHistory {
  userId: number
  contentId: string
  contentType: 'movie' | 'series'
  episodeId?: string
  progress: number
  watchedAt: Date
}

export interface IBroadcast {
  type: 'text' | 'photo' | 'video' | 'audio' | 'forward'
  content?: string
  mediaFileId?: string
  totalSent: number
  totalFailed: number
  totalBlocked: number
  sentTo: number[]
  status: 'pending' | 'sending' | 'completed' | 'cancelled'
  scheduledFor?: Date
  createdBy: number
  createdAt: Date
}

export interface ILog {
  adminId: number
  adminName?: string
  action: string
  targetId?: string
  targetName?: string
  details?: string
  timestamp: Date
}

export interface ISetting {
  key: string
  value: string
  description?: string
  updatedAt: Date
}

export interface IAdmin {
  userId: number
  username?: string
  role: 'owner' | 'superadmin' | 'admin' | 'moderator' | 'support'
  permissions: string[]
  addedBy: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

import { Context } from 'telegraf'
export type BotContext = Context & { session?: any; match?: RegExpExecArray }
