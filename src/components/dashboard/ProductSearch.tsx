import { useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useCart } from '../../context/CartContext'
import { formatINR } from '../../lib/format'
import type { Product } from '../../lib/database.types'

const MIN_QUERY_LENGTH = 3
const MAX_RESULTS = 8

export default function ProductSearch() {
  const { products, addToCart } = useCart()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Product | null>(null)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (trimmed.length < MIN_QUERY_LENGTH) return []
    return products.filter((p) => p.name.toLowerCase().includes(trimmed)).slice(0, MAX_RESULTS)
  }, [products, query])

  const handleSelect = (product: Product) => {
    setSelected(product)
    setQuery(product.name)
  }

  const handleAdd = async () => {
    if (!selected) return
    setAdding(true)
    await addToCart(selected, qty)
    setAdding(false)
    toast.success(`Added ${qty} × ${selected.name}`)
    setQuery('')
    setSelected(null)
    setQty(1)
    inputRef.current?.focus()
  }

  const clearSelection = () => {
    setSelected(null)
    setQuery('')
    setQty(1)
    inputRef.current?.focus()
  }

  return (
    <div className="bg-[#242424] border border-border rounded-xl p-4">
      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (selected) setSelected(null)
          }}
          placeholder="Search product name..."
          className="w-full bg-tertiary border-2 border-border rounded-xl px-4 py-4 text-lg text-secondary placeholder:text-disabled focus:outline-none focus:border-primary"
        />

        {!selected && results.length > 0 && (
          <div className="absolute z-20 left-0 right-0 mt-2 bg-[#2e2e2e] border border-border rounded-xl overflow-hidden shadow-lg max-h-72 overflow-y-auto">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className="w-full text-left px-4 py-3 hover:bg-primary/20 flex justify-between items-center border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-disabled">{p.category}</p>
                </div>
                <span className="text-primary font-semibold">{formatINR(p.price)}</span>
              </button>
            ))}
          </div>
        )}

        {!selected && query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH && (
          <p className="text-xs text-disabled mt-2">Type at least {MIN_QUERY_LENGTH} letters to search…</p>
        )}

        {!selected && query.trim().length >= MIN_QUERY_LENGTH && results.length === 0 && (
          <p className="text-xs text-disabled mt-2">No matching products.</p>
        )}
      </div>

      {selected && (
        <div className="mt-4 bg-tertiary border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">{selected.name}</p>
              <p className="text-primary font-bold">{formatINR(selected.price)}</p>
            </div>
            <button onClick={clearSelection} className="text-disabled hover:text-secondary text-sm">
              ✕
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-disabled">Quantity</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-lg bg-[#242424] border border-border hover:border-primary text-lg"
              >
                −
              </button>
              <span className="w-8 text-center font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-9 h-9 rounded-lg bg-[#242424] border border-border hover:border-primary text-lg"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={adding}
            className="w-full bg-primary hover:bg-primary-hover disabled:bg-disabled text-secondary font-semibold py-3 rounded-lg text-base"
          >
            {adding ? 'Adding…' : 'Add to Cart'}
          </button>
        </div>
      )}
    </div>
  )
}
