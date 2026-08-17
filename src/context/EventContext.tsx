import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { usePolling } from '../lib/usePolling'
import { fetchItemsForOrders, fetchOrdersForScope } from '../lib/scopedOrders'
import type { Event, EventCategory } from '../lib/database.types'

const EVENT_POLL_MS = 3000

export interface StartEventInput {
  name: string
  location: string
  category: EventCategory
  participants: number | null
  booth_cost: number
  transportation_cost: number
  outside_help_cost: number
  food_drinks_cost: number
  accommodation_cost: number
  miscellaneous_cost: number
}

interface EventContextValue {
  activeEvent: Event | null
  loading: boolean
  startEvent: (input: StartEventInput) => Promise<{ error: string | null }>
  endEvent: () => Promise<{ error: string | null; endedEvent: Event | null }>
}

const EventContext = createContext<EventContextValue | undefined>(undefined)

export function EventProvider({ children }: { children: ReactNode }) {
  const [activeEvent, setActiveEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchActiveEvent = useCallback(async () => {
    const { data, error } = await supabase.from('events').select('*').eq('status', 'active').maybeSingle()
    if (error) {
      setLoading(false)
      return
    }
    setActiveEvent((data as Event) ?? null)
    setLoading(false)
  }, [])

  usePolling(fetchActiveEvent, EVENT_POLL_MS)

  const startEvent = async (input: StartEventInput) => {
    if (activeEvent) {
      return { error: 'An event is already active. End it before starting a new one.' }
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('events')
      .insert({ ...input, status: 'active', created_by: user?.id ?? null })
      .select()
      .single()
    if (error) {
      return {
        error: error.message.includes('events')
          ? `${error.message}. Run supabase/migration_events.sql in the Supabase SQL Editor if you haven't yet.`
          : error.message,
      }
    }
    setActiveEvent(data as Event)
    return { error: null }
  }

  const endEvent = async () => {
    if (!activeEvent) return { error: 'No active event', endedEvent: null }
    const { data, error } = await supabase
      .from('events')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', activeEvent.id)
      .select()
      .single()
    if (error) {
      toast.error(`Could not end event: ${error.message}`)
      return { error: error.message, endedEvent: null }
    }
    const endedEvent = data as Event
    setActiveEvent(null)

    // Best-effort: snapshot the summary into archived_events. If this
    // fails (e.g. migration not run), the event is still ended — the
    // Event Archive page can always recompute live from events/orders.
    const orders = await fetchOrdersForScope({ mode: 'event', eventId: endedEvent.id })
    const items = await fetchItemsForOrders(orders.map((o) => o.id))
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
    const totalCogs = items.reduce(
      (sum, item) => sum + (item.product ? (item.product.cost_price + item.product.packaging_cost) * item.quantity : 0),
      0,
    )
    const totalExpenses =
      endedEvent.booth_cost +
      endedEvent.transportation_cost +
      endedEvent.outside_help_cost +
      endedEvent.food_drinks_cost +
      endedEvent.accommodation_cost +
      endedEvent.miscellaneous_cost
    const totalProfit = totalRevenue - totalCogs - totalExpenses

    const { error: archiveError } = await supabase.from('archived_events').insert({
      event_id: endedEvent.id,
      event_name: endedEvent.name,
      event_date: endedEvent.created_at,
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      total_orders: orders.length,
    })
    if (archiveError) {
      console.error('Failed to save archived event summary:', archiveError)
    }

    return { error: null, endedEvent }
  }

  return (
    <EventContext.Provider value={{ activeEvent, loading, startEvent, endEvent }}>
      {children}
    </EventContext.Provider>
  )
}

export function useEvent() {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error('useEvent must be used within EventProvider')
  return ctx
}
