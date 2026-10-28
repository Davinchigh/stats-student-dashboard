import Papa from 'papaparse'

/** Reads an uploaded .csv or .xlsx file into rows of cells. */
export async function readRows(file: File): Promise<unknown[][]> {
  const name = file.name.toLowerCase()

  if (name.endsWith('.xlsx')) {
    const { readSheet } = await import('read-excel-file/browser')
    return (await readSheet(file)) as unknown[][]
  }

  if (name.endsWith('.csv') || name.endsWith('.txt') || file.type === 'text/csv') {
    const textContent = await file.text()
    const parsed = Papa.parse<string[]>(textContent, { skipEmptyLines: false })
    return parsed.data
  }

  if (name.endsWith('.xls')) {
    throw new Error('Old .xls files aren\'t supported. In Excel, use File > Save As and choose .xlsx or .csv.')
  }
  throw new Error('Upload a .csv or .xlsx file.')
}
