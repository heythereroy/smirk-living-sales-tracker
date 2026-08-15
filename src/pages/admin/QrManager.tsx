import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import ImageInput from '../../components/admin/ImageInput'
import { usePolling } from '../../lib/usePolling'
import type { QrConfig } from '../../lib/database.types'

const ADMIN_POLL_MS = 3000

export default function QrManager() {
  const [configs, setConfigs] = useState<QrConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchConfigs = async () => {
    const { data, error } = await supabase
      .from('qr_configs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) toast.error('Failed to load QR settings')
    else setConfigs(data as QrConfig[])
    setLoading(false)
  }

  usePolling(fetchConfigs, ADMIN_POLL_MS)

  const active = configs.find((c) => c.is_active)

  const startEdit = () => {
    setName(active?.qr_name ?? 'PhonePe - Ashish Roy')
    setImageUrl(active?.qr_image_url ?? '')
    setEditing(true)
  }

  const handleSave = async () => {
    if (!name.trim() || !imageUrl.trim()) {
      toast.error('Name and QR image are required')
      return
    }
    setSaving(true)

    await supabase.from('qr_configs').update({ is_active: false }).eq('is_active', true)

    const { error } = await supabase.from('qr_configs').insert({
      qr_name: name.trim(),
      qr_image_url: imageUrl.trim(),
      is_active: true,
    })

    setSaving(false)
    if (error) {
      toast.error('Failed to save QR code')
      return
    }
    toast.success('QR code updated')
    setEditing(false)
    fetchConfigs()
  }

  const setActive = async (config: QrConfig) => {
    await supabase.from('qr_configs').update({ is_active: false }).eq('is_active', true)
    const { error } = await supabase.from('qr_configs').update({ is_active: true }).eq('id', config.id)
    if (error) toast.error('Failed to activate')
    else fetchConfigs()
  }

  const deleteConfig = async (config: QrConfig) => {
    if (!window.confirm(`Delete "${config.qr_name}"?`)) return
    const { error } = await supabase.from('qr_configs').delete().eq('id', config.id)
    if (error) toast.error('Failed to delete')
    else fetchConfigs()
  }

  if (loading) return <p className="text-disabled text-sm">Loading…</p>

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Payment QR Settings</h1>

      <div className="bg-[#242424] border border-border rounded-xl p-4 mb-4">
        <h2 className="font-semibold mb-3">Active QR</h2>
        {active && !editing ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={active.qr_image_url}
              alt={active.qr_name}
              className="w-48 h-48 object-contain bg-white rounded-lg p-2"
            />
            <p className="text-disabled text-sm">{active.qr_name}</p>
            <button
              onClick={startEdit}
              className="bg-primary hover:bg-primary-hover text-secondary font-semibold px-4 py-2 rounded-lg text-sm"
            >
              Change QR
            </button>
          </div>
        ) : editing ? (
          <div className="flex flex-col gap-3 max-w-sm">
            <div>
              <label className="block text-sm text-disabled mb-1">QR Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <ImageInput bucket="qr-images" value={imageUrl} onChange={setImageUrl} />
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 border border-border rounded-lg py-2.5 text-sm hover:bg-tertiary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary hover:bg-primary-hover disabled:bg-disabled text-secondary font-semibold rounded-lg py-2.5 text-sm"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-disabled text-sm mb-3">No active QR code set.</p>
            <button
              onClick={startEdit}
              className="bg-primary hover:bg-primary-hover text-secondary font-semibold px-4 py-2 rounded-lg text-sm"
            >
              Set Up QR Code
            </button>
          </div>
        )}
      </div>

      {configs.length > 1 && (
        <div className="bg-[#242424] border border-border rounded-xl p-4">
          <h2 className="font-semibold mb-3">History</h2>
          <div className="flex flex-col gap-2">
            {configs
              .filter((c) => !c.is_active)
              .map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm border-b border-border last:border-0 py-2">
                  <span>{c.qr_name}</span>
                  <div className="flex gap-3">
                    <button onClick={() => setActive(c)} className="text-primary hover:text-primary-hover underline text-xs">
                      Set Active
                    </button>
                    <button onClick={() => deleteConfig(c)} className="text-danger hover:text-red-400 underline text-xs">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
