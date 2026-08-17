import { useState } from 'react'
import { useEvent } from '../../context/EventContext'
import type { Event } from '../../lib/database.types'

interface Props {
  onStartEvent: () => void
  onEventEnded: (event: Event) => void
}

export default function EventBanner({ onStartEvent, onEventEnded }: Props) {
  const { activeEvent, loading, endEvent } = useEvent()
  const [ending, setEnding] = useState(false)

  const handleEnd = async () => {
    if (!activeEvent) return
    const confirmed = window.confirm('Are you sure you want to end this event? This cannot be undone.')
    if (!confirmed) return
    setEnding(true)
    const { endedEvent, error } = await endEvent()
    setEnding(false)
    if (!error && endedEvent) {
      onEventEnded(endedEvent)
    }
  }

  if (loading) {
    return <div className="bg-[#242424] border border-border rounded-xl p-4 text-disabled text-sm">Loading event…</div>
  }

  if (!activeEvent) {
    return (
      <div className="bg-[#242424] border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-semibold">No active event</p>
          <p className="text-disabled text-sm">Start an event to begin taking orders.</p>
        </div>
        <button
          onClick={onStartEvent}
          className="bg-primary hover:bg-primary-hover text-secondary font-semibold px-4 py-2 rounded-lg text-sm shrink-0"
        >
          Start New Event
        </button>
      </div>
    )
  }

  return (
    <div className="bg-[#242424] border border-primary/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success" />
          <p className="font-semibold">{activeEvent.name}</p>
          <span className="text-xs bg-tertiary border border-border px-2 py-0.5 rounded text-disabled">
            {activeEvent.category}
          </span>
        </div>
        <p className="text-disabled text-sm mt-0.5">
          {activeEvent.location}
          {activeEvent.participants ? ` · ${activeEvent.participants} participants` : ''}
        </p>
      </div>
      <button
        onClick={handleEnd}
        disabled={ending}
        className="border border-danger text-danger hover:bg-danger hover:text-secondary disabled:opacity-50 font-semibold px-4 py-2 rounded-lg text-sm transition-colors shrink-0"
      >
        {ending ? 'Ending…' : 'End Event'}
      </button>
    </div>
  )
}
