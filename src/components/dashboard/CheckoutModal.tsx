import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useCart } from '../../context/CartContext'
import { useEvent } from '../../context/EventContext'
import { supabase } from '../../lib/supabase'
import { formatINR } from '../../lib/format'
import { printReceipt } from '../../lib/receipt'
import type { AppliedDiscount } from '../../lib/discount'
import type { Order, PaymentMethod, QrConfig } from '../../lib/database.types'

interface Props {
  appliedDiscount: AppliedDiscount | null
  onClose: () => void
  onComplete: () => void
}

type Step = 'details' | 'payment' | 'receipt'

export default function CheckoutModal({ appliedDiscount, onClose, onComplete }: Props) {
  const { cartLines, subtotal, clearCart } = useCart()
  const { activeEvent } = useEvent()
  const [step, setStep] = useState<Step>('details')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [qrConfig, setQrConfig] = useState<QrConfig | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)

  const discountAmount = appliedDiscount?.amount ?? 0
  const computedTotal = subtotal - discountAmount
  const [amount, setAmount] = useState(computedTotal)

  useEffect(() => {
    setAmount(computedTotal)
  }, [computedTotal])

  const receiptLines = useMemo(
    () => cartLines.map((l) => ({ name: l.product.name, quantity: l.quantity, price: l.product.price })),
    [cartLines],
  )

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

  const chooseMethod = (m: PaymentMethod) => {
    setMethod(m)
    setStep('payment')
  }

  const handleConfirm = async () => {
    if (!method) return
    if (!activeEvent) {
      toast.error('No active event — start an event before checking out.')
      return
    }
    setSubmitting(true)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        subtotal,
        discount_amount: discountAmount,
        total: amount,
        final_total: amount,
        payment_method: method,
        discount_code_used: appliedDiscount?.source === 'code' ? appliedDiscount.code.code : null,
        discount_type: appliedDiscount?.type ?? null,
        discount_value: appliedDiscount?.value ?? null,
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
        customer_email: customerEmail.trim() || null,
        event_id: activeEvent.id,
      })
      .select()
      .single()

    if (orderError || !order) {
      toast.error(
        orderError?.message.includes('customer_')
          ? 'Order failed — the customer_name/phone/email columns are missing. Run supabase/migration_add_customer_fields.sql first.'
          : orderError?.message.includes('event_id')
            ? 'Order failed — the event_id column is missing. Run supabase/migration_events.sql first.'
            : orderError?.message.includes('discount_type') || orderError?.message.includes('final_total')
              ? 'Order failed — discount tracking columns are missing. Run supabase/migration_discount_tracking.sql first.'
              : 'Could not save order',
      )
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

    if (appliedDiscount?.source === 'code') {
      await supabase
        .from('discount_codes')
        .update({ used_count: appliedDiscount.code.used_count + 1 })
        .eq('id', appliedDiscount.code.id)
    }

    await clearCart()

    // Re-fetch rather than trust the insert response, so the receipt
    // reflects exactly what's persisted.
    const { data: savedOrder } = await supabase.from('orders').select('*').eq('id', order.id).single()

    setSubmitting(false)
    setCompletedOrder((savedOrder as Order) ?? (order as Order))
    setStep('receipt')
    toast.success(`Order #${order.id} complete — ${formatINR(amount)}`)
  }

  const amountDiffersFromComputed = amount !== computedTotal

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={submitting ? undefined : onClose} />
      <div className="relative bg-[#242424] border border-border rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">{step === 'receipt' ? 'Order Complete' : 'Checkout'}</h2>
          {step !== 'receipt' && (
            <button onClick={onClose} disabled={submitting} className="text-disabled hover:text-secondary">
              ✕
            </button>
          )}
        </div>

        {step !== 'receipt' && (
          <div className="bg-tertiary rounded-lg p-3 mb-4 text-sm">
            <div className="flex justify-between text-disabled">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount{appliedDiscount ? ` (${appliedDiscount.label})` : ''}</span>
                <span>−{formatINR(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base mt-1 pt-1 border-t border-border">
              <span>Total</span>
              <span className="text-primary">{formatINR(computedTotal)}</span>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-disabled">Customer details (optional)</p>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
            <input
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />

            <p className="text-sm text-disabled mt-2">Payment method</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => chooseMethod('phonepe')}
                className="border border-border hover:border-primary rounded-xl py-6 flex flex-col items-center gap-2 transition-colors"
              >
                <span className="text-2xl">📱</span>
                <span className="font-medium">PhonePe QR</span>
              </button>
              <button
                onClick={() => chooseMethod('cash')}
                className="border border-border hover:border-primary rounded-xl py-6 flex flex-col items-center gap-2 transition-colors"
              >
                <span className="text-2xl">💵</span>
                <span className="font-medium">Cash</span>
              </button>
            </div>
          </div>
        )}

        {step === 'payment' && method === 'phonepe' && (
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

            <AmountField amount={amount} setAmount={setAmount} differs={amountDiffersFromComputed} />

            <div className="flex gap-2 w-full mt-2">
              <button
                onClick={() => setStep('details')}
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

        {step === 'payment' && method === 'cash' && (
          <div className="flex flex-col gap-3">
            <p className="text-center text-sm text-disabled py-2">Confirm the cash amount received.</p>
            <AmountField amount={amount} setAmount={setAmount} differs={amountDiffersFromComputed} />
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setStep('details')}
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

        {step === 'receipt' && completedOrder && (
          <div className="flex flex-col gap-4 items-center text-center">
            <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center text-success text-2xl">
              ✓
            </div>
            <div>
              <p className="font-bold text-lg">Order #{completedOrder.id}</p>
              <p className="text-primary text-2xl font-extrabold mt-1">{formatINR(completedOrder.total)}</p>
              <p className="text-disabled text-sm mt-1">
                Paid via {completedOrder.payment_method === 'phonepe' ? 'PhonePe' : 'Cash'}
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => printReceipt(completedOrder, receiptLines)}
                className="flex-1 border border-border rounded-lg py-2.5 text-sm hover:bg-tertiary"
              >
                Print Receipt
              </button>
              <button
                onClick={onComplete}
                className="flex-1 bg-primary hover:bg-primary-hover text-secondary font-semibold rounded-lg py-2.5 text-sm"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AmountField({
  amount,
  setAmount,
  differs,
}: {
  amount: number
  setAmount: (n: number) => void
  differs: boolean
}) {
  return (
    <div className="w-full">
      <label className="block text-sm text-disabled mb-1">Amount to charge (₹)</label>
      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
        className="w-full bg-tertiary border border-border rounded-lg px-3 py-2.5 text-lg font-semibold text-center focus:outline-none focus:border-primary"
      />
      {differs && <p className="text-xs text-disabled mt-1">Adjusted from the calculated total.</p>}
    </div>
  )
}
