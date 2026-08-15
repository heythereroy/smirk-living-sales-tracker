import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { formatINR } from '../../lib/format'
import { isAdmin } from '../../config'
import { useAuth } from '../../context/AuthContext'
import type { Order } from '../../lib/database.types'

function startOfTodayISO() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export default function DailySummary() {
  const { session } = useAuth()
  const admin = isAdmin(session?.user.email)
  const [orders, setOrders] = useState<Order[]>([])
  const [itemsSold, setItemsSold] = useState(0)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  const fetchSummary = useCallback(async () => {
    const { data: todaysOrders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startOfTodayISO())
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load daily summary')
      setLoading(false)
      return
    }

    const ordersList = (todaysOrders as Order[]) ?? []
    setOrders(ordersList)

    if (ordersList.length === 0) {
      setItemsSold(0)
      setLoading(false)
      return
    }

    const { data: items } = await supabase
      .from('order_items')
      .select('quantity')
      .in(
        'order_id',
        ordersList.map((o) => o.id),
      )
    setItemsSold((items ?? []).reduce((sum, i: { quantity: number }) => sum + i.quantity, 0))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSummary()
    const channel = supabase
      .channel('orders-summary')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchSummary())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchSummary())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchSummary])

  const revenue = orders.reduce((sum, o) => sum + o.total, 0)
  const lastOrder = orders[0]

  const handleReset = async () => {
    if (orders.length === 0) return
    const confirmed = window.confirm(
      `This permanently deletes ${orders.length} order(s) from today's summary. This cannot be undone. Continue?`,
    )
    if (!confirmed) return
    setResetting(true)
    const ids = orders.map((o) => o.id)
    const { error: itemsErr } = await supabase.from('order_items').delete().in('order_id', ids)
    if (itemsErr) {
      toast.error('Reset failed while clearing line items')
      setResetting(false)
      return
    }
    const { error: ordersErr } = await supabase.from('orders').delete().in('id', ids)
    if (ordersErr) {
      toast.error('Reset failed while clearing orders')
      setResetting(false)
      return
    }
    toast.success("Today's summary reset")
    setResetting(false)
  }

  return (
    <div className="bg-[#242424] border border-border rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold text-lg">Today's Summary</h2>
        {admin && (
          <button
            onClick={handleReset}
            disabled={resetting || orders.length === 0}
            className="text-xs text-danger hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed underline"
          >
            Reset Daily Summary
          </button>
        )}
      </div>
      {loading ? (
        <p className="text-disabled text-sm">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-disabled">Items Sold</p>
            <p className="text-xl font-bold">{itemsSold}</p>
          </div>
          <div>
            <p className="text-xs text-disabled">Revenue</p>
            <p className="text-xl font-bold text-primary">{formatINR(revenue)}</p>
          </div>
          <div>
            <p className="text-xs text-disabled">Orders</p>
            <p className="text-xl font-bold">{orders.length}</p>
          </div>
          <div>
            <p className="text-xs text-disabled">Last Order</p>
            <p className="text-sm font-medium">
              {lastOrder ? new Date(lastOrder.created_at).toLocaleTimeString() : '—'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
