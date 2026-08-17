import { supabase } from './supabase'
import type { Order, Product } from './database.types'

export type DashboardScope =
  | { mode: 'event'; eventId: number }
  | { mode: 'range'; from: string; to: string } // yyyy-mm-dd, inclusive

export interface OrderItemWithProduct {
  quantity: number
  product: Product | null
}

export async function fetchOrdersForScope(scope: DashboardScope): Promise<Order[]> {
  let query = supabase.from('orders').select('*')
  query =
    scope.mode === 'event'
      ? query.eq('event_id', scope.eventId)
      : query.gte('created_at', `${scope.from}T00:00:00`).lte('created_at', `${scope.to}T23:59:59`)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return []
  return data as Order[]
}

export async function fetchItemsForOrders(orderIds: number[]): Promise<OrderItemWithProduct[]> {
  if (orderIds.length === 0) return []
  const { data, error } = await supabase
    .from('order_items')
    .select('quantity, product:products(*)')
    .in('order_id', orderIds)
  if (error) return []
  return data as unknown as OrderItemWithProduct[]
}

export function todayScope(): DashboardScope {
  const today = new Date().toISOString().split('T')[0]
  return { mode: 'range', from: today, to: today }
}
