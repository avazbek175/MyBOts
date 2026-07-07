import { Markup } from 'telegraf'
import { EMOJIS } from '../config/constants'

export function adminMainReplyKeyboard() {
  return Markup.keyboard([
    ['📊 Dashboard', '🎬 Kinolar', '📂 Kategoriyalar'],
    ['📢 Kanallar', '👥 Foydalanuvchilar', '💎 Premium'],
    ['⭐ To\'lovlar', '📨 Broadcast', '📈 Statistika'],
    ['🛡 Moderatorlar', '⚙ Sozlamalar', '📝 Loglar'],
    ['🏠 Bosh menyu'],
  ]).resize()
}

export function adminMoviesReplyKeyboard() {
  return Markup.keyboard([
    ['🎬 Kino qo\'shish', '📋 Kinolar ro\'yxati'],
    ['✏️ Kinoni tahrirlash', '🗑 Kinoni o\'chirish'],
    ['🔙 Admin panel'],
  ]).resize()
}

export function adminSeriesReplyKeyboard() {
  return Markup.keyboard([
    ['🎞 Serial qo\'shish', '📋 Seriallar ro\'yxati'],
    ['🔙 Admin panel'],
  ]).resize()
}

export function adminCategoriesReplyKeyboard() {
  return Markup.keyboard([
    ['📂 Kategoriya qo\'shish', '📋 Kategoriyalar ro\'yxati'],
    ['🔙 Admin panel'],
  ]).resize()
}

export function adminChannelsReplyKeyboard() {
  return Markup.keyboard([
    ['📢 Kanal qo\'shish', '📋 Kanallar ro\'yxati'],
    ['🔙 Admin panel'],
  ]).resize()
}

export function adminPremiumReplyKeyboard() {
  return Markup.keyboard([
    ['💎 Premium berish'],
    ['🔙 Admin panel'],
  ]).resize()
}

export function adminPaymentsReplyKeyboard() {
  return Markup.keyboard([
    ['⭐ Barcha to\'lovlar'],
    ['🔙 Admin panel'],
  ]).resize()
}

export function adminBroadcastReplyKeyboard() {
  return Markup.keyboard([
    ['📨 Yangi broadcast'],
    ['🔙 Admin panel'],
  ]).resize()
}

export function adminModeratorsReplyKeyboard() {
  return Markup.keyboard([
    ['🛡 Moderator qo\'shish'],
    ['🔙 Admin panel'],
  ]).resize()
}

export function adminSettingsReplyKeyboard() {
  return Markup.keyboard([
    ['🤖 Bot holati', '🔧 Xizmat rejimi'],
    ['📄 Sahifa hajmi', '📢 Kinolar kanali'],
    ['🔙 Admin panel'],
  ]).resize()
}

export function adminLogsReplyKeyboard() {
  return Markup.keyboard([
    ['🔧 Admin amallari', '👤 Foydalanuvchi amallari'],
    ['💳 To\'lov amallari', '❌ Xatoliklar'],
    ['🔙 Admin panel'],
  ]).resize()
}

// ─── Inline keyboards (for data views, pagination) ─────────

export function adminSettingsKeyboard(pageSize: number = 10, _channelLink?: string) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`🤖 Bot holati`, 'admin_settings_status')],
    [Markup.button.callback(`🔧 Xizmat rejimi`, 'admin_settings_maintenance')],
    [Markup.button.callback(`📄 Sahifa hajmi (${pageSize})`, 'admin_settings_pagesize')],
    [Markup.button.callback(`📢 Kinolar kanali`, 'admin_settings_channel_link')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_dashboard')],
  ])
}

export function adminSeriesListKeyboard(page: number, totalPages: number) {
  const navButtons: ReturnType<typeof Markup.button.callback>[] = []
  if (page > 1) navButtons.push(Markup.button.callback(`${EMOJIS.prev} Oldingi`, `admin_series_list_page_${page - 1}`))
  navButtons.push(Markup.button.callback(`${page}/${totalPages}`, 'page_info'))
  if (page < totalPages) navButtons.push(Markup.button.callback(`${EMOJIS.next} Keyingi`, `admin_series_list_page_${page + 1}`))
  return Markup.inlineKeyboard([
    navButtons,
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'admin_series')],
  ])
}
