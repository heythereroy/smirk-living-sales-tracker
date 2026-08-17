import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
}

interface OrderRow {
  id: number;
  total: number;
  payment_method: 'cash' | 'phonepe';
  created_at: string;
}

interface OrderItemRow {
  quantity: number;
  product: { name: string } | null;
}

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: 'Hi! I\'m your Smirk Living assistant. Ask me anything about today\'s sales like "How much cash did I make?" or "What\'s my best seller?"',
    },
  ]);
  const [input, setInput] = useState('');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<OrderItemRow[]>([]);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const { data: orderData } = await supabase
        .from('orders')
        .select('id, total, payment_method, created_at')
        .gte('created_at', startOfTodayISO());

      const orderRows = (orderData as OrderRow[]) ?? [];
      setOrders(orderRows);

      const orderIds = orderRows.map((o) => o.id);
      if (orderIds.length > 0) {
        const { data: itemData } = await supabase
          .from('order_items')
          .select('quantity, product:products(name)')
          .in('order_id', orderIds);
        setItems((itemData as unknown as OrderItemRow[]) ?? []);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const generateResponse = (question: string): string => {
    const q = question.toLowerCase();

    let totalRevenue = 0;
    let cashTotal = 0;
    let phonepeTotal = 0;
    orders.forEach((order) => {
      totalRevenue += order.total;
      if (order.payment_method === 'cash') {
        cashTotal += order.total;
      } else {
        phonepeTotal += order.total;
      }
    });

    const productSales: { [key: string]: number } = {};
    items.forEach((item) => {
      if (!item.product) return;
      productSales[item.product.name] = (productSales[item.product.name] || 0) + item.quantity;
    });

    if (q.includes('cash') && (q.includes('made') || q.includes('make') || q.includes('earn'))) {
      return `You made ₹${cashTotal.toFixed(2)} in cash payments today!`;
    }
    if ((q.includes('online') || q.includes('phonepe')) && (q.includes('made') || q.includes('make') || q.includes('earn'))) {
      return `You made ₹${phonepeTotal.toFixed(2)} in PhonePe payments today!`;
    }
    if (q.includes('total') && (q.includes('made') || q.includes('make') || q.includes('earn') || q.includes('revenue'))) {
      return `Your total revenue today is ₹${totalRevenue.toFixed(2)}!`;
    }
    if (q.includes('best') || q.includes('top') || q.includes('most sold')) {
      const best = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0];
      return best ? `Your best seller is ${best[0]} with ${best[1]} units sold!` : 'No sales yet.';
    }
    if (q.includes('product') && q.includes('sell')) {
      const products = Object.entries(productSales)
        .map((p) => `${p[0]} (${p[1]} units)`)
        .join(', ');
      return `Today you sold: ${products || 'No sales yet'}`;
    }
    if (q.includes('order')) {
      return `You have ${orders.length} orders today!`;
    }
    if (q.includes('how many')) {
      return `You have ${orders.length} sales today with ₹${totalRevenue.toFixed(2)} revenue.`;
    }

    return `I found ${orders.length} sales with ₹${totalRevenue.toFixed(2)} revenue. Try asking: "How much cash did I make?" or "What's my best seller?"`;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: input,
    };
    setMessages((prev) => [...prev, userMessage]);

    const response = generateResponse(input);
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      text: response,
    };
    setMessages((prev) => [...prev, botMessage]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[70vh] max-h-[600px] bg-[#242424] border border-border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.type === 'user' ? 'bg-primary text-secondary' : 'bg-tertiary text-secondary border border-border'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything..."
          className="flex-1 px-4 py-2 bg-tertiary border border-border rounded-lg text-secondary placeholder:text-disabled focus:outline-none focus:border-primary"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-secondary rounded-lg transition-colors font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
}
