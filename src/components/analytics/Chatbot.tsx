import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
}

interface Sale {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: 'cash' | 'online';
  created_at: string;
  product_name: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: 'Hi! I\'m your smirk LVNG assistant. Ask me anything about today\'s sales like "How much cash did I make?" or "What\'s my best seller?"',
    },
  ]);
  const [input, setInput] = useState('');
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const generateResponse = (question: string): string => {
    const q = question.toLowerCase();

    // Calculate metrics
    let totalRevenue = 0;
    let cashTotal = 0;
    let onlineTotal = 0;
    const productSales: { [key: string]: number } = {};

    sales.forEach((sale) => {
      totalRevenue += sale.total_amount;
      if (sale.payment_method === 'cash') {
        cashTotal += sale.total_amount;
      } else {
        onlineTotal += sale.total_amount;
      }
      productSales[sale.product_name] = (productSales[sale.product_name] || 0) + sale.quantity;
    });

    // Answer questions
    if (q.includes('cash') && (q.includes('made') || q.includes('earn'))) {
      return `You made ₹${cashTotal.toFixed(2)} in cash payments today!`;
    }
    if (q.includes('online') && (q.includes('made') || q.includes('earn'))) {
      return `You made ₹${onlineTotal.toFixed(2)} in online payments today!`;
    }
    if (q.includes('total') && (q.includes('made') || q.includes('earn') || q.includes('revenue'))) {
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
      return `You have ${sales.length} orders today!`;
    }
    if (q.includes('how many')) {
      return `You have ${sales.length} sales today with ₹${totalRevenue.toFixed(2)} revenue.`;
    }

    return `I found ${sales.length} sales with ₹${totalRevenue.toFixed(2)} revenue. Try asking: "How much cash did I make?" or "What's my best seller?"`;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: input,
    };

    setMessages([...messages, userMessage]);

    // Generate bot response
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
    <div className="flex flex-col h-full max-h-96 bg-white rounded-lg shadow">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.type === 'user' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-600"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
