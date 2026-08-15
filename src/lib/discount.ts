import type { DiscountCode } from './database.types'

export const AUTO_DISCOUNT_THRESHOLD = 1500
export const AUTO_DISCOUNT_PERCENT = 10

export interface DiscountResult {
  percent: number
  amount: number
  label: string | null
  source: 'code' | 'auto' | null
}

// A manually applied code takes precedence over the automatic bulk discount
// rather than stacking with it — codes are deliberate promotions, the
// auto-discount is just a bulk-order incentive.
export function computeDiscount(subtotal: number, appliedCode: DiscountCode | null): DiscountResult {
  if (appliedCode) {
    const amount = Math.round((subtotal * appliedCode.discount_percent) / 100)
    return {
      percent: appliedCode.discount_percent,
      amount,
      label: `${appliedCode.code} — ${appliedCode.discount_percent}% OFF`,
      source: 'code',
    }
  }

  if (subtotal >= AUTO_DISCOUNT_THRESHOLD) {
    const amount = Math.round((subtotal * AUTO_DISCOUNT_PERCENT) / 100)
    return {
      percent: AUTO_DISCOUNT_PERCENT,
      amount,
      label: `${AUTO_DISCOUNT_PERCENT}% OFF — Save ${amount}`,
      source: 'auto',
    }
  }

  return { percent: 0, amount: 0, label: null, source: null }
}
