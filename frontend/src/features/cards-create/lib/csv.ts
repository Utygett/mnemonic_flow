export type CsvRow = {
  name: string
  front: string
  back: string
}

function splitCsvLine(line: string): string[] {
  const res: string[] = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (ch === ',' && !inQuotes) {
      res.push(cur)
      cur = ''
      continue
    }

    cur += ch
  }

  res.push(cur)
  return res
}

export function parseCsvNameFrontBack(text: string): {
  rows: CsvRow[]
  errors: string[]
  total: number
} {
  const errors: string[] = []

  const rawLines = text.split(/\r?\n/)
  const lines = rawLines.filter(l => l.length > 0)

  if (lines.length === 0) {
    return { rows: [], errors: ['CSV пустой'], total: 0 }
  }

  const first = splitCsvLine(lines[0]).map(s => String(s).toLowerCase())
  const hasHeader = first.includes('name') && first.includes('front') && first.includes('back')

  let nameIdx = 0
  let frontIdx = 1
  let backIdx = 2
  let start = 0

  if (hasHeader) {
    nameIdx = first.indexOf('name')
    frontIdx = first.indexOf('front')
    backIdx = first.indexOf('back')
    start = 1
  } else if (first.length !== 3) {
    return { rows: [], errors: ['CSV должен быть 3 колонки: name,front,back'], total: 0 }
  }

  const total = Math.max(0, lines.length - start)
  const rows: CsvRow[] = []

  for (let i = start; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i])

    const name = (cols[nameIdx] ?? '').trim()
    const front = (cols[frontIdx] ?? '').trim()
    const back = (cols[backIdx] ?? '').trim()

    if (!name || !front || !back) {
      errors.push(`${i + 1}: пустые поля name/front/back`)
      continue
    }

    rows.push({ name, front, back })
  }

  return { rows, errors, total }
}
