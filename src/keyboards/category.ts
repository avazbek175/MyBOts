import { Markup } from 'telegraf'
import { ICategory } from '../types'
import { EMOJIS } from '../config/constants'

export function categorySelectionKeyboard(categories: ICategory[], prefix: string = 'category_select_') {
  const buttons = categories.map((cat) => [
    Markup.button.callback(`${cat.icon || EMOJIS.category} ${cat.name}`, `${prefix}${cat.slug}`),
  ])

  buttons.push([Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back')])

  return Markup.inlineKeyboard(buttons)
}

export function categoryContentKeyboard(categorySlug: string, page: number, totalPages: number) {
  const navButtons: ReturnType<typeof Markup.button.callback>[] = []

  if (page > 1) {
    navButtons.push(Markup.button.callback(`${EMOJIS.prev} Oldingi`, `category_page_${categorySlug}_${page - 1}`))
  }

  navButtons.push(Markup.button.callback(`${page}/${totalPages}`, 'page_info'))

  if (page < totalPages) {
    navButtons.push(Markup.button.callback(`${EMOJIS.next} Keyingi`, `category_page_${categorySlug}_${page + 1}`))
  }

  return Markup.inlineKeyboard([
    navButtons,
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back')],
  ])
}
