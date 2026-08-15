import { useState } from 'react'
import ProductGrid from '../components/dashboard/ProductGrid'
import CartPanel from '../components/dashboard/CartPanel'
import CheckoutModal from '../components/dashboard/CheckoutModal'
import DailySummary from '../components/dashboard/DailySummary'
import type { DiscountCode } from '../lib/database.types'

export default function Dashboard() {
  const [appliedCode, setAppliedCode] = useState<DiscountCode | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <DailySummary />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
        <ProductGrid />
        <CartPanel appliedCode={appliedCode} onApplyCode={setAppliedCode} onCheckout={() => setCheckoutOpen(true)} />
      </div>

      {checkoutOpen && (
        <CheckoutModal
          appliedCode={appliedCode}
          onClose={() => setCheckoutOpen(false)}
          onComplete={() => {
            setCheckoutOpen(false)
            setAppliedCode(null)
          }}
        />
      )}
    </div>
  )
}
