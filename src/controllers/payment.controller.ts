import { BotContext } from '../types'
import { PaymentService } from '../services/payment.service'
import { SubscriptionService } from '../services/subscription.service'
import { EMOJIS, PAGINATION } from '../config/constants'
import { logger } from '../utils/logger'

export async function handlePaymentSuccess(ctx: BotContext) {
  try {
    const message = ctx.message
    if (!message || !('successful_payment' in message)) return

    const successfulPayment = message.successful_payment
    const payload = successfulPayment.invoice_payload
    let parsed: { paymentId?: string; userId?: number; plan?: string }

    try {
      parsed = JSON.parse(payload)
    } catch {
      parsed = {}
    }

    const paymentId = parsed.paymentId || (successfulPayment as any).invoice_id || (successfulPayment as any).telegram_payment_charge_id
    const userId = parsed.userId || ctx.from?.id
    const plan = parsed.plan || 'premium_30d'

    if (!paymentId || !userId) {
      logger.error('Payment success handler missing required data')
      return
    }

    const payment = await PaymentService.completePayment(paymentId)
    if (!payment) {
      logger.error(`Payment not found: ${paymentId}`)
      await ctx.reply(`${EMOJIS.error} To'lov topilmadi. Iltimos, support bilan bog'laning.`)
      return
    }

    await SubscriptionService.createPremium(userId, plan)

    const planName = plan.replace('premium_', '').replace('_', ' ')
    await ctx.reply(
      `${EMOJIS.success} <b>To'lov muvaffaqiyatli amalga oshirildi!</b>\n\n` +
      `${EMOJIS.premium} Siz <b>${planName}</b> rejasini faollashtirdingiz.\n` +
      `${EMOJIS.movie} Endi barcha kinolar va seriallarni tomosha qilishingiz mumkin!\n\n` +
      `${EMOJIS.heart} Yoqimli tomosha!`,
      { parse_mode: 'HTML' }
    )

    logger.info(`Payment success processed: userId=${userId}, plan=${plan}, paymentId=${paymentId}`)
  } catch (error) {
    logger.error(error, 'handlePaymentSuccess error')
    await ctx.reply(`${EMOJIS.error} To'lovni qayta ishlashda xatolik yuz berdi.`)
  }
}

export async function handlePaymentFailed(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    await ctx.editMessageText(
      `${EMOJIS.error} <b>To'lov amalga oshmadi</b>\n\n` +
      `To'lov jarayonida xatolik yuz berdi.\n` +
      `Iltimos, qayta urinib ko'ring yoki support bilan bog'laning.`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handlePaymentFailed error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handlePaymentHistory(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const userId = ctx.from?.id
    if (!userId) return

    const page = 1
    const { payments, total, totalPages } = await PaymentService.getUserPayments(userId, page, PAGINATION.pageSize)

    if (payments.length === 0) {
      await ctx.editMessageText(
        `${EMOJIS.star} Sizda hali to'lovlar mavjud emas.\n\n` +
        `Premium sotib olish uchun "Premium" bo'limiga o'ting.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: `${EMOJIS.premium} Premium`, callback_data: 'premium_info' }],
              [{ text: `${EMOJIS.back} Orqaga`, callback_data: 'back' }],
            ],
          },
        }
      )
      return
    }

    const lines = payments.map((p, i) => {
      const date = new Date(p.createdAt).toLocaleDateString('uz-UZ')
      const statusEmoji = p.status === 'completed' ? EMOJIS.check : p.status === 'pending' ? '⏳' : p.status === 'refunded' ? '🔄' : EMOJIS.cross
      return `${i + 1}. ${statusEmoji} ${p.type.replace('premium_', '')} | ${p.stars}⭐ | ${date}`
    })

    const text = `${EMOJIS.star} <b>To'lov tarixi (${total} ta):</b>\n\n${lines.join('\n')}`

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: paymentHistoryKeyboard(page, totalPages).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handlePaymentHistory error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handleInvoiceCallback(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''

    if (data.startsWith('premium_select_')) {
      const { handlePremiumBuy } = await import('./premium.controller')
      await handlePremiumBuy(ctx)
    } else if (data.startsWith('premium_confirm_')) {
      const { handlePremiumConfirm } = await import('./premium.controller')
      await handlePremiumConfirm(ctx)
    } else if (data === 'premium_cancel' || data === 'premium_info') {
      const { handlePremiumInfo } = await import('./premium.controller')
      await handlePremiumInfo(ctx)
    } else {
      await ctx.editMessageText(`${EMOJIS.warning} Noma'lum buyruq.`)
    }
  } catch (error) {
    logger.error(error, 'handleInvoiceCallback error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handlePaymentPagination(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const userId = ctx.from?.id
    if (!userId) return

    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''
    const page = parseInt(data.replace('payment_page_', ''), 10)
    if (isNaN(page) || page < 1) return

    const { payments, total, totalPages } = await PaymentService.getUserPayments(userId, page, PAGINATION.pageSize)

    if (payments.length === 0) {
      await ctx.editMessageText(`${EMOJIS.star} Bu sahifada to'lovlar mavjud emas.`)
      return
    }

    const lines = payments.map((p, i) => {
      const date = new Date(p.createdAt).toLocaleDateString('uz-UZ')
      const statusEmoji = p.status === 'completed' ? EMOJIS.check : p.status === 'pending' ? '⏳' : p.status === 'refunded' ? '🔄' : EMOJIS.cross
      return `${i + 1 + (page - 1) * PAGINATION.pageSize}. ${statusEmoji} ${p.type.replace('premium_', '')} | ${p.stars}⭐ | ${date}`
    })

    const text = `${EMOJIS.star} <b>To'lov tarixi (${total} ta):</b>\n\n${lines.join('\n')}`
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: paymentHistoryKeyboard(page, totalPages).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handlePaymentPagination error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

function paymentHistoryKeyboard(page: number, totalPages: number) {
  const { Markup } = require('telegraf')
  const navButtons: ReturnType<typeof Markup.button.callback>[] = []

  if (page > 1) navButtons.push(Markup.button.callback(`${EMOJIS.prev} Oldingi`, `payment_page_${page - 1}`))
  navButtons.push(Markup.button.callback(`${page}/${totalPages}`, 'page_info'))
  if (page < totalPages) navButtons.push(Markup.button.callback(`${EMOJIS.next} Keyingi`, `payment_page_${page + 1}`))

  return Markup.inlineKeyboard([
    navButtons,
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back')],
  ])
}
