import { Telegraf, session } from 'telegraf'
import { config } from '../config'
import { BotContext } from '../types'
import { MovieService } from '../services/movie.service'
import { formatMovieInfo } from '../utils/formatters'
import { movieDetailKeyboard } from '../keyboards/movie'
import { authMiddleware } from '../middlewares/auth'
import { subscriptionMiddleware } from '../middlewares/subscription'
import { errorHandlerMiddleware as errorHandler } from '../middlewares/errorHandler'
import { rateLimitMiddleware } from '../middlewares/rateLimit'
import { antiSpamMiddleware } from '../middlewares/antiSpam'

import { startCommand, handleMainMenu } from '../controllers/start.controller'
import {
  handleMovieList, handleMovieDetail, handleMovieSearch,
  handleMovieSearchByCode, handleMovieSearchByName,
  handleMovieSearchByGenre, handleMovieSearchByYear,
  handleMoviePlay, handleMovieDownload, handleMoviePagination,
  handleMovieSave,
} from '../controllers/movie.controller'
import {
  handleSeriesList, handleSeriesDetail,
  handleSeasonList, handleEpisodeList, handleEpisodePlay,
  handleSeriesSearch, handleSeriesPagination, handleEpisodePagination,
  handleSeriesSave,
} from '../controllers/series.controller'
import {
  handleCategoryList, handleCategorySelect, handleCategoryPagination,
} from '../controllers/category.controller'
import {
  handleSearch, handleSearchByCode, handleSearchByName,
  handleSearchByGenre, handleSearchByYear, handleSearchResults,
  handleSearchPagination, handleSearchByGenreSelect,
} from '../controllers/search.controller'
import {
  handleProfile, handleFavorites,
  handleAddFavorite, handleRemoveFavorite,
  handleWatchHistory, handleClearHistory,
} from '../controllers/profile.controller'
import {
  handlePremiumInfo, handlePremiumBuy, handlePremiumConfirm,
  handlePremiumStatus, handlePreCheckout, handleSuccessfulPayment,
} from '../controllers/premium.controller'
import {
  handleAdminPanel, handleAdminDashboard,
  handleAdminMovies, handleAdminAddMovie, handleAdminDeleteMovie, handleAdminEditMovie,
  handleAdminSeries, handleAdminAddSeries, handleAdminAddSeason, handleAdminAddEpisode,
  handleAdminCategories, handleAdminAddCategory, handleAdminDeleteCategory,
  handleAdminChannels, handleAdminAddChannel, handleAdminDeleteChannel,
  handleAdminUsers, handleAdminUsersList, handleAdminBanUser, handleAdminUnbanUser,
  handleAdminPremium, handleAdminGrantPremium, handleAdminPremiumPrices,
  handleAdminPayments, handleAdminRefund,
  handleAdminBroadcast, handleAdminSendBroadcast,
  handleAdminStats,
  handleAdminModerators, handleAdminAddAdmin, handleAdminRemoveAdmin, handleAdminPermissions,
  handleAdminSettings, handleAdminLogs, handleAdminPagination,
  handleAdminAddChannelProcess, handleAdminAddMovieProcess, handleAdminAddMovieVideo,
  handleAdminAddSeriesProcess, handleAdminAddSeasonProcess, handleAdminAddEpisodeProcess,
  handleAdminAddCategoryProcess, handleAdminBanUserProcess, handleAdminGrantPremiumProcess,
  handleAdminRefundProcess, handleAdminSendBroadcastProcess, handleAdminAddAdminProcess,
} from '../controllers/admin.controller'
import {
  handleStats, handleDetailedStats,
  handleTopMovies, handleTopSeries,
  handleRecommendations,
} from '../controllers/stats.controller'

const bot = new Telegraf(config.bot.token)

bot.use(session())
bot.use(async (ctx, next) => {
  if (ctx.chat && ctx.chat.type !== 'private') return
  return next()
})
bot.use(errorHandler)
bot.use(authMiddleware)
bot.use(rateLimitMiddleware)
bot.use(antiSpamMiddleware)

bot.use(async (ctx, next) => {
  const txt = ctx.message && 'text' in ctx.message ? ctx.message.text : ''
  if (txt === '/start') return next()
  return subscriptionMiddleware(ctx, next)
})

bot.command('ping', async (ctx) => {
  await ctx.reply('🏓 *Pong!*\n\nBot ishlayapti ✅', { parse_mode: 'Markdown' })
})

bot.command('debug', async (ctx: BotContext) => {
  if (!ctx.from) return
  const owners = config.owner.ids
  if (!owners.includes(ctx.from.id)) {
    await ctx.reply('🚫 Bu buyruq faqat owner uchun.')
    return
  }
  const { default: mongoose } = await import('mongoose')
  const mongoState = ['disconnected', 'connected', 'connecting', 'disconnecting']
  await ctx.reply([
    '🔍 *BOT DEBUG*',
    '',
    `• Bot: ✅`,
    `• MongoDB: ${mongoState[mongoose.connection.readyState] || '?'}`,
    `• User: ${ctx.from.id}`,
    `• Owner IDs: [${owners.join(', ')}]`,
    `• Owner usernames: [${config.owner.usernames.join(', ')}]`,
    `• Role: ${ctx.session?.user?.role || 'none'}`,
    `• Time: ${new Date().toISOString()}`,
    `• Platform: Vercel`,
    `• Telegraf: v4`,
  ].join('\n'), { parse_mode: 'Markdown' })
})

bot.start(startCommand)
bot.command('menu', handleMainMenu)
bot.command('search', handleSearch)
bot.command('premium', handlePremiumInfo)
bot.command('profile', handleProfile)
bot.command('admin', handleAdminPanel)
bot.command('cancel', async (ctx: BotContext) => {
  if (ctx.session) {
    ctx.session.data = null
  }
  await ctx.reply('❌ Jarayon bekor qilindi.')
})
bot.command('stats', handleStats)

bot.action('main_menu', handleMainMenu)
bot.action('back', handleMainMenu)

bot.action('movies', handleMovieList)
bot.action('movie_search', handleMovieSearch)
bot.action('movie_search_code', handleMovieSearchByCode)
bot.action('movie_search_name', handleMovieSearchByName)
bot.action('movie_search_genre', handleMovieSearchByGenre)
bot.action('movie_search_year', handleMovieSearchByYear)
bot.action(/^movie_detail:(.+)$/, handleMovieDetail)
bot.action(/^movie_play:(.+)$/, handleMoviePlay)
bot.action(/^movie_download:(.+)$/, handleMovieDownload)
bot.action(/^movie_save:(.+)$/, handleMovieSave)
bot.action(/^movie_page:(\d+)$/, handleMoviePagination)

bot.action('series', handleSeriesList)
bot.action('series_search', handleSeriesSearch)
bot.action(/^series_detail:(.+)$/, handleSeriesDetail)
bot.action(/^series_seasons:(.+)$/, handleSeasonList)
bot.action(/^season_episodes:(.+)$/, handleEpisodeList)
bot.action(/^episode_play:(.+)$/, handleEpisodePlay)
bot.action(/^series_save:(.+)$/, handleSeriesSave)
bot.action(/^series_page:(\d+)$/, handleSeriesPagination)
bot.action(/^episode_page:(.+)$/, handleEpisodePagination)

bot.action('categories', handleCategoryList)
bot.action(/^category:(.+)$/, handleCategorySelect)
bot.action(/^category_page:(\w+):(\d+)$/, handleCategoryPagination)

bot.action('search', handleSearch)
bot.action('search_code', handleSearchByCode)
bot.action('search_name', handleSearchByName)
bot.action('search_genre', handleSearchByGenre)
bot.action('search_year', handleSearchByYear)
bot.action(/^search_results:(.+):(\d+)$/, (ctx) => {
  const match = ctx.match as RegExpExecArray
  return handleSearchResults(ctx, match[1]!, parseInt(match[2]!))
})
bot.action(/^search_page:(.+):(\d+)$/, handleSearchPagination)
bot.action(/^search_genre:(.+)$/, handleSearchByGenreSelect)

bot.action('profile', handleProfile)
bot.action('favorites', handleFavorites)
bot.action(/^fav_add:(.+):(.+)$/, handleAddFavorite)
bot.action(/^fav_remove:(.+)$/, handleRemoveFavorite)
bot.action('history', handleWatchHistory)
bot.action('clear_history', handleClearHistory)

bot.action('premium', handlePremiumInfo)
bot.action('premium_status', handlePremiumStatus)
bot.action(/^premium_buy:(.+)$/, handlePremiumBuy)
bot.action(/^premium_confirm:(.+)$/, handlePremiumConfirm)

bot.action('recommendations', handleRecommendations)

bot.action('admin_panel', handleAdminPanel)
bot.action('admin_dashboard', handleAdminDashboard)
bot.action('admin_movies', handleAdminMovies)
bot.action('admin_add_movie', handleAdminAddMovie)
bot.action(/^admin_delete_movie:(.+)$/, handleAdminDeleteMovie)
bot.action(/^admin_edit_movie:(.+)$/, handleAdminEditMovie)
bot.action('admin_series', handleAdminSeries)
bot.action('admin_add_series', handleAdminAddSeries)
bot.action(/^admin_add_season:(.+)$/, handleAdminAddSeason)
bot.action(/^admin_add_episode:(.+)$/, handleAdminAddEpisode)
bot.action('admin_categories', handleAdminCategories)
bot.action('admin_add_category', handleAdminAddCategory)
bot.action(/^admin_delete_category:(.+)$/, handleAdminDeleteCategory)
bot.action('admin_channels', handleAdminChannels)
bot.action('admin_add_channel', handleAdminAddChannel)
bot.action(/^admin_delete_channel:(.+)$/, handleAdminDeleteChannel)
bot.action('admin_users', handleAdminUsers)
bot.action('admin_users_list', handleAdminUsersList)
bot.action(/^admin_ban:(.+)$/, handleAdminBanUser)
bot.action(/^admin_unban:(.+)$/, handleAdminUnbanUser)
bot.action('admin_premium', handleAdminPremium)
bot.action(/^admin_grant_premium:(.+)$/, handleAdminGrantPremium)
bot.action('admin_premium_prices', handleAdminPremiumPrices)
bot.action('admin_payments', handleAdminPayments)
bot.action(/^admin_refund:(.+)$/, handleAdminRefund)
bot.action('admin_broadcast', handleAdminBroadcast)
bot.action('admin_send_broadcast', handleAdminSendBroadcast)
bot.action('admin_stats', handleAdminStats)
bot.action('admin_moderators', handleAdminModerators)
bot.action(/^admin_add_admin:(.+)$/, handleAdminAddAdmin)
bot.action(/^admin_remove_admin:(.+)$/, handleAdminRemoveAdmin)
bot.action(/^admin_permissions:(.+)$/, handleAdminPermissions)
bot.action('admin_settings', handleAdminSettings)
bot.action('admin_logs', handleAdminLogs)
bot.action(/^admin_page:([a-z_]+):(\d+)$/, handleAdminPagination)

bot.on('video', async (ctx) => {
  if ((ctx as any).session?.data?.step === 'admin_add_movie_video') {
    await handleAdminAddMovieVideo(ctx)
  }
})
bot.on('document', async (ctx) => {
  if ((ctx as any).session?.data?.step === 'admin_add_movie_video') {
    await handleAdminAddMovieVideo(ctx)
  }
})

bot.action('stats', handleStats)
bot.action('detailed_stats', handleDetailedStats)
bot.action('top_movies', handleTopMovies)
bot.action('top_series', handleTopSeries)

bot.action('check_subscription', async (ctx) => {
  await subscriptionMiddleware(ctx, async () => {
    await ctx.answerCbQuery('✅ Obuna tasdiqlandi!')
    await handleMainMenu(ctx)
  })
})

bot.on('pre_checkout_query', handlePreCheckout)
bot.on('successful_payment', handleSuccessfulPayment)

bot.on('text', async (ctx) => {
  const session = (ctx as any).session
  if (session?.data?.step) {
    const step = session.data.step
    if (step.startsWith('admin_add_movie')) {
      await handleAdminAddMovieProcess(ctx)
    } else if (step.startsWith('admin_add_series')) {
      await handleAdminAddSeriesProcess(ctx)
    } else if (step.startsWith('admin_add_season')) {
      await handleAdminAddSeasonProcess(ctx)
    } else if (step.startsWith('admin_add_episode')) {
      await handleAdminAddEpisodeProcess(ctx)
    } else if (step.startsWith('admin_add_category')) {
      await handleAdminAddCategoryProcess(ctx)
    } else if (step.startsWith('admin_ban')) {
      await handleAdminBanUserProcess(ctx)
    } else if (step.startsWith('admin_grant')) {
      await handleAdminGrantPremiumProcess(ctx)
    } else if (step.startsWith('admin_refund')) {
      await handleAdminRefundProcess(ctx)
    } else if (step.startsWith('admin_broadcast')) {
      await handleAdminSendBroadcastProcess(ctx)
    } else if (step.startsWith('admin_add_admin')) {
      await handleAdminAddAdminProcess(ctx)
    } else if (step.startsWith('admin_add_channel')) {
      await handleAdminAddChannelProcess(ctx)
    } else if (step.startsWith('admin_')) {
      await ctx.reply('❌ Noma\'lum admin qadam.')
    }
    return
  }

  if (session?.data?.searchMode === 'code') {
    session.data.searchMode = null
    await handleSearchResults(ctx, ctx.message.text, 1)
    return
  }
  if (session?.data?.searchMode === 'name') {
    session.data.searchMode = null
    await handleSearchResults(ctx, ctx.message.text, 1)
    return
  }
  if (session?.data?.searchMode === 'year') {
    session.data.searchMode = null
    await handleSearchResults(ctx, ctx.message.text, 1)
    return
  }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text?.trim() : ''
  if (text) {
    const movie = await MovieService.getByCode(text)
    if (movie) {
      await ctx.reply(formatMovieInfo(movie), { parse_mode: 'HTML', reply_markup: movieDetailKeyboard(movie.movieCode).reply_markup })
      return
    }
  }

  await handleSearchResults(ctx, ctx.message.text, 1)
})

export default bot
