import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useCart } from '../../context/CartContext'
import { supabase } from '../../lib/supabase'
import { formatINR } from '../../lib/format'
import { computeDiscount } from '../../lib/discount'
import type { DiscountCode, PaymentMethod, QrConfig } from '../../lib/database.types'

interface Props {
  appliedCode: DiscountCode | null
  onClose: () => void
  onComplete: () => void
}

export default function CheckoutModal({ appliedCode, onClose, onComplete }: Props) {
  const { cartLines, subtotal, clearCart } = useCart()
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [qrConfig, setQrConfig] = useState<QrConfig | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const discount = computeDiscount(subtotal, appliedCode)
  const total = subtotal - discount.amount

  useEffect(() => {
    if (method !== 'phonepe') return
    setQrLoading(true)
    supabase
      .from('qr_configs')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        setQrConfig(data as QrConfig | null)
        setQrLoading(false)
      })
  }, [method])

  const handleConfirm = async () => {
    if (!method) return
    setSubmitting(true)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        subtotal,
        discount_amount: discount.amount,
        total,
        payment_method: method,
        discount_code_used: appliedCode?.code ?? null,
      })
      .select()
      .single()

    if (orderError || !order) {
      toast.error('Could not save order')
      setSubmitting(false)
      return
    }

    const items = cartLines.map((line) => ({
      order_id: order.id,
      product_id: line.product_id,
      quantity: line.quantity,
    }))
    const { error: itemsError } = await supabase.from('order_items').insert(items)
    if (itemsError) {
      toast.error('Order saved but line items failed')
      setSubmitting(false)
      return
    }

    if (appliedCode) {
      await supabase
        .from('discount_codes')
        .update({ used_count: appliedCode.used_count + 1 })
        .eq('id', appliedCode.id)
    }

    await clearCart()
    setSubmitting(false)
    toast.success(`Order #${order.id} complete — ${formatINR(total)}`)
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={submitting ? undefined : onClose} />
      <div className="relative bg-[#242424] border border-border rounded-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Checkout</h2>
          <button onClick={onClose} disabled={submitting} className="text-disabled hover:text-secondary">
            ✕
          </button>
        </div>

        <div className="bg-tertiary rounded-lg p-3 mb-4 text-sm">
          <div className="flex justify-between text-disabled">
            <span>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          {discount.amount > 0 && (
            <div className="flex justify-between text-success">
              <span>Discount</span>
              <span>−{formatINR(discount.amount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base mt-1 pt-1 border-t border-border">
            <span>Total</span>
            <span className="text-primary">{formatINR(total)}</span>
          </div>
        </div>

        {!method && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMethod('phonepe')}
              className="border border-border hover:border-primary rounded-xl py-6 flex flex-col items-center gap-2 transition-colors"
            >
              <span className="text-2xl">📱</span>
              <span className="font-medium">PhonePe QR</span>
            </button>
            <button
              onClick={() => setMethod('cash')}
              className="border border-border hover:border-primary rounded-xl py-6 flex flex-col items-center gap-2 transition-colors"
            >
              <span className="text-2xl">💵</span>
              <span className="font-medium">Cash</span>
            </button>
          </div>
        )}

        {method === 'phonepe' && (
          <div className="flex flex-col items-center gap-3">
            {qrLoading ? (
              <p className="text-disabled text-sm py-8">Loading QR…</p>
            ) : qrConfig ? (
              <>
                <img
                  src={qrConfig.qr_image_url}
                  alt={qrConfig.qr_name}
                  className="w-56 h-56 object-contain bg-white rounded-lg p-2"
                />
                <p className="text-disabled text-sm">{qrConfig.qr_name}</p>
              </>
            ) : (
              <p className="text-danger text-sm py-4 text-center">
                No active QR code configured. Set one up in Admin → QR Manager, or use Cash.
              </p>
            )}
            <div className="flex gap-2 w-full mt-2">
              <button
                onClick={() => setMethod(null)}
                disabled={submitting}
                className="flex-1 border border-border rounded-lg py-2.5 text-sm hover:bg-tertiary"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 bg-primary hover:bg-primary-hover disabled:bg-disabled text-secondary font-semibold rounded-lg py-2.5 text-sm"
              >
                {submitting ? 'Saving…' : 'Confirm Payment Received'}
              </button>
            </div>
          </div>
        )}

        {method === 'cash' && (
          <div className="flex flex-col gap-3">
            <p className="text-center text-sm text-disabled py-4">
              Confirm you've received <span className="text-secondary font-semibold">{formatINR(total)}</span>{' '}
              in cash.
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setMethod(null)}
                disabled={submitting}
                className="flex-1 border border-border rounded-lg py-2.5 text-sm hover:bg-tertiary"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 bg-primary hover:bg-primary-hover disabled:bg-disabled text-secondary font-semibold rounded-lg py-2.5 text-sm"
              >
                {submitting ? 'Saving…' : 'Confirm Cash Payment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
