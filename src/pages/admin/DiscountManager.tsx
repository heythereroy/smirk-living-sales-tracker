import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { usePolling } from '../../lib/usePolling'
import type { DiscountCode } from '../../lib/database.types'

const ADMIN_POLL_MS = 3000

export default function DiscountManager() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [percent, setPercent] = useState('')
  const [generating, setGenerating] = useState(false)

  const fetchCodes = async () => {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) toast.error('Failed to load discount codes')
    else setCodes(data as DiscountCode[])
    setLoading(false)
  }

  usePolling(fetchCodes, ADMIN_POLL_MS)

  const handleGenerate = async () => {
    const trimmed = name.trim().toUpperCase()
    const pct = parseFloat(percent)
    if (!trimmed) {
      toast.error('Enter a code name')
      return
    }
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      toast.error('Discount % must be between 1 and 100')
      return
    }
    setGenerating(true)
    const { error } = await supabase.from('discount_codes').insert({
      code: trimmed,
      discount_percent: pct,
      is_active: true,
      used_count: 0,
    })
    setGenerating(false)
    if (error) {
      toast.error(
        error.message.includes('duplicate')
          ? 'That code already exists'
          : error.message.includes('row-level security')
            ? 'Missing write permission. Run supabase/migration_qr_discount_write_policies.sql in the Supabase SQL Editor.'
            : `Failed to create code: ${error.message}`,
        { duration: 6000 },
      )
      return
    }
    toast.success(`Created ${trimmed}`)
    setName('')
    setPercent('')
    fetchCodes()
  }

  const toggleActive = async (code: DiscountCode) => {
    const { error } = await supabase
      .from('discount_codes')
      .update({ is_active: !code.is_active })
      .eq('id', code.id)
    if (error) toast.error('Failed to update code')
    else fetchCodes()
  }

  const deleteCode = async (code: DiscountCode) => {
    if (!window.confirm(`Delete code "${code.code}"?`)) return
    const { error } = await supabase.from('discount_codes').delete().eq('id', code.id)
    if (error) toast.error('Failed to delete code')
    else {
      toast.success('Code deleted')
      fetchCodes()
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Discount Codes</h1>

      <div className="bg-[#242424] border border-border rounded-xl p-4 mb-4">
        <h2 className="font-semibold mb-3">Create Discount Code</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Code name (e.g. SUMMER10)"
            className="flex-1 bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <input
            type="number"
            min="1"
            max="100"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            placeholder="Discount %"
            className="w-full sm:w-32 bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-primary hover:bg-primary-hover disabled:bg-disabled text-secondary font-semibold px-4 py-2 rounded-lg text-sm shrink-0"
          >
            {generating ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-disabled text-sm">Loading…</p>
      ) : codes.length === 0 ? (
        <p className="text-disabled text-sm">No discount codes yet.</p>
      ) : (
        <div className="overflow-x-auto bg-[#242424] border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-disabled border-b border-border">
                <th className="p-3">Code</th>
                <th className="p-3">Discount %</th>
                <th className="p-3">Used</th>
                <th className="p-3">Active</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr key={code.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-mono font-medium">{code.code}</td>
                  <td className="p-3">{code.discount_percent}%</td>
                  <td className="p-3">{code.used_count}</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleActive(code)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        code.is_active ? 'bg-success/20 text-success' : 'bg-disabled/20 text-disabled'
                      }`}
                    >
                      {code.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => deleteCode(code)}
                      className="text-danger hover:text-red-400 text-xs underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
