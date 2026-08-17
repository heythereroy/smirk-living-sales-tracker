import { useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { formatINR } from '../../lib/format'
import { discountLabel } from '../../lib/receipt'
import { usePolling } from '../../lib/usePolling'
import type { ArchivedEvent, Event, Order, Product } from '../../lib/database.types'

const POLL_MS = 5000

interface OrderItemRow {
  id: number
  order_id: number
  quantity: number
  product: Product | null
}

interface EventDetail {
  event: Event | null
  orders: Order[]
  itemsByOrder: Record<number, OrderItemRow[]>
}

export default function EventArchive() {
  const [archives, setArchives] = useState<ArchivedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [details, setDetails] = useState<Record<string, EventDetail>>({})
  const [detailLoading, setDetailLoading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchArchives = async () => {
    const { data, error } = await supabase
      .from('archived_events')
      .select('*')
      .order('event_date', { ascending: false })
    if (error) {
      toast.error('Failed to load archived events')
      setLoading(false)
      return
    }
    setArchives((data as ArchivedEvent[]) ?? [])
    setLoading(false)
  }

  usePolling(fetchArchives, POLL_MS)

  const loadDetail = async (archive: ArchivedEvent) => {
    if (!archive.event_id) {
      toast.error('This archived event has no linked event record to show details for')
      return
    }
    setDetailLoading(archive.id)

    const [{ data: event }, { data: orders }] = await Promise.all([
      supabase.from('events').select('*').eq('id', archive.event_id).maybeSingle(),
      supabase
        .from('orders')
        .select('*')
        .eq('event_id', archive.event_id)
        .order('created_at', { ascending: false }),
    ])

    const orderRows = (orders as Order[]) ?? []
    let itemsByOrder: Record<number, OrderItemRow[]> = {}
    if (orderRows.length > 0) {
      const { data: items } = await supabase
        .from('order_items')
        .select('id, order_id, quantity, product:products(*)')
        .in(
          'order_id',
          orderRows.map((o) => o.id),
        )
      itemsByOrder = ((items as unknown as OrderItemRow[]) ?? []).reduce<Record<number, OrderItemRow[]>>(
        (acc, item) => {
          ;(acc[item.order_id] ??= []).push(item)
          return acc
        },
        {},
      )
    }

    setDetails((prev) => ({ ...prev, [archive.id]: { event: (event as Event) ?? null, orders: orderRows, itemsByOrder } }))
    setDetailLoading(null)
  }

  const toggleExpand = (archive: ArchivedEvent) => {
    if (expandedId === archive.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(archive.id)
    if (!details[archive.id]) loadDetail(archive)
  }

  const handleDelete = async (archive: ArchivedEvent) => {
    const confirmed = window.confirm('Are you sure? This event data will be permanently deleted.')
    if (!confirmed) return
    setDeleting(archive.id)

    if (archive.event_id) {
      const { data: orders } = await supabase.from('orders').select('id').eq('event_id', archive.event_id)
      const orderIds = (orders ?? []).map((o: { id: number }) => o.id)
      if (orderIds.length > 0) {
        await supabase.from('order_items').delete().in('order_id', orderIds)
        await supabase.from('orders').delete().in('id', orderIds)
      }
    }
    await supabase.from('archived_events').delete().eq('id', archive.id)
    if (archive.event_id) {
      await supabase.from('events').delete().eq('id', archive.event_id)
    }

    setDeleting(null)
    setArchives((prev) => prev.filter((a) => a.id !== archive.id))
    if (expandedId === archive.id) setExpandedId(null)
    toast.success('Event deleted')
  }

  if (loading) {
    return <div className="text-center py-8 text-disabled">Loading events...</div>
  }

  if (archives.length === 0) {
    return (
      <div className="bg-[#242424] border border-border p-8 rounded-lg text-center">
        <p className="text-secondary mb-2">No archived events yet</p>
        <p className="text-sm text-disabled">Events are saved here automatically when you end them.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-2 text-secondary">Past Events</h1>

      <div className="flex flex-col gap-3">
        {archives.map((archive) => (
          <div key={archive.id} className="bg-[#242424] border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => toggleExpand(archive)}
              className="w-full text-left px-5 py-4 hover:bg-[#2a2a2a] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-semibold text-secondary">{archive.event_name}</p>
                  <p className="text-xs text-disabled">📅 {new Date(archive.event_date).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <Stat label="Revenue" value={formatINR(archive.total_revenue)} accent="text-primary" />
                  <Stat label="Profit" value={formatINR(archive.total_profit)} accent="text-success" />
                  <Stat label="Orders" value={String(archive.total_orders)} />
                </div>
              </div>
            </button>

            {expandedId === archive.id && (
              <div className="border-t border-border p-5">
                {detailLoading === archive.id ? (
                  <p className="text-disabled text-sm">Loading details…</p>
                ) : (
                  <EventDetailView
                    detail={details[archive.id]}
                    deleting={deleting === archive.id}
                    onDelete={() => handleDelete(archive)}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 bg-[#242424] border border-border p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-secondary">Overall Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-disabled text-sm">Total Events</p>
            <p className="text-2xl font-bold text-primary">{archives.length}</p>
          </div>
          <div className="text-center">
            <p className="text-disabled text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-success">
              {formatINR(archives.reduce((sum, e) => sum + e.total_revenue, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-disabled text-sm">Total Profit</p>
            <p className="text-2xl font-bold text-secondary">
              {formatINR(archives.reduce((sum, e) => sum + e.total_profit, 0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="text-right">
      <p className="text-disabled text-[10px] uppercase tracking-wide">{label}</p>
      <p className={`font-bold ${accent ?? 'text-secondary'}`}>{value}</p>
    </div>
  )
}

function EventDetailView({
  detail,
  deleting,
  onDelete,
}: {
  detail: EventDetail | undefined
  deleting: boolean
  onDelete: () => void
}) {
  if (!detail) return <p className="text-disabled text-sm">No detail available.</p>
  const { event, orders, itemsByOrder } = detail

  const grossRevenue = orders.reduce((sum, o) => sum + o.subtotal, 0)
  const totalDiscounts = orders.reduce((sum, o) => sum + o.discount_amount, 0)
  const netRevenue = orders.reduce((sum, o) => sum + o.total, 0)

  const productStats: { [name: string]: { qty: number; revenue: number; cogs: number } } = {}
  let totalCogs = 0
  Object.values(itemsByOrder)
    .flat()
    .forEach((item) => {
      if (!item.product) return
      const cogs = (item.product.cost_price + item.product.packaging_cost) * item.quantity
      totalCogs += cogs
      const entry = productStats[item.product.name] || { qty: 0, revenue: 0, cogs: 0 }
      entry.qty += item.quantity
      entry.revenue += item.product.price * item.quantity
      entry.cogs += cogs
      productStats[item.product.name] = entry
    })

  const totalExpenses = event
    ? event.booth_cost +
      event.transportation_cost +
      event.outside_help_cost +
      event.food_drinks_cost +
      event.accommodation_cost +
      event.miscellaneous_cost
    : 0

  const grossProfit = netRevenue - totalCogs
  const netProfit = grossProfit - totalExpenses
  const profitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0

  const cashOrders = orders.filter((o) => o.payment_method === 'cash')
  const phonepeOrders = orders.filter((o) => o.payment_method === 'phonepe')

  const topProducts = Object.entries(productStats)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-5">
      {event && (
        <div>
          <p className="text-sm text-disabled">
            {event.location} · {event.category}
            {event.participants ? ` · ${event.participants} participants` : ''}
          </p>
        </div>
      )}

      <Section title={`Orders (${orders.length})`}>
        {orders.length === 0 ? (
          <p className="text-disabled text-sm">No orders recorded.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.map((order) => (
              <div key={order.id} className="bg-tertiary border border-border rounded-lg p-3 text-sm">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-medium">Order #{order.id}</span>
                  <span className="text-disabled text-xs">{new Date(order.created_at).toLocaleString()}</span>
                </div>
                {(itemsByOrder[order.id] ?? []).map((item) =>
                  item.product ? (
                    <div key={item.id} className="flex justify-between text-xs text-disabled py-0.5">
                      <span>
                        {item.product.name} × {item.quantity} @ {formatINR(item.product.price)}
                      </span>
                      <span>{formatINR(item.product.price * item.quantity)}</span>
                    </div>
                  ) : null,
                )}
                <div className="flex justify-between text-xs mt-1.5 pt-1.5 border-t border-border">
                  <span className="text-disabled">
                    {order.discount_amount > 0
                      ? `Discount${discountLabel(order) ? `: ${discountLabel(order)}` : ''} (−${formatINR(order.discount_amount)})`
                      : 'No discount'}
                    {' · '}
                    {order.payment_method === 'phonepe' ? 'PhonePe' : 'Cash'}
                  </span>
                  <span className="font-semibold text-primary">{formatINR(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {event && (
        <Section title="Expenses">
          <Row label="Booth Cost" value={formatINR(event.booth_cost)} />
          <Row label="Transportation Cost" value={formatINR(event.transportation_cost)} />
          <Row label="Outside Help Cost" value={formatINR(event.outside_help_cost)} />
          <Row label="Food & Drinks Cost" value={formatINR(event.food_drinks_cost)} />
          <Row label="Accommodation Cost" value={formatINR(event.accommodation_cost)} />
          <Row label="Miscellaneous Cost" value={formatINR(event.miscellaneous_cost)} />
          <Row label="Total Expenses" value={formatINR(totalExpenses)} bold />
        </Section>
      )}

      <Section title="Financial Summary">
        <Row label="Total Revenue (before discounts)" value={formatINR(grossRevenue)} />
        <Row label="Total Discounts Applied" value={`−${formatINR(totalDiscounts)}`} />
        <Row label="Net Revenue (after discounts)" value={formatINR(netRevenue)} bold />
        <Row label="Total COGS" value={formatINR(totalCogs)} />
        <Row label="Gross Profit" value={formatINR(grossProfit)} />
        <Row label="Total Expenses" value={formatINR(totalExpenses)} />
        <Row label={netProfit >= 0 ? 'Net Profit' : 'Net Loss'} value={formatINR(Math.abs(netProfit))} bold accent />
        <Row label="Profit Margin" value={`${profitMargin.toFixed(1)}%`} />
      </Section>

      <Section title="Top Products">
        {topProducts.length === 0 ? (
          <p className="text-disabled text-sm">No sales recorded.</p>
        ) : (
          topProducts.map(([name, s]) => (
            <Row key={name} label={`${name} (${s.qty} units)`} value={formatINR(s.revenue)} />
          ))
        )}
      </Section>

      <Section title="Payment Breakdown">
        <Row label={`Cash (${cashOrders.length} orders)`} value={formatINR(cashOrders.reduce((s, o) => s + o.total, 0))} />
        <Row
          label={`PhonePe (${phonepeOrders.length} orders)`}
          value={formatINR(phonepeOrders.reduce((s, o) => s + o.total, 0))}
        />
      </Section>

      <button
        onClick={onDelete}
        disabled={deleting}
        className="self-start px-4 py-2 bg-danger hover:brightness-110 disabled:opacity-50 text-secondary rounded-lg text-sm font-semibold transition-all"
      >
        {deleting ? 'Deleting…' : 'Delete Event'}
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-secondary mb-2 uppercase tracking-wide">{title}</h3>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? 'font-semibold' : ''} ${accent ? 'text-primary' : 'text-secondary'}`}>
      <span className={accent ? '' : 'text-disabled'}>{label}</span>
      <span>{value}</span>
    </div>
  )
}
