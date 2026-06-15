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
    [Markup.button.callback(`🎬 Kino qo'shish`, 'admin_movie_add')],
    [Markup.button.callback(`📝 Kinoni tahrirlash`, 'admin_movie_edit')],
    [Markup.button.callback(`🗑 Kinoni o'chirish`, 'admin_movie_delete')],
    [Markup.button.callback(`📋 Kinolar ro'yxati`, 'admin_movie_list')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminSeriesKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`🎞 Serial qo'shish`, 'admin_series_add')],
    [Markup.button.callback(`📝 Serialni tahrirlash`, 'admin_series_edit')],
    [Markup.button.callback(`🗑 Serialni o'chirish`, 'admin_series_delete')],
    [Markup.button.callback(`📋 Seriallar ro'yxati`, 'admin_series_list')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminCategoriesKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`📂 Kategoriya qo'shish`, 'admin_category_add')],
    [Markup.button.callback(`📝 Kategoriyani tahrirlash`, 'admin_category_edit')],
    [Markup.button.callback(`🗑 Kategoriyani o'chirish`, 'admin_category_delete')],
    [Markup.button.callback(`📋 Kategoriyalar ro'yxati`, 'admin_category_list')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminChannelsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`📢 Kanal qo'shish`, 'admin_channel_add')],
    [Markup.button.callback(`📝 Kanalni tahrirlash`, 'admin_channel_edit')],
    [Markup.button.callback(`🗑 Kanalni o'chirish`, 'admin_channel_delete')],
    [Markup.button.callback(`📋 Kanallar ro'yxati`, 'admin_channel_list')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminPremiumKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`💎 Premium berish`, 'admin_premium_grant')],
    [Markup.button.callback(`🔄 Premium uzaytirish`, 'admin_premium_extend')],
    [Markup.button.callback(`➖ Premium olib tashlash`, 'admin_premium_remove')],
    [Markup.button.callback(`📋 Premium foydalanuvchilar`, 'admin_premium_list')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminPaymentsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`⭐ Barcha to'lovlar`, 'admin_payments_all')],
    [Markup.button.callback(`✅ Tasdiqlanganlar`, 'admin_payments_completed')],
    [Markup.button.callback(`❌ Muvaffaqiyatsiz`, 'admin_payments_failed')],
    [Markup.button.callback(`🔄 Kutilayotganlar`, 'admin_payments_pending')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminBroadcastKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`📝 Matnli broadcast`, 'admin_broadcast_text')],
    [Markup.button.callback(`🖼 Rasmli broadcast`, 'admin_broadcast_photo')],
    [Markup.button.callback(`🎥 Videoli broadcast`, 'admin_broadcast_video')],
    [Markup.button.callback(`🎵 Audioli broadcast`, 'admin_broadcast_audio')],
    [
      Markup.button.callback(`👥 Preview`, 'admin_broadcast_preview'),
      Markup.button.callback(`📨 Yuborish`, 'admin_broadcast_send'),
    ],
    [Markup.button.callback(`🔄 Bekor qilish`, 'admin_broadcast_cancel')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminModeratorsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`🛡 Moderator qo'shish`, 'admin_moderator_add')],
    [Markup.button.callback(`🗑 Moderatorni o'chirish`, 'admin_moderator_remove')],
    [Markup.button.callback(`📋 Moderatorlar ro'yxati`, 'admin_moderator_list')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminSettingsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`⚙ Asosiy sozlamalar`, 'admin_settings_general')],
    [Markup.button.callback(`🔔 Obuna sozlamalari`, 'admin_settings_subscription')],
    [Markup.button.callback(`🎨 Ko'rinish`, 'admin_settings_appearance')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminLogsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`📝 Admin loglari`, 'admin_logs_admin')],
    [Markup.button.callback(`👥 Foydalanuvchi loglari`, 'admin_logs_users')],
    [Markup.button.callback(`💰 To'lov loglari`, 'admin_logs_payments')],
    [Markup.button.callback(`❌ Xatolik loglari`, 'admin_logs_errors')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}
