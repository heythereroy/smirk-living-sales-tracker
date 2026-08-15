import { createContext, useContext, useCallback, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { usePolling } from '../lib/usePolling'
import type { CartLine, Product } from '../lib/database.types'

const CART_POLL_MS = 1500

interface CartContextValue {
  products: Product[]
  cartLines: CartLine[]
  loading: boolean
  subtotal: number
  addToCart: (product: Product, quantity?: number) => Promise<void>
  setQuantity: (cartId: number, quantity: number) => Promise<void>
  removeFromCart: (cartId: number) => Promise<void>
  clearCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [cartLines, setCartLines] = useState<CartLine[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*').order('category').order('name')
    if (error) return
    setProducts(data as Product[])
  }, [])

  const fetchCart = useCallback(async () => {
    const { data, error } = await supabase
      .from('cart')
      .select('*, product:products(*)')
      .order('created_at')
    if (error) return
    setCartLines((data as unknown as CartLine[]).filter((line) => line.product))
  }, [])

  usePolling(() => {
    Promise.all([fetchProducts(), fetchCart()]).finally(() => setLoading(false))
  }, CART_POLL_MS)

  const addToCart = async (product: Product, quantity = 1) => {
    const existing = cartLines.find((l) => l.product_id === product.id)
    if (existing) {
      const { error } = await supabase
        .from('cart')
        .update({ quantity: existing.quantity + quantity, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (error) {
        toast.error('Could not update cart')
        return
      }
    } else {
      const { error } = await supabase.from('cart').insert({ product_id: product.id, quantity })
      if (error) {
        toast.error('Could not add to cart')
        return
      }
    }
    await fetchCart()
  }

  const setQuantity = async (cartId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(cartId)
      return
    }
    const { error } = await supabase
      .from('cart')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', cartId)
    if (error) {
      toast.error('Could not update quantity')
      return
    }
    await fetchCart()
  }

  const removeFromCart = async (cartId: number) => {
    const { error } = await supabase.from('cart').delete().eq('id', cartId)
    if (error) {
      toast.error('Could not remove item')
      return
    }
    await fetchCart()
  }

  const clearCart = async () => {
    const { error } = await supabase.from('cart').delete().gte('id', 0)
    if (error) {
      toast.error('Could not clear cart')
      return
    }
    await fetchCart()
  }

  const subtotal = cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0)

  return (
    <CartContext.Provider
      value={{ products, cartLines, loading, subtotal, addToCart, setQuantity, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
