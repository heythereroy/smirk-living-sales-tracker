import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Chart from 'chart.js/auto';

interface Sale {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: 'cash' | 'online';
  created_at: string;
  product_name: string;
  cost_price: number;
  packaging_cost: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  cost_price: number;
  packaging_cost: number;
  inventory: number;
}

export default function EnhancedAnalytics() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    cashRevenue: 0,
    onlineRevenue: 0,
    totalProfit: 0,
    profitMargin: 0,
    totalOrders: 0,
    bestSeller: '',
  });
  const [revenueChart, setRevenueChart] = useState<Chart | null>(null);
  const [productsChart, setProductsChart] = useState<Chart | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch today's sales
      const today = new Date().toISOString().split('T')[0];
      const { data: salesData } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*');

      setSales(salesData || []);
      setProducts(productsData || []);
      calculateMetrics(salesData || [], productsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const calculateMetrics = (salesData: Sale[], productsData: Product[]) => {
    let totalRev = 0;
    let cashRev = 0;
    let onlineRev = 0;
    let totalCost = 0;

    const productSalesCount: { [key: string]: number } = {};
    const productRevenue: { [key: string]: number } = {};

    salesData.forEach((sale) => {
      const product = productsData.find((p) => p.id === sale.product_id);
      const revenue = sale.total_amount;

      totalRev += revenue;
      if (sale.payment_method === 'cash') {
        cashRev += revenue;
      } else {
        onlineRev += revenue;
      }

      if (product) {
        const costPerUnit = (product.cost_price || 0) + (product.packaging_cost || 0);
        totalCost += costPerUnit * sale.quantity;
      }

      // Track product sales
      productSalesCount[sale.product_name] = (productSalesCount[sale.product_name] || 0) + sale.quantity;
      productRevenue[sale.product_name] = (productRevenue[sale.product_name] || 0) + revenue;
    });

    const totalProfit = totalRev - totalCost;
    const profitMargin = totalRev > 0 ? ((totalProfit / totalRev) * 100).toFixed(1) : '0';
    const bestSeller = Object.keys(productSalesCount).length > 0
      ? Object.entries(productSalesCount).sort((a, b) => b[1] - a[1])[0]?.[0]
      : 'N/A';

    setMetrics({
      totalRevenue: totalRev,
      cashRevenue: cashRev,
      onlineRevenue: onlineRev,
      totalProfit,
      profitMargin: parseFloat(profitMargin as string),
      totalOrders: salesData.length,
      bestSeller,
    });

    // Update charts
    updateCharts(cashRev, onlineRev, productSalesCount);
  };

  const updateCharts = (cashRev: number, onlineRev: number, productSalesCount: { [key: string]: number }) => {
    // Revenue chart
    const revenueCtx = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (revenueCtx) {
      if (revenueChart) revenueChart.destroy();
      const newChart = new Chart(revenueCtx, {
        type: 'doughnut',
        data: {
          labels: ['Cash', 'Online'],
          datasets: [
            {
              data: [cashRev, onlineRev],
              backgroundColor: ['#DF7628', '#6C6A48'],
            },
          ],
        },
      });
      setRevenueChart(newChart);
    }

    // Products chart
    const productsCtx = document.getElementById('productsChart') as HTMLCanvasElement;
    if (productsCtx) {
      if (productsChart) productsChart.destroy();
      const sortedProducts = Object.entries(productSalesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const newChart = new Chart(productsCtx, {
        type: 'bar',
        data: {
          labels: sortedProducts.map((p) => p[0]),
          datasets: [
            {
              label: 'Units Sold',
              data: sortedProducts.map((p) => p[1]),
              backgroundColor: '#DF7628',
            },
          ],
        },
      });
      setProductsChart(newChart);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Today's Summary</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold text-orange-600">₹{metrics.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Profit</p>
          <p className="text-3xl font-bold text-green-600">₹{metrics.totalProfit.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Profit Margin</p>
          <p className="text-3xl font-bold text-blue-600">{metrics.profitMargin}%</p>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Cash Revenue</p>
          <p className="text-2xl font-bold">₹{metrics.cashRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Online Revenue</p>
          <p className="text-2xl font-bold">₹{metrics.onlineRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
          <canvas id="revenueChart"></canvas>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
          <canvas id="productsChart"></canvas>
        </div>
      </div>

      {/* Best Seller Info */}
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600 text-sm">Best Seller Today</p>
        <p className="text-2xl font-bold">{metrics.bestSeller}</p>
      </div>
    </div>
  );
}
