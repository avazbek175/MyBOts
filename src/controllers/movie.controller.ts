import { BotContext } from '../types'
import { MovieService } from '../services/movie.service'
import { WatchHistoryService } from '../services/watchHistory.service'
import { FavoriteService } from '../services/favorite.service'
import {
  movieDetailKeyboard,
  movieListKeyboard,
  movieSearchKeyboard,
} from '../keyboards/movie'
import { categorySelectionKeyboard } from '../keyboards/category'
import { formatMovieInfo } from '../utils/formatters'
import { EMOJIS, PAGINATION } from '../config/constants'
import { logger } from '../utils/logger'
import { CategoryService } from '../services/category.service'

export async function handleMovieList(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const page = 1
    const { movies, total, totalPages } = await MovieService.getAll(page, PAGINATION.pageSize)

    if (movies.length === 0) {
      await ctx.editMessageText(`${EMOJIS.movie} Hozircha kinolar mavjud emas.`, {
        reply_markup: { inline_keyboard: [[{ text: `${EMOJIS.back} Orqaga`, callback_data: 'back' }]] },
      })
      return
    }

    const text = `${EMOJIS.movie} <b>Kinolar ro'yxati</b> (${total} ta):\n\n`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: movieListKeyboard(movies, page, totalPages).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleMovieList error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleMovieDetail(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const match = ctx.match as RegExpExecArray
    const movieCode = match?.[1] || ''
    const movie = await MovieService.getByCode(movieCode)

    if (!movie) {
      await ctx.editMessageText(`${EMOJIS.error} Kino topilmadi.`, {
        reply_markup: { inline_keyboard: [[{ text: `${EMOJIS.back} Orqaga`, callback_data: 'back' }]] },
      })
      return
    }

    const text = formatMovieInfo(movie)
    const caption = `${EMOJIS.movie} <b>${movie.movieName}</b>\n\n${text}`

    if (movie.poster) {
      await ctx.editMessageMedia(
        {
          type: 'photo',
          media: movie.poster,
          caption,
          parse_mode: 'HTML',
        },
        { reply_markup: movieDetailKeyboard(movie.movieCode).reply_markup }
      )
    } else {
      await ctx.editMessageText(caption, {
        parse_mode: 'HTML',
        reply_markup: movieDetailKeyboard(movie.movieCode).reply_markup,
      })
    }
  } catch (error) {
    logger.error(error, 'handleMovieDetail error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleMovieSearch(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    await ctx.editMessageText(`${EMOJIS.search} Qidirish turini tanlang:`, {
      reply_markup: movieSearchKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleMovieSearch error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleMovieSearchByCode(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = { step: 'movie_search_code' }
    }
    await ctx.editMessageText(
      `${EMOJIS.search} Kino kodini kiriting.\n\nMisol: <code>AVATAR01</code>`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handleMovieSearchByCode error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleMovieSearchByName(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = { step: 'movie_search_name' }
    }
    await ctx.editMessageText(
      `${EMOJIS.search} Kino nomini kiriting.\n\nMisol: <code>Avatar</code>`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handleMovieSearchByName error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleMovieSearchByGenre(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const categories = await CategoryService.getAll()
    await ctx.editMessageText(`${EMOJIS.category} Janrni tanlang:`, {
      reply_markup: categorySelectionKeyboard(categories, 'movie_search_genre:').reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleMovieSearchByGenre error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleMovieSearchByYear(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = { step: 'movie_search_year' }
    }
    await ctx.editMessageText(
      `${EMOJIS.search} Kino yilini kiriting.\n\nMisol: <code>2024</code>`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handleMovieSearchByYear error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleMoviePlay(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const match = ctx.match as RegExpExecArray
    const movieCode = match?.[1] || ''
    const movie = await MovieService.getByCode(movieCode)

    if (!movie) {
      await ctx.editMessageText(`${EMOJIS.error} Kino topilmadi.`)
      return
    }

    const userId = ctx.from?.id
    if (userId) {
      const movieId = (movie as any)._id?.toString() || movieCode
      await WatchHistoryService.add(userId, movieId, 'movie')
    }

    await MovieService.incrementViews(movieCode)
    await ctx.replyWithVideo(movie.fileId, {
      caption: `${EMOJIS.movie} <b>${movie.movieName}</b>\n\n${EMOJIS.views} Tomosha qiling, yoqimli tomosha!`,
      parse_mode: 'HTML',
      supports_streaming: true,
    })
  } catch (error) {
    logger.error(error, 'handleMoviePlay error')
    await ctx.reply(`${EMOJIS.error} Videoni yuklashda xatolik.`)
  }
}

export async function handleMovieDownload(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const match = ctx.match as RegExpExecArray
    const movieCode = match?.[1] || ''
    const movie = await MovieService.getByCode(movieCode)

    if (!movie) {
      await ctx.editMessageText(`${EMOJIS.error} Kino topilmadi.`)
      return
    }

    await MovieService.incrementDownloads(movieCode)
    await ctx.replyWithDocument(movie.fileId, {
      caption: `${EMOJIS.download} <b>${movie.movieName}</b> yuklab olindi.`,
      parse_mode: 'HTML',
    })
  } catch (error) {
    logger.error(error, 'handleMovieDownload error')
    await ctx.reply(`${EMOJIS.error} Yuklab olishda xatolik.`)
  }
}

export async function handleMoviePagination(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const match = ctx.match as RegExpExecArray
    const page = parseInt(match?.[1] || '1', 10)
    if (isNaN(page) || page < 1) return

    const { movies, total, totalPages } = await MovieService.getAll(page, PAGINATION.pageSize)

    if (movies.length === 0) {
      await ctx.editMessageText(`${EMOJIS.movie} Bu sahifada kinolar mavjud emas.`)
      return
    }

    const text = `${EMOJIS.movie} <b>Kinolar ro'yxati</b> (${total} ta):\n\n`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: movieListKeyboard(movies, page, totalPages).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleMoviePagination error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleMovieSave(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const match = ctx.match as RegExpExecArray
    const movieCode = match?.[1] || ''
    const movie = await MovieService.getByCode(movieCode)
    if (!movie) {
      await ctx.answerCbQuery?.('Kino topilmadi.', { show_alert: true })
      return
    }

    const userId = ctx.from?.id
    if (!userId) return

    const movieId = (movie as any)._id?.toString() || movieCode
    await FavoriteService.add(userId, movieId, 'movie')
    await ctx.answerCbQuery?.(`${EMOJIS.heart} Sevimlilarga qo'shildi!`, { show_alert: false })
  } catch (error) {
    logger.error(error, 'handleMovieSave error')
    await ctx.answerCbQuery?.('Xatolik yuz berdi.', { show_alert: true })
  }
}
