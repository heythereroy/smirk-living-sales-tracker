import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

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
    return <div className="text-center py-8 text-disabled">Loading events...</div>;
  }

  if (events.length === 0) {
    return (
      <div className="bg-[#242424] border border-border p-8 rounded-lg text-center">
        <p className="text-secondary mb-2">No archived events yet</p>
        <p className="text-sm text-disabled">
          Events will appear here after you save them at the end of each pop-up
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-6 text-secondary">Past Events</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <div key={event.id} className="bg-[#242424] border border-border p-6 rounded-lg hover:border-primary transition-colors">
            <h3 className="text-lg font-semibold text-secondary mb-2">{event.event_name}</h3>
            <p className="text-sm text-disabled mb-4">📅 {new Date(event.event_date).toLocaleDateString()}</p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-disabled">Revenue:</span>
                <span className="font-semibold text-primary">₹{event.total_revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-disabled">Profit:</span>
                <span className="font-semibold text-success">₹{event.total_profit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-disabled">Orders:</span>
                <span className="font-semibold text-secondary">{event.total_orders}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  alert(
                    `Event: ${event.event_name}\nDate: ${new Date(event.event_date).toLocaleDateString()}\nRevenue: ₹${event.total_revenue.toFixed(2)}\nProfit: ₹${event.total_profit.toFixed(2)}\nOrders: ${event.total_orders}`
                  );
                }}
                className="flex-1 px-3 py-2 bg-tertiary border border-border hover:border-primary text-secondary rounded text-sm transition-colors"
              >
                View
              </button>
              <button
                onClick={() => deleteEvent(event.id)}
                className="flex-1 px-3 py-2 bg-danger hover:brightness-110 text-secondary rounded text-sm transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      {events.length > 0 && (
        <div className="mt-8 bg-[#242424] border border-border p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-secondary">Overall Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-disabled text-sm">Total Events</p>
              <p className="text-2xl font-bold text-primary">{events.length}</p>
            </div>
            <div className="text-center">
              <p className="text-disabled text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-success">
                ₹{events.reduce((sum, e) => sum + e.total_revenue, 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-disabled text-sm">Total Profit</p>
              <p className="text-2xl font-bold text-secondary">
                ₹{events.reduce((sum, e) => sum + e.total_profit, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
