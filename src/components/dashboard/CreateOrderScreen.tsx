import ProductSearch from './ProductSearch'
import CartPanel from './CartPanel'
import type { DiscountCode } from '../../lib/database.types'

interface Props {
  appliedCode: DiscountCode | null
  onApplyCode: (code: DiscountCode | null) => void
  onCheckout: () => void
  onDone: () => void
}

export default function CreateOrderScreen({ appliedCode, onApplyCode, onCheckout, onDone }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">New Order</h1>
        <button
          onClick={onDone}
          className="text-sm text-disabled hover:text-secondary border border-border rounded-lg px-3 py-1.5"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
        <ProductSearch />
        <CartPanel appliedCode={appliedCode} onApplyCode={onApplyCode} onCheckout={onCheckout} />
      </div>
    </div>
  )
}
