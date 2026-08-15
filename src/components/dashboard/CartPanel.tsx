import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useCart } from '../../context/CartContext'
import { supabase } from '../../lib/supabase'
import { formatINR } from '../../lib/format'
import { computeDiscount } from '../../lib/discount'
import type { DiscountCode } from '../../lib/database.types'

interface Props {
  appliedCode: DiscountCode | null
  onApplyCode: (code: DiscountCode | null) => void
  onCheckout: () => void
}

export default function CartPanel({ appliedCode, onApplyCode, onCheckout }: Props) {
  const { cartLines, subtotal, setQuantity, removeFromCart, clearCart } = useCart()
  const [codeInput, setCodeInput] = useState('')
  const [applying, setApplying] = useState(false)
  const [activeCodes, setActiveCodes] = useState<DiscountCode[]>([])

  useEffect(() => {
    supabase
      .from('discount_codes')
      .select('*')
      .eq('is_active', true)
      .then(({ data }) => setActiveCodes((data as DiscountCode[]) ?? []))
  }, [])

  const discount = computeDiscount(subtotal, appliedCode)
  const total = subtotal - discount.amount

  const handleApply = async () => {
    const trimmed = codeInput.trim()
    if (!trimmed) return
    setApplying(true)
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .ilike('code', trimmed)
      .eq('is_active', true)
      .maybeSingle()
    setApplying(false)
    if (error || !data) {
      toast.error('Invalid or inactive discount code')
      return
    }
    onApplyCode(data as DiscountCode)
    toast.success(`Applied ${(data as DiscountCode).code}`)
  }

  const handleClearCart = async () => {
    await clearCart()
    onApplyCode(null)
  }

  return (
    <div className="bg-[#242424] border border-border rounded-xl p-4 flex flex-col gap-4 sticky top-[70px]">
      <h2 className="font-bold text-lg">Cart</h2>

      {cartLines.length === 0 ? (
        <p className="text-disabled text-sm py-6 text-center">Cart is empty</p>
      ) : (
        <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto pr-1">
          {cartLines.map((line) => (
            <div key={line.id} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{line.product.name}</p>
                <p className="text-xs text-disabled">
                  {formatINR(line.product.price)} × {line.quantity} ={' '}
                  {formatINR(line.product.price * line.quantity)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setQuantity(line.id, line.quantity - 1)}
                  className="w-7 h-7 rounded bg-tertiary border border-border hover:border-primary text-sm"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm">{line.quantity}</span>
                <button
                  onClick={() => setQuantity(line.id, line.quantity + 1)}
                  className="w-7 h-7 rounded bg-tertiary border border-border hover:border-primary text-sm"
                >
                  +
                </button>
                <button
                  onClick={() => removeFromCart(line.id)}
                  className="ml-1 text-danger hover:text-red-400 text-xs"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border pt-3">
        {appliedCode ? (
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-success">Code {appliedCode.code} applied</span>
            <button
              className="text-disabled underline text-xs"
              onClick={() => {
                onApplyCode(null)
                setCodeInput('')
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="mb-2">
            <div className="flex gap-2">
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Discount code"
                className="flex-1 min-w-0 bg-tertiary border border-border rounded-lg px-2.5 py-1.5 text-sm placeholder:text-disabled focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleApply}
                disabled={applying || !codeInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-tertiary border border-border hover:border-primary disabled:opacity-50 text-sm shrink-0"
              >
                Apply
              </button>
            </div>
            {activeCodes.length > 0 && (
              <p className="text-xs text-disabled mt-1.5">
                Active codes:{' '}
                {activeCodes.map((c) => `${c.code} (${c.discount_percent}%)`).join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-between text-sm text-disabled">
          <span>Subtotal</span>
          <span>{formatINR(subtotal)}</span>
        </div>
        {discount.label && (
          <div className="flex justify-between text-sm text-success mt-1">
            <span>{discount.label}</span>
            <span>−{formatINR(discount.amount)}</span>
          </div>
        )}

        <div className="mt-3 bg-primary rounded-lg px-4 py-3 flex justify-between items-center">
          <span className="font-semibold">Total</span>
          <span className="text-xl font-extrabold">{formatINR(total)}</span>
        </div>

        <div className="flex flex-col gap-2 mt-3">
          <button
            onClick={onCheckout}
            disabled={cartLines.length === 0}
            className="w-full bg-success hover:brightness-110 disabled:bg-disabled disabled:cursor-not-allowed text-secondary font-semibold py-2.5 rounded-lg transition-all"
          >
            Checkout
          </button>
          <button
            onClick={handleClearCart}
            disabled={cartLines.length === 0}
            className="w-full border border-border hover:border-danger hover:text-danger disabled:opacity-40 text-sm py-2 rounded-lg transition-colors"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  )
}
