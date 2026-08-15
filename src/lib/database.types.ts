// Hand-written to match the live schema (introspected via PostgREST — no
// management API access was available to pull a generated types file).

export interface Product {
  id: number
  name: string
  price: number
  category: string
  image_url: string | null
  created_at: string
  updated_at: string
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
  discount_code_used: string | null
  created_at: string
  // Added via supabase/migration_add_customer_fields.sql — run that
  // migration before these are readable/writable on the live DB.
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
}

export interface DiscountCode {
  id: number
  code: string
  discount_percent: number
  used_count: number
  is_active: boolean
  created_at: string
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
