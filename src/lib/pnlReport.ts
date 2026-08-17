import html2pdf from 'html2pdf.js'
import { formatINR } from './format'
import type { Event, Order } from './database.types'
import type { OrderItemWithProduct } from './scopedOrders'

function esc(v: string): string {
  return v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

export async function downloadPnlReport(event: Event, orders: Order[], items: OrderItemWithProduct[]) {
  let totalRevenue = 0
  let cashRevenue = 0
  let cashCount = 0
  let phonepeRevenue = 0
  let phonepeCount = 0

  orders.forEach((o) => {
    totalRevenue += o.total
    if (o.payment_method === 'cash') {
      cashRevenue += o.total
      cashCount += 1
    } else {
      phonepeRevenue += o.total
      phonepeCount += 1
    }
  })

  const totalExpenses =
    event.booth_cost +
    event.transportation_cost +
    event.outside_help_cost +
    event.food_drinks_cost +
    event.accommodation_cost +
    event.miscellaneous_cost

  const productStats: { [name: string]: { qty: number; revenue: number; cogs: number } } = {}
  let totalCogs = 0
  items.forEach((item) => {
    if (!item.product) return
    const cogsPerUnit = item.product.cost_price + item.product.packaging_cost
    const lineCogs = cogsPerUnit * item.quantity
    const lineRevenue = item.product.price * item.quantity
    totalCogs += lineCogs

    const entry = productStats[item.product.name] || { qty: 0, revenue: 0, cogs: 0 }
    entry.qty += item.quantity
    entry.revenue += lineRevenue
    entry.cogs += lineCogs
    productStats[item.product.name] = entry
  })

  const grossProfit = totalRevenue - totalCogs
  const netProfit = grossProfit - totalExpenses
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  const topProducts = Object.entries(productStats)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5)

  const bestSeller = topProducts[0]?.[0] ?? 'N/A'
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

  const recommendations: string[] = []
  if (profitMargin < 0) {
    recommendations.push('This event ran at a loss — review expense line items and pricing before the next one.')
  } else if (profitMargin < 15) {
    recommendations.push('Profit margin is thin — consider raising prices or negotiating lower booth/transport costs.')
  } else {
    recommendations.push('Healthy margin — this event category/location looks worth repeating.')
  }
  if (topProducts.length > 0) {
    recommendations.push(`Stock more of "${bestSeller}" next time — it was the top seller by units.`)
  }
  if (cashCount > 0 && phonepeCount > 0 && cashRevenue > phonepeRevenue * 2) {
    recommendations.push('Cash dominated payments — make sure enough change/float is on hand next time.')
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #1A1A1A;">
      <h1 style="color: #FF6B35; text-align: center; margin-bottom: 4px;">${esc(event.name)}</h1>
      <p style="text-align: center; color: #666666; margin: 0 0 4px;">${esc(event.location)} · ${esc(event.category)}</p>
      <p style="text-align: center; color: #666666; margin: 0 0 20px;">
        ${new Date(event.created_at).toLocaleDateString()} — ${event.ended_at ? new Date(event.ended_at).toLocaleDateString() : 'Ongoing'}
        ${event.participants ? ` · ${event.participants} participants` : ''}
      </p>

      <h2 style="color: #1A1A1A; border-bottom: 2px solid #FF6B35; padding-bottom: 8px;">Revenue</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0 24px;">
        <tr style="background: #F5F2ED;">
          <td style="padding: 8px 10px; border: 1px solid #ECE4D7; font-weight: bold;">Total Revenue</td>
          <td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right; color: #FF6B35; font-weight: bold;">${formatINR(totalRevenue)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 10px; border: 1px solid #ECE4D7;">Cash Revenue</td>
          <td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">${formatINR(cashRevenue)}</td>
        </tr>
        <tr style="background: #F5F2ED;">
          <td style="padding: 8px 10px; border: 1px solid #ECE4D7;">PhonePe Revenue</td>
          <td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">${formatINR(phonepeRevenue)}</td>
        </tr>
      </table>

      <h2 style="color: #1A1A1A; border-bottom: 2px solid #FF6B35; padding-bottom: 8px;">Expenses</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0 24px;">
        <tr><td style="padding: 8px 10px; border: 1px solid #ECE4D7;">Booth Cost</td><td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">${formatINR(event.booth_cost)}</td></tr>
        <tr style="background: #F5F2ED;"><td style="padding: 8px 10px; border: 1px solid #ECE4D7;">Transportation Cost</td><td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">${formatINR(event.transportation_cost)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ECE4D7;">Outside Help Cost</td><td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">${formatINR(event.outside_help_cost)}</td></tr>
        <tr style="background: #F5F2ED;"><td style="padding: 8px 10px; border: 1px solid #ECE4D7;">Food & Drinks Cost</td><td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">${formatINR(event.food_drinks_cost)}</td></tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ECE4D7;">Accommodation Cost</td><td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">${formatINR(event.accommodation_cost)}</td></tr>
        <tr style="background: #F5F2ED;"><td style="padding: 8px 10px; border: 1px solid #ECE4D7;">Miscellaneous Cost</td><td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">${formatINR(event.miscellaneous_cost)}</td></tr>
        <tr style="background: #333333; color: white;"><td style="padding: 8px 10px; border: 1px solid #333333; font-weight: bold;">Total Expenses</td><td style="padding: 8px 10px; border: 1px solid #333333; text-align: right; font-weight: bold;">${formatINR(totalExpenses)}</td></tr>
      </table>

      <h2 style="color: #1A1A1A; border-bottom: 2px solid #FF6B35; padding-bottom: 8px;">Cost of Goods Sold</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0 24px;">
        <tr><td style="padding: 8px 10px; border: 1px solid #ECE4D7;">Total COGS (cost price + packaging, per unit sold)</td><td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">${formatINR(totalCogs)}</td></tr>
      </table>

      <h2 style="color: #1A1A1A; border-bottom: 2px solid #FF6B35; padding-bottom: 8px;">Profit / Loss</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0 24px;">
        <tr><td style="padding: 8px 10px; border: 1px solid #ECE4D7;">Gross Profit (Revenue − COGS)</td><td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">${formatINR(grossProfit)}</td></tr>
        <tr style="background: ${netProfit >= 0 ? '#FF6B35' : '#F44336'}; color: white;">
          <td style="padding: 8px 10px; border: 1px solid #ECE4D7; font-weight: bold;">Net ${netProfit >= 0 ? 'Profit' : 'Loss'} (Gross Profit − Expenses)</td>
          <td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right; font-weight: bold; font-size: 16px;">${formatINR(Math.abs(netProfit))}</td>
        </tr>
        <tr><td style="padding: 8px 10px; border: 1px solid #ECE4D7;">Profit Margin</td><td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">${profitMargin.toFixed(1)}%</td></tr>
      </table>

      <h2 style="color: #1A1A1A; border-bottom: 2px solid #FF6B35; padding-bottom: 8px;">Top 5 Products</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0 24px;">
        <thead>
          <tr style="background: #F5F2ED;">
            <th style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: left;">Product</th>
            <th style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: center;">Units</th>
            <th style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">Revenue</th>
            <th style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">COGS</th>
            <th style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">Profit</th>
          </tr>
        </thead>
        <tbody>
          ${
            topProducts
              .map(
                ([name, s]) => `
            <tr>
              <td style="padding: 8px 10px; border: 1px solid #ECE4D7;">${esc(name)}</td>
              <td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: center;">${s.qty}</td>
              <td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">${formatINR(s.revenue)}</td>
              <td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">${formatINR(s.cogs)}</td>
              <td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">${formatINR(s.revenue - s.cogs)}</td>
            </tr>`,
              )
              .join('') || '<tr><td colspan="5" style="padding: 8px 10px; border: 1px solid #ECE4D7;">No sales recorded</td></tr>'
          }
        </tbody>
      </table>

      <h2 style="color: #1A1A1A; border-bottom: 2px solid #FF6B35; padding-bottom: 8px;">Payment Breakdown</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0 24px;">
        <tr style="background: #F5F2ED;">
          <td style="padding: 8px 10px; border: 1px solid #ECE4D7;">Cash</td>
          <td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: center;">${cashCount} order${cashCount === 1 ? '' : 's'}</td>
          <td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">${formatINR(cashRevenue)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 10px; border: 1px solid #ECE4D7;">PhonePe</td>
          <td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: center;">${phonepeCount} order${phonepeCount === 1 ? '' : 's'}</td>
          <td style="padding: 8px 10px; border: 1px solid #ECE4D7; text-align: right;">${formatINR(phonepeRevenue)}</td>
        </tr>
      </table>

      <h2 style="color: #1A1A1A; border-bottom: 2px solid #FF6B35; padding-bottom: 8px;">Summary Insights</h2>
      <ul style="line-height: 1.8;">
        <li>Best selling product: <strong>${esc(bestSeller)}</strong></li>
        <li>Total orders: ${orders.length}</li>
        <li>Average order value: ${formatINR(avgOrderValue)}</li>
      </ul>
      <p style="font-weight: bold; margin-top: 16px; margin-bottom: 6px;">Recommendations for next event:</p>
      <ul style="line-height: 1.8;">
        ${recommendations.map((r) => `<li>${esc(r)}</li>`).join('')}
      </ul>

      <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ECE4D7; text-align: center; color: #666666; font-size: 12px;">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>Thank you for using smirk LVNG</p>
      </footer>
    </div>
  `

  const element = document.createElement('div')
  element.innerHTML = html

  await html2pdf()
    .set({
      margin: 10,
      filename: `pnl-${event.name.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' },
    })
    .from(element)
    .save()
}
