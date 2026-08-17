import { formatINR } from './format'
import type { Order } from './database.types'

export interface ReceiptLine {
  name: string
  quantity: number
  price: number
}

export function buildReceiptHtml(order: Order, lines: ReceiptLine[]): string {
  const rows = lines
    .map(
      (l) => `
      <tr>
        <td style="padding:4px 0;">${escapeHtml(l.name)}</td>
        <td style="padding:4px 0;text-align:center;">${l.quantity}</td>
        <td style="padding:4px 0;text-align:right;">${formatINR(l.price * l.quantity)}</td>
      </tr>`,
    )
    .join('')

  const customerLines = [
    order.customer_name ? `<div>${escapeHtml(order.customer_name)}</div>` : '',
    order.customer_phone ? `<div>${escapeHtml(order.customer_phone)}</div>` : '',
    order.customer_email ? `<div>${escapeHtml(order.customer_email)}</div>` : '',
  ]
    .filter(Boolean)
    .join('')

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt #${order.id}</title>
<style>
  body { font-family: ui-monospace, Consolas, monospace; width: 300px; margin: 16px auto; color: #000; font-size: 13px; }
  h1 { font-size: 16px; text-align: center; margin: 0 0 2px; }
  .sub { text-align: center; color: #444; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; }
  hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
  .row { display: flex; justify-content: space-between; }
  .total { font-weight: bold; font-size: 15px; }
</style>
</head>
<body>
  <h1>Smirk Living</h1>
  <div class="sub">Order #${order.id}<br/>${new Date(order.created_at).toLocaleString()}</div>
  ${customerLines ? `<div class="sub">${customerLines}</div>` : ''}
  <hr />
  <table>
    <thead>
      <tr>
        <td>Item</td>
        <td style="text-align:center;">Qty</td>
        <td style="text-align:right;">Amt</td>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <hr />
  <div class="row"><span>Subtotal</span><span>${formatINR(order.subtotal)}</span></div>
  ${
    order.discount_amount > 0
      ? `<div class="row"><span>Discount${discountLabel(order) ? ` (${escapeHtml(discountLabel(order)!)})` : ''}</span><span>-${formatINR(order.discount_amount)}</span></div>`
      : ''
  }
  <div class="row total"><span>Total</span><span>${formatINR(order.total)}</span></div>
  <hr />
  <div class="sub">Paid via ${order.payment_method === 'phonepe' ? 'PhonePe' : 'Cash'}</div>
  <div class="sub">Thank you for shopping with us!</div>
</body>
</html>`
}

export function discountLabel(order: Order): string | null {
  if (order.discount_code_used) return order.discount_code_used
  if (order.discount_type === 'percentage' && order.discount_value != null) return `${order.discount_value}% off`
  if (order.discount_type === 'flat' && order.discount_value != null) return `₹${order.discount_value} off`
  return null
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

export function printReceipt(order: Order, lines: ReceiptLine[]) {
  const html = buildReceiptHtml(order, lines)
  const win = window.open('', '_blank', 'width=380,height=640')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}
