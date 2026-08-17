// Discounts are manual only, and there is exactly one path to apply
// one: the cashier types a flat ₹ amount or a percentage directly.
// There is no discount-code lookup and no automatic threshold discount.
export interface AppliedDiscount {
  type: 'flat' | 'percentage'
  value: number
  amount: number
  label: string
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
      discount: { type: 'percentage', value: num, amount, label: `${num}% off` },
    }
  }

  if (num > subtotal) return { error: 'Discount cannot exceed cart total' }
  return {
    discount: { type: 'flat', value: num, amount: num, label: `₹${num} off` },
  }
}
