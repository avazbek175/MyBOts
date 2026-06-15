import { BotContext } from '../types'
import { UserService } from '../services/user.service'
import { SubscriptionService } from '../services/subscription.service'
import { PaymentService } from '../services/payment.service'
import { premiumPlansKeyboard, premiumConfirmKeyboard, premiumStatusKeyboard } from '../keyboards/premium'
import { formatPremiumInfo } from '../utils/formatters'
import { EMOJIS, PREMIUM_PLANS } from '../config/constants'
import { logger } from '../utils/logger'

const PLANS = [...PREMIUM_PLANS]

export async function handlePremiumInfo(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const text = [
      `${EMOJIS.premium} <b>Premium rejalar</b>\n\n`,
      'Premium imkoniyatlari:\n',
      `${EMOJIS.check} Cheklanmagan kinolar va seriallar\n`,
      `${EMOJIS.check} Yuqori sifat (HD/4K)\n`,
      `${EMOJIS.check} Yuklab olish imkoniyati\n`,
      `${EMOJIS.check} Reklamasiz tomosha\n`,
      `${EMOJIS.check} Eksklyuziv kontent\n\n`,
      'Marhamat, rejani tanlang:\n',
    ].join('')

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: premiumPlansKeyboard(PLANS).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handlePremiumInfo error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handlePremiumBuy(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''
    const planKey = data.replace('premium_select_', '')
    const plan = PLANS.find((p) => p.key === planKey)

    if (!plan) {
      await ctx.answerCbQuery?.('Reja topilmadi.', { show_alert: true })
      return
    }

    const text = [
      `${EMOJIS.premium} <b>${plan.label}</b>\n\n`,
      `${formatPremiumInfo(plan)}\n\n`,
      `${EMOJIS.star} Narxi: <b>${plan.stars} yulduz</b>\n`,
      `${EMOJIS.warning} To'lov Telegram Stars orqali amalga oshiriladi.`,
    ].join('')

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: premiumConfirmKeyboard(planKey).reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handlePremiumBuy error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handlePremiumConfirm(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? (ctx.callbackQuery as any).data : ''
    const planKey = data.replace('premium_confirm_', '')
    const plan = PLANS.find((p) => p.key === planKey)

    if (!plan) {
      await ctx.answerCbQuery?.('Reja topilmadi.', { show_alert: true })
      return
    }

    const userId = ctx.from?.id
    if (!userId) return

    const payment = await PaymentService.createPayment(userId, planKey, plan.stars)
    const paymentId = (payment as any)._id?.toString()

    const title = `Ultimate Movie Bot - ${plan.label}`
    const description = `${plan.label} - ${plan.unit === 'lifetime' ? 'Butun umr' : `${plan.duration} kun`}`
    const payload = JSON.stringify({ paymentId, userId, plan: planKey })

    const invoiceLink = await ctx.telegram.createInvoiceLink({
      title,
      description,
      payload,
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: plan.label, amount: plan.stars }],
    })

    await PaymentService.createPayment(userId, planKey, plan.stars)

    await ctx.editMessageText(
      `${EMOJIS.premium} <b>To'lov uchun havola:</b>\n\n${invoiceLink}\n\n${EMOJIS.warning} Havolani bosing va to'lovni amalga oshiring.`,
      { parse_mode: 'HTML' }
    )
  } catch (error) {
    logger.error(error, 'handlePremiumConfirm error')
    await ctx.reply(`${EMOJIS.error} To'lov havolasini yaratishda xatolik.`)
  }
}

export async function handlePremiumStatus(ctx: BotContext) {
  try {
    await ctx.answerCbQuery?.()
    const userId = ctx.from?.id
    if (!userId) return

    const user = await UserService.getById(userId)
    if (!user) {
      await ctx.editMessageText(`${EMOJIS.error} Foydalanuvchi topilmadi.`)
      return
    }

    const isPremium = await SubscriptionService.isPremium(userId)

    if (!isPremium) {
      await ctx.editMessageText(
        `${EMOJIS.star} Sizda hozircha premium yo'q.\n\nPremium sotib olish uchun pastdagi tugmani bosing.`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: `${EMOJIS.premium} Premium olish`, callback_data: 'premium_info' }]],
          },
        }
      )
      return
    }

    const statusText = user.premiumLifetime
      ? `${EMOJIS.premium} Sizning premium holatingiz: <b>Lifetime</b>\n\n${EMOJIS.check} Siz butun umr premium foydalanuvchisisiz!`
      : `${EMOJIS.premium} Sizning premium holatingiz: <b>Faol</b>\n\n${EMOJIS.calendar} Tugash sanasi: ${user.premiumUntil?.toLocaleDateString('uz-UZ')}\n${EMOJIS.clock} ${Math.ceil((user.premiumUntil!.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} kun qoldi`

    await ctx.editMessageText(statusText, {
      parse_mode: 'HTML',
      reply_markup: premiumStatusKeyboard().reply_markup,
    })
  } catch (error) {
    logger.error(error, 'handlePremiumStatus error')
    await ctx.reply(`${EMOJIS.error} Xatolik yuz berdi.`)
  }
}

export async function handlePreCheckout(ctx: BotContext) {
  try {
    await ctx.answerPreCheckoutQuery(true)
    logger.info(`Pre-checkout approved: ${ctx.preCheckoutQuery?.id}`)
  } catch (error) {
    logger.error(error, 'handlePreCheckout error')
    try {
      await ctx.answerPreCheckoutQuery(false, 'Xatolik yuz berdi.')
    } catch { }
  }
}

export async function handleSuccessfulPayment(ctx: BotContext) {
  try {
    const message = ctx.message
    if (!message || !('successful_payment' in message)) return

    const payment = message.successful_payment
    const payload = payment.invoice_payload
    let parsed: { paymentId: string; userId: number; plan: string }

    try {
      parsed = JSON.parse(payload)
    } catch {
      logger.error('Failed to parse payment payload')
      return
    }

    const { userId, plan } = parsed

    await PaymentService.completePayment((payment as any).invoice_id || (payment as any).telegram_payment_charge_id)
    await UserService.updatePremium(userId, plan)

    await ctx.reply(
      `${EMOJIS.success} To'lov muvaffaqiyatli amalga oshirildi!\n\n${EMOJIS.premium} Premium holatingiz faollashtirildi. Endi barcha imkoniyatlardan foydalanishingiz mumkin!`,
      { parse_mode: 'HTML' }
    )

    logger.info(`Payment success for user ${userId}: ${plan}`)
  } catch (error) {
    logger.error(error, 'handleSuccessfulPayment error')
    await ctx.reply(`${EMOJIS.error} To'lovni qayta ishlashda xatolik.`)
  }
}

export async function handlePremiumReminder(ctx: BotContext, userId?: number) {
  try {
    const targetId = userId || ctx.from?.id
    if (!targetId) return

    const user = await UserService.getById(targetId)
    if (!user || !user.isPremium || !user.premiumUntil) return

    const daysLeft = Math.ceil((user.premiumUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysLeft > 3) return

    const text = [
      `${EMOJIS.notification} <b>Premium xabarnomasi</b>\n\n`,
      `Hurmatli ${user.firstName || 'foydalanuvchi'}!\n`,
      `Premium obunangiz ${daysLeft <= 0 ? 'tugadi' : `${daysLeft} kundan keyin tugaydi`}.\n\n`,
      daysLeft > 0
        ? `${EMOJIS.premium} Obunani uzaytirish uchun /premium buyrug'ini bosing.`
        : `${EMOJIS.premium} Qayta faollashtirish uchun /premium buyrug'ini bosing.`,
    ].join('')

    try {
      await ctx.telegram.sendMessage(targetId, text, { parse_mode: 'HTML' })
      logger.info(`Premium reminder sent to ${targetId}: ${daysLeft} days left`)
    } catch (err: any) {
      logger.error(err, `Failed to send reminder to ${targetId}`)
    }
  } catch (error) {
    logger.error(error, 'handlePremiumReminder error')
  }
}
