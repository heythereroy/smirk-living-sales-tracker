// Minimal RFC4180-ish CSV parser — handles quoted fields, commas and
// escaped quotes ("") inside quotes. No external dependency needed for
// a file this small.
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0
  const len = text.length

  while (i < len) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += char
      i++
      continue
    }

    if (char === '"') {
      inQuotes = true
      i++
      continue
    }
    if (char === ',') {
      row.push(field)
      field = ''
      i++
      continue
    }
    if (char === '\r') {
      i++
      continue
    }
    if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i++
      continue
    }
    field += char
    i++
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''))
}

export interface ParsedProductRow {
  name: string
  price: number
  category: string
  image_url: string | null
}

export interface CsvRowError {
  row: number
  message: string
}

export interface ProductCsvResult {
  rows: ParsedProductRow[]
  errors: CsvRowError[]
}

export function parseProductsCsv(text: string): ProductCsvResult {
  const table = parseCsvRows(text)
  if (table.length === 0) {
    return { rows: [], errors: [{ row: 0, message: 'CSV file is empty' }] }
  }

  const header = table[0].map((h) => h.trim().toLowerCase())
  const nameIdx = header.indexOf('name')
  const priceIdx = header.indexOf('price')
  const categoryIdx = header.indexOf('category')
  const imageIdx = header.indexOf('image_url')

  if (nameIdx === -1 || priceIdx === -1 || categoryIdx === -1) {
    return {
      rows: [],
      errors: [
        { row: 1, message: 'Header row must include name, price, category (image_url is optional)' },
      ],
    }
  }

  const rows: ParsedProductRow[] = []
  const errors: CsvRowError[] = []

  for (let i = 1; i < table.length; i++) {
    const cols = table[i]
    if (cols.every((c) => c.trim() === '')) continue

    const rowNum = i + 1 // 1-indexed, counting the header row, for user-facing messages
    const name = (cols[nameIdx] ?? '').trim()
    const priceRaw = (cols[priceIdx] ?? '').trim()
    const category = (cols[categoryIdx] ?? '').trim()
    const imageRaw = imageIdx === -1 ? '' : (cols[imageIdx] ?? '').trim()

    if (!name) {
      errors.push({ row: rowNum, message: 'Missing name' })
      continue
    }
    if (!category) {
      errors.push({ row: rowNum, message: 'Missing category' })
      continue
    }
    const price = Number(priceRaw)
    if (priceRaw === '' || Number.isNaN(price) || price < 0) {
      errors.push({ row: rowNum, message: `Invalid price "${priceRaw}"` })
      continue
    }

    const image_url = !imageRaw || imageRaw.toLowerCase() === 'null' ? null : imageRaw
    rows.push({ name, price, category, image_url })
  }

  return { rows, errors }
}

export function buildSampleProductsCsv(): string {
  return [
    'name,price,category,image_url',
    '"Badla Bhui Mug (Set)",700,"Mugs & Bowls",https://example.com/badla-bhui-mug.jpg',
    '"Pizza Plate (Single)",200,"Serveware",null',
    '"Watermelon",500,"Salt & Pepper Sprinklers",',
  ].join('\n')
}

export function downloadTextFile(filename: string, content: string, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
