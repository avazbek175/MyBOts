import { Markup } from 'telegraf'
import { EMOJIS } from '../config/constants'

export function paginationKeyboard(prefix: string, page: number, totalPages: number) {
  const navButtons: ReturnType<typeof Markup.button.callback>[] = []

  if (page > 1) {
    navButtons.push(Markup.button.callback(`${EMOJIS.prev} Oldingi`, `${prefix}_page_${page - 1}`))
  }

  navButtons.push(Markup.button.callback(`${page}/${totalPages}`, 'page_info'))

  if (page < totalPages) {
    navButtons.push(Markup.button.callback(`${EMOJIS.next} Keyingi`, `${prefix}_page_${page + 1}`))
  }

  return Markup.inlineKeyboard([navButtons])
}

export function numberedListKeyboard<T>(
  items: T[],
  labelFn: (item: T) => string,
  prefix: string,
  page: number,
  totalPages: number,
) {
  const buttons = items.map((item, index) => [
    Markup.button.callback(`${index + 1 + (page - 1) * 10}. ${labelFn(item)}`, `${prefix}_${index}`),
  ])

  if (totalPages > 1) {
    const navButtons: ReturnType<typeof Markup.button.callback>[] = []

    if (page > 1) {
      navButtons.push(Markup.button.callback(`${EMOJIS.prev} Oldingi`, `${prefix}_page_${page - 1}`))
    }

    navButtons.push(Markup.button.callback(`${page}/${totalPages}`, 'page_info'))

    if (page < totalPages) {
      navButtons.push(Markup.button.callback(`${EMOJIS.next} Keyingi`, `${prefix}_page_${page + 1}`))
    }

    buttons.push(navButtons)
  }

  return Markup.inlineKeyboard(buttons)
}
