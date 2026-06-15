import { Markup } from 'telegraf'
import { ISeason, IEpisode } from '../types'
import { EMOJIS } from '../config/constants'

export function seriesDetailKeyboard(seriesCode: string) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`${EMOJIS.season} Fasllarni ko'rish`, `series_seasons:${seriesCode}`)],
    [
      Markup.button.callback(`${EMOJIS.heart} Saqlash`, `series_save:${seriesCode}`),
      Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back'),
    ],
  ])
}

export function seasonListKeyboard(seriesCode: string, seasons: ISeason[]) {
  const buttons = seasons.map((season) => [
    Markup.button.callback(`${EMOJIS.season} ${season.seasonNumber}-Fasl`, `season_episodes:${seriesCode}_${season.seasonNumber}`),
  ])

  buttons.push([Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back')])

  return Markup.inlineKeyboard(buttons)
}

export function episodeListKeyboard(seasonId: string, episodes: IEpisode[], page: number, totalPages: number) {
  const buttons = episodes.map((episode) => [
    Markup.button.callback(
      `${EMOJIS.episode} ${episode.episodeNumber}-Qism${episode.title ? ` - ${episode.title}` : ''}`,
      `episode_play:${seasonId}_${episode.episodeNumber}`,
    ),
  ])

  if (totalPages > 1) {
    const navButtons: ReturnType<typeof Markup.button.callback>[] = []

    if (page > 1) {
      navButtons.push(Markup.button.callback(`${EMOJIS.prev} Oldingi`, `episode_page:${seasonId}_${page - 1}`))
    }

    navButtons.push(Markup.button.callback(`${page}/${totalPages}`, 'page_info'))

    if (page < totalPages) {
      navButtons.push(Markup.button.callback(`${EMOJIS.next} Keyingi`, `episode_page:${seasonId}_${page + 1}`))
    }

    buttons.push(navButtons)
  }

  buttons.push([Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back')])

  return Markup.inlineKeyboard(buttons)
}

export function seriesSearchKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`${EMOJIS.search} Kod bo'yicha`, 'series_search_code')],
    [Markup.button.callback(`${EMOJIS.search} Nom bo'yicha`, 'series_search_name')],
    [Markup.button.callback(`${EMOJIS.category} Janr bo'yicha`, 'series_search_genre')],
    [Markup.button.callback(`${EMOJIS.year} Yil bo'yicha`, 'series_search_year')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back')],
  ])
}
