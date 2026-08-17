import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import html2pdf from 'html2pdf.js';

interface Sale {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: 'cash' | 'online';
  cost_price: number;
  packaging_cost: number;
}

interface Expense {
  booth_cost: number;
  fuel_cost: number;
  food_cost: number;
  staff_cost: number;
}

export default function PDFReportGenerator() {
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const formattedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Fetch today's sales
      const { data: salesData } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      // Fetch expenses from local storage or database
      const expenses: Expense = JSON.parse(localStorage.getItem('expenses') || '{"booth_cost":0,"fuel_cost":0,"food_cost":0,"staff_cost":0}');

      const sales = salesData || [];

      // Calculate metrics
      let totalRevenue = 0;
      let cashRevenue = 0;
      let onlineRevenue = 0;
      let totalCost = 0;
      const productSales: { [key: string]: number } = {};

      sales.forEach((sale: Sale) => {
        totalRevenue += sale.total_amount;
        if (sale.payment_method === 'cash') {
          cashRevenue += sale.total_amount;
        } else {
          onlineRevenue += sale.total_amount;
        }

        const costPerUnit = (sale.cost_price || 0) + (sale.packaging_cost || 0);
        totalCost += costPerUnit * sale.quantity;

        productSales[sale.product_name] = (productSales[sale.product_name] || 0) + sale.quantity;
      });

      const totalExpenses = (expenses.booth_cost || 0) + (expenses.fuel_cost || 0) + (expenses.food_cost || 0) + (expenses.staff_cost || 0);
      const totalProfit = totalRevenue - totalCost - totalExpenses;

      // Build HTML for PDF
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #DF7628; text-align: center;">smirk LVNG - Event Report</h1>
          <p style="text-align: center; color: #8C7A64;">Date: ${formattedDate}</p>

          <h2 style="color: #1A1513; border-bottom: 2px solid #DF7628; padding-bottom: 10px;">Summary</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #F5F2ED;">
              <td style="padding: 10px; border: 1px solid #ECE4D7; font-weight: bold;">Total Revenue</td>
              <td style="padding: 10px; border: 1px solid #ECE4D7; color: #DF7628; font-size: 18px; font-weight: bold;">₹${totalRevenue.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ECE4D7;">Cash Revenue</td>
              <td style="padding: 10px; border: 1px solid #ECE4D7;">₹${cashRevenue.toFixed(2)}</td>
            </tr>
            <tr style="background: #F5F2ED;">
              <td style="padding: 10px; border: 1px solid #ECE4D7;">Online Revenue</td>
              <td style="padding: 10px; border: 1px solid #ECE4D7;">₹${onlineRevenue.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ECE4D7;">Total Cost (Products)</td>
              <td style="padding: 10px; border: 1px solid #ECE4D7;">₹${totalCost.toFixed(2)}</td>
            </tr>
            <tr style="background: #F5F2ED;">
              <td style="padding: 10px; border: 1px solid #ECE4D7;">Total Expenses</td>
              <td style="padding: 10px; border: 1px solid #ECE4D7;">₹${totalExpenses.toFixed(2)}</td>
            </tr>
            <tr style="background: #DF7628; color: white;">
              <td style="padding: 10px; border: 1px solid #DF7628; font-weight: bold;">Net Profit</td>
              <td style="padding: 10px; border: 1px solid #DF7628; font-size: 18px; font-weight: bold;">₹${totalProfit.toFixed(2)}</td>
            </tr>
          </table>

          <h2 style="color: #1A1513; border-bottom: 2px solid #DF7628; padding-bottom: 10px;">Sales Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #F5F2ED;">
                <th style="padding: 10px; border: 1px solid #ECE4D7; text-align: left;">Product</th>
                <th style="padding: 10px; border: 1px solid #ECE4D7; text-align: center;">Qty</th>
                <th style="padding: 10px; border: 1px solid #ECE4D7; text-align: right;">Unit Price</th>
                <th style="padding: 10px; border: 1px solid #ECE4D7; text-align: right;">Total</th>
                <th style="padding: 10px; border: 1px solid #ECE4D7; text-align: center;">Payment</th>
              </tr>
            </thead>
            <tbody>
              ${sales
                .map(
                  (sale: Sale) => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ECE4D7;">${sale.product_name}</td>
                  <td style="padding: 10px; border: 1px solid #ECE4D7; text-align: center;">${sale.quantity}</td>
                  <td style="padding: 10px; border: 1px solid #ECE4D7; text-align: right;">₹${sale.unit_price.toFixed(2)}</td>
                  <td style="padding: 10px; border: 1px solid #ECE4D7; text-align: right;">₹${sale.total_amount.toFixed(2)}</td>
                  <td style="padding: 10px; border: 1px solid #ECE4D7; text-align: center;">${sale.payment_method === 'cash' ? '💰' : '💳'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <h2 style="color: #1A1513; border-bottom: 2px solid #DF7628; padding-bottom: 10px; margin-top: 30px;">Top Selling Products</h2>
          <ul style="line-height: 1.8;">
            ${Object.entries(productSales)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([product, qty]) => `<li>${product}: ${qty} units</li>`)
              .join('')}
          </ul>

          ${totalExpenses > 0 ? `
            <h2 style="color: #1A1513; border-bottom: 2px solid #DF7628; padding-bottom: 10px; margin-top: 30px;">Expenses</h2>
            <ul style="line-height: 1.8;">
              ${expenses.booth_cost > 0 ? `<li>Booth Cost: ₹${expenses.booth_cost.toFixed(2)}</li>` : ''}
              ${expenses.fuel_cost > 0 ? `<li>Fuel Cost: ₹${expenses.fuel_cost.toFixed(2)}</li>` : ''}
              ${expenses.food_cost > 0 ? `<li>Food Cost: ₹${expenses.food_cost.toFixed(2)}</li>` : ''}
              ${expenses.staff_cost > 0 ? `<li>Staff Cost: ₹${expenses.staff_cost.toFixed(2)}</li>` : ''}
            </ul>
          ` : ''}

          <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ECE4D7; text-align: center; color: #8C7A64; font-size: 12px;">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>smirk LVNG - Art That Lives With You</p>
          </footer>
        </div>
      `;

      // Generate PDF
      const element = document.createElement('div');
      element.innerHTML = html;

      const opt = {
        margin: 10,
        filename: `smirk_report_${today}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      };

      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generateReport}
      disabled={loading}
      className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
    >
      {loading ? 'Generating...' : '📥 Download PDF Report'}
    </button>
  );
}
