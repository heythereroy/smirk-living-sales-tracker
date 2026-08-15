import { useCart } from '../../context/CartContext'
import { formatINR } from '../../lib/format'

export default function ProductGrid() {
  const { products, loading, addToCart } = useCart()

  if (loading) {
    return <div className="text-disabled text-sm py-8 text-center">Loading products…</div>
  }

  if (products.length === 0) {
    return <div className="text-disabled text-sm py-8 text-center">No products yet.</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-[#242424] border border-border rounded-xl overflow-hidden flex flex-col"
        >
          <div className="aspect-square bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-disabled text-sm">No image</span>
            )}
          </div>
          <div className="p-3 flex flex-col gap-2 flex-1">
            <div className="flex-1">
              <p className="text-xs text-disabled">{product.category}</p>
              <p className="font-medium leading-snug">{product.name}</p>
              <p className="text-primary font-bold mt-1">{formatINR(product.price)}</p>
            </div>
            <button
              onClick={() => addToCart(product)}
              className="w-full bg-primary hover:bg-primary-hover text-secondary font-semibold py-2 rounded-lg transition-colors text-sm"
            >
              Add to Cart
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
