import { BotContext } from '../types'
import { MovieService } from '../services/movie.service'
import { CategoryService } from '../services/category.service'
import { categorySelectionKeyboard } from '../keyboards/category'
import { movieListKeyboard } from '../keyboards/movie'
import { EMOJIS, PAGINATION } from '../config/constants'
import { logger } from '../utils/logger'

export async function handleSearch(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const text = `${EMOJIS.search} <b>Qidirish</b>\n\nKino yoki serialni qidirish usulini tanlang:`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: (
        await import('../keyboards/main')
      ).backButton('main_menu').reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleSearch error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleSearchByCode(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = { searchMode: 'code' }
    }
    await ctx.reply(`${EMOJIS.search} Kino yoki serial kodini kiriting:\n\nMisol: <code>AVATAR</code>`, { parse_mode: 'HTML' })
  } catch (error) {
    logger.error(error, 'handleSearchByCode error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleSearchByName(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = { searchMode: 'name' }
    }
    await ctx.reply(`${EMOJIS.search} Kino yoki serial nomini kiriting:`, { parse_mode: 'HTML' })
  } catch (error) {
    logger.error(error, 'handleSearchByName error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleSearchByGenre(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const categories = await CategoryService.getAll()
    if (ctx.session) {
      ctx.session.data = { step: 'search_genre_selection' }
    }
    await ctx.editMessageText(`${EMOJIS.category} Janrni tanlang:`, {
      reply_markup: categorySelectionKeyboard(categories, 'search_genre:').reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleSearchByGenre error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleSearchByYear(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    if (ctx.session) {
      ctx.session.data = { searchMode: 'year' }
    }
    await ctx.reply(`${EMOJIS.search} Yilni kiriting:\n\nMisol: <code>2024</code>`, { parse_mode: 'HTML' })
  } catch (error) {
    logger.error(error, 'handleSearchByYear error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleSearchByGenreSelect(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const match = ctx.match as RegExpExecArray
    const genreSlug = match?.[1] || ''
    const category = await CategoryService.getBySlug(genreSlug)
    const genreName = category?.name || genreSlug

    const { movies, total } = await MovieService.getAll(1, PAGINATION.pageSize, { genre: genreSlug })

    if (movies.length === 0) {
      await ctx.editMessageText(`${EMOJIS.error} "${genreName}" janrida kinolar topilmadi.`)
      return
    }

    const text = `${EMOJIS.category} <b>${genreName} (${total} ta):</b>\n\n`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: movieListKeyboard(movies, 1, Math.ceil(total / PAGINATION.pageSize)).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleSearchByGenreSelect error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleSearchResults(ctx: BotContext, query?: string, page: number = 1) {
  try {
    const searchQuery = query || (ctx.message && 'text' in ctx.message ? ctx.message.text?.trim() : '')
    if (!searchQuery) {
      await ctx.reply(`${EMOJIS.warning} Qidiruv matnini kiriting.`)
      return
    }

    const { movies, total } = await MovieService.search(searchQuery, page, PAGINATION.pageSize)
    const totalPages = Math.ceil(total / PAGINATION.pageSize)

    if (movies.length === 0) {
      await ctx.reply(`${EMOJIS.error} "${searchQuery}" bo'yicha hech narsa topilmadi.`)
      return
    }

    const text = `${EMOJIS.search} <b>"${searchQuery}" bo'yicha (${total} ta):</b>\n\n`
    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: movieListKeyboard(movies, page, totalPages).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleSearchResults error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleSearchPagination(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''
    const parts = data.replace('search_page_', '').split('_')
    const page = parseInt(parts[parts.length - 1], 10)
    const query = parts.slice(0, -1).join('_')
    if (isNaN(page) || page < 1) return

    const { movies, total } = await MovieService.search(query, page, PAGINATION.pageSize)
    const totalPages = Math.ceil(total / PAGINATION.pageSize)

    if (movies.length === 0) {
      await ctx.editMessageText(`${EMOJIS.search} Bu sahifada natijalar mavjud emas.`)
      return
    }

    const text = `${EMOJIS.search} <b>"${query}" bo'yicha (${total} ta):</b>\n\n`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: movieListKeyboard(movies, page, totalPages).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleSearchPagination error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}
