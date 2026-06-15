import { Markup } from 'telegraf'
import { IMovie } from '../types'
import { EMOJIS } from '../config/constants'

export function movieDetailKeyboard(movieCode: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(`${EMOJIS.views} Ko'rish`, `movie_play:${movieCode}`),
      Markup.button.callback(`${EMOJIS.download} Yuklab olish`, `movie_download:${movieCode}`),
    ],
    [
      Markup.button.callback(`${EMOJIS.heart} Saqlash`, `movie_save:${movieCode}`),
      Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back'),
    ],
  ])
}

export function movieListKeyboard(movies: IMovie[], page: number, totalPages: number) {
  const buttons = movies.map((movie, index) => [
    Markup.button.callback(`${index + 1 + (page - 1) * 10}. ${movie.movieName}`, `movie_detail:${movie.movieCode}`),
  ])

  if (totalPages > 1) {
    const navButtons: ReturnType<typeof Markup.button.callback>[] = []

    if (page > 1) {
      navButtons.push(Markup.button.callback(`${EMOJIS.prev} Oldingi`, `movie_page:${page - 1}`))
    }

    navButtons.push(Markup.button.callback(`${page}/${totalPages}`, 'page_info'))

    if (page < totalPages) {
      navButtons.push(Markup.button.callback(`${EMOJIS.next} Keyingi`, `movie_page:${page + 1}`))
    }

    buttons.push(navButtons)
  }

  buttons.push([Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back')])

  return Markup.inlineKeyboard(buttons)
}

export function movieSearchKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`${EMOJIS.search} Kod bo'yicha`, 'movie_search_code')],
    [Markup.button.callback(`${EMOJIS.search} Nom bo'yicha`, 'movie_search_name')],
    [Markup.button.callback(`${EMOJIS.category} Janr bo'yicha`, 'movie_search_genre')],
    [Markup.button.callback(`${EMOJIS.year} Yil bo'yicha`, 'movie_search_year')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back')],
  ])
}
