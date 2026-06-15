import { BotContext } from '../types'
import { UserService } from '../services/user.service'
import { MovieService } from '../services/movie.service'
import { SeriesService } from '../services/series.service'
import { CategoryService } from '../services/category.service'
import { ChannelService } from '../services/channel.service'
import { SeasonService } from '../services/season.service'
import { EpisodeService } from '../services/episode.service'
import { PaymentService } from '../services/payment.service'
import { StatsService } from '../services/stats.service'
import { BroadcastService } from '../services/broadcast.service'

import {
  adminDashboardKeyboard,
  adminMoviesKeyboard,
  adminSeriesKeyboard,
  adminCategoriesKeyboard,
  adminChannelsKeyboard,
  adminPremiumKeyboard,
  adminPaymentsKeyboard,
  adminBroadcastKeyboard,
  adminModeratorsKeyboard,
  adminSettingsKeyboard,
  adminLogsKeyboard,
} from '../keyboards/admin'
import { formatStats } from '../utils/formatters'
import { EMOJIS, PAGINATION, PREMIUM_PLANS, ADMIN_PERMISSIONS } from '../config/constants'
import { logger } from '../utils/logger'
import { config } from '../config'
import Admin from '../models/Admin'
import Log from '../models/Log'
import { formatNumber } from '../utils/helpers'

async function logAdminAction(ctx: BotContext, action: string, targetId?: string, targetName?: string, details?: string) {
  try {
    await Log.create({
      adminId: ctx.from?.id || 0,
      adminName: ctx.from?.first_name || 'Unknown',
      action,
      targetId,
      targetName,
      details,
      timestamp: new Date(),
    })
  } catch (error) {
    logger.error(error, 'Failed to log admin action')
  }
}

// ─── Dashboard ────────────────────────────────────────────

async function adminReply(ctx: BotContext, text: string, keyboard: any) {
  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard.reply_markup })
    } else {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard.reply_markup })
    }
  } catch {
    try {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard.reply_markup })
    } catch {}
  }
}

export async function handleAdminPanel(ctx: BotContext) {
  if (ctx.callbackQuery) await ctx.answerCbQuery()
  const user = ctx.session?.user || await UserService.getById(ctx.from?.id || 0)
  const name = user?.firstName || ctx.from?.first_name || 'Foydalanuvchi'
  const role = user?.role || 'user'

  if (!['owner', 'superadmin', 'admin', 'moderator', 'support'].includes(role)) {
    await ctx.reply(`${EMOJIS.lock} Siz admin emassiz.\n\nSizning rolingiz: <b>${role}</b>\n\nAdmin bilan bog'laning: @${config.owner.usernames[0] || 'admin'}`, { parse_mode: 'HTML' })
    return
  }

  const text = [
    `${EMOJIS.admin} <b>Admin panel</b>\n\n`,
    `Xush kelibsiz, ${name}!\n`,
    `Sizning rolingiz: <b>${role}</b>\n\n`,
    `Kerakli bo'limni tanlang:`,
  ].join('')

  await adminReply(ctx, text, adminDashboardKeyboard())
}

export async function handleAdminDashboard(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const stats = await StatsService.getDashboardStats()
    const text = formatStats(stats)

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: adminDashboardKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleAdminDashboard error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

// ─── Movies ────────────────────────────────────────────────

export async function handleAdminMovies(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    await ctx.editMessageText(`${EMOJIS.movie} <b>Kino boshqaruvi</b>\n\nKerakli amalni tanlang:`, {
      parse_mode: 'HTML',
      reply_markup: adminMoviesKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleAdminMovies error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminAddMovie(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = {
        step: 'waiting_movie_code',
        movieData: {},
      }
    }
    await ctx.editMessageText(
      `${EMOJIS.movie} <b>Yangi kino qo'shish</b>\n\n` +
      `1-qadam: Kino kodini kiriting.\n\n` +
      `Misol: <code>AVATAR01</code>\n\n` +
      `${EMOJIS.cross} Bekor qilish uchun /cancel buyrug'ini bosing.`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handleAdminAddMovie error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminAddMovieProcess(ctx: BotContext) {
  try {
    const step = ctx.session?.data?.step
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text?.trim() : ''
    if (!step || !text) return

    if (text === '/cancel') {
      ctx.session.data = undefined
      await ctx.reply(`${EMOJIS.check} Jarayon bekor qilindi.`)
      await handleAdminPanel(ctx)
      return
    }

    const data = ctx.session.data!

    switch (step) {
      case 'admin_add_movie_code': {
        const existing = await MovieService.getByCode(text.toUpperCase())
        if (existing) {
          await ctx.reply(`${EMOJIS.warning} Bu kod allaqachon mavjud. Boshqa kod kiriting.`)
          return
        }
        data.movieData.movieCode = text.toUpperCase()
        data.step = 'admin_add_movie_name'
        await ctx.reply(`${EMOJIS.movie} 2-qadam: Kino nomini kiriting.\n\nMisol: <b>Avatar 2</b>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_movie_name': {
        data.movieData.movieName = text
        data.step = 'admin_add_movie_description'
        await ctx.reply(`${EMOJIS.pencil} 3-qadam: Kino tavsifini kiriting (yoki - o'tkazib yuborish uchun).`)
        break
      }
      case 'admin_add_movie_description': {
        if (text !== '-') data.movieData.description = text
        data.step = 'admin_add_movie_genre'
        await ctx.reply(`${EMOJIS.category} 4-qadam: Janr(lar)ni vergul bilan ajratib kiriting.\n\nMisol: <code>Action, Sci-Fi, Adventure</code>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_movie_genre': {
        data.movieData.genre = text.split(',').map((g: string) => g.trim()).filter(Boolean)
        data.step = 'admin_add_movie_country'
        await ctx.reply(`${EMOJIS.globe} 5-qadam: Kino davlatini kiriting.\n\nMisol: <code>USA</code>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_movie_country': {
        data.movieData.country = text
        data.step = 'admin_add_movie_year'
        await ctx.reply(`${EMOJIS.year} 6-qadam: Kino yilini kiriting.\n\nMisol: <code>2024</code>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_movie_year': {
        const year = parseInt(text, 10)
        if (isNaN(year) || year < 1900 || year > 2100) {
          await ctx.reply(`${EMOJIS.warning} To'g'ri yil kiriting (1900-2100).`)
          return
        }
        data.movieData.year = year
        data.step = 'admin_add_movie_duration'
        await ctx.reply(`${EMOJIS.clock} 7-qadam: Kino davomiyligini (daqiqa) kiriting.\n\nMisol: <code>142</code>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_movie_duration': {
        const duration = parseInt(text, 10)
        if (isNaN(duration) || duration < 1) {
          await ctx.reply(`${EMOJIS.warning} To'g'ri davomiylik kiriting (daqiqalarda).`)
          return
        }
        data.movieData.duration = duration
        data.step = 'admin_add_movie_rating'
        await ctx.reply(`${EMOJIS.rating} 8-qadam: Kino reytingini kiriting (1-10).\n\nMisol: <code>8.5</code>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_movie_rating': {
        const rating = parseFloat(text)
        if (isNaN(rating) || rating < 0 || rating > 10) {
          await ctx.reply(`${EMOJIS.warning} To'g'ri reyting kiriting (0-10).`)
          return
        }
        data.movieData.rating = rating
        data.step = 'admin_add_movie_poster'
        await ctx.reply(`${EMOJIS.movie} 9-qadam: Kino poster URL manzilini kiriting (yoki - o'tkazib yuborish uchun).\n\nMisol: <code>https://example.com/poster.jpg</code>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_movie_poster': {
        if (text !== '-' && text.startsWith('http')) data.movieData.poster = text
        data.step = 'admin_add_movie_language'
        await ctx.reply(`${EMOJIS.language} 10-qadam: Kino tilini kiriting.\n\nMisol: <code>O'zbekcha</code> yoki <code>Inglizcha</code>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_movie_language': {
        data.movieData.lang = text
        data.step = 'admin_add_movie_video'
        await ctx.reply(`${EMOJIS.views} 11-qadam (oxirgi): Kino video fayl ID sini yuboring.\n\nVideo faylni telegramga yuklab, file_id sini yuboring.`, { parse_mode: 'HTML' })
        break
      }
      default:
        await ctx.reply(`${EMOJIS.warning} Noma'lum qadam. /cancel buyrug'ini bosing.`)
    }
  } catch (error) {
    logger.error(error, 'handleAdminAddMovieProcess error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminAddMovieVideo(ctx: BotContext) {
  try {
    const data = ctx.session?.data
    if (!data || data.step !== 'admin_add_movie_video') return

    const video = ctx.message && 'video' in ctx.message ? ctx.message.video : null
    const document = ctx.message && 'document' in ctx.message ? ctx.message.document : null
    const fileId = video?.file_id || document?.file_id

    if (!fileId) {
      await ctx.reply(`${EMOJIS.warning} Iltimos, video fayl yuboring.`)
      return
    }

    data.movieData.fileId = fileId

    await MovieService.create(data.movieData)
    await logAdminAction(ctx, 'movie_add', data.movieData.movieCode, data.movieData.movieName)

    ctx.session.data = undefined
    await ctx.reply(`${EMOJIS.success} <b>Kino muvaffaqiyatli qo'shildi!</b>\n\nKod: <code>${data.movieData.movieCode}</code>\nNom: ${data.movieData.movieName}`, { parse_mode: 'HTML' })
  } catch (error) {
    logger.error(error, 'handleAdminAddMovieVideo error')
    await ctx.reply(`${EMOJIS.error} Kinoni saqlashda xatolik.`)
  }
}

export async function handleAdminDeleteMovie(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const { movies } = await MovieService.getAll(1, 10)

    if (movies.length === 0) {
      await ctx.editMessageText(`${EMOJIS.movie} O'chirish uchun kinolar mavjud emas.`)
      return
    }

    const buttons = movies.map((m) => [
      { text: `${EMOJIS.trash} ${m.movieName} (${m.movieCode})`, callback_data: `admin_movie_delete_confirm_${m.movieCode}` },
    ])

    buttons.push([{ text: `${EMOJIS.back} Orqaga`, callback_data: 'admin_movies' }])

    await ctx.editMessageText(`${EMOJIS.movie} <b>Kino o'chirish</b>\n\nO'chirmoqchi bo'lgan kinoni tanlang:`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons },
    })
  } catch (error) {
    logger.error(error, 'handleAdminDeleteMovie error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminDeleteMovieConfirm(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''
    const movieCode = data.replace('admin_movie_delete_confirm_', '')

    const movie = await MovieService.getByCode(movieCode)
    if (!movie) {
      await ctx.editMessageText(`${EMOJIS.error} Kino topilmadi.`)
      return
    }

    await MovieService.delete(movieCode)
    await logAdminAction(ctx, 'movie_delete', movieCode, movie.movieName)

    await ctx.editMessageText(`${EMOJIS.success} <b>Kino o'chirildi:</b> ${movie.movieName} (${movieCode})`, { parse_mode: 'HTML' })
  } catch (error) {
    logger.error(error, 'handleAdminDeleteMovieConfirm error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminEditMovie(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const { movies } = await MovieService.getAll(1, 10)

    if (movies.length === 0) {
      await ctx.editMessageText(`${EMOJIS.movie} Tahrirlash uchun kinolar mavjud emas.`)
      return
    }

    const buttons = movies.map((m) => [
      { text: `${EMOJIS.pencil} ${m.movieName} (${m.movieCode})`, callback_data: `admin_movie_edit_select_${m.movieCode}` },
    ])

    buttons.push([{ text: `${EMOJIS.back} Orqaga`, callback_data: 'admin_movies' }])

    await ctx.editMessageText(`${EMOJIS.movie} <b>Kinoni tahrirlash</b>\n\nTahrirlamoqchi bo'lgan kinoni tanlang:`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons },
    })
  } catch (error) {
    logger.error(error, 'handleAdminEditMovie error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminMovieList(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const page = 1
    const { movies, total, totalPages } = await MovieService.getAll(page, PAGINATION.pageSize)

    if (movies.length === 0) {
      await ctx.editMessageText(`${EMOJIS.movie} Kinolar mavjud emas.`)
      return
    }

    const lines = movies.map((m, i) =>
      `${i + 1}. ${EMOJIS.movie} ${m.movieName} | <code>${m.movieCode}</code> | 👁 ${formatNumber(m.views)}`
    )

    const text = `${EMOJIS.movie} <b>Barcha kinolar (${total} ta)</b>\n\n${lines.join('\n')}`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: adminMovieListKeyboard(page, totalPages).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleAdminMovieList error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

// ─── Series ────────────────────────────────────────────────

export async function handleAdminSeries(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    await ctx.editMessageText(`${EMOJIS.series} <b>Serial boshqaruvi</b>\n\nKerakli amalni tanlang:`, {
      parse_mode: 'HTML',
      reply_markup: adminSeriesKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleAdminSeries error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminAddSeries(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = {
        step: 'admin_add_series_code',
        seriesData: {},
      }
    }
    await ctx.editMessageText(
      `${EMOJIS.series} <b>Yangi serial qo'shish</b>\n\n` +
      `1-qadam: Serial kodini kiriting.\n\n` +
      `Misol: <code>STRNG01</code>\n\n` +
      `${EMOJIS.cross} Bekor qilish uchun /cancel buyrug'ini bosing.`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handleAdminAddSeries error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminAddSeriesProcess(ctx: BotContext) {
  try {
    const step = ctx.session?.data?.step
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text?.trim() : ''
    if (!step || !text || !step.startsWith('admin_add_series')) return

    if (text === '/cancel') {
      ctx.session.data = undefined
      await ctx.reply(`${EMOJIS.check} Jarayon bekor qilindi.`)
      await handleAdminPanel(ctx)
      return
    }

    const data = ctx.session.data!

    switch (step) {
      case 'admin_add_series_code': {
        const existing = await SeriesService.getByCode(text.toUpperCase())
        if (existing) {
          await ctx.reply(`${EMOJIS.warning} Bu kod allaqachon mavjud. Boshqa kod kiriting.`)
          return
        }
        data.seriesData.seriesCode = text.toUpperCase()
        data.step = 'admin_add_series_name'
        await ctx.reply(`${EMOJIS.series} 2-qadam: Serial nomini kiriting.\n\nMisol: <b>Stranger Things</b>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_series_name': {
        data.seriesData.seriesName = text
        data.step = 'admin_add_series_description'
        await ctx.reply(`${EMOJIS.pencil} 3-qadam: Serial tavsifini kiriting (yoki - o'tkazib yuborish uchun).`)
        break
      }
      case 'admin_add_series_description': {
        if (text !== '-') data.seriesData.description = text
        data.step = 'admin_add_series_genre'
        await ctx.reply(`${EMOJIS.category} 4-qadam: Janr(lar)ni vergul bilan ajratib kiriting.\n\nMisol: <code>Drama, Fantasy, Horror</code>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_series_genre': {
        data.seriesData.genre = text.split(',').map((g: string) => g.trim()).filter(Boolean)
        data.step = 'admin_add_series_country'
        await ctx.reply(`${EMOJIS.globe} 5-qadam: Serial davlatini kiriting.\n\nMisol: <code>USA</code>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_series_country': {
        data.seriesData.country = text
        data.step = 'admin_add_series_year'
        await ctx.reply(`${EMOJIS.year} 6-qadam: Serial yilini kiriting.\n\nMisol: <code>2016</code>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_series_year': {
        const year = parseInt(text, 10)
        if (isNaN(year) || year < 1900 || year > 2100) {
          await ctx.reply(`${EMOJIS.warning} To'g'ri yil kiriting (1900-2100).`)
          return
        }
        data.seriesData.year = year
        data.step = 'admin_add_series_rating'
        await ctx.reply(`${EMOJIS.rating} 7-qadam: Serial reytingini kiriting (1-10).\n\nMisol: <code>8.7</code>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_series_rating': {
        const rating = parseFloat(text)
        if (isNaN(rating) || rating < 0 || rating > 10) {
          await ctx.reply(`${EMOJIS.warning} To'g'ri reyting kiriting (0-10).`)
          return
        }
        data.seriesData.rating = rating
        data.step = 'admin_add_series_poster'
        await ctx.reply(`${EMOJIS.movie} 8-qadam: Serial poster URL manzilini kiriting (yoki - o'tkazib yuborish uchun).`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_series_poster': {
        if (text !== '-' && text.startsWith('http')) data.seriesData.poster = text
        data.step = 'admin_add_series_language'
        await ctx.reply(`${EMOJIS.language} 9-qadam: Serial tilini kiriting.\n\nMisol: <code>Inglizcha</code>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_series_language': {
        data.seriesData.lang = text
        data.seriesData.totalSeasons = 0
        await SeriesService.create(data.seriesData)
        await logAdminAction(ctx, 'series_add', data.seriesData.seriesCode, data.seriesData.seriesName)

        ctx.session.data = undefined
        await ctx.reply(`${EMOJIS.success} <b>Serial muvaffaqiyatli qo'shildi!</b>\n\nKod: <code>${data.seriesData.seriesCode}</code>\nNom: ${data.seriesData.seriesName}\n\n${EMOJIS.info} Endi fasllarni qo'shishingiz mumkin.`, { parse_mode: 'HTML' })
        break
      }
      default:
        await ctx.reply(`${EMOJIS.warning} Noma'lum qadam. /cancel buyrug'ini bosing.`)
    }
  } catch (error) {
    logger.error(error, 'handleAdminAddSeriesProcess error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminAddSeason(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = {
        step: 'admin_add_season_series_code',
        seasonData: {},
      }
    }
    await ctx.editMessageText(
      `${EMOJIS.season} <b>Fasl qo'shish</b>\n\n` +
      `Serial kodini kiriting:\n\n` +
      `Misol: <code>STRNG01</code>`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handleAdminAddSeason error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminAddSeasonProcess(ctx: BotContext) {
  try {
    const step = ctx.session?.data?.step
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text?.trim() : ''
    if (!step || !text) return

    if (text === '/cancel') {
      ctx.session.data = undefined
      await ctx.reply(`${EMOJIS.check} Jarayon bekor qilindi.`)
      await handleAdminPanel(ctx)
      return
    }

    const data = ctx.session.data!

    switch (step) {
      case 'admin_add_season_series_code': {
        const series = await SeriesService.getByCode(text.toUpperCase())
        if (!series) {
          await ctx.reply(`${EMOJIS.error} Serial topilmadi. Kodni tekshiring.`)
          return
        }
        data.seasonData.seriesId = (series as any)._id?.toString()
        data.seasonData.seriesCode = text.toUpperCase()
        data.step = 'admin_add_season_number'
        await ctx.reply(`${EMOJIS.season} Fasl raqamini kiriting:\n\nMisol: <code>1</code>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_season_number': {
        const seasonNumber = parseInt(text, 10)
        if (isNaN(seasonNumber) || seasonNumber < 1) {
          await ctx.reply(`${EMOJIS.warning} To'g'ri fasl raqamini kiriting.`)
          return
        }
        data.seasonData.seasonNumber = seasonNumber
        data.step = 'admin_add_season_title'
        await ctx.reply(`${EMOJIS.pencil} Fasl nomini kiriting (yoki - o'tkazib yuborish uchun):`)
        break
      }
      case 'admin_add_season_title': {
        if (text !== '-') data.seasonData.title = text
        await SeasonService.create(data.seasonData)
        await logAdminAction(ctx, 'season_add', data.seasonData.seriesCode, `Season ${data.seasonData.seasonNumber}`)

        ctx.session.data = undefined
        await ctx.reply(`${EMOJIS.success} <b>Fasl qo'shildi!</b>\n\nSerial: ${data.seasonData.seriesCode}\nFasl: ${data.seasonData.seasonNumber}`, { parse_mode: 'HTML' })
        break
      }
      default:
        await ctx.reply(`${EMOJIS.warning} Noma'lum qadam. /cancel buyrug'ini bosing.`)
    }
  } catch (error) {
    logger.error(error, 'handleAdminAddSeasonProcess error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminAddEpisode(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = {
        step: 'admin_add_episode_series_code',
        episodeData: {},
      }
    }
    await ctx.editMessageText(
      `${EMOJIS.episode} <b>Qism qo'shish</b>\n\n` +
      `Serial kodini kiriting:\n\n` +
      `Misol: <code>STRNG01</code>`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handleAdminAddEpisode error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminAddEpisodeProcess(ctx: BotContext) {
  try {
    const step = ctx.session?.data?.step
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text?.trim() : ''
    if (!step || !text) return

    if (text === '/cancel') {
      ctx.session.data = undefined
      await ctx.reply(`${EMOJIS.check} Jarayon bekor qilindi.`)
      await handleAdminPanel(ctx)
      return
    }

    const data = ctx.session.data!

    switch (step) {
      case 'admin_add_episode_series_code': {
        const series = await SeriesService.getByCode(text.toUpperCase())
        if (!series) {
          await ctx.reply(`${EMOJIS.error} Serial topilmadi.`)
          return
        }
        data.episodeData.seriesId = (series as any)._id?.toString()
        data.episodeData.seriesCode = text.toUpperCase()
        data.step = 'admin_add_episode_season'
        await ctx.reply(`${EMOJIS.season} Fasl raqamini kiriting:\n\nMisol: <code>1</code>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_episode_season': {
        const seasonNum = parseInt(text, 10)
        if (isNaN(seasonNum) || seasonNum < 1) {
          await ctx.reply(`${EMOJIS.warning} To'g'ri fasl raqamini kiriting.`)
          return
        }
        const season = await SeasonService.getByNumber(data.episodeData.seriesId, seasonNum)
        if (!season) {
          await ctx.reply(`${EMOJIS.error} Bu fasl topilmadi. Avval fasl yarating.`)
          return
        }
        data.episodeData.seasonId = (season as any)._id?.toString()
        data.step = 'admin_add_episode_number'
        await ctx.reply(`${EMOJIS.episode} Qism raqamini kiriting:\n\nMisol: <code>1</code>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_episode_number': {
        const epNum = parseInt(text, 10)
        if (isNaN(epNum) || epNum < 1) {
          await ctx.reply(`${EMOJIS.warning} To'g'ri qism raqamini kiriting.`)
          return
        }
        data.episodeData.episodeNumber = epNum
        data.step = 'admin_add_episode_title'
        await ctx.reply(`${EMOJIS.pencil} Qism nomini kiriting (yoki - o'tkazib yuborish uchun):`)
        break
      }
      case 'admin_add_episode_title': {
        if (text !== '-') data.episodeData.title = text
        data.step = 'admin_add_episode_video'
        await ctx.reply(`${EMOJIS.views} Qism video fayl ID sini yuboring.`)
        break
      }
      default:
        await ctx.reply(`${EMOJIS.warning} Noma'lum qadam.`)
    }
  } catch (error) {
    logger.error(error, 'handleAdminAddEpisodeProcess error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminAddEpisodeVideo(ctx: BotContext) {
  try {
    const data = ctx.session?.data
    if (!data || data.step !== 'admin_add_episode_video') return

    const video = ctx.message && 'video' in ctx.message ? ctx.message.video : null
    const document = ctx.message && 'document' in ctx.message ? ctx.message.document : null
    const fileId = video?.file_id || document?.file_id

    if (!fileId) {
      await ctx.reply(`${EMOJIS.warning} Iltimos, video fayl yuboring.`)
      return
    }

    data.episodeData.fileId = fileId
    await EpisodeService.create(data.episodeData)
    await logAdminAction(ctx, 'episode_add', data.episodeData.seriesCode, `S${data.episodeData.seasonId}E${data.episodeData.episodeNumber}`)

    ctx.session.data = undefined
    await ctx.reply(`${EMOJIS.success} <b>Qism qo'shildi!</b>`, { parse_mode: 'HTML' })
  } catch (error) {
    logger.error(error, 'handleAdminAddEpisodeVideo error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

// ─── Categories ────────────────────────────────────────────

export async function handleAdminCategories(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    await ctx.editMessageText(`${EMOJIS.category} <b>Kategoriya boshqaruvi</b>\n\nKerakli amalni tanlang:`, {
      parse_mode: 'HTML',
      reply_markup: adminCategoriesKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleAdminCategories error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminAddCategory(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = {
        step: 'admin_add_category_name',
        categoryData: {},
      }
    }
    await ctx.editMessageText(
      `${EMOJIS.category} <b>Yangi kategoriya qo'shish</b>\n\n` +
      `Kategoriya nomini kiriting:\n\n` +
      `Misol: <code>Thriller</code>`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handleAdminAddCategory error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminAddCategoryProcess(ctx: BotContext) {
  try {
    const step = ctx.session?.data?.step
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text?.trim() : ''
    if (!step || !text) return

    if (text === '/cancel') {
      ctx.session.data = undefined
      await ctx.reply(`${EMOJIS.check} Jarayon bekor qilindi.`)
      await handleAdminPanel(ctx)
      return
    }

    const data = ctx.session.data!

    switch (step) {
      case 'admin_add_category_name': {
        data.categoryData.name = text
        data.step = 'admin_add_category_slug'
        await ctx.reply(`${EMOJIS.pencil} Kategoriya slug (identifikator) kiriting:\n\nMisol: <code>thriller</code>\n\nBo'sh qoldirilsa, avtomatik generatsiya qilinadi.`)
        break
      }
      case 'admin_add_category_slug': {
        data.categoryData.slug = text || text.toLowerCase().replace(/\s+/g, '-')
        data.step = 'admin_add_category_icon'
        await ctx.reply(`${EMOJIS.pencil} Kategoriya ikonkasini kiriting (yoki - o'tkazib yuborish uchun):\n\nMisol: <code>🎭</code>`)
        break
      }
      case 'admin_add_category_icon': {
        data.categoryData.icon = text !== '-' ? text : undefined
        await CategoryService.create(data.categoryData)
        await logAdminAction(ctx, 'category_add', data.categoryData.slug, data.categoryData.name)

        ctx.session.data = undefined
        await ctx.reply(`${EMOJIS.success} <b>Kategoriya qo'shildi:</b> ${data.categoryData.icon || ''} ${data.categoryData.name}`, { parse_mode: 'HTML' })
        break
      }
      default:
        await ctx.reply(`${EMOJIS.warning} Noma'lum qadam.`)
    }
  } catch (error) {
    logger.error(error, 'handleAdminAddCategoryProcess error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminDeleteCategory(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const categories = await CategoryService.getAll()

    if (categories.length === 0) {
      await ctx.editMessageText(`${EMOJIS.category} O'chirish uchun kategoriyalar mavjud emas.`)
      return
    }

    const buttons = categories.map((cat) => [
      { text: `${EMOJIS.trash} ${cat.icon || ''} ${cat.name}`, callback_data: `admin_category_delete_confirm_${cat.slug}` },
    ])

    buttons.push([{ text: `${EMOJIS.back} Orqaga`, callback_data: 'admin_categories' }])

    await ctx.editMessageText(`${EMOJIS.category} <b>Kategoriya o'chirish</b>\n\nDiqqat! Kategoriya o'chirilsa, undagi kinolar kategoriyasiz qoladi.`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons },
    })
  } catch (error) {
    logger.error(error, 'handleAdminDeleteCategory error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminDeleteCategoryConfirm(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''
    const slug = data.replace('admin_category_delete_confirm_', '')

    const category = await CategoryService.getBySlug(slug)
    if (!category) {
      await ctx.editMessageText(`${EMOJIS.error} Kategoriya topilmadi.`)
      return
    }

    const catId = (category as any)._id?.toString()
    await CategoryService.delete(catId)
    await logAdminAction(ctx, 'category_delete', slug, category.name)

    await ctx.editMessageText(`${EMOJIS.success} Kategoriya o'chirildi: ${category.name}`, { parse_mode: 'HTML' })
  } catch (error) {
    logger.error(error, 'handleAdminDeleteCategoryConfirm error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

// ─── Channels ──────────────────────────────────────────────

export async function handleAdminChannels(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    await ctx.editMessageText(`${EMOJIS.channel} <b>Kanal boshqaruvi</b>\n\nKerakli amalni tanlang:`, {
      parse_mode: 'HTML',
      reply_markup: adminChannelsKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleAdminChannels error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminAddChannel(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = {
        step: 'admin_add_channel_username',
        channelData: {},
      }
    }
    await ctx.editMessageText(
      `${EMOJIS.channel} <b>Kanal qo'shish</b>\n\n` +
      `Kanal username'ini kiriting (@ bilan yoki @siz):\n\n` +
      `Misol: <code>@kinokanali</code> yoki <code>kinokanali</code>`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handleAdminAddChannel error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminAddChannelProcess(ctx: BotContext) {
  try {
    const step = ctx.session?.data?.step
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text?.trim() : ''
    if (!step || !text) return

    if (text === '/cancel') {
      ctx.session.data = undefined
      await ctx.reply(`${EMOJIS.check} Jarayon bekor qilindi.`)
      await handleAdminPanel(ctx)
      return
    }

    const data = ctx.session.data!

    switch (step) {
      case 'admin_add_channel_username': {
        const username = text.replace('@', '').trim()
        try {
          const chat = await ctx.telegram.getChat(`@${username}`)
          if (chat.type !== 'channel') {
            await ctx.reply(`${EMOJIS.warning} Bu kanal emas. Kanal username'ini kiriting.`)
            return
          }
          data.channelData.channelId = chat.id.toString()
          data.channelData.channelName = chat.title
          data.channelData.channelUrl = chat.invite_link || `https://t.me/${username}`

          await ChannelService.create(data.channelData)
          await logAdminAction(ctx, 'channel_add', data.channelData.channelId, data.channelData.channelName)

          ctx.session.data = undefined
          await ctx.reply(
            `${EMOJIS.success} <b>Kanal qo'shildi:</b> ${data.channelData.channelName}\n\n` +
            `🆔 ID: <code>${data.channelData.channelId}</code>`,
            { parse_mode: 'HTML' }
          )
        } catch (err: any) {
          if (err?.description?.includes('chat not found')) {
            await ctx.reply(`${EMOJIS.error} Kanal topilmadi. Username'ni tekshirib qayta kiriting.`)
          } else {
            throw err
          }
        }
        break
      }
      default:
        await ctx.reply(`${EMOJIS.warning} Noma'lum qadam.`)
    }
  } catch (error) {
    logger.error(error, 'handleAdminAddChannelProcess error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminDeleteChannel(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const channels = await ChannelService.getAll()

    if (channels.length === 0) {
      await ctx.editMessageText(`${EMOJIS.channel} O'chirish uchun kanallar mavjud emas.`)
      return
    }

    const buttons = channels.map((ch) => [
      { text: `${EMOJIS.trash} ${ch.channelName}`, callback_data: `admin_channel_delete_confirm_${(ch as any)._id}` },
    ])

    buttons.push([{ text: `${EMOJIS.back} Orqaga`, callback_data: 'admin_channels' }])

    await ctx.editMessageText(`${EMOJIS.channel} <b>Kanal o'chirish</b>\n\nO'chirmoqchi bo'lgan kanalni tanlang:`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons },
    })
  } catch (error) {
    logger.error(error, 'handleAdminDeleteChannel error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminDeleteChannelConfirm(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''
    const channelId = data.replace('admin_channel_delete_confirm_', '')

    const channel = await ChannelService.getById(channelId)
    if (!channel) {
      await ctx.editMessageText(`${EMOJIS.error} Kanal topilmadi.`)
      return
    }

    await ChannelService.delete(channelId)
    await logAdminAction(ctx, 'channel_delete', channelId, channel.channelName)

    await ctx.editMessageText(`${EMOJIS.success} Kanal o'chirildi: ${channel.channelName}`, { parse_mode: 'HTML' })
  } catch (error) {
    logger.error(error, 'handleAdminDeleteChannelConfirm error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

// ─── Users ─────────────────────────────────────────────────

export async function handleAdminUsers(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const { users, total } = await UserService.getAll(1, PAGINATION.pageSize)
    const activeCount = await UserService.getActiveCount()
    const bannedCount = users.filter((u) => u.isBanned).length

    const text = [
      `${EMOJIS.users} <b>Foydalanuvchilar boshqaruvi</b>\n\n`,
      `Jami foydalanuvchilar: <b>${formatNumber(total)}</b>\n`,
      `Faol (24h): <b>${formatNumber(activeCount)}</b>\n`,
      `Bloklangan: <b>${formatNumber(bannedCount)}</b>\n\n`,
      `Foydalanuvchi ID sini yuboring yoki pastdagi tugmalardan foydalaning:`,
    ].join('')

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: adminUsersKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleAdminUsers error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminSearchUser(ctx: BotContext) {
  try {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text?.trim() : ''
    if (!text || !/^\d+$/.test(text)) return

    const telegramId = parseInt(text, 10)
    const user = await UserService.getById(telegramId)

    if (!user) {
      await ctx.reply(`${EMOJIS.error} Foydalanuvchi topilmadi.`)
      return
    }

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Noma\'lum'
    const premiumStatus = user.isPremium
      ? user.premiumLifetime
        ? `${EMOJIS.premium} Lifetime`
        : `${EMOJIS.premium} ${user.premiumUntil?.toLocaleDateString('uz-UZ')}`
      : `${EMOJIS.star} Free`

    const text2 = [
      `${EMOJIS.user} <b>Foydalanuvchi ma'lumotlari</b>\n\n`,
      `ID: <code>${user.telegramId}</code>\n`,
      `Ism: ${name}\n`,
      user.username ? `Username: @${user.username}\n` : '',
      `Rol: <b>${user.role}</b>\n`,
      `Premium: ${premiumStatus}\n`,
      user.isBanned ? `\n${EMOJIS.lock} <b>Bloklangan:</b> ${user.banReason || 'Sabab ko\'rsatilmagan'}` : '',
    ].filter(Boolean).join('')

    const buttons = user.isBanned
      ? [{ text: `${EMOJIS.unlock} Blokdan chiqarish`, callback_data: `admin_user_unban_${user.telegramId}` }]
      : [{ text: `${EMOJIS.lock} Bloklash`, callback_data: `admin_user_ban_${user.telegramId}` }]

    buttons.push(
      ...(user.role === 'user'
        ? [{ text: `${EMOJIS.premium} Premium berish`, callback_data: `admin_user_grant_premium_${user.telegramId}` }]
        : []),
      { text: `${EMOJIS.back} Orqaga`, callback_data: 'admin_users' }
    )

    await ctx.reply(text2, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [buttons] as any },
    })
  } catch (error) {
    logger.error(error, 'handleAdminSearchUser error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminBanUser(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''
    const telegramId = parseInt(data.replace('admin_user_ban_', ''), 10)
    if (isNaN(telegramId)) return

    if (ctx.session) {
      ctx.session.data = { step: 'admin_ban_reason', banUserId: telegramId }
    }
    await ctx.editMessageText(`${EMOJIS.lock} Bloklash sababini kiriting (yoki - sababsiz):`)
  } catch (error) {
    logger.error(error, 'handleAdminBanUser error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminBanUserProcess(ctx: BotContext) {
  try {
    const step = ctx.session?.data?.step
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text?.trim() : ''
    if (step !== 'admin_ban_reason' || !text) return

    const telegramId = ctx.session.data!.banUserId
    const reason = text === '-' ? 'Sabab ko\'rsatilmagan' : text

    const user = await UserService.banUser(telegramId, reason)
    if (!user) {
      await ctx.reply(`${EMOJIS.error} Foydalanuvchi topilmadi.`)
      return
    }

    await logAdminAction(ctx, 'user_ban', String(telegramId), user.firstName, reason)
    ctx.session.data = undefined

    await ctx.reply(`${EMOJIS.success} Foydalanuvchi bloklandi: <code>${telegramId}</code>\nSabab: ${reason}`, { parse_mode: 'HTML' })
  } catch (error) {
    logger.error(error, 'handleAdminBanUserProcess error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminUnbanUser(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''
    const telegramId = parseInt(data.replace('admin_user_unban_', ''), 10)
    if (isNaN(telegramId)) return

    const user = await UserService.unbanUser(telegramId)
    if (!user) {
      await ctx.editMessageText(`${EMOJIS.error} Foydalanuvchi topilmadi.`)
      return
    }

    await logAdminAction(ctx, 'user_unban', String(telegramId), user.firstName)
    await ctx.editMessageText(`${EMOJIS.success} Foydalanuvchi blokdan chiqarildi: <code>${telegramId}</code>`, { parse_mode: 'HTML' })
  } catch (error) {
    logger.error(error, 'handleAdminUnbanUser error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

// ─── Premium ───────────────────────────────────────────────

export async function handleAdminPremium(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const premiumCount = await UserService.getPremiumCount()

    const text = [
      `${EMOJIS.premium} <b>Premium boshqaruvi</b>\n\n`,
      `Premium foydalanuvchilar: <b>${formatNumber(premiumCount)}</b>\n\n`,
      `Kerakli amalni tanlang:`,
    ].join('')

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: adminPremiumKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleAdminPremium error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminGrantPremium(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = {
        step: 'admin_grant_premium_user',
        grantData: {},
      }
    }
    await ctx.editMessageText(
      `${EMOJIS.premium} <b>Premium berish</b>\n\n` +
      `Foydalanuvchi Telegram ID sini kiriting:\n\n` +
      `Misol: <code>123456789</code>`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handleAdminGrantPremium error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminGrantPremiumProcess(ctx: BotContext) {
  try {
    const step = ctx.session?.data?.step
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text?.trim() : ''
    if (!step || !text) return

    if (text === '/cancel') {
      ctx.session.data = undefined
      await ctx.reply(`${EMOJIS.check} Jarayon bekor qilindi.`)
      await handleAdminPanel(ctx)
      return
    }

    const data = ctx.session.data!

    switch (step) {
      case 'admin_grant_premium_user': {
        const telegramId = parseInt(text, 10)
        if (isNaN(telegramId)) {
          await ctx.reply(`${EMOJIS.warning} To'g'ri ID kiriting.`)
          return
        }
        const user = await UserService.getById(telegramId)
        if (!user) {
          await ctx.reply(`${EMOJIS.error} Foydalanuvchi topilmadi.`)
          return
        }
        data.grantData.userId = telegramId
        data.step = 'admin_grant_premium_plan'
        const planButtons = PREMIUM_PLANS.map((plan) => [
          { text: `${plan.label} - ${plan.stars}⭐`, callback_data: `admin_grant_plan_${plan.key}_${telegramId}` },
        ])
        await ctx.reply(`${EMOJIS.premium} Rejani tanlang:`, {
          reply_markup: { inline_keyboard: planButtons },
        })
        break
      }
      default:
        await ctx.reply(`${EMOJIS.warning} Noma'lum qadam.`)
    }
  } catch (error) {
    logger.error(error, 'handleAdminGrantPremiumProcess error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminGrantPremiumSelect(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''
    const parts = data.replace('admin_grant_plan_', '').split('_')
    const planKey = `premium_${parts[0]}`
    const telegramId = parseInt(parts[1], 10)

    await UserService.updatePremium(telegramId, planKey)
    await logAdminAction(ctx, 'premium_grant', String(telegramId), planKey)

    await ctx.editMessageText(`${EMOJIS.success} <b>Premium berildi!</b>\n\nFoydalanuvchi: <code>${telegramId}</code>\nReja: ${planKey}`, { parse_mode: 'HTML' })
  } catch (error) {
    logger.error(error, 'handleAdminGrantPremiumSelect error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminPremiumPrices(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const lines = PREMIUM_PLANS.map((p) => `${p.label} - ${p.stars}⭐ | ${p.unit === 'lifetime' ? 'Butun umr' : `${p.duration} kun`}`)
    const text = [
      `${EMOJIS.premium} <b>Premium narxlar</b>\n\n`,
      ...lines.map((l) => `${l}\n`),
      `\nNarxlarni o'zgartirish uchun sozlamalar bo'limiga o'ting.`,
    ].join('')

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: `${EMOJIS.back} Orqaga`, callback_data: 'admin_premium' }]] },
    })
  } catch (error) {
    logger.error(error, 'handleAdminPremiumPrices error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

// ─── Payments ──────────────────────────────────────────────

export async function handleAdminPayments(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const revenue = await PaymentService.getTotalRevenue()

    const text = [
      `${EMOJIS.star} <b>To'lov boshqaruvi</b>\n\n`,
      `Jami daromad: <b>${formatNumber(revenue)}⭐</b>\n\n`,
      `Kerakli amalni tanlang:`,
    ].join('')

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: adminPaymentsKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleAdminPayments error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminPaymentsAll(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const { payments, total, totalPages } = await PaymentService.getAllPayments(1, PAGINATION.pageSize)

    if (payments.length === 0) {
      await ctx.editMessageText(`${EMOJIS.star} To'lovlar mavjud emas.`)
      return
    }

    const lines = payments.map((p, i) =>
      `${i + 1}. <code>${p.userId}</code> | ${p.type.replace('premium_', '')} | ${p.stars}⭐ | ${p.status}`
    )

    await ctx.editMessageText(`${EMOJIS.star} <b>Barcha to'lovlar (${total} ta)</b>\n\n${lines.join('\n')}`, {
      parse_mode: 'HTML',
      reply_markup: adminPaymentsListKeyboard(1, totalPages).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleAdminPaymentsAll error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminRefund(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = { step: 'admin_refund_invoice' }
    }
    await ctx.editMessageText(
      `${EMOJIS.star} <b>To'lovni qaytarish (Refund)</b>\n\n` +
      `To'lov invoice ID sini kiriting:\n\n` +
      `Misol: <code>invoice_id_12345</code>`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handleAdminRefund error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminRefundProcess(ctx: BotContext) {
  try {
    const step = ctx.session?.data?.step
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text?.trim() : ''
    if (step !== 'admin_refund_invoice' || !text) return

    const payment = await PaymentService.refundPayment(text)
    if (!payment) {
      await ctx.reply(`${EMOJIS.error} To'lov topilmadi yoki qaytarib bo'lmaydi.`)
      return
    }

    await logAdminAction(ctx, 'payment_refund', text, String(payment.userId))
    ctx.session.data = undefined

    await ctx.reply(`${EMOJIS.success} <b>To'lov qaytarildi!</b>\n\nInvoice: <code>${text}</code>\nFoydalanuvchi: <code>${payment.userId}</code>`, { parse_mode: 'HTML' })
  } catch (error) {
    logger.error(error, 'handleAdminRefundProcess error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

// ─── Broadcast ─────────────────────────────────────────────

export async function handleAdminBroadcast(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const text = `${EMOJIS.broadcast} <b>Broadcast boshqaruvi</b>\n\nBarcha foydalanuvchilarga xabar yuborish.\nEhtiyot bo'ling!`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: adminBroadcastKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleAdminBroadcast error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminSendBroadcast(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''

    let broadcastType: 'text' | 'photo' | 'video' | 'audio' = 'text'
    if (data === 'admin_broadcast_photo') broadcastType = 'photo'
    else if (data === 'admin_broadcast_video') broadcastType = 'video'
    else if (data === 'admin_broadcast_audio') broadcastType = 'audio'

    if (ctx.session) {
      ctx.session.data = {
        step: 'admin_broadcast_content',
        broadcastType,
        broadcastData: {},
      }
    }

    const typeText = broadcastType === 'text' ? 'matn' : broadcastType === 'photo' ? 'rasm' : broadcastType === 'video' ? 'video' : 'audio'
    const instruction = broadcastType === 'text'
      ? 'Xabar matnini kiriting (HTML formatda):'
      : `${typeText.charAt(0).toUpperCase() + typeText.slice(1)} fayl ID sini yuboring:`

    await ctx.editMessageText(
      `${EMOJIS.broadcast} <b>Broadcast yaratish</b>\n\n` +
      `Tur: ${typeText}\n\n${instruction}\n\n` +
      `${EMOJIS.cross} /cancel - Bekor qilish`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handleAdminSendBroadcast error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminSendBroadcastProcess(ctx: BotContext) {
  try {
    const step = ctx.session?.data?.step
    const data = ctx.session?.data
    if (!step || !data) return

    const text = ctx.message && 'text' in ctx.message ? ctx.message.text?.trim() : ''
    if (text === '/cancel') {
      ctx.session.data = undefined
      await ctx.reply(`${EMOJIS.check} Jarayon bekor qilindi.`)
      await handleAdminPanel(ctx)
      return
    }

    if (step === 'admin_broadcast_content') {
      const broadcastType = data.broadcastType

      if (broadcastType === 'text') {
        if (!text) return
        data.broadcastData.content = text
      } else {
        const msg = ctx.message as any
        const mediaFileId = msg?.video?.file_id || msg?.photo?.[0]?.file_id || msg?.audio?.file_id || text
        if (!mediaFileId) {
          await ctx.reply(`${EMOJIS.warning} Iltimos, fayl yuboring yoki fayl ID sini kiriting.`)
          return
        }
        data.broadcastData.mediaFileId = mediaFileId
        if (text && !mediaFileId.startsWith('http')) data.broadcastData.content = text
      }

      data.step = 'admin_broadcast_preview'
      const preview = data.broadcastData.content || 'Kontent'
      await ctx.reply(
        `${EMOJIS.broadcast} <b>Broadcast preview:</b>\n\n${preview}\n\n${EMOJIS.warning} Yuborishni tasdiqlaysizmi?`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: `${EMOJIS.check} Yuborish`, callback_data: 'admin_broadcast_confirm_send' }],
              [{ text: `${EMOJIS.cross} Bekor qilish`, callback_data: 'admin_broadcast_cancel' }],
            ],
          },
        }
      )
    }
  } catch (error) {
    logger.error(error, 'handleAdminSendBroadcastProcess error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminBroadcastConfirm(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.session?.data
    if (!data || data.step !== 'admin_broadcast_preview') return

    const bot = ctx.telegram as any
    const broadcast = await BroadcastService.createBroadcast(
      data.broadcastType,
      data.broadcastData.content,
      data.broadcastData.mediaFileId,
      undefined,
      ctx.from?.id || 0
    )

    await logAdminAction(ctx, 'broadcast_send', String((broadcast as any)._id), data.broadcastType)
    await ctx.editMessageText(`${EMOJIS.broadcast} Broadcast yuborilmoqda... Bu biroz vaqt olishi mumkin.`)

    BroadcastService.sendToAllUsers(bot, String((broadcast as any)._id)).then(() => {
      logger.info('Broadcast completed')
    }).catch((err) => {
      logger.error(err, 'Broadcast send error')
    })

    ctx.session.data = undefined
  } catch (error) {
    logger.error(error, 'handleAdminBroadcastConfirm error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

// ─── Stats ─────────────────────────────────────────────────

export async function handleAdminStats(ctx: BotContext) {
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
      `  Faol (24h): ${formatNumber(stats.activeUsers)}\n`,
      `  Premium: ${formatNumber(stats.premiumUsers)}\n\n`,
      `🎬 <b>Kontent:</b>\n`,
      `  Kinolar: ${formatNumber(stats.totalMovies)}\n`,
      `  Seriallar: ${formatNumber(stats.totalSeries)}\n`,
      `  Ko'rishlar: ${formatNumber(stats.totalViews)}\n\n`,
      `💰 <b>Daromad:</b>\n`,
      `  Jami: ${formatNumber(stats.totalRevenue)}⭐\n\n`,
      `⚙️ <b>Tizim:</b>\n`,
      `  MongoDB: ${health.mongodb}\n`,
      `  Redis: ${health.redis}\n`,
      `  Uptime: ${Math.floor(health.uptime / 60)} min`,
    ].join('')

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: `${EMOJIS.back} Orqaga`, callback_data: 'admin_dashboard' }]] },
    })
  } catch (error) {
    logger.error(error, 'handleAdminStats error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

// ─── Moderators ────────────────────────────────────────────

export async function handleAdminModerators(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const admins = await Admin.find({ isActive: true }).lean()

    const text = [
      `${EMOJIS.admin} <b>Moderatorlar boshqaruvi</b>\n\n`,
      `Jami moderatorlar: <b>${admins.length}</b>\n\n`,
      admins.map((a) => `🛡 <code>${a.userId}</code> | ${a.role} | ${a.username || 'Noma\'lum'}`).join('\n'),
      `\n\nKerakli amalni tanlang:`,
    ].join('')

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: adminModeratorsKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleAdminModerators error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminAddAdmin(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = { step: 'admin_add_admin_id' }
    }
    await ctx.editMessageText(
      `${EMOJIS.admin} <b>Admin qo'shish</b>\n\n` +
      `Foydalanuvchi Telegram ID sini kiriting:\n\n` +
      `Misol: <code>123456789</code>`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handleAdminAddAdmin error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminAddAdminProcess(ctx: BotContext) {
  try {
    const step = ctx.session?.data?.step
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text?.trim() : ''
    if (!step || !text) return

    if (text === '/cancel') {
      ctx.session.data = undefined
      await ctx.reply(`${EMOJIS.check} Jarayon bekor qilindi.`)
      await handleAdminPanel(ctx)
      return
    }

    const data = ctx.session.data!

    switch (step) {
      case 'admin_add_admin_id': {
        const userId = parseInt(text, 10)
        if (isNaN(userId)) {
          await ctx.reply(`${EMOJIS.warning} To'g'ri ID kiriting.`)
          return
        }
        const existing = await Admin.findOne({ userId })
        if (existing) {
          await ctx.reply(`${EMOJIS.warning} Bu foydalanuvchi allaqachon admin.`)
          return
        }
        data.adminId = userId
        data.step = 'admin_add_admin_role'
        await ctx.reply(`${EMOJIS.pencil} Rolni tanlang:\n\n<code>admin</code> | <code>moderator</code> | <code>support</code>`, { parse_mode: 'HTML' })
        break
      }
      case 'admin_add_admin_role': {
        const validRoles = ['admin', 'moderator', 'support']
        if (!validRoles.includes(text.toLowerCase())) {
          await ctx.reply(`${EMOJIS.warning} Noto'g'ri rol. Tanlang: admin, moderator, support`)
          return
        }
        data.adminRole = text.toLowerCase()
        data.step = 'admin_add_admin_permissions'

        const permButtons = Object.entries(ADMIN_PERMISSIONS).map(([key, perm]) => ({
          text: `${perm.default ? `${EMOJIS.check} ` : ''}${perm.label}`,
          callback_data: `admin_toggle_perm_${key}`,
        }))

        const rows: { text: string; callback_data: string }[][] = []
        for (let i = 0; i < permButtons.length; i += 2) {
          rows.push(permButtons.slice(i, i + 2))
        }
        rows.push([{ text: `${EMOJIS.check} Saqlash`, callback_data: 'admin_save_admin_permissions' }])

        data.adminPermissions = Object.entries(ADMIN_PERMISSIONS)
          .filter(([_, perm]) => perm.default)
          .map(([key]) => key)

        await ctx.reply(`${EMOJIS.pencil} Ruxsatlarni tanlang:\n\n(Boshlang'ich ruxsatlar belgilangan)`, {
          reply_markup: { inline_keyboard: rows },
        })
        break
      }
      default:
        await ctx.reply(`${EMOJIS.warning} Noma'lum qadam.`)
    }
  } catch (error) {
    logger.error(error, 'handleAdminAddAdminProcess error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminTogglePermission(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''
    const permKey = data.replace('admin_toggle_perm_', '')

    const perms = ctx.session?.data?.adminPermissions as string[] | undefined
    if (!perms) return

    const idx = perms.indexOf(permKey)
    if (idx >= 0) {
      perms.splice(idx, 1)
    } else {
      perms.push(permKey)
    }

    const permButtons = Object.entries(ADMIN_PERMISSIONS).map(([key, perm]) => ({
      text: `${perms.includes(key) ? `${EMOJIS.check} ` : ''}${perm.label}`,
      callback_data: `admin_toggle_perm_${key}`,
    }))

    const rows: { text: string; callback_data: string }[][] = []
    for (let i = 0; i < permButtons.length; i += 2) {
      rows.push(permButtons.slice(i, i + 2))
    }
    rows.push([{ text: `${EMOJIS.check} Saqlash`, callback_data: 'admin_save_admin_permissions' }])

    await ctx.editMessageReplyMarkup({ inline_keyboard: rows })
  } catch (error) {
    logger.error(error, 'handleAdminTogglePermission error')
    await ctx.answerCbQuery?.('Xatolik yuz berdi.', { show_alert: true })
  }
}

export async function handleAdminSaveAdmin(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.session?.data
    if (!data || !data.adminId) return

    const user = await UserService.getById(data.adminId)
    const username = user?.username || ''

    await Admin.create({
      userId: data.adminId,
      username,
      role: data.adminRole || 'moderator',
      permissions: data.adminPermissions || [],
      addedBy: ctx.from?.id || 0,
      isActive: true,
    })

    await logAdminAction(ctx, 'admin_add', String(data.adminId), username, `Role: ${data.adminRole}`)
    ctx.session.data = undefined

    await ctx.editMessageText(`${EMOJIS.success} <b>Admin qo'shildi!</b>\n\nID: <code>${data.adminId}</code>\nRol: ${data.adminRole}`, { parse_mode: 'HTML' })
  } catch (error) {
    logger.error(error, 'handleAdminSaveAdmin error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminRemoveAdmin(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const admins = await Admin.find({ isActive: true }).lean()

    if (admins.length === 0) {
      await ctx.editMessageText(`${EMOJIS.admin} O'chirish uchun adminlar mavjud emas.`)
      return
    }

    const buttons = admins.map((a) => [
      { text: `${EMOJIS.trash} <code>${a.userId}</code> ${a.role}`, callback_data: `admin_remove_admin_confirm_${a.userId}` },
    ])

    buttons.push([{ text: `${EMOJIS.back} Orqaga`, callback_data: 'admin_moderators' }])

    await ctx.editMessageText(`${EMOJIS.admin} <b>Admin o'chirish</b>\n\nO'chirmoqchi bo'lgan adminni tanlang:`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons },
    })
  } catch (error) {
    logger.error(error, 'handleAdminRemoveAdmin error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminRemoveAdminConfirm(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''
    const userId = parseInt(data.replace('admin_remove_admin_confirm_', ''), 10)

    const admin = await Admin.findOneAndUpdate({ userId }, { isActive: false }, { new: true })
    if (!admin) {
      await ctx.editMessageText(`${EMOJIS.error} Admin topilmadi.`)
      return
    }

    await logAdminAction(ctx, 'admin_remove', String(userId), admin.username)
    await ctx.editMessageText(`${EMOJIS.success} Admin o'chirildi: <code>${userId}</code>`, { parse_mode: 'HTML' })
  } catch (error) {
    logger.error(error, 'handleAdminRemoveAdminConfirm error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminPermissions(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const admins = await Admin.find({ isActive: true }).lean()

    if (admins.length === 0) {
      await ctx.editMessageText(`${EMOJIS.admin} Adminlar mavjud emas.`)
      return
    }

    const buttons = admins.map((a) => [
      { text: `${EMOJIS.pencil} <code>${a.userId}</code> ${a.role}`, callback_data: `admin_edit_perms_${a.userId}` },
    ])

    buttons.push([{ text: `${EMOJIS.back} Orqaga`, callback_data: 'admin_moderators' }])

    await ctx.editMessageText(`${EMOJIS.admin} <b>Ruxsatlarni tahrirlash</b>\n\nAdminni tanlang:`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons },
    })
  } catch (error) {
    logger.error(error, 'handleAdminPermissions error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

// ─── Settings ──────────────────────────────────────────────

export async function handleAdminSettings(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    await ctx.editMessageText(`${EMOJIS.settings} <b>Sozlamalar</b>\n\nKerakli bo'limni tanlang:`, {
      parse_mode: 'HTML',
      reply_markup: adminSettingsKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleAdminSettings error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

// ─── Logs ──────────────────────────────────────────────────

export async function handleAdminLogs(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    await ctx.editMessageText(`${EMOJIS.info} <b>Loglar</b>\n\nKerakli bo'limni tanlang:`, {
      parse_mode: 'HTML',
      reply_markup: adminLogsKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleAdminLogs error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAdminLogsView(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''
    let filter: Record<string, unknown> = {}

    if (data === 'admin_logs_admin') filter = { action: { $regex: /^admin_/ } }
    else if (data === 'admin_logs_users') filter = { action: { $regex: /^user_/ } }
    else if (data === 'admin_logs_payments') filter = { action: { $regex: /^payment_/ } }
    else if (data === 'admin_logs_errors') filter = { action: 'error' }

    const logs = await Log.find(filter).sort({ timestamp: -1 }).limit(20).lean()

    if (logs.length === 0) {
      await ctx.editMessageText(`${EMOJIS.info} Loglar mavjud emas.`)
      return
    }

    const lines = logs.map((l, i) =>
      `${i + 1}. [${new Date(l.timestamp).toLocaleString('uz-UZ')}] ${l.action} | ${l.adminName || l.adminId}`
    )

    await ctx.editMessageText(`${EMOJIS.info} <b>Loglar (oxirgi 20):</b>\n\n${lines.join('\n')}`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: `${EMOJIS.back} Orqaga`, callback_data: 'admin_logs' }]] },
    })
  } catch (error) {
    logger.error(error, 'handleAdminLogsView error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

// ─── Pagination ────────────────────────────────────────────

export async function handleAdminPagination(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''

    if (data.startsWith('admin_movie_list_page_')) {
      const page = parseInt(data.replace('admin_movie_list_page_', ''), 10)
      if (isNaN(page) || page < 1) return

      const { movies, total, totalPages } = await MovieService.getAll(page, PAGINATION.pageSize)
      if (movies.length === 0) {
        await ctx.editMessageText(`${EMOJIS.movie} Bu sahifada kinolar mavjud emas.`)
        return
      }

      const lines = movies.map((m, i) =>
        `${i + 1 + (page - 1) * PAGINATION.pageSize}. ${EMOJIS.movie} ${m.movieName} | <code>${m.movieCode}</code>`
      )
      await ctx.editMessageText(`${EMOJIS.movie} <b>Barcha kinolar (${total} ta)</b>\n\n${lines.join('\n')}`, {
        parse_mode: 'HTML',
        reply_markup: adminMovieListKeyboard(page, totalPages).reply_markup,
      })
    }
  } catch (error) {
    logger.error(error, 'handleAdminPagination error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

// ─── Keyboard helpers ──────────────────────────────────────

function adminMovieListKeyboard(page: number, totalPages: number) {
  const { Markup } = require('telegraf')
  const navButtons: ReturnType<typeof Markup.button.callback>[] = []
  if (page > 1) navButtons.push(Markup.button.callback(`${EMOJIS.prev} Oldingi`, `admin_movie_list_page_${page - 1}`))
  navButtons.push(Markup.button.callback(`${page}/${totalPages}`, 'page_info'))
  if (page < totalPages) navButtons.push(Markup.button.callback(`${EMOJIS.next} Keyingi`, `admin_movie_list_page_${page + 1}`))
  return Markup.inlineKeyboard([
    navButtons,
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_movies')],
  ])
}

function adminUsersKeyboard() {
  const { Markup } = require('telegraf')
  return Markup.inlineKeyboard([
    [Markup.button.callback(`${EMOJIS.users} Foydalanuvchilar ro'yxati`, 'admin_users_list')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

function adminPaymentsListKeyboard(page: number, totalPages: number) {
  const { Markup } = require('telegraf')
  const navButtons: ReturnType<typeof Markup.button.callback>[] = []
  if (page > 1) navButtons.push(Markup.button.callback(`${EMOJIS.prev} Oldingi`, `admin_payments_page_${page - 1}`))
  navButtons.push(Markup.button.callback(`${page}/${totalPages}`, 'page_info'))
  if (page < totalPages) navButtons.push(Markup.button.callback(`${EMOJIS.next} Keyingi`, `admin_payments_page_${page + 1}`))
  return Markup.inlineKeyboard([
    navButtons,
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_payments')],
  ])
}
