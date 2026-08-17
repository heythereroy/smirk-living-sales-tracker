import { useEffect, useRef, useState } from 'react'
import Chart from 'chart.js/auto'
import { formatINR } from '../../lib/format'
import { fetchItemsForOrders, fetchOrdersForScope, type DashboardScope } from '../../lib/scopedOrders'

interface Props {
  scope: DashboardScope
}

export default function ScopedAnalytics({ scope }: Props) {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    cashRevenue: 0,
    phonepeRevenue: 0,
    totalOrders: 0,
    totalCogs: 0,
    grossProfit: 0,
    bestSeller: 'N/A',
    avgOrderValue: 0,
  })
  const [loading, setLoading] = useState(true)
  const revenueChartRef = useRef<Chart | null>(null)
  const productsChartRef = useRef<Chart | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const run = async () => {
      const orders = await fetchOrdersForScope(scope)
      const items = await fetchItemsForOrders(orders.map((o) => o.id))
      if (cancelled) return

      let totalRevenue = 0
      let cashRevenue = 0
      let phonepeRevenue = 0
      orders.forEach((o) => {
        totalRevenue += o.total
        if (o.payment_method === 'cash') cashRevenue += o.total
        else phonepeRevenue += o.total
      })

      let totalCogs = 0
      const productSalesCount: { [name: string]: number } = {}
      items.forEach((item) => {
        if (!item.product) return
        productSalesCount[item.product.name] = (productSalesCount[item.product.name] || 0) + item.quantity
        totalCogs += (item.product.cost_price + item.product.packaging_cost) * item.quantity
      })

      const bestSeller =
        Object.keys(productSalesCount).length > 0
          ? Object.entries(productSalesCount).sort((a, b) => b[1] - a[1])[0]?.[0]
          : 'N/A'

      setMetrics({
        totalRevenue,
        cashRevenue,
        phonepeRevenue,
        totalOrders: orders.length,
        totalCogs,
        grossProfit: totalRevenue - totalCogs,
        bestSeller,
        avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      })
      setLoading(false)
      updateCharts(cashRevenue, phonepeRevenue, productSalesCount)
    }

    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.mode, scope.mode === 'event' ? scope.eventId : `${scope.from}:${scope.to}`])

  useEffect(() => {
    return () => {
      revenueChartRef.current?.destroy()
      productsChartRef.current?.destroy()
    }
  }, [])

  const updateCharts = (cashRev: number, phonepeRev: number, productSalesCount: { [key: string]: number }) => {
    const revenueCtx = document.getElementById('dashboardRevenueChart') as HTMLCanvasElement | null
    if (revenueCtx) {
      revenueChartRef.current?.destroy()
      revenueChartRef.current = new Chart(revenueCtx, {
        type: 'doughnut',
        data: {
          labels: ['Cash', 'PhonePe'],
          datasets: [{ data: [cashRev, phonepeRev], backgroundColor: ['#FF6B35', '#333333'] }],
        },
        options: { plugins: { legend: { labels: { color: '#FFFFFF' } } } },
      })
    }

    const productsCtx = document.getElementById('dashboardProductsChart') as HTMLCanvasElement | null
    if (productsCtx) {
      productsChartRef.current?.destroy()
      const sorted = Object.entries(productSalesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
      productsChartRef.current = new Chart(productsCtx, {
        type: 'bar',
        data: {
          labels: sorted.map((p) => p[0]),
          datasets: [{ label: 'Units Sold', data: sorted.map((p) => p[1]), backgroundColor: '#FF6B35' }],
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#FFFFFF' } },
            y: { ticks: { color: '#FFFFFF' } },
          },
        },
      })
    }
  }

  if (loading) {
    return <div className="bg-[#242424] border border-border rounded-xl p-4 text-disabled text-sm">Loading analytics…</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total Revenue" value={formatINR(metrics.totalRevenue)} accent="text-primary" />
        <Stat label="Orders" value={String(metrics.totalOrders)} />
        <Stat label="Gross Profit" value={formatINR(metrics.grossProfit)} accent="text-success" />
        <Stat label="Best Seller" value={metrics.bestSeller} small />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Cash Revenue" value={formatINR(metrics.cashRevenue)} />
        <Stat label="PhonePe Revenue" value={formatINR(metrics.phonepeRevenue)} />
        <Stat label="COGS" value={formatINR(metrics.totalCogs)} />
        <Stat label="Avg Order Value" value={formatINR(metrics.avgOrderValue)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#242424] border border-border p-4 rounded-lg">
          <h3 className="text-sm font-semibold mb-3 text-secondary">Revenue Breakdown</h3>
          <canvas id="dashboardRevenueChart"></canvas>
        </div>
        <div className="bg-[#242424] border border-border p-4 rounded-lg">
          <h3 className="text-sm font-semibold mb-3 text-secondary">Top Selling Products</h3>
          <canvas id="dashboardProductsChart"></canvas>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, accent, small }: { label: string; value: string; accent?: string; small?: boolean }) {
  return (
    <div className="bg-[#242424] border border-border p-4 rounded-lg">
      <p className="text-disabled text-xs">{label}</p>
      <p className={`font-bold ${small ? 'text-base' : 'text-xl'} ${accent ?? 'text-secondary'}`}>{value}</p>
    </div>
  )
}
