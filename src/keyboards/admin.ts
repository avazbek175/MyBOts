import { Markup } from 'telegraf'
import { EMOJIS } from '../config/constants'

export function adminDashboardKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(`📊 Dashboard`, 'admin_dashboard_stats'),
      Markup.button.callback(`🎬 Kinolar`, 'admin_movies'),
    ],
    [
      Markup.button.callback(`🎞 Seriallar`, 'admin_series'),
      Markup.button.callback(`📂 Kategoriyalar`, 'admin_categories'),
    ],
    [
      Markup.button.callback(`📢 Kanallar`, 'admin_channels'),
      Markup.button.callback(`👥 Foydalanuvchilar`, 'admin_users'),
    ],
    [
      Markup.button.callback(`💎 Premium`, 'admin_premium'),
      Markup.button.callback(`⭐ To'lovlar`, 'admin_payments'),
    ],
    [
      Markup.button.callback(`📨 Broadcast`, 'admin_broadcast'),
      Markup.button.callback(`📈 Statistika`, 'admin_stats'),
    ],
    [
      Markup.button.callback(`🛡 Moderatorlar`, 'admin_moderators'),
      Markup.button.callback(`⚙ Sozlamalar`, 'admin_settings'),
    ],
    [
      Markup.button.callback(`📝 Loglar`, 'admin_logs'),
      Markup.button.callback(`🏠 Asosiy menyu`, 'main_menu'),
    ],
  ])
}

export function adminMoviesKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`🎬 Kino qo'shish`, 'admin_add_movie')],
    [Markup.button.callback(`📋 Kinolar ro'yxati`, 'admin_movies')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminSeriesKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`🎞 Serial qo'shish`, 'admin_add_series')],
    [Markup.button.callback(`📋 Seriallar ro'yxati`, 'admin_series')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminCategoriesKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`📂 Kategoriya qo'shish`, 'admin_add_category')],
    [Markup.button.callback(`📋 Kategoriyalar ro'yxati`, 'admin_categories')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminChannelsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`📢 Kanal qo'shish`, 'admin_add_channel')],
    [Markup.button.callback(`📋 Kanallar ro'yxati`, 'admin_channels')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminPremiumKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`💎 Premium berish`, 'admin_premium')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminPaymentsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`⭐ Barcha to'lovlar`, 'admin_payments')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminBroadcastKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`📨 Broadcast`, 'admin_broadcast')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminModeratorsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`🛡 Moderatorlar`, 'admin_moderators')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminSettingsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`⚙ Sozlamalar`, 'admin_settings')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminLogsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`📝 Loglar`, 'admin_logs')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}
