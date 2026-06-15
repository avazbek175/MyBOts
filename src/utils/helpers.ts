import { ROLE_LEVELS } from '../config/constants'

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function generateCode(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')
}

export function parseUserFromCtx(ctx: any): {
  telegramId: number
  username?: string
  firstName?: string
  lastName?: string
} {
  const from = ctx.from
  return {
    telegramId: from.id,
    username: from.username,
    firstName: from.first_name,
    lastName: from.last_name,
  }
}

export function splitArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

export function hasPermission(userRole: string, requiredLevel: number): boolean {
  const userLevel = ROLE_LEVELS[userRole as keyof typeof ROLE_LEVELS]
  if (userLevel === undefined) return false
  return userLevel >= requiredLevel
}
