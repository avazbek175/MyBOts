import { BotContext } from '../types'
import { StatsService } from '../services/stats.service'
import { MovieService } from '../services/movie.service'
import { SeriesService } from '../services/series.service'
import { RecommendationService } from '../services/recommendation.service'
import { formatStats } from '../utils/formatters'
import { formatNumber } from '../utils/helpers'
import { EMOJIS } from '../config/constants'
import { logger } from '../utils/logger'

export async function handleStats(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const stats = await StatsService.getDashboardStats()
    const text = formatStats(stats)

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: statsMainKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleStats error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleDetailedStats(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const stats = await StatsService.getDashboardStats()
    const health = await StatsService.getSystemHealth()

    const text = [
      `${EMOJIS.stats} <b>Batafsil statistika</b>\n\n`,
      `👥 <b>Foydalanuvchilar:</b>\n`,
      `  Jami: ${formatNumber(stats.totalUsers)}\n`,
      `  Bugun: ${formatNumber(stats.todayUsers)}\n`,
      `  Haftalik: ${formatNumber(stats.weeklyUsers)}\n`,
      `  Faol (24 soat): ${formatNumber(stats.activeUsers)}\n`,
      `  Premium: ${formatNumber(stats.premiumUsers)}\n\n`,
      `🎬 <b>Kontent:</b>\n`,
      `  Kinolar: ${formatNumber(stats.totalMovies)}\n`,
      `  Seriallar: ${formatNumber(stats.totalSeries)}\n`,
      `  Jami ko'rishlar: ${formatNumber(stats.totalViews)}\n\n`,
      `💰 <b>Daromad:</b>\n`,
      `  Jami: ${formatNumber(stats.totalRevenue)} ⭐\n\n`,
      `⚙️ <b>Tizim holati:</b>\n`,
      `  MongoDB: ${health.mongodb === 'connected' ? `${EMOJIS.check} Ulangan` : `${EMOJIS.cross} Uzilgan`}\n`,
      `  Redis: ${health.redis === 'connected' ? `${EMOJIS.check} Ulangan` : `${EMOJIS.cross} Uzilgan`}\n`,
      `  Ishlash vaqti: ${Math.floor(health.uptime / 3600)} soat ${Math.floor((health.uptime % 3600) / 60)} min`,
    ].join('')

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: `${EMOJIS.back} Orqaga`, callback_data: 'back' }]] },
    })
  } catch (error) {
    logger.error(error, 'handleDetailedStats error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleTopMovies(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const movies = await MovieService.getMostViewed(10)

    if (movies.length === 0) {
      await ctx.editMessageText(`${EMOJIS.top} Top kinolar mavjud emas.`)
      return
    }

    const lines = movies.map((m, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
      return `${medal} ${EMOJIS.movie} <b>${m.movieName}</b>\n` +
        `   Kod: <code>${m.movieCode}</code> | Reyting: ${m.rating || 'N/A'}⭐ | ${EMOJIS.views} ${formatNumber(m.views)}`
    })

    const text = `${EMOJIS.top} <b>Top 10 kinolar</b>\n\n${lines.join('\n')}`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: `${EMOJIS.back} Orqaga`, callback_data: 'back' }]] },
    })
  } catch (error) {
    logger.error(error, 'handleTopMovies error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleTopSeries(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const seriesList = await SeriesService.getMostViewed(10)

    if (seriesList.length === 0) {
      await ctx.editMessageText(`${EMOJIS.top} Top seriallar mavjud emas.`)
      return
    }

    const lines = seriesList.map((s, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
      return `${medal} ${EMOJIS.series} <b>${s.seriesName}</b>\n` +
        `   Kod: <code>${s.seriesCode}</code> | Reyting: ${s.rating || 'N/A'}⭐ | ${s.totalSeasons} fasl`
    })

    const text = `${EMOJIS.top} <b>Top 10 seriallar</b>\n\n${lines.join('\n')}`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: `${EMOJIS.back} Orqaga`, callback_data: 'back' }]] },
    })
  } catch (error) {
    logger.error(error, 'handleTopSeries error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleTrending(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const text = `${EMOJIS.trending} <b>Trenddagi kontent</b>\n\nDavrni tanlang:`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: trendingPeriodKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleTrending error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleTrendingPeriod(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''

    let days = 7
    if (data === 'trending_30d') days = 30

    const movies = await MovieService.getTrending(days, 10)
    const seriesList = await SeriesService.getTrending(days, 10)

    const periodText = days === 7 ? '7 kun' : '30 kun'

    if (movies.length === 0 && seriesList.length === 0) {
      await ctx.editMessageText(`${EMOJIS.trending} So'nggi ${periodText} ichida trend ma'lumotlari mavjud emas.`)
      return
    }

    const parts: string[] = [`${EMOJIS.trending} <b>Trend (${periodText})</b>\n`]

    if (movies.length > 0) {
      parts.push(`\n${EMOJIS.movie} <b>Kinolar:</b>`)
      movies.slice(0, 5).forEach((m, i) => {
        parts.push(`${i + 1}. ${m.movieName} | ${EMOJIS.views} ${formatNumber(m.views)}`)
      })
    }

    if (seriesList.length > 0) {
      parts.push(`\n${EMOJIS.series} <b>Seriallar:</b>`)
      seriesList.slice(0, 5).forEach((s, i) => {
        parts.push(`${i + 1}. ${s.seriesName}`)
      })
    }

    await ctx.editMessageText(parts.join('\n'), {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: `${EMOJIS.back} Orqaga`, callback_data: 'back' }]] },
    })
  } catch (error) {
    logger.error(error, 'handleTrendingPeriod error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleRecommendations(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const userId = ctx.from?.id
    if (!userId) return

    const recommendations = await RecommendationService.getForUser(userId, 10)

    if (recommendations.length === 0) {
      await ctx.editMessageText(
        `${EMOJIS.recommend} Hozircha tavsiyalar mavjud emas.\n\n` +
        `Ko'proq kino tomosha qiling, shunda sizga mos tavsiyalar bera olamiz.`,
        {
          reply_markup: { inline_keyboard: [[{ text: `${EMOJIS.back} Orqaga`, callback_data: 'back' }]] },
        }
      )
      return
    }

    const lines = recommendations.map((m: any, i: number) =>
      `${i + 1}. ${EMOJIS.movie} ${m.movieName} | Reyting: ${m.rating || 'N/A'}⭐`
    )

    const text = `${EMOJIS.recommend} <b>Sizga tavsiyalar</b>\n\n${lines.join('\n')}`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: `${EMOJIS.back} Orqaga`, callback_data: 'back' }]] },
    })
  } catch (error) {
    logger.error(error, 'handleRecommendations error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

// ─── Keyboard helpers ──────────────────────────────────────

function statsMainKeyboard() {
  const { Markup } = require('telegraf')
  return Markup.inlineKeyboard([
    [Markup.button.callback(`${EMOJIS.stats} Batafsil statistika`, 'detailed_stats')],
    [Markup.button.callback(`${EMOJIS.top} Top kinolar`, 'top_movies')],
    [Markup.button.callback(`${EMOJIS.top} Top seriallar`, 'top_series')],
    [Markup.button.callback(`${EMOJIS.trending} Trend`, 'trending')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back')],
  ])
}

function trendingPeriodKeyboard() {
  const { Markup } = require('telegraf')
  return Markup.inlineKeyboard([
    [Markup.button.callback(`${EMOJIS.trending} 7 kunlik`, 'trending_7d')],
    [Markup.button.callback(`${EMOJIS.trending} 30 kunlik`, 'trending_30d')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back')],
  ])
}
