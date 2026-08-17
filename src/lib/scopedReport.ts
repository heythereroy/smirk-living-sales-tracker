import html2pdf from 'html2pdf.js'
import { formatINR } from './format'
import type { Order } from './database.types'
import type { OrderItemWithProduct } from './scopedOrders'

export async function downloadScopedReport(label: string, orders: Order[], items: OrderItemWithProduct[]) {
  let totalRevenue = 0
  let cashRevenue = 0
  let phonepeRevenue = 0
  orders.forEach((o) => {
    totalRevenue += o.total
    if (o.payment_method === 'cash') cashRevenue += o.total
    else phonepeRevenue += o.total
  })

  const productSales: { [name: string]: { qty: number; revenue: number } } = {}
  items.forEach((item) => {
    if (!item.product) return
    const entry = productSales[item.product.name] || { qty: 0, revenue: 0 }
    entry.qty += item.quantity
    entry.revenue += item.product.price * item.quantity
    productSales[item.product.name] = entry
  })

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #FF6B35; text-align: center;">Smirk Living - Report</h1>
      <p style="text-align: center; color: #666666;">${label}</p>

      <h2 style="color: #1A1A1A; border-bottom: 2px solid #FF6B35; padding-bottom: 10px;">Summary</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #F5F2ED;">
          <td style="padding: 10px; border: 1px solid #ECE4D7; font-weight: bold;">Total Revenue</td>
          <td style="padding: 10px; border: 1px solid #ECE4D7; color: #FF6B35; font-size: 18px; font-weight: bold;">${formatINR(totalRevenue)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ECE4D7;">Cash Revenue</td>
          <td style="padding: 10px; border: 1px solid #ECE4D7;">${formatINR(cashRevenue)}</td>
        </tr>
        <tr style="background: #F5F2ED;">
          <td style="padding: 10px; border: 1px solid #ECE4D7;">PhonePe Revenue</td>
          <td style="padding: 10px; border: 1px solid #ECE4D7;">${formatINR(phonepeRevenue)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ECE4D7;">Orders</td>
          <td style="padding: 10px; border: 1px solid #ECE4D7;">${orders.length}</td>
        </tr>
      </table>

      <h2 style="color: #1A1A1A; border-bottom: 2px solid #FF6B35; padding-bottom: 10px;">Top Selling Products</h2>
      <ul style="line-height: 1.8;">
        ${
          Object.entries(productSales)
            .sort((a, b) => b[1].qty - a[1].qty)
            .slice(0, 10)
            .map(([name, { qty, revenue }]) => `<li>${name}: ${qty} units (${formatINR(revenue)})</li>`)
            .join('') || '<li>No sales in this period</li>'
        }
      </ul>

      <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ECE4D7; text-align: center; color: #666666; font-size: 12px;">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>Smirk Living</p>
      </footer>
    </div>
  `

  const element = document.createElement('div')
  element.innerHTML = html

  await html2pdf()
    .set({
      margin: 10,
      filename: `smirk-living-report-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' },
    })
    .from(element)
    .save()
}
