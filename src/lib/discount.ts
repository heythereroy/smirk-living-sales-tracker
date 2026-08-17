import type { DiscountCode } from './database.types'

// Discounts are manual only — the cashier must explicitly apply a named
// code or type a flat/percentage value. There is no automatic threshold
// discount.
export type AppliedDiscount =
  | { source: 'code'; code: DiscountCode; type: 'code'; value: number; amount: number; label: string }
  | { source: 'manual'; type: 'flat' | 'percentage'; value: number; amount: number; label: string }

export function discountFromCode(subtotal: number, code: DiscountCode): AppliedDiscount {
  const amount = Math.round((subtotal * code.discount_percent) / 100)
  return {
    source: 'code',
    code,
    type: 'code',
    value: code.discount_percent,
    amount,
    label: `${code.code} — ${code.discount_percent}% OFF`,
  }
}

export function parseManualDiscount(
  raw: string,
  subtotal: number,
): { discount: AppliedDiscount } | { error: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { error: 'Enter a discount value' }

  const isPercent = trimmed.endsWith('%')
  const numStr = isPercent ? trimmed.slice(0, -1).trim() : trimmed
  const num = Number(numStr)

  if (numStr === '' || isNaN(num) || num < 0) {
    return { error: 'Enter a valid number, e.g. 10 or 10%' }
  }

  if (isPercent) {
    if (num > 100) return { error: 'Percentage cannot exceed 100%' }
    const amount = Math.round((subtotal * num) / 100)
    return {
      discount: { source: 'manual', type: 'percentage', value: num, amount, label: `${num}% off` },
    }
  }

  if (num > subtotal) return { error: 'Discount cannot exceed cart total' }
  return {
    discount: { source: 'manual', type: 'flat', value: num, amount: num, label: `₹${num} off` },
  }
}
