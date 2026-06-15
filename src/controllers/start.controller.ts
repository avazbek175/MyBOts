import { BotContext } from '../types'
import { mainMenuKeyboard } from '../keyboards/main'
import { EMOJIS } from '../config/constants'

export async function startCommand(ctx: BotContext) {
  const name = ctx.from?.first_name || 'Foydalanuvchi'
  await ctx.reply(
    `${EMOJIS.movie} Assalomu alaykum, ${name}!

🎬 ULTIMATE MOVIE BOT ga xush kelibsiz!

Bu yerda siz eng so'nggi kinolar va seriallarni topishingiz mumkin.

${EMOJIS.search} Kino kodi yoki nomi bilan qidirish
${EMOJIS.category} Kategoriyalar bo'yicha ko'rish
${EMOJIS.heart} Sevimlilar va tarix
${EMOJIS.premium} Premium sotib olish

Marhamat, kerakli bo'limni tanlang:`,
    { reply_markup: mainMenuKeyboard().reply_markup }
  )
}

export async function handleMainMenu(ctx: BotContext) {
  try {
    await ctx.editMessageText('🏠 *Bosh menyu:*', {
      parse_mode: 'Markdown',
      reply_markup: mainMenuKeyboard().reply_markup,
    })
  } catch {
    await ctx.reply('🏠 Bosh menyu:', {
      reply_markup: mainMenuKeyboard().reply_markup,
    })
  }
}
