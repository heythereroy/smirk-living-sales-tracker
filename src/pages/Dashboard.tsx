import { useState } from 'react'
import { useCart } from '../context/CartContext'
import DailySummary from '../components/dashboard/DailySummary'
import CreateOrderScreen from '../components/dashboard/CreateOrderScreen'
import CheckoutModal from '../components/dashboard/CheckoutModal'
import type { DiscountCode } from '../lib/database.types'

export default function Dashboard() {
  const { cartLines } = useCart()
  const [screen, setScreen] = useState<'landing' | 'order'>('landing')
  const [appliedCode, setAppliedCode] = useState<DiscountCode | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const itemCount = cartLines.reduce((sum, l) => sum + l.quantity, 0)

  if (screen === 'order') {
    return (
      <>
        <CreateOrderScreen
          appliedCode={appliedCode}
          onApplyCode={setAppliedCode}
          onCheckout={() => setCheckoutOpen(true)}
          onDone={() => setScreen('landing')}
        />
        {checkoutOpen && (
          <CheckoutModal
            appliedCode={appliedCode}
            onClose={() => setCheckoutOpen(false)}
            onComplete={() => {
              setCheckoutOpen(false)
              setAppliedCode(null)
              setScreen('landing')
            }}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <DailySummary />

      <button
        onClick={() => setScreen('order')}
        className="w-full bg-primary hover:bg-primary-hover text-secondary font-extrabold text-2xl py-10 rounded-2xl transition-colors shadow-lg"
      >
        {itemCount > 0 ? `Resume Order (${itemCount} item${itemCount === 1 ? '' : 's'})` : 'Create Order'}
      </button>
    </div>
  )
}
