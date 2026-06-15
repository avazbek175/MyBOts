import { Markup } from 'telegraf'
import { EMOJIS, PREMIUM_PLANS } from '../config/constants'

type PremiumPlan = (typeof PREMIUM_PLANS)[number]

export function premiumPlansKeyboard(plans: PremiumPlan[]) {
  const buttons = plans.map((plan) => [
    Markup.button.callback(`${plan.label} - ${plan.stars} ${EMOJIS.star}`, `premium_select_${plan.key}`),
  ])

  buttons.push([Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back')])

  return Markup.inlineKeyboard(buttons)
}

export function premiumConfirmKeyboard(planKey: string) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`${EMOJIS.check} To'lovni tasdiqlash`, `premium_confirm_${planKey}`)],
    [Markup.button.callback(`${EMOJIS.back} Bekor qilish`, 'premium_cancel')],
  ])
}

export function premiumStatusKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`🔄 Uzaytirish`, 'premium_extend')],
    [Markup.button.callback(`${EMOJIS.back} Orqaga`, 'back')],
  ])
}
