import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

interface Props {
  bucket: string
  value: string
  onChange: (url: string) => void
}

export default function ImageInput({ bucket, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false })
    if (error) {
      toast.error(
        `Upload failed: ${error.message}. Make sure a public storage bucket named "${bucket}" exists, or paste an image URL instead.`,
      )
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  return (
    <div>
      <label className="block text-sm text-disabled mb-1">Image</label>
      <div className="flex gap-3 items-start">
        <div className="w-16 h-16 rounded-lg bg-tertiary border border-border overflow-hidden shrink-0 flex items-center justify-center">
          {value ? (
            <img src={value} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-disabled text-xs">None</span>
          )}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Paste image URL"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs text-primary hover:text-primary-hover underline self-start disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'or upload an image file'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>
      </div>
    </div>
  )
}
