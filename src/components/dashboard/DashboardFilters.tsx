import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { DashboardScope } from '../../lib/scopedOrders'
import type { Event } from '../../lib/database.types'

interface Props {
  scope: DashboardScope
  onChange: (scope: DashboardScope) => void
}

export default function DashboardFilters({ scope, onChange }: Props) {
  const [events, setEvents] = useState<Event[]>([])
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setEvents((data as Event[]) ?? []))
  }, [])

  const selectedEvent = scope.mode === 'event' ? events.find((e) => e.id === scope.eventId) : null

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return events.slice(0, 8)
    return events.filter((e) => e.name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)).slice(0, 8)
  }, [events, query])

  const today = new Date().toISOString().split('T')[0]
  const [rangeFrom, setRangeFrom] = useState(scope.mode === 'range' ? scope.from : today)
  const [rangeTo, setRangeTo] = useState(scope.mode === 'range' ? scope.to : today)

  return (
    <div className="bg-[#242424] border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <p className="text-xs text-disabled mb-1.5">Search event</p>
        <div className="relative">
          <input
            value={selectedEvent ? selectedEvent.name : query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Search by event name or location…"
            className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
          {showDropdown && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-[#2e2e2e] border border-border rounded-lg overflow-hidden shadow-lg max-h-64 overflow-y-auto">
              {filteredEvents.length === 0 ? (
                <p className="px-3 py-2 text-sm text-disabled">No events found</p>
              ) : (
                filteredEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => {
                      onChange({ mode: 'event', eventId: ev.id })
                      setQuery('')
                      setShowDropdown(false)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-primary/20 border-b border-border last:border-0 text-sm"
                  >
                    <span className="font-medium">{ev.name}</span>
                    <span className="text-disabled">
                      {' '}
                      — {ev.location} · {ev.status === 'active' ? 'Active' : new Date(ev.created_at).toLocaleDateString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs text-disabled mb-1.5">Or filter by date range</p>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={rangeFrom}
            onChange={(e) => setRangeFrom(e.target.value)}
            className="bg-tertiary border border-border rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <span className="text-disabled text-sm">to</span>
          <input
            type="date"
            value={rangeTo}
            onChange={(e) => setRangeTo(e.target.value)}
            className="bg-tertiary border border-border rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <button
            onClick={() => {
              onChange({ mode: 'range', from: rangeFrom, to: rangeTo })
              setShowDropdown(false)
            }}
            className="bg-primary hover:bg-primary-hover text-secondary text-sm font-semibold px-3 py-2 rounded-lg shrink-0"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
