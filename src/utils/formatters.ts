import { IMovie, ISeries, IEpisode, IUser } from '../types'
import { PREMIUM_PLANS } from '../config/constants'
import { formatNumber, formatDuration } from './helpers'

export type PremiumPlan = (typeof PREMIUM_PLANS)[number]

export function formatMovieInfo(movie: IMovie): string {
  return [
    `🎬 ${movie.movieName}`,
    movie.description ? `📝 ${movie.description}` : null,
    `🏷 Kod: ${movie.movieCode}`,
    movie.genre?.length ? `🎭 Janr: ${movie.genre.join(', ')}` : null,
    movie.country ? `🌍 Davlat: ${movie.country}` : null,
    movie.year ? `📆 Yil: ${movie.year}` : null,
    movie.duration ? `⏱ Davomiyligi: ${formatDuration(movie.duration)}` : null,
    movie.rating ? `⭐ Reyting: ${movie.rating}` : null,
    movie.language ? `🗣 Til: ${movie.language}` : null,
    `👁 Ko'rishlar: ${formatNumber(movie.views)}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function formatSeriesInfo(series: ISeries): string {
  return [
    `🎞 ${series.seriesName}`,
    series.description ? `📝 ${series.description}` : null,
    `🏷 Kod: ${series.seriesCode}`,
    series.genre?.length ? `🎭 Janr: ${series.genre.join(', ')}` : null,
    series.country ? `🌍 Davlat: ${series.country}` : null,
    series.year ? `📆 Yil: ${series.year}` : null,
    series.rating ? `⭐ Reyting: ${series.rating}` : null,
    series.language ? `🗣 Til: ${series.language}` : null,
    `📦 Fasllar: ${series.totalSeasons}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function formatEpisodeInfo(episode: IEpisode, seriesName: string): string {
  return [
    `📺 ${seriesName} - ${episode.episodeNumber}-qism`,
    episode.title ? `📝 ${episode.title}` : null,
    episode.description ? `📋 ${episode.description}` : null,
    episode.duration ? `⏱ Davomiyligi: ${formatDuration(episode.duration)}` : null,
    `👁 Ko'rishlar: ${formatNumber(episode.views)}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function formatProfileInfo(user: IUser): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User'
  const premiumBadge = user.isPremium
    ? user.premiumLifetime
      ? '💎 <b>Lifetime Premium</b>'
      : `💎 <b>Premium</b> — ${formatDate(user.premiumUntil!)}`
    : '⭐ Free user'

  return [
    `👤 <b>${escapeHtml(name)}</b>`,
    `🆔 ID: <code>${user.telegramId}</code>`,
    user.username ? `📛 @${user.username}` : null,
    `🎭 Rol: <b>${user.role}</b>`,
    `${premiumBadge}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function formatPremiumInfo(plan: PremiumPlan): string {
  const durationText =
    plan.unit === 'lifetime' ? 'Butun umr' : `${plan.duration} ${plan.unit === 'days' ? 'kun' : ''}`

  return [
    `${plan.label}`,
    `💰 Narxi: ${plan.stars} ⭐`,
    `⏱ Muddati: ${durationText}`,
  ].join('\n')
}

export function formatStats(stats: any): string {
  return [
    `📊 <b>Bot statistikasi</b>`,
    '',
    `👥 Foydalanuvchilar: <b>${formatNumber(stats.totalUsers || 0)}</b>`,
    `🎬 Kinolar: <b>${formatNumber(stats.totalMovies || 0)}</b>`,
    `🎞 Seriallar: <b>${formatNumber(stats.totalSeries || 0)}</b>`,
    `💎 Premium: <b>${formatNumber(stats.totalPremium || 0)}</b>`,
    `⭐ To'lovlar: <b>${formatNumber(stats.totalPayments || 0)}</b>`,
    `👁 Ko'rishlar: <b>${formatNumber(stats.totalViews || 0)}</b>`,
  ].join('\n')
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
