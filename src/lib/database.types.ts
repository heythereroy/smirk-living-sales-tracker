// Hand-written to match the live schema (introspected via PostgREST — no
// management API access was available to pull a generated types file).

export interface Product {
  id: number
  name: string
  price: number
  cost_price: number
  packaging_cost: number
  category: string
  image_url: string | null
  created_at: string
  updated_at: string
}

export type EventCategory = 'Wedding' | 'Corporate' | 'Festival' | 'Popup' | 'Other'
export type EventStatus = 'active' | 'ended'

export interface Event {
  id: string // uuid
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
  status: EventStatus
  created_at: string
  ended_at: string | null
  created_by: string | null // uuid, references auth.users
}

export interface CartRow {
  id: number
  product_id: number
  quantity: number
  created_at: string
  updated_at: string
}

export type PaymentMethod = 'phonepe' | 'cash'

export interface Order {
  id: number
  subtotal: number
  discount_amount: number
  total: number
  payment_method: PaymentMethod
  // Legacy — the discount-codes feature was removed. Old orders placed
  // while it existed may still have a value here; nothing writes to it
  // anymore. Kept only so historical orders still display correctly.
  discount_code_used: string | null
  created_at: string
  // Added via supabase/migration_add_customer_fields.sql — run that
  // migration before these are readable/writable on the live DB.
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  // Added via supabase/migration_events.sql — nullable since orders
  // placed before that migration ran have no event. events.id is uuid.
  event_id: string | null
  // Added via supabase/migration_discount_tracking.sql. 'code' is a
  // legacy value from before the discount-codes feature was removed.
  discount_type: 'flat' | 'percentage' | 'code' | null
  discount_value: number | null
  final_total: number
}

export interface ArchivedEvent {
  id: string // uuid
  event_id: string | null // uuid, references events(id)
  event_name: string
  event_date: string
  total_revenue: number
  total_profit: number
  total_orders: number
  created_at: string
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
}

export interface QrConfig {
  id: number
  qr_name: string
  qr_image_url: string
  is_active: boolean
  created_at: string
}

// Convenience: a cart row joined with its product for display/calculation.
export interface CartLine extends CartRow {
  product: Product
}
