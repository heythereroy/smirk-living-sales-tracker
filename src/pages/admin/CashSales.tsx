import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useCart } from '../../context/CartContext'
import { useEvent } from '../../context/EventContext'
import { supabase } from '../../lib/supabase'
import { formatINR } from '../../lib/format'

export default function CashSales() {
  const { products } = useCart()
  const { activeEvent } = useEvent()
  const [productId, setProductId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const selected = useMemo(() => products.find((p) => p.id === productId) ?? null, [products, productId])
  const total = selected ? selected.price * quantity : 0

  const handleSubmit = async () => {
    if (!selected || quantity <= 0) {
      toast.error('Select a product and a valid quantity')
      return
    }
    if (!activeEvent) {
      toast.error('No active event — start an event before logging sales.')
      return
    }
    setSubmitting(true)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        subtotal: total,
        discount_amount: 0,
        total,
        payment_method: 'cash',
        discount_code_used: null,
        event_id: activeEvent.id,
      })
      .select()
      .single()

    if (orderError || !order) {
      toast.error('Could not save cash sale')
      setSubmitting(false)
      return
    }

    const { error: itemError } = await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: selected.id,
      quantity,
    })

    setSubmitting(false)
    if (itemError) {
      toast.error('Order saved but line item failed')
      return
    }

    toast.success(`Cash sale logged — ${formatINR(total)}`)
    setProductId('')
    setQuantity(1)
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Cash Sales Quick Log</h1>
      <p className="text-disabled text-sm mb-4">
        Manual backup entry for a cash sale outside the normal cart/checkout flow.
      </p>

      {!activeEvent && (
        <div className="bg-[#242424] border border-danger/40 rounded-xl p-4 max-w-md mb-4 text-sm text-disabled">
          No active event — start one from the Dashboard before logging cash sales.
        </div>
      )}

      <div className="bg-[#242424] border border-border rounded-xl p-4 max-w-md flex flex-col gap-3">
        <div>
          <label className="block text-sm text-disabled mb-1">Product</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          >
            <option value="">Select a product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatINR(p.price)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-disabled mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex justify-between items-center bg-tertiary rounded-lg px-3 py-2 text-sm">
          <span className="text-disabled">Total</span>
          <span className="font-bold text-primary">{formatINR(total)}</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !selected || !activeEvent}
          className="w-full bg-primary hover:bg-primary-hover disabled:bg-disabled text-secondary font-semibold py-2.5 rounded-lg"
        >
          {submitting ? 'Saving…' : 'Add Cash Sale'}
        </button>
      </div>
    </div>
  )
}
