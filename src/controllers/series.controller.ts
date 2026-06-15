import { BotContext } from '../types'
import { SeriesService } from '../services/series.service'
import { SeasonService } from '../services/season.service'
import { EpisodeService } from '../services/episode.service'
import { WatchHistoryService } from '../services/watchHistory.service'
import { FavoriteService } from '../services/favorite.service'
import {
  seriesDetailKeyboard,
  seasonListKeyboard,
  episodeListKeyboard,
  seriesSearchKeyboard,
} from '../keyboards/series'
import { categorySelectionKeyboard } from '../keyboards/category'
import { formatSeriesInfo } from '../utils/formatters'
import { EMOJIS, PAGINATION } from '../config/constants'
import { logger } from '../utils/logger'
import { CategoryService } from '../services/category.service'

export async function handleSeriesList(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const page = 1
    const { seriesList, total, totalPages } = await SeriesService.getAll(page, PAGINATION.pageSize)

    if (seriesList.length === 0) {
      await ctx.editMessageText(`${EMOJIS.series} Hozircha seriallar mavjud emas.`, {
        reply_markup: { inline_keyboard: [[{ text: `${EMOJIS.back} Orqaga`, callback_data: 'back' }]] },
      })
      return
    }

    const text = `${EMOJIS.series} <b>Seriallar ro'yxati</b> (${total} ta):\n\n`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: seriesListKeyboard(seriesList, page, totalPages).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleSeriesList error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleSeriesDetail(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const match = ctx.match as RegExpExecArray
    const seriesCode = match?.[1] || ''
    const series = await SeriesService.getByCode(seriesCode)

    if (!series) {
      await ctx.editMessageText(`${EMOJIS.error} Serial topilmadi.`, {
        reply_markup: { inline_keyboard: [[{ text: `${EMOJIS.back} Orqaga`, callback_data: 'back' }]] },
      })
      return
    }

    const text = formatSeriesInfo(series)
    const caption = `${EMOJIS.series} <b>${series.seriesName}</b>\n\n${text}`

    if (series.poster) {
      await ctx.editMessageMedia(
        {
          type: 'photo',
          media: series.poster,
          caption,
          parse_mode: 'HTML',
        },
        { reply_markup: seriesDetailKeyboard(series.seriesCode).reply_markup }
      )
    } else {
      await ctx.editMessageText(caption, {
        parse_mode: 'HTML',
        reply_markup: seriesDetailKeyboard(series.seriesCode).reply_markup,
      })
    }
  } catch (error) {
    logger.error(error, 'handleSeriesDetail error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleSeasonList(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const match = ctx.match as RegExpExecArray
    const seriesCode = match?.[1] || ''
    const series = await SeriesService.getByCode(seriesCode)

    if (!series) {
      await ctx.editMessageText(`${EMOJIS.error} Serial topilmadi.`)
      return
    }

    const seriesId = (series as any)._id?.toString()
    const seasons = await SeasonService.getBySeries(seriesId)

    if (seasons.length === 0) {
      await ctx.editMessageText(`${EMOJIS.series} Bu serialda fasllar mavjud emas.`)
      return
    }

    await ctx.editMessageText(
      `${EMOJIS.series} <b>${series.seriesName}</b> - Fasllar:\n\n${seasons.map((s) => `${EMOJIS.season} ${s.seasonNumber}-Fasl (${s.totalEpisodes} qism)`).join('\n')}`,
      {
        parse_mode: 'HTML',
        reply_markup: seasonListKeyboard(seriesCode, seasons).reply_markup,
      }
    )
  } catch (error) {
    logger.error(error, 'handleSeasonList error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleEpisodeList(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const match = ctx.match as RegExpExecArray
    const raw = match?.[1] || ''
    const parts = raw.split('_')
    const seriesCode = parts[0] || ''
    const seasonNumber = parseInt(parts[1] || '0', 10)

    const series = await SeriesService.getByCode(seriesCode)
    if (!series) {
      await ctx.editMessageText(`${EMOJIS.error} Serial topilmadi.`)
      return
    }

    const seriesId = (series as any)._id?.toString()
    const season = await SeasonService.getByNumber(seriesId, seasonNumber)

    if (!season) {
      await ctx.editMessageText(`${EMOJIS.error} Fasl topilmadi.`)
      return
    }

    const seasonId = (season as any)._id?.toString()
    const page = 1
    const { episodes, total, totalPages } = await EpisodeService.getBySeason(seasonId, page, PAGINATION.pageSize)

    if (episodes.length === 0) {
      await ctx.editMessageText(`${EMOJIS.episode} Bu faslda qismlar mavjud emas.`)
      return
    }

    await ctx.editMessageText(
      `${EMOJIS.series} <b>${series.seriesName}</b> | ${EMOJIS.season} ${seasonNumber}-Fasl (${total} qism):`,
      {
        parse_mode: 'HTML',
        reply_markup: episodeListKeyboard(seasonId, episodes, page, totalPages).reply_markup,
      }
    )
  } catch (error) {
    logger.error(error, 'handleEpisodeList error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleEpisodePlay(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const match = ctx.match as RegExpExecArray
    const raw = match?.[1] || ''
    const parts = raw.split('_')
    const seasonId = parts[0] || ''
    const episodeNumber = parseInt(parts[1] || '0', 10)

    const episode = await EpisodeService.getByNumber(seasonId, episodeNumber)
    if (!episode) {
      await ctx.editMessageText(`${EMOJIS.error} Qism topilmadi.`)
      return
    }

    const userId = ctx.from?.id
    if (userId) {
      await WatchHistoryService.add(userId, seasonId, 'series', 0)
    }

    await EpisodeService.incrementViews((episode as any)._id?.toString())

    const episodeTitle = episode.title || `${episodeNumber}-qism`
    await ctx.replyWithVideo(episode.fileId, {
      caption: `${EMOJIS.episode} <b>${episodeTitle}</b>\n\n${EMOJIS.views} Tomosha qiling, yoqimli tomosha!`,
      parse_mode: 'HTML',
      supports_streaming: true,
    })
  } catch (error) {
    logger.error(error, 'handleEpisodePlay error')
    await ctx.reply(`${EMOJIS.error} Videoni yuklashda xatolik.`)
  }
}

export async function handleSeriesSearch(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    await ctx.editMessageText(`${EMOJIS.search} Qidirish turini tanlang:`, {
      reply_markup: seriesSearchKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleSeriesSearch error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleSeriesSearchByCode(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = { step: 'series_search_code' }
    }
    await ctx.editMessageText(
      `${EMOJIS.search} Serial kodini kiriting.\n\nMisol: <code>STRANGER01</code>`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handleSeriesSearchByCode error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleSeriesSearchByName(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = { step: 'series_search_name' }
    }
    await ctx.editMessageText(
      `${EMOJIS.search} Serial nomini kiriting.\n\nMisol: <code>Stranger Things</code>`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handleSeriesSearchByName error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleSeriesSearchByGenre(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const categories = await CategoryService.getAll()
    await ctx.editMessageText(`${EMOJIS.category} Janrni tanlang:`, {
      reply_markup: categorySelectionKeyboard(categories, 'series_search_genre_').reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleSeriesSearchByGenre error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleSeriesSearchByYear(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = { step: 'series_search_year' }
    }
    await ctx.editMessageText(
      `${EMOJIS.search} Serial yilini kiriting.\n\nMisol: <code>2024</code>`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handleSeriesSearchByYear error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleSeriesPagination(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const match = ctx.match as RegExpExecArray
    const page = parseInt(match?.[1] || '1', 10)
    if (isNaN(page) || page < 1) return

    const { seriesList, total, totalPages } = await SeriesService.getAll(page, PAGINATION.pageSize)

    if (seriesList.length === 0) {
      await ctx.editMessageText(`${EMOJIS.series} Bu sahifada seriallar mavjud emas.`)
      return
    }

    const text = `${EMOJIS.series} <b>Seriallar ro'yxati</b> (${total} ta):\n\n`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: seriesListKeyboard(seriesList, page, totalPages).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleSeriesPagination error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleSeriesSave(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const match = ctx.match as RegExpExecArray
    const seriesCode = match?.[1] || ''
    const series = await SeriesService.getByCode(seriesCode)
    if (!series) {
      await ctx.answerCbQuery?.('Serial topilmadi.', { show_alert: true })
      return
    }

    const userId = ctx.from?.id
    if (!userId) return

    const seriesId = (series as any)._id?.toString() || seriesCode
    await FavoriteService.add(userId, seriesId, 'series')
    await ctx.answerCbQuery?.(`${EMOJIS.heart} Sevimlilarga qo'shildi!`, { show_alert: false })
  } catch (error) {
    logger.error(error, 'handleSeriesSave error')
    await ctx.answerCbQuery?.('Xatolik yuz berdi.', { show_alert: true })
  }
}

export async function handleEpisodePagination(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const match = ctx.match as RegExpExecArray
    const raw = match?.[1] || ''
    const parts = raw.split('_')
    const seasonId = parts[0] || ''
    const page = parseInt(parts[1] || '1', 10)
    if (isNaN(page) || page < 1) return

    const { episodes, total, totalPages } = await EpisodeService.getBySeason(seasonId, page, PAGINATION.pageSize)

    if (episodes.length === 0) {
      await ctx.editMessageText(`${EMOJIS.episode} Bu sahifada qismlar mavjud emas.`)
      return
    }

    await ctx.editMessageText(`${EMOJIS.episode} Qismlar (${total} ta):`, {
      parse_mode: 'HTML',
      reply_markup: episodeListKeyboard(seasonId, episodes, page, totalPages).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleEpisodePagination error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

function seriesListKeyboard(seriesList: any[], page: number, totalPages: number) {
  const { Markup } = require('telegraf')
  const buttons = seriesList.map((s, index) => [
    Markup.button.callback(`${index + 1 + (page - 1) * 10}. ${s.seriesName}`, `series_detail:${s.seriesCode}`),
  ])

  if (totalPages > 1) {
    const navButtons: ReturnType<typeof Markup.button.callback>[] = []
    if (page > 1) navButtons.push(Markup.button.callback(`${EMOJIS.prev} Oldingi`, `series_page:${page - 1}`))
    navButtons.push(Markup.button.callback(`${page}/${totalPages}`, 'page_info'))
    if (page < totalPages) navButtons.push(Markup.button.callback(`${EMOJIS.next} Keyingi`, `series_page:${page + 1}`))
    buttons.push(navButtons)
  }

  buttons.push([Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back')])
  return Markup.inlineKeyboard(buttons)
}
