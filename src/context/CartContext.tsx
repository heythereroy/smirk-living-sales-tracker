import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import type { CartLine, Product } from '../lib/database.types'

interface CartContextValue {
  products: Product[]
  cartLines: CartLine[]
  loading: boolean
  subtotal: number
  addToCart: (product: Product) => Promise<void>
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
    if (error) {
      toast.error('Failed to load products')
      return
    }
    setProducts(data as Product[])
  }, [])

  const fetchCart = useCallback(async () => {
    const { data, error } = await supabase
      .from('cart')
      .select('*, product:products(*)')
      .order('created_at')
    if (error) {
      toast.error('Failed to load cart')
      return
    }
    setCartLines((data as unknown as CartLine[]).filter((line) => line.product))
  }, [])

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCart()]).finally(() => setLoading(false))

    const cartChannel = supabase
      .channel('cart-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart' }, () => {
        fetchCart()
      })
      .subscribe()

    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts()
        fetchCart()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(cartChannel)
      supabase.removeChannel(productsChannel)
    }
  }, [fetchProducts, fetchCart])

  const addToCart = async (product: Product) => {
    const existing = cartLines.find((l) => l.product_id === product.id)
    if (existing) {
      const { error } = await supabase
        .from('cart')
        .update({ quantity: existing.quantity + 1, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (error) toast.error('Could not update cart')
      return
    }
    const { error } = await supabase.from('cart').insert({ product_id: product.id, quantity: 1 })
    if (error) toast.error('Could not add to cart')
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
    if (error) toast.error('Could not update quantity')
  }

  const removeFromCart = async (cartId: number) => {
    const { error } = await supabase.from('cart').delete().eq('id', cartId)
    if (error) toast.error('Could not remove item')
  }

  const clearCart = async () => {
    const { error } = await supabase.from('cart').delete().gte('id', 0)
    if (error) toast.error('Could not clear cart')
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
