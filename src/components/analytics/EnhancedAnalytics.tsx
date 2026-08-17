import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Chart from 'chart.js/auto';

interface OrderRow {
  id: number;
  total: number;
  payment_method: 'cash' | 'phonepe';
  created_at: string;
}

interface OrderItemRow {
  quantity: number;
  product: { name: string; price: number } | null;
}

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function EnhancedAnalytics() {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    cashRevenue: 0,
    phonepeRevenue: 0,
    totalOrders: 0,
    bestSeller: 'N/A',
  });
  const revenueChartRef = useRef<Chart | null>(null);
  const productsChartRef = useRef<Chart | null>(null);

  useEffect(() => {
    fetchData();
    // Chart.js instances are stored in refs (not state) and torn down on
    // unmount — with state, React StrictMode's double-invoked effect in
    // dev recreates a chart before the first one's destroy() commits,
    // and Chart.js refuses to attach two instances to the same canvas.
    return () => {
      revenueChartRef.current?.destroy();
      productsChartRef.current?.destroy();
      revenueChartRef.current = null;
      productsChartRef.current = null;
    };
  }, []);

  const fetchData = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, total, payment_method, created_at')
        .gte('created_at', startOfTodayISO());

      const orderRows = (orders as OrderRow[]) ?? [];
      const orderIds = orderRows.map((o) => o.id);

      let itemRows: OrderItemRow[] = [];
      if (orderIds.length > 0) {
        const { data: items } = await supabase
          .from('order_items')
          .select('quantity, product:products(name, price)')
          .in('order_id', orderIds);
        itemRows = (items as unknown as OrderItemRow[]) ?? [];
      }

      calculateMetrics(orderRows, itemRows);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const calculateMetrics = (orderRows: OrderRow[], itemRows: OrderItemRow[]) => {
    let totalRev = 0;
    let cashRev = 0;
    let phonepeRev = 0;

    orderRows.forEach((order) => {
      totalRev += order.total;
      if (order.payment_method === 'cash') {
        cashRev += order.total;
      } else {
        phonepeRev += order.total;
      }
    });

    const productSalesCount: { [key: string]: number } = {};
    itemRows.forEach((item) => {
      if (!item.product) return;
      productSalesCount[item.product.name] = (productSalesCount[item.product.name] || 0) + item.quantity;
    });

    const bestSeller =
      Object.keys(productSalesCount).length > 0
        ? Object.entries(productSalesCount).sort((a, b) => b[1] - a[1])[0]?.[0]
        : 'N/A';

    setMetrics({
      totalRevenue: totalRev,
      cashRevenue: cashRev,
      phonepeRevenue: phonepeRev,
      totalOrders: orderRows.length,
      bestSeller,
    });

    updateCharts(cashRev, phonepeRev, productSalesCount);
  };

  const updateCharts = (cashRev: number, phonepeRev: number, productSalesCount: { [key: string]: number }) => {
    const revenueCtx = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (revenueCtx) {
      revenueChartRef.current?.destroy();
      revenueChartRef.current = new Chart(revenueCtx, {
        type: 'doughnut',
        data: {
          labels: ['Cash', 'PhonePe'],
          datasets: [
            {
              data: [cashRev, phonepeRev],
              backgroundColor: ['#FF6B35', '#333333'],
            },
          ],
        },
      });
    }

    const productsCtx = document.getElementById('productsChart') as HTMLCanvasElement;
    if (productsCtx) {
      productsChartRef.current?.destroy();
      const sortedProducts = Object.entries(productSalesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      productsChartRef.current = new Chart(productsCtx, {
        type: 'bar',
        data: {
          labels: sortedProducts.map((p) => p[0]),
          datasets: [
            {
              label: 'Units Sold',
              data: sortedProducts.map((p) => p[1]),
              backgroundColor: '#FF6B35',
            },
          ],
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary">Today's Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#242424] border border-border p-6 rounded-lg">
          <p className="text-disabled text-sm">Total Revenue</p>
          <p className="text-3xl font-bold text-primary">₹{metrics.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-[#242424] border border-border p-6 rounded-lg">
          <p className="text-disabled text-sm">Total Orders</p>
          <p className="text-3xl font-bold text-secondary">{metrics.totalOrders}</p>
        </div>
        <div className="bg-[#242424] border border-border p-6 rounded-lg">
          <p className="text-disabled text-sm">Best Seller Today</p>
          <p className="text-2xl font-bold text-secondary">{metrics.bestSeller}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#242424] border border-border p-6 rounded-lg">
          <p className="text-disabled text-sm">Cash Revenue</p>
          <p className="text-2xl font-bold text-secondary">₹{metrics.cashRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-[#242424] border border-border p-6 rounded-lg">
          <p className="text-disabled text-sm">PhonePe Revenue</p>
          <p className="text-2xl font-bold text-secondary">₹{metrics.phonepeRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#242424] border border-border p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-secondary">Revenue Breakdown</h3>
          <canvas id="revenueChart"></canvas>
        </div>
        <div className="bg-[#242424] border border-border p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-secondary">Top Selling Products</h3>
          <canvas id="productsChart"></canvas>
        </div>
      </div>
    </div>
  );
}
