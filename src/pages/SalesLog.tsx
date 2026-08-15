import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { formatINR } from '../lib/format'
import { printReceipt } from '../lib/receipt'
import type { Order, Product } from '../lib/database.types'

interface LineWithProduct {
  id: number
  quantity: number
  product_id: number
  product: Product
}

export default function SalesLog() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [lines, setLines] = useState<Record<number, LineWithProduct[]>>({})

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) toast.error('Failed to load sales log')
    else setOrders(data as Order[])
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
    const channel = supabase
      .channel('sales-log')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const toggleExpand = async (orderId: number) => {
    if (expanded === orderId) {
      setExpanded(null)
      return
    }
    setExpanded(orderId)
    if (!lines[orderId]) {
      const { data, error } = await supabase
        .from('order_items')
        .select('id, quantity, product_id, product:products(*)')
        .eq('order_id', orderId)
      if (error) {
        toast.error('Failed to load order items')
        return
      }
      setLines((prev) => ({ ...prev, [orderId]: data as unknown as LineWithProduct[] }))
    }
  }

  const handlePrint = (order: Order) => {
    const items = lines[order.id]
    if (!items) return
    printReceipt(
      order,
      items.map((l) => ({ name: l.product.name, quantity: l.quantity, price: l.product.price })),
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Sales Log</h1>

      {loading ? (
        <p className="text-disabled text-sm">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-disabled text-sm">No orders yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((order) => (
            <div key={order.id} className="bg-[#242424] border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleExpand(order.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#2a2a2a]"
              >
                <div>
                  <p className="font-medium">
                    Order #{order.id}
                    {order.customer_name && <span className="text-disabled"> — {order.customer_name}</span>}
                  </p>
                  <p className="text-xs text-disabled">
                    {new Date(order.created_at).toLocaleString()} ·{' '}
                    {order.payment_method === 'phonepe' ? 'PhonePe' : 'Cash'}
                    {order.discount_code_used ? ` · Code: ${order.discount_code_used}` : ''}
                  </p>
                </div>
                <span className="font-bold text-primary">{formatINR(order.total)}</span>
              </button>

              {expanded === order.id && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                  {!lines[order.id] ? (
                    <p className="text-disabled text-sm">Loading items…</p>
                  ) : (
                    <>
                      <table className="w-full text-sm mb-3">
                        <tbody>
                          {lines[order.id].map((l) => (
                            <tr key={l.id}>
                              <td className="py-1">{l.product.name}</td>
                              <td className="py-1 text-center text-disabled">× {l.quantity}</td>
                              <td className="py-1 text-right">{formatINR(l.product.price * l.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(order.customer_phone || order.customer_email) && (
                        <p className="text-xs text-disabled mb-2">
                          {[order.customer_phone, order.customer_email].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <button
                        onClick={() => handlePrint(order)}
                        className="text-xs text-primary hover:text-primary-hover underline"
                      >
                        Print Receipt
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
