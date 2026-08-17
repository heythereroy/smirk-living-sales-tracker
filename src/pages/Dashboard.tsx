import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { useEvent } from '../context/EventContext'
import CreateOrderScreen from '../components/dashboard/CreateOrderScreen'
import CheckoutModal from '../components/dashboard/CheckoutModal'
import EventBanner from '../components/dashboard/EventBanner'
import StartEventModal from '../components/dashboard/StartEventModal'
import DashboardFilters from '../components/dashboard/DashboardFilters'
import ScopedAnalytics from '../components/dashboard/ScopedAnalytics'
import { downloadPnlReport } from '../lib/pnlReport'
import { downloadScopedReport } from '../lib/scopedReport'
import { fetchItemsForOrders, fetchOrdersForScope, todayScope, type DashboardScope } from '../lib/scopedOrders'
import type { DiscountCode, Event } from '../lib/database.types'

export default function Dashboard() {
  const { cartLines } = useCart()
  const { activeEvent } = useEvent()
  const [screen, setScreen] = useState<'landing' | 'order'>('landing')
  const [appliedCode, setAppliedCode] = useState<DiscountCode | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [startEventOpen, setStartEventOpen] = useState(false)
  const [justEndedEvent, setJustEndedEvent] = useState<Event | null>(null)
  const [downloadingReport, setDownloadingReport] = useState(false)

  const [scope, setScope] = useState<DashboardScope>(() =>
    activeEvent ? { mode: 'event', eventId: activeEvent.id } : todayScope(),
  )
  const [userPickedScope, setUserPickedScope] = useState(false)

  // Follow the active event by default (e.g. right after Start New Event)
  // unless the user has deliberately picked a different scope to look at.
  useEffect(() => {
    if (userPickedScope) return
    setScope(activeEvent ? { mode: 'event', eventId: activeEvent.id } : todayScope())
  }, [activeEvent, userPickedScope])

  const itemCount = cartLines.reduce((sum, l) => sum + l.quantity, 0)

  const handleScopeChange = (next: DashboardScope) => {
    setUserPickedScope(true)
    setScope(next)
    setJustEndedEvent(null)
  }

  const handleDownloadReport = async () => {
    setDownloadingReport(true)
    const orders = await fetchOrdersForScope(scope)
    const items = await fetchItemsForOrders(orders.map((o) => o.id))
    const label =
      scope.mode === 'event'
        ? `Event report`
        : `${new Date(scope.from).toLocaleDateString()} — ${new Date(scope.to).toLocaleDateString()}`
    await downloadScopedReport(label, orders, items)
    setDownloadingReport(false)
  }

  const handleDownloadPnl = async (event: Event) => {
    setDownloadingReport(true)
    const orders = await fetchOrdersForScope({ mode: 'event', eventId: event.id })
    const items = await fetchItemsForOrders(orders.map((o) => o.id))
    await downloadPnlReport(event, orders, items)
    setDownloadingReport(false)
  }

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
      <EventBanner
        onStartEvent={() => setStartEventOpen(true)}
        onEventEnded={(event) => {
          setJustEndedEvent(event)
          setUserPickedScope(true)
          setScope({ mode: 'event', eventId: event.id })
        }}
      />

      {justEndedEvent && (
        <div className="bg-[#242424] border border-success/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-semibold text-success">Event Ended</p>
            <p className="text-disabled text-sm">"{justEndedEvent.name}" has been closed. Download the full P&L report below.</p>
          </div>
          <button
            onClick={() => handleDownloadPnl(justEndedEvent)}
            disabled={downloadingReport}
            className="bg-success hover:brightness-110 disabled:opacity-50 text-secondary font-semibold px-4 py-2 rounded-lg text-sm shrink-0"
          >
            {downloadingReport ? 'Generating…' : '📊 Download P&L Report'}
          </button>
        </div>
      )}

      <DashboardFilters scope={scope} onChange={handleScopeChange} />

      <ScopedAnalytics scope={scope} />

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleDownloadReport}
          disabled={downloadingReport}
          className="flex-1 border border-border hover:border-primary disabled:opacity-50 text-secondary font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {downloadingReport ? 'Generating…' : '📥 Download PDF Report'}
        </button>

        {activeEvent ? (
          <button
            onClick={() => setScreen('order')}
            className="flex-[2] bg-primary hover:bg-primary-hover text-secondary font-extrabold text-xl py-3 rounded-xl transition-colors shadow-lg"
          >
            {itemCount > 0 ? `Resume Order (${itemCount} item${itemCount === 1 ? '' : 's'})` : 'Create Order'}
          </button>
        ) : (
          <button
            onClick={() => setStartEventOpen(true)}
            className="flex-[2] bg-tertiary border border-border text-disabled font-semibold text-sm py-3 rounded-xl"
          >
            Start an event to begin taking orders
          </button>
        )}
      </div>

      {startEventOpen && (
        <StartEventModal onClose={() => setStartEventOpen(false)} onCreated={() => setStartEventOpen(false)} />
      )}
    </div>
  )
}
