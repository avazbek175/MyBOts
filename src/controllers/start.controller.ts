import { BotContext } from '../types'
import { mainMenuKeyboard } from '../keyboards/main'
import { EMOJIS } from '../config/constants'
import { UserService } from '../services/user.service'
import { logger } from '../utils/logger'

export async function startCommand(ctx: BotContext) {
  try {
    const from = ctx.from
    if (from) {
      await UserService.findOrCreate(from.id, {
        telegramId: from.id,
        username: from.username,
        firstName: from.first_name,
        lastName: from.last_name,
        languageCode: from.language_code,
      })
    }

    const name = ctx.from?.first_name || 'Foydalanuvchi'
    await ctx.replyWithPhoto(
      'https://via.placeholder.com/800x200/1a1a2e/ffffff?text=🎬+ULTIMATE+MOVIE+BOT',
      {
        caption: `${EMOJIS.movie} Assalomu alaykum, ${name}!

🎬 ULTIMATE MOVIE BOT - ga xush kelibsiz!

Bu yerda siz eng so'nggi kinolar va seriallarni tomosha qilishingiz mumkin.

🔍 Kino kodi bo'yicha qidirish
📂 Kategoriyalar bo'yicha ko'rish
💎 Premium sotib olish

Marhamat, kerakli bo'limni tanlang:`,
        ...mainMenuKeyboard(),
      }
    )
  } catch (error) {
    logger.error(error, 'startCommand error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.`)
  }
}

export async function handleMainMenu(ctx: BotContext) {
  try {
    await ctx.editMessageText('🏠 Bosh menyu:', {
      reply_markup: mainMenuKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handleMainMenu error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}
