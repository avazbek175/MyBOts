import { BotContext } from '../types'
import { mainMenuReplyKeyboard } from '../keyboards/main'
import { EMOJIS } from '../config/constants'

export async function startCommand(ctx: BotContext) {
  const name = ctx.from?.first_name || 'Foydalanuvchi'
  await ctx.reply(
    `${EMOJIS.movie} Assalomu alaykum, ${name}!

🎬 <b>Kino Prime | UZ</b> ga xush kelibsiz!

Bu yerda siz eng so'nggi kinolarni topishingiz mumkin.

🔍 Kino kodi bilan qidirish
❤️ Sevimlilar va tarix
💎 Premium sotib olish

Marhamat, kerakli bo'limni tanlang:`,
    { parse_mode: 'HTML', reply_markup: mainMenuReplyKeyboard().reply_markup }
  )
}

export async function handleMainMenu(ctx: BotContext) {
  try {
    await ctx.reply('🏠 *Bosh menyu:*', {
      parse_mode: 'Markdown',
      reply_markup: mainMenuReplyKeyboard().reply_markup,
    })
  } catch {
    await ctx.reply('🏠 Bosh menyu:', {
      reply_markup: mainMenuReplyKeyboard().reply_markup,
    })
  }
}
