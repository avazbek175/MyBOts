import { Telegraf, session } from 'telegraf'
import { config } from '../config'
import { BotContext } from '../types'
import { MovieService } from '../services/movie.service'
import { SeriesService } from '../services/series.service'
import { SettingService } from '../services/setting.service'
import { EMOJIS } from '../config/constants'
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
  handleMovieSave, handleMovieSearchResults,
} from '../controllers/movie.controller'
import {
  handleSeriesList, handleSeriesDetail,
  handleSeasonList, handleEpisodeList, handleEpisodePlay,
  handleSeriesSearch, handleSeriesPagination, handleEpisodePagination,
  handleSeriesSave, handleSeriesSearchByCode, handleSeriesSearchByName,
  handleSeriesSearchByGenre, handleSeriesSearchByYear, handleSeriesSearchByGenreSelect,
  handleSeriesSearchResults,
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
  handleFavoritePagination, handleHistoryPagination,
} from '../controllers/profile.controller'
import {
  handlePremiumInfo, handlePremiumBuy, handlePremiumConfirm,
  handlePremiumStatus, handlePreCheckout, handleSuccessfulPayment,
} from '../controllers/premium.controller'
import {
  handleAdminPanel, handleAdminDashboard,
  handleAdminMovies, handleAdminMovieList, handleAdminAddMovie, handleAdminDeleteMovie, handleAdminEditMovie,
  handleAdminSeries, handleAdminSeriesList, handleAdminAddSeries, handleAdminAddSeason, handleAdminAddEpisode,
  handleAdminChannels, handleAdminChannelList, handleAdminAddChannel, handleAdminDeleteChannel,
  handleAdminEditChannel, handleAdminEditChannelSelect, handleAdminEditChannelToggleActive,
  handleAdminEditChannelPromptName, handleAdminEditChannelPromptUrl, handleAdminEditChannelProcess,
  handleAdminUsers, handleAdminUsersList, handleAdminBanUser, handleAdminUnbanUser,
  handleAdminPremium, handleAdminGrantPremium, handleAdminPremiumPrices,
  handleAdminPayments, handleAdminRefund,
  handleAdminBroadcast, handleAdminSendBroadcast,
  handleAdminStats,
  handleAdminModerators, handleAdminAddAdmin, handleAdminRemoveAdmin, handleAdminPermissions,
  handleAdminSettings, handleAdminSettingsStatus, handleAdminSettingsMaintenance,
  handleAdminSettingsPageSize, handleAdminSettingsPageSizeProcess,
  handleAdminSettingsChannelLink, handleAdminSettingsChannelLinkProcess,
  handleAdminLogs, handleAdminLogsView, handleAdminPagination,
  handleAdminAddChannelProcess, handleAdminAddMovieProcess, handleAdminAddMovieVideo, handleAdminAddMovieCodeSelect,
  handleAdminAddSeriesProcess, handleAdminAddSeasonProcess, handleAdminAddEpisodeProcess,
  handleAdminBanUserProcess, handleAdminGrantPremiumProcess,
  handleAdminRefundProcess, handleAdminSendBroadcastProcess, handleAdminAddAdminProcess,
  handleAdminDeleteMovieConfirm, handleAdminDeleteChannelConfirm,
  handleAdminGrantPremiumSelect, handleAdminPaymentsAll, handleAdminBroadcastConfirm, handleAdminBroadcastCancel,
  handleAdminTogglePermission, handleAdminSaveAdmin, handleAdminRemoveAdminConfirm,
  handleAdminEditMovieSelect, handleAdminEditMovieField, handleAdminEditMovieProcess,
} from '../controllers/admin.controller'
import {
  handleStats, handleDetailedStats,
  handleTopMovies, handleTopSeries,
  handleRecommendations, handleTrending, handleTrendingPeriod,
} from '../controllers/stats.controller'


const bot = new Telegraf(config.bot.token)

bot.use(session())
bot.use(async (ctx, next) => {
  if (ctx.chat && ctx.chat.type !== 'private') return
  return next()
})
bot.use(errorHandler)
bot.use(async (ctx, next) => {
  try {
    const maintenance = await SettingService.isMaintenanceMode()
    if (maintenance) {
      const owners = config.owner.ids
      if (!owners.includes(ctx.from?.id || 0)) {
        await ctx.reply('🔧 Bot texnik ishlar uchun vaqtincha to\'xtatilgan.')
        return
      }
    }
  } catch {}
  return next()
})
bot.use(authMiddleware)
bot.use(rateLimitMiddleware)
bot.use(antiSpamMiddleware)

bot.use(async (ctx, next) => {
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
bot.action(/^movie_search_genre:(.+)$/, handleMovieSearchResults)

bot.action('series', handleSeriesList)
bot.action('series_search', handleSeriesSearch)
bot.action(/^series_detail:(.+)$/, handleSeriesDetail)
bot.action(/^series_seasons:(.+)$/, handleSeasonList)
bot.action(/^season_episodes:(.+)$/, handleEpisodeList)
bot.action(/^episode_play:(.+)$/, handleEpisodePlay)
bot.action(/^series_save:(.+)$/, handleSeriesSave)
bot.action(/^series_page:(\d+)$/, handleSeriesPagination)
bot.action(/^episode_page:(.+)$/, handleEpisodePagination)
bot.action('series_search_code', handleSeriesSearchByCode)
bot.action('series_search_name', handleSeriesSearchByName)
bot.action('series_search_genre', handleSeriesSearchByGenre)
bot.action(/^series_search_genre:(.+)$/, handleSeriesSearchByGenreSelect)
bot.action('series_search_year', handleSeriesSearchByYear)

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
bot.action(/^fav_page_(\d+)$/, handleFavoritePagination)
bot.action(/^history_page_(\d+)$/, handleHistoryPagination)
bot.action('history', handleWatchHistory)
bot.action('clear_history', handleClearHistory)

bot.action('premium', handlePremiumInfo)
bot.action('premium_status', handlePremiumStatus)
bot.action(/^premium_buy:(.+)$/, handlePremiumBuy)
bot.action(/^premium_confirm:(.+)$/, handlePremiumConfirm)

bot.action('recommendations', handleRecommendations)
bot.action('page_info', async (ctx) => { await ctx.answerCbQuery?.() })
bot.action('premium_cancel', handlePremiumInfo)
bot.action('premium_extend', handlePremiumInfo)

bot.action('admin_panel', handleAdminPanel)
bot.action('admin_dashboard', handleAdminDashboard)
bot.action('admin_movies', handleAdminMovies)
bot.action('admin_movie_list', handleAdminMovieList)
bot.action('admin_add_movie', handleAdminAddMovie)
bot.action(/^admin_add_movie_code_select:(.+)$/, handleAdminAddMovieCodeSelect)
bot.action('admin_delete_movie', handleAdminDeleteMovie)
bot.action(/^admin_movie_delete_confirm_(.+)$/, handleAdminDeleteMovieConfirm)
bot.action('admin_edit_movie', handleAdminEditMovie)
bot.action(/^admin_movie_edit_select:(.+)$/, handleAdminEditMovieSelect)
bot.action(/^admin_edit_movie_field:(.+):(.+)$/, handleAdminEditMovieField)
bot.action('admin_series', handleAdminSeries)
bot.action('admin_series_list', handleAdminSeriesList)
bot.action('admin_add_series', handleAdminAddSeries)
bot.action(/^admin_add_season:(.+)$/, handleAdminAddSeason)
bot.action(/^admin_add_episode:(.+)$/, handleAdminAddEpisode)
bot.action('admin_channels', handleAdminChannels)
bot.action('admin_add_channel', handleAdminAddChannel)
bot.action(/^admin_delete_channel:(.+)$/, handleAdminDeleteChannel)
bot.action(/^admin_channel_delete_confirm_(.+)$/, handleAdminDeleteChannelConfirm)
bot.action(/^admin_channel_edit_(?!name_|url_|toggle_)(.+)$/, handleAdminEditChannelSelect)
bot.action(/^admin_channel_edit_name_(.+)$/, handleAdminEditChannelPromptName)
bot.action(/^admin_channel_edit_url_(.+)$/, handleAdminEditChannelPromptUrl)
bot.action(/^admin_channel_edit_toggle_(.+)$/, handleAdminEditChannelToggleActive)
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
bot.action('admin_settings_status', handleAdminSettingsStatus)
bot.action('admin_settings_maintenance', handleAdminSettingsMaintenance)
bot.action('admin_settings_pagesize', handleAdminSettingsPageSize)
bot.action('admin_settings_channel_link', handleAdminSettingsChannelLink)
bot.action('admin_logs', handleAdminLogs)
bot.action(/^admin_logs_(admin|users|payments|errors)$/, handleAdminLogsView)
bot.action(/^admin_page:([a-z_]+):(\d+)$/, handleAdminPagination)
bot.action(/^admin_grant_plan_(.+)$/, handleAdminGrantPremiumSelect)
bot.action('admin_payments_all', handleAdminPaymentsAll)
bot.action('admin_broadcast_confirm_send', handleAdminBroadcastConfirm)
bot.action('admin_broadcast_cancel', handleAdminBroadcastCancel)
bot.action(/^admin_toggle_perm_(.+)$/, handleAdminTogglePermission)
bot.action('admin_save_admin_permissions', handleAdminSaveAdmin)
bot.action(/^admin_remove_admin_confirm_(.+)$/, handleAdminRemoveAdminConfirm)

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
bot.action('trending', handleTrending)
bot.action(/^trending_(\d+)d$/, handleTrendingPeriod)

// ─── ReplyKeyboard hears handlers ─────────────────────────

bot.hears('👤 Profil', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleProfile(ctx)
})
bot.hears('🛡 Admin', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminPanel(ctx)
})
bot.hears('🏠 Bosh menyu', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleMainMenu(ctx)
})

// ─── Admin ReplyKeyboard hears handlers ────────────────────

bot.hears('📊 Dashboard', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminDashboard(ctx)
})
bot.hears('🎬 Kinolar', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  if (ctx.session?.user?.role && ['owner', 'superadmin', 'admin', 'moderator', 'support'].includes(ctx.session.user.role)) {
    await handleAdminMovies(ctx)
  } else {
    await handleMovieList(ctx)
  }
})
bot.hears('📢 Kanallar', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminChannels(ctx)
})
bot.hears('👥 Foydalanuvchilar', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminUsers(ctx)
})
bot.hears('💎 Premium', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  if (ctx.session?.user?.role && ['owner', 'superadmin', 'admin', 'moderator', 'support'].includes(ctx.session.user.role)) {
    await handleAdminPremium(ctx)
  } else {
    await handlePremiumInfo(ctx)
  }
})
bot.hears("⭐ To'lovlar", async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminPayments(ctx)
})
bot.hears('📨 Broadcast', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminBroadcast(ctx)
})
bot.hears('📈 Statistika', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminStats(ctx)
})
bot.hears('🛡 Moderatorlar', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminModerators(ctx)
})
bot.hears('⚙ Sozlamalar', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminSettings(ctx)
})
bot.hears('📝 Loglar', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminLogs(ctx)
})

// ─── Admin sub-menu ReplyKeyboard hears handlers ───────────

bot.hears("🎬 Kino qo'shish", async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminAddMovie(ctx)
})
bot.hears("📋 Kinolar ro'yxati", async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminMovieList(ctx)
})
bot.hears("✏️ Kinoni tahrirlash", async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminEditMovie(ctx)
})
bot.hears("🗑 Kinoni o'chirish", async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminDeleteMovie(ctx)
})
bot.hears("📢 Kanal qo'shish", async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminAddChannel(ctx)
})
bot.hears("📋 Kanallar ro'yxati", async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminChannelList(ctx)
})
bot.hears("✏️ Kanal tahrirlash", async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminEditChannel(ctx)
})
bot.hears("🗑 Kanal o'chirish", async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminDeleteChannel(ctx)
})
bot.hears("💎 Premium berish", async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminGrantPremium(ctx)
})
bot.hears("⭐ Barcha to'lovlar", async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminPaymentsAll(ctx)
})
bot.hears('📨 Yangi broadcast', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminSendBroadcast(ctx)
})
bot.hears("🛡 Moderator qo'shish", async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminAddAdmin(ctx)
})
bot.hears("🔙 Admin panel", async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminPanel(ctx)
})
bot.hears('🤖 Bot holati', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminSettingsStatus(ctx)
})
bot.hears('🔧 Xizmat rejimi', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminSettingsMaintenance(ctx)
})
bot.hears('📄 Sahifa hajmi', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminSettingsPageSize(ctx)
})
bot.hears('📢 Kinolar kanali', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  await handleAdminSettingsChannelLink(ctx)
})
bot.hears('🔧 Admin amallari', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  ctx.match = ['', 'admin'] as any
  await handleAdminLogsView(ctx)
})
bot.hears("👤 Foydalanuvchi amallari", async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  ctx.match = ['', 'users'] as any
  await handleAdminLogsView(ctx)
})
bot.hears("💳 To'lov amallari", async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  ctx.match = ['', 'payments'] as any
  await handleAdminLogsView(ctx)
})
bot.hears('❌ Xatoliklar', async (ctx: BotContext) => {
  ctx.session = ctx.session || {}
  ctx.match = ['', 'errors'] as any
  await handleAdminLogsView(ctx)
})

bot.action('check_subscription', async (ctx) => {
  await subscriptionMiddleware(ctx, async () => {
    await ctx.answerCbQuery('✅ Obuna tasdiqlandi!')
    try { await ctx.deleteMessage() } catch {}
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
    } else if (step.startsWith('admin_edit_channel_')) {
      await handleAdminEditChannelProcess(ctx)
    } else if (step.startsWith('admin_edit_movie_')) {
      await handleAdminEditMovieProcess(ctx)
    } else if (step === 'admin_settings_pagesize') {
      await handleAdminSettingsPageSizeProcess(ctx)
    } else if (step === 'admin_settings_channel_link') {
      await handleAdminSettingsChannelLinkProcess(ctx)
    } else if (step.startsWith('admin_')) {
      await ctx.reply('❌ Noma\'lum admin qadam.')
    }
    return
  }

  if (session?.data?.step === 'movie_search_code' || session?.data?.step === 'search_code') {
    session.data.step = null
    session.data.searchMode = null
    const { MovieService } = require('../services/movie.service')
    const movie = await MovieService.getByCode(ctx.message.text.trim().toUpperCase())
    if (movie) {
      const { formatMovieInfo } = require('../utils/formatters')
      const { movieDetailKeyboard } = require('../keyboards/movie')
      await ctx.reply(formatMovieInfo(movie), { parse_mode: 'HTML', reply_markup: movieDetailKeyboard(movie.movieCode).reply_markup })
    } else {
      await ctx.reply('❌ Kino topilmadi.')
    }
    return
  }
  if (session?.data?.step === 'series_search_code') {
    session.data.step = null
    const series = await SeriesService.getByCode(ctx.message.text.trim().toUpperCase())
    if (series) {
      const { formatSeriesInfo } = require('../utils/formatters')
      const { seriesDetailKeyboard } = require('../keyboards/series')
      await ctx.reply(formatSeriesInfo(series), { parse_mode: 'HTML', reply_markup: seriesDetailKeyboard(series.seriesCode).reply_markup })
    } else {
      await ctx.reply('❌ Serial topilmadi.')
    }
    return
  }
  if (session?.data?.step === 'series_search_name' || session?.data?.step === 'series_search_year') {
    session.data.step = null
    await handleSeriesSearchResults(ctx, ctx.message.text)
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
    if (movie && movie.fileId) {
      const userId = ctx.from?.id
      if (userId) {
        try {
          const WatchHistoryService = (await import('../services/watchHistory.service')).WatchHistoryService
          const movieId = (movie as any)._id?.toString() || movie.movieCode
          await WatchHistoryService.add(userId, movieId, 'movie')
        } catch {}
      }
      await MovieService.incrementViews(movie.movieCode)
      await ctx.replyWithVideo(movie.fileId, {
        caption: `${EMOJIS.movie} <b>${movie.movieName}</b>\n\n${EMOJIS.views} Tomosha qiling, yoqimli tomosha!`,
        parse_mode: 'HTML',
        supports_streaming: true,
        protect_content: true,
      })
      return
    }
  }

  await handleSearchResults(ctx, ctx.message.text, 1)
})

export default bot
