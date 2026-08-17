import { useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '../admin/Modal'
import { useEvent } from '../../context/EventContext'
import type { EventCategory } from '../../lib/database.types'

const CATEGORIES: EventCategory[] = ['Wedding', 'Corporate', 'Festival', 'Popup', 'Other']

interface Props {
  onClose: () => void
  onCreated: () => void
}

interface FormState {
  name: string
  location: string
  category: EventCategory
  participants: string
  booth_cost: string
  transportation_cost: string
  outside_help_cost: string
  food_drinks_cost: string
  accommodation_cost: string
  miscellaneous_cost: string
}

const emptyForm: FormState = {
  name: '',
  location: '',
  category: 'Popup',
  participants: '',
  booth_cost: '',
  transportation_cost: '',
  outside_help_cost: '',
  food_drinks_cost: '',
  accommodation_cost: '',
  miscellaneous_cost: '',
}

const costFields: { key: keyof FormState; label: string }[] = [
  { key: 'booth_cost', label: 'Booth Cost (₹)' },
  { key: 'transportation_cost', label: 'Transportation Cost (₹)' },
  { key: 'outside_help_cost', label: 'Outside Help Cost (₹)' },
  { key: 'food_drinks_cost', label: 'Food & Drinks Cost (₹)' },
  { key: 'accommodation_cost', label: 'Accommodation Cost (₹)' },
  { key: 'miscellaneous_cost', label: 'Miscellaneous Cost (₹)' },
]

function numOrZero(v: string) {
  const n = parseFloat(v)
  return isNaN(n) || n < 0 ? 0 : n
}

export default function StartEventModal({ onClose, onCreated }: Props) {
  const { startEvent } = useEvent()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const set = (key: keyof FormState, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.location.trim()) {
      toast.error('Event name and location are required')
      return
    }
    setSubmitting(true)
    const { error } = await startEvent({
      name: form.name.trim(),
      location: form.location.trim(),
      category: form.category,
      participants: form.participants.trim() ? parseInt(form.participants, 10) : null,
      booth_cost: numOrZero(form.booth_cost),
      transportation_cost: numOrZero(form.transportation_cost),
      outside_help_cost: numOrZero(form.outside_help_cost),
      food_drinks_cost: numOrZero(form.food_drinks_cost),
      accommodation_cost: numOrZero(form.accommodation_cost),
      miscellaneous_cost: numOrZero(form.miscellaneous_cost),
    })
    setSubmitting(false)
    if (error) {
      toast.error(error, { duration: 6000 })
      return
    }
    toast.success(`Event "${form.name.trim()}" started`)
    onCreated()
  }

  return (
    <Modal title="Start New Event" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-sm text-disabled mb-1">Event Name</label>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm text-disabled mb-1">Location</label>
          <input
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm text-disabled mb-1">Event Category</label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-disabled mb-1">Participants Count</label>
          <input
            type="number"
            min="0"
            value={form.participants}
            onChange={(e) => set('participants', e.target.value)}
            className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="border-t border-border pt-3 mt-1">
          <p className="text-sm text-disabled mb-2">Expected expenses (optional, editable later only via database)</p>
          <div className="grid grid-cols-2 gap-3">
            {costFields.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-disabled mb-1">{label}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder="0"
                  className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-2 w-full bg-primary hover:bg-primary-hover disabled:bg-disabled text-secondary font-semibold py-2.5 rounded-lg"
        >
          {submitting ? 'Starting…' : 'Create Event'}
        </button>
      </div>
    </Modal>
  )
}
