import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { supabase } from '../../lib/supabase'
import { buildSampleProductsCsv, downloadTextFile, parseProductsCsv, type CsvRowError } from '../../lib/csv'

interface Props {
  onClose: () => void
  onImported: () => void
}

export default function CsvImportModal({ onClose, onImported }: Props) {
  const [importing, setImporting] = useState(false)
  const [rowErrors, setRowErrors] = useState<CsvRowError[]>([])
  const [addedCount, setAddedCount] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownloadSample = () => {
    downloadTextFile('products-sample.csv', buildSampleProductsCsv())
  }

  const handleFile = async (file: File) => {
    setImporting(true)
    setRowErrors([])
    setAddedCount(null)

    const text = await file.text()
    const { rows, errors } = parseProductsCsv(text)

    if (rows.length === 0) {
      setImporting(false)
      setRowErrors(errors)
      toast.error('No valid rows to import')
      return
    }

    const { error } = await supabase.from('products').insert(rows)
    setImporting(false)

    if (error) {
      toast.error(`Import failed: ${error.message}`)
      return
    }

    setAddedCount(rows.length)
    setRowErrors(errors)
    toast.success(`Added ${rows.length} product${rows.length === 1 ? '' : 's'}`)
    onImported()

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Modal title="Import Products from CSV" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-disabled mb-2">
            CSV columns: <span className="font-mono text-secondary">name, price, category, image_url</span>{' '}
            (image_url is optional — leave blank or use "null").
          </p>
          <button
            onClick={handleDownloadSample}
            className="text-sm text-primary hover:text-primary-hover underline"
          >
            Download Sample CSV
          </button>
        </div>

        <div className="border-t border-border pt-4">
          <label className="block text-sm text-disabled mb-2">Choose CSV file</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            disabled={importing}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
            className="w-full text-sm text-secondary file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-border file:bg-tertiary file:text-secondary file:text-sm hover:file:border-primary file:cursor-pointer"
          />
          {importing && <p className="text-xs text-disabled mt-2">Importing…</p>}
        </div>

        {addedCount !== null && (
          <p className="text-success text-sm">
            Added {addedCount} product{addedCount === 1 ? '' : 's'}.
          </p>
        )}

        {rowErrors.length > 0 && (
          <div className="bg-tertiary border border-danger/40 rounded-lg p-3 max-h-48 overflow-y-auto">
            <p className="text-danger text-sm font-medium mb-2">
              {addedCount !== null ? 'Skipped rows:' : 'Could not import:'}
            </p>
            <ul className="text-xs text-disabled flex flex-col gap-1">
              {rowErrors.map((e, idx) => (
                <li key={idx}>
                  Row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}
