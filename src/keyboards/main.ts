import { Markup } from 'telegraf'
import { EMOJIS } from '../config/constants'

export function mainMenuKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`${EMOJIS.movie} Kinolar`, 'movies')],
    [Markup.button.callback(`${EMOJIS.series} Seriallar`, 'series')],
    [Markup.button.callback(`${EMOJIS.fire} Top kinolar`, 'top_movies')],
    [Markup.button.callback(`${EMOJIS.user} Profil`, 'profile')],
  ])
}

export function backButton(action: string = 'main_menu') {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, action)],
  ])
}

export function backAndHomeButtons() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back'), Markup.button.callback('🏠 Bosh menyu', 'main_menu')],
  ])
}
