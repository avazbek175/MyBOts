import { BotContext } from '../types'
import { CategoryService } from '../services/category.service'
import { MovieService } from '../services/movie.service'
import { SeriesService } from '../services/series.service'
import { categorySelectionKeyboard } from '../keyboards/category'
import { movieListKeyboard } from '../keyboards/movie'
import { EMOJIS, PAGINATION } from '../config/constants'
import { logger } from '../utils/logger'

export async function handleCategoryList(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const categories = await CategoryService.getAll()

    if (categories.length === 0) {
      await ctx.editMessageText(`${EMOJIS.category} Hozircha kategoriyalar mavjud emas.`, {
        reply_markup: { inline_keyboard: [[{ text: `${EMOJIS.back} Orqaga`, callback_data: 'back' }]] },
      })
      return
    }

    const text = `${EMOJIS.category} <b>Kategoriyalar</b>\n\nKerakli kategoriyani tanlang:`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: categorySelectionKeyboard(categories, 'category:').reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleCategoryList error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleCategorySelect(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const match = ctx.match as RegExpExecArray
    const categorySlug = match?.[1] || ''
    const category = await CategoryService.getBySlug(categorySlug)

    if (!category) {
      await ctx.editMessageText(`${EMOJIS.error} Kategoriya topilmadi.`)
      return
    }

    const categoryId = (category as any)._id?.toString()
    const page = 1
    const { movies, total, totalPages } = await MovieService.getByCategory(categoryId, page, PAGINATION.pageSize)

    if (movies.length === 0) {
      const { seriesList } = await SeriesService.getAll(page, PAGINATION.pageSize)
      if (seriesList.length > 0) {
        await ctx.editMessageText(
          `${category.icon || EMOJIS.category} <b>${category.name}</b>\n\nBu kategoriyada kontent topilmadi.`,
          { parse_mode: 'HTML' }
        )
      } else {
        await ctx.editMessageText(
          `${category.icon || EMOJIS.category} <b>${category.name}</b>\n\nBu kategoriyada kontent topilmadi.`,
          { parse_mode: 'HTML' }
        )
      }
      return
    }

    const text = `${category.icon || EMOJIS.category} <b>${category.name}</b> (${total} ta):\n\n`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: movieListKeyboard(movies, page, totalPages).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleCategorySelect error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleCategoryPagination(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const match = ctx.match as RegExpExecArray
    const categorySlug = match?.[1] || ''
    const page = parseInt(match?.[2] || '1', 10)
    if (isNaN(page) || page < 1) return

    const category = await CategoryService.getBySlug(categorySlug)
    if (!category) return

    const categoryId = (category as any)._id?.toString()
    const { movies, total, totalPages } = await MovieService.getByCategory(categoryId, page, PAGINATION.pageSize)

    if (movies.length === 0) {
      await ctx.editMessageText(`${EMOJIS.category} Bu sahifada kontent mavjud emas.`)
      return
    }

    const text = `${category.icon || EMOJIS.category} <b>${category.name}</b> (${total} ta):\n\n`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: movieListKeyboard(movies, page, totalPages).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleCategoryPagination error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}
