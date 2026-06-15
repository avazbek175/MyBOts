import { BotContext } from '../types'
import { UserService } from '../services/user.service'
import { FavoriteService } from '../services/favorite.service'
import { WatchHistoryService } from '../services/watchHistory.service'
import { formatProfileInfo } from '../utils/formatters'
import { EMOJIS, PAGINATION } from '../config/constants'
import { logger } from '../utils/logger'

export async function handleProfile(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const userId = ctx.from?.id
    if (!userId) return

    const user = await UserService.getById(userId)
    if (!user) {
      await ctx.editMessageText(`${EMOJIS.error} Foydalanuvchi topilmadi.`)
      return
    }

    const favCount = await FavoriteService.getCount(userId)
    const historyResult = await WatchHistoryService.getAll(userId, 1, 1)
    const historyCount = historyResult.total

    const profileText = formatProfileInfo(user)
    const statsText = [
      '',
      `${EMOJIS.heart} Sevimlilar: <b>${favCount}</b>`,
      `${EMOJIS.history} Tomosha tarixi: <b>${historyCount}</b>`,
      user.isPremium
        ? user.premiumLifetime
          ? `${EMOJIS.premium} Holat: <b>Lifetime Premium</b>`
          : `${EMOJIS.premium} Holat: <b>Premium</b> (${user.premiumUntil?.toLocaleDateString('uz-UZ')})`
        : `${EMOJIS.star} Holat: <b>Bepul foydalanuvchi</b>`,
    ].join('\n')

    await ctx.editMessageText(`${profileText}\n${statsText}`, {
      parse_mode: 'HTML',
      reply_markup: profileKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleProfile error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleFavorites(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const userId = ctx.from?.id
    if (!userId) return

    const page = 1
    const { favorites, total, totalPages } = await FavoriteService.getAll(userId, page, PAGINATION.pageSize)

    if (favorites.length === 0) {
      await ctx.editMessageText(`${EMOJIS.heart} Sevimlilar ro'yxati bo'sh.\n\nKinolar yoki seriallarni sevimlilarga qo'shishingiz mumkin.`, {
        reply_markup: { inline_keyboard: [[{ text: `${EMOJIS.back} Orqaga`, callback_data: 'back' }]] },
      })
      return
    }

    const lines = favorites.map((fav, i) => {
      const name = fav.content?.movieName || fav.content?.seriesName || 'Noma\'lum'
      return `${i + 1}. ${fav.contentType === 'movie' ? EMOJIS.movie : EMOJIS.series} ${name}`
    })

    const text = `${EMOJIS.heart} <b>Sevimlilar (${total} ta):</b>\n\n${lines.join('\n')}`

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: favoritesListKeyboard(favorites, page, totalPages).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleFavorites error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleAddFavorite(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''
    const contentId = data.replace('fav_add:', '')
    const userId = ctx.from?.id
    if (!userId || !contentId) return

    const parts = contentId.split(':')
    const contentType = (parts[0] as 'movie' | 'series') || 'movie'
    const id = parts[1] || contentId

    await FavoriteService.add(userId, id, contentType)
    await ctx.answerCbQuery?.(`${EMOJIS.heart} Sevimlilarga qo'shildi!`, { show_alert: false })
  } catch (error) {
    logger.error(error, 'handleAddFavorite error')
    await ctx.answerCbQuery?.('Xatolik yuz berdi.', { show_alert: true })
  }
}

export async function handleRemoveFavorite(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''
    const contentId = data.replace('fav_remove:', '')
    const userId = ctx.from?.id
    if (!userId || !contentId) return

    await FavoriteService.remove(userId, contentId)
    await ctx.answerCbQuery?.(`${EMOJIS.remove} Sevimlilardan olib tashlandi!`, { show_alert: false })
  } catch (error) {
    logger.error(error, 'handleRemoveFavorite error')
    await ctx.answerCbQuery?.('Xatolik yuz berdi.', { show_alert: true })
  }
}

export async function handleWatchHistory(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const userId = ctx.from?.id
    if (!userId) return

    const page = 1
    const { history, total, totalPages } = await WatchHistoryService.getAll(userId, page, PAGINATION.pageSize)

    if (history.length === 0) {
      await ctx.editMessageText(`${EMOJIS.history} Tomosha tarixi bo'sh.`, {
        reply_markup: { inline_keyboard: [[{ text: `${EMOJIS.back} Orqaga`, callback_data: 'back' }]] },
      })
      return
    }

    const lines = history.map((h, i) => {
      const date = new Date(h.watchedAt).toLocaleDateString('uz-UZ')
      return `${i + 1}. ${h.contentType === 'movie' ? EMOJIS.movie : EMOJIS.series} ${date}`
    })

    const text = `${EMOJIS.history} <b>Tomosha tarixi (${total} ta):</b>\n\n${lines.join('\n')}`

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: historyListKeyboard(page, totalPages).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleWatchHistory error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleClearHistory(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const userId = ctx.from?.id
    if (!userId) return

    await WatchHistoryService.clear(userId)
    await ctx.answerCbQuery?.(`${EMOJIS.check} Tomosha tarixi tozalandi!`, { show_alert: false })
    await handleProfile(ctx)
  } catch (error) {
    logger.error(error, 'handleClearHistory error')
    await ctx.answerCbQuery?.('Xatolik yuz berdi.', { show_alert: true })
  }
}

function profileKeyboard() {
  const { Markup } = require('telegraf')
  return Markup.inlineKeyboard([
    [Markup.button.callback(`${EMOJIS.heart} Sevimlilar`, 'favorites')],
    [Markup.button.callback(`${EMOJIS.history} Tomosha tarixi`, 'history')],
    [Markup.button.callback(`${EMOJIS.premium} Premium`, 'premium_info')],
    [Markup.button.callback('🏠 Bosh menyu', 'main_menu')],
  ])
}

function favoritesListKeyboard(favorites: any[], page: number, totalPages: number) {
  const { Markup } = require('telegraf')
  const buttons = favorites.map((fav) => [
    Markup.button.callback(
      `${EMOJIS.remove} Olib tashlash`,
      `fav_remove:${fav.contentId}`
    ),
  ])

  if (totalPages > 1) {
    const navButtons: ReturnType<typeof Markup.button.callback>[] = []
    if (page > 1) navButtons.push(Markup.button.callback(`${EMOJIS.prev} Oldingi`, `fav_page_${page - 1}`))
    navButtons.push(Markup.button.callback(`${page}/${totalPages}`, 'page_info'))
    if (page < totalPages) navButtons.push(Markup.button.callback(`${EMOJIS.next} Keyingi`, `fav_page_${page + 1}`))
    buttons.push(navButtons)
  }

  buttons.push([Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back')])
  return Markup.inlineKeyboard(buttons)
}

function historyListKeyboard(page: number, totalPages: number) {
  const { Markup } = require('telegraf')
  const navButtons: ReturnType<typeof Markup.button.callback>[] = []

  if (page > 1) navButtons.push(Markup.button.callback(`${EMOJIS.prev} Oldingi`, `history_page_${page - 1}`))
  navButtons.push(Markup.button.callback(`${page}/${totalPages}`, 'page_info'))
  if (page < totalPages) navButtons.push(Markup.button.callback(`${EMOJIS.next} Keyingi`, `history_page_${page + 1}`))

  return Markup.inlineKeyboard([
    navButtons,
    [Markup.button.callback(`${EMOJIS.trash} Tarixni tozalash`, 'history_clear')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back')],
  ])
}
