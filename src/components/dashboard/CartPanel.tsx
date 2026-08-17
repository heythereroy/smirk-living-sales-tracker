import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useCart } from '../../context/CartContext'
import { formatINR } from '../../lib/format'
import { parseManualDiscount, type AppliedDiscount } from '../../lib/discount'

interface Props {
  appliedDiscount: AppliedDiscount | null
  onApplyDiscount: (discount: AppliedDiscount | null) => void
  onCheckout: () => void
}

export default function CartPanel({ appliedDiscount, onApplyDiscount, onCheckout }: Props) {
  const { cartLines, subtotal, setQuantity, removeFromCart, clearCart } = useCart()
  const [discountInput, setDiscountInput] = useState('')

  const total = subtotal - (appliedDiscount?.amount ?? 0)

  const preview = useMemo(() => {
    if (!discountInput.trim()) return null
    return parseManualDiscount(discountInput, subtotal)
  }, [discountInput, subtotal])

  const handleApplyDiscount = () => {
    if (!preview) return
    if ('error' in preview) {
      toast.error(preview.error)
      return
    }
    onApplyDiscount(preview.discount)
    toast.success(
      preview.discount.type === 'percentage'
        ? `Discount of ${preview.discount.value}% applied`
        : `Discount of ${formatINR(preview.discount.value)} applied`,
    )
    setDiscountInput('')
  }

  const clearDiscount = () => {
    onApplyDiscount(null)
    setDiscountInput('')
  }

  const handleClearCart = async () => {
    await clearCart()
    clearDiscount()
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
        {appliedDiscount ? (
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-success">✓ {appliedDiscount.label} applied</span>
            <button className="text-disabled underline text-xs" onClick={clearDiscount}>
              Clear Discount
            </button>
          </div>
        ) : (
          <div className="mb-3">
            <p className="text-xs text-disabled mb-1">Apply Discount</p>
            <div className="flex gap-2">
              <input
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="e.g., 10 or 10%"
                className="flex-1 min-w-0 bg-tertiary border border-border rounded-lg px-2.5 py-1.5 text-sm placeholder:text-disabled focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleApplyDiscount}
                disabled={!discountInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-tertiary border border-border hover:border-primary disabled:opacity-50 text-sm shrink-0"
              >
                Apply Discount
              </button>
            </div>
            {preview && (
              <p className={`text-xs mt-1.5 ${'error' in preview ? 'text-danger' : 'text-success'}`}>
                {'error' in preview
                  ? preview.error
                  : `Preview: ${formatINR(subtotal)} − ${formatINR(preview.discount.amount)} = ${formatINR(subtotal - preview.discount.amount)}`}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-between text-sm text-disabled">
          <span>Subtotal</span>
          <span>{formatINR(subtotal)}</span>
        </div>
        {appliedDiscount && (
          <div className="flex justify-between text-sm text-success mt-1">
            <span>Discount Applied ({appliedDiscount.label})</span>
            <span>−{formatINR(appliedDiscount.amount)}</span>
          </div>
        )}

        <div className="mt-3 bg-primary rounded-lg px-4 py-3 flex justify-between items-center">
          <span className="font-semibold">Final Total</span>
          <span className="text-xl font-extrabold">{formatINR(total)}</span>
        </div>

        <div className="flex flex-col gap-2 mt-3">
          <button
            onClick={onCheckout}
            disabled={cartLines.length === 0}
            className="w-full bg-success hover:brightness-110 disabled:bg-disabled disabled:cursor-not-allowed text-secondary font-semibold py-2.5 rounded-lg transition-all"
          >
            Proceed to Checkout
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
