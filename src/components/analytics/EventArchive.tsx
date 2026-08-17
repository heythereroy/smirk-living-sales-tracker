import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ArchivedEvent {
  id: string;
  event_name: string;
  event_date: string;
  total_revenue: number;
  total_profit: number;
  total_orders: number;
  created_at: string;
}

export default function EventArchive() {
  const [events, setEvents] = useState<ArchivedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('archived_events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('archived_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setEvents(events.filter((e) => e.id !== id));
      alert('Event deleted');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading events...</div>;
  }

  if (events.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-600 mb-4">No archived events yet</p>
        <p className="text-sm text-gray-500">
          Events will appear here after you save them at the end of each pop-up
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-6">Past Events</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <div key={event.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{event.event_name}</h3>
            <p className="text-sm text-gray-600 mb-4">📅 {new Date(event.event_date).toLocaleDateString()}</p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue:</span>
                <span className="font-semibold text-orange-600">₹{event.total_revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Profit:</span>
                <span className="font-semibold text-green-600">₹{event.total_profit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Orders:</span>
                <span className="font-semibold">{event.total_orders}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  alert(
                    `Event: ${event.event_name}\nDate: ${new Date(event.event_date).toLocaleDateString()}\nRevenue: ₹${event.total_revenue.toFixed(2)}\nProfit: ₹${event.total_profit.toFixed(2)}\nOrders: ${event.total_orders}`
                  );
                }}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
              >
                View
              </button>
              <button
                onClick={() => deleteEvent(event.id)}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      {events.length > 0 && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Overall Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total Events</p>
              <p className="text-2xl font-bold text-orange-600">{events.length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{events.reduce((sum, e) => sum + e.total_revenue, 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total Profit</p>
              <p className="text-2xl font-bold text-blue-600">
                ₹{events.reduce((sum, e) => sum + e.total_profit, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
