import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import html2pdf from 'html2pdf.js';

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

interface Expenses {
  booth_cost: number;
  fuel_cost: number;
  food_cost: number;
  staff_cost: number;
}

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function PDFReportGenerator() {
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const formattedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const { data: orderData } = await supabase
        .from('orders')
        .select('id, total, payment_method, created_at')
        .gte('created_at', startOfTodayISO());
      const orders = (orderData as OrderRow[]) ?? [];

      let items: OrderItemRow[] = [];
      if (orders.length > 0) {
        const { data: itemData } = await supabase
          .from('order_items')
          .select('quantity, product:products(name, price)')
          .in(
            'order_id',
            orders.map((o) => o.id),
          );
        items = (itemData as unknown as OrderItemRow[]) ?? [];
      }

      const expenses: Expenses = JSON.parse(
        localStorage.getItem('expenses') || '{"booth_cost":0,"fuel_cost":0,"food_cost":0,"staff_cost":0}',
      );

      let totalRevenue = 0;
      let cashRevenue = 0;
      let phonepeRevenue = 0;
      orders.forEach((order) => {
        totalRevenue += order.total;
        if (order.payment_method === 'cash') {
          cashRevenue += order.total;
        } else {
          phonepeRevenue += order.total;
        }
      });

      const productSales: { [key: string]: { qty: number; revenue: number } } = {};
      items.forEach((item) => {
        if (!item.product) return;
        const entry = productSales[item.product.name] || { qty: 0, revenue: 0 };
        entry.qty += item.quantity;
        entry.revenue += item.product.price * item.quantity;
        productSales[item.product.name] = entry;
      });

      const totalExpenses =
        (expenses.booth_cost || 0) + (expenses.fuel_cost || 0) + (expenses.food_cost || 0) + (expenses.staff_cost || 0);
      const netProfit = totalRevenue - totalExpenses;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #FF6B35; text-align: center;">Smirk Living - Event Report</h1>
          <p style="text-align: center; color: #666666;">Date: ${formattedDate}</p>

          <h2 style="color: #1A1A1A; border-bottom: 2px solid #FF6B35; padding-bottom: 10px;">Summary</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #F5F2ED;">
              <td style="padding: 10px; border: 1px solid #ECE4D7; font-weight: bold;">Total Revenue</td>
              <td style="padding: 10px; border: 1px solid #ECE4D7; color: #FF6B35; font-size: 18px; font-weight: bold;">₹${totalRevenue.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ECE4D7;">Cash Revenue</td>
              <td style="padding: 10px; border: 1px solid #ECE4D7;">₹${cashRevenue.toFixed(2)}</td>
            </tr>
            <tr style="background: #F5F2ED;">
              <td style="padding: 10px; border: 1px solid #ECE4D7;">PhonePe Revenue</td>
              <td style="padding: 10px; border: 1px solid #ECE4D7;">₹${phonepeRevenue.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ECE4D7;">Total Expenses</td>
              <td style="padding: 10px; border: 1px solid #ECE4D7;">₹${totalExpenses.toFixed(2)}</td>
            </tr>
            <tr style="background: #FF6B35; color: white;">
              <td style="padding: 10px; border: 1px solid #FF6B35; font-weight: bold;">Net Profit</td>
              <td style="padding: 10px; border: 1px solid #FF6B35; font-size: 18px; font-weight: bold;">₹${netProfit.toFixed(2)}</td>
            </tr>
          </table>

          <h2 style="color: #1A1A1A; border-bottom: 2px solid #FF6B35; padding-bottom: 10px;">Orders (${orders.length})</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #F5F2ED;">
                <th style="padding: 10px; border: 1px solid #ECE4D7; text-align: left;">Order #</th>
                <th style="padding: 10px; border: 1px solid #ECE4D7; text-align: right;">Total</th>
                <th style="padding: 10px; border: 1px solid #ECE4D7; text-align: center;">Payment</th>
                <th style="padding: 10px; border: 1px solid #ECE4D7; text-align: center;">Time</th>
              </tr>
            </thead>
            <tbody>
              ${orders
                .map(
                  (order) => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ECE4D7;">#${order.id}</td>
                  <td style="padding: 10px; border: 1px solid #ECE4D7; text-align: right;">₹${order.total.toFixed(2)}</td>
                  <td style="padding: 10px; border: 1px solid #ECE4D7; text-align: center;">${order.payment_method === 'cash' ? '💰 Cash' : '📱 PhonePe'}</td>
                  <td style="padding: 10px; border: 1px solid #ECE4D7; text-align: center;">${new Date(order.created_at).toLocaleTimeString()}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>

          <h2 style="color: #1A1A1A; border-bottom: 2px solid #FF6B35; padding-bottom: 10px; margin-top: 30px;">Top Selling Products</h2>
          <ul style="line-height: 1.8;">
            ${Object.entries(productSales)
              .sort((a, b) => b[1].qty - a[1].qty)
              .slice(0, 5)
              .map(([product, { qty, revenue }]) => `<li>${product}: ${qty} units (₹${revenue.toFixed(2)})</li>`)
              .join('') || '<li>No sales yet</li>'}
          </ul>

          ${
            totalExpenses > 0
              ? `
            <h2 style="color: #1A1A1A; border-bottom: 2px solid #FF6B35; padding-bottom: 10px; margin-top: 30px;">Expenses</h2>
            <ul style="line-height: 1.8;">
              ${expenses.booth_cost > 0 ? `<li>Booth Cost: ₹${expenses.booth_cost.toFixed(2)}</li>` : ''}
              ${expenses.fuel_cost > 0 ? `<li>Fuel Cost: ₹${expenses.fuel_cost.toFixed(2)}</li>` : ''}
              ${expenses.food_cost > 0 ? `<li>Food Cost: ₹${expenses.food_cost.toFixed(2)}</li>` : ''}
              ${expenses.staff_cost > 0 ? `<li>Staff Cost: ₹${expenses.staff_cost.toFixed(2)}</li>` : ''}
            </ul>
          `
              : ''
          }

          <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ECE4D7; text-align: center; color: #666666; font-size: 12px;">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Smirk Living</p>
          </footer>
        </div>
      `;

      const element = document.createElement('div');
      element.innerHTML = html;

      const opt = {
        margin: 10,
        filename: `smirk-living-report-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-secondary">PDF Report</h1>
      <p className="text-disabled text-sm">Generates a report of today's orders, revenue split, and expenses.</p>
      <button
        onClick={generateReport}
        disabled={loading}
        className="px-6 py-3 bg-primary hover:bg-primary-hover disabled:bg-disabled text-secondary rounded-lg transition-colors font-semibold"
      >
        {loading ? 'Generating...' : '📥 Download PDF Report'}
      </button>
    </div>
  );
}
