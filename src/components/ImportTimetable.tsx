import { useRef, useState } from 'react'
import { findClashes, importTimetable, type ImportResult } from '../lib/importTimetable'
import { readRows } from '../lib/readFile'
import { DAY_SHORT, type ClassSession } from '../lib/types'
import { formatTime } from '../lib/time'

/**
 * Upload step: choose a file, preview what was read (with any problems), then confirm.
 * Nothing replaces the current timetable until the student clicks "Use this timetable".
 */
export function ImportTimetable({
  hasExisting,
  onConfirm,
  onCancel,
}: {
  hasExisting: boolean
  onConfirm: (sessions: ClassSession[]) => void
  onCancel?: () => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setFileName(file.name)
    setError('')
    setResult(null)
    setBusy(true)
    try {
      const rows = await readRows(file)
      setResult(importTimetable(rows))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That file couldn\'t be read.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  const clashes = result ? findClashes(result.sessions) : []

  return (
    <div className="import">
      <div
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFile(e.dataTransfer.files[0])
        }}
      >
        <p>
          <strong>Upload your timetable</strong> as an Excel (.xlsx) or CSV file. It needs a row for each class with the day,
          start and end time, and the course code.
        </p>
        <div className="dropzone-actions">
          <button type="button" className="button" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? 'Reading…' : 'Choose file'}
          </button>
          <a className="text-button" href="/timetable-template.csv" download>
            Download the template
          </a>
        </div>
        <input
          ref={input}
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
          aria-label="Timetable file"
        />
        <p className="hint">Or drop the file here. It stays on your device and is never uploaded to a server.</p>
      </div>

      <div aria-live="polite">
        {error && <p className="alert">{error}</p>}
        {result?.fatal && (
          <p className="alert">
            {fileName}: {result.fatal}
          </p>
        )}
      </div>

      {result && !result.fatal && (
        <div className="preview">
          <p>
            Found <strong>{result.sessions.length}</strong> class{result.sessions.length === 1 ? '' : 'es'} in {fileName}.
            {hasExisting && ' Using it will replace your current timetable.'}
          </p>

          {result.problems.length > 0 && (
            <div className="alert">
              <p>
                {result.problems.length} row{result.problems.length === 1 ? ' was' : 's were'} skipped. Fix{' '}
                {result.problems.length === 1 ? 'it' : 'them'} in your file and upload again, or continue without{' '}
                {result.problems.length === 1 ? 'it' : 'them'}:
              </p>
              <ul>
                {result.problems.slice(0, 8).map((p) => (
                  <li key={p.row}>
                    Row {p.row}: {p.message}
                  </li>
                ))}
                {result.problems.length > 8 && <li>and {result.problems.length - 8} more</li>}
              </ul>
            </div>
          )}

          {clashes.length > 0 && (
            <div className="notice">
              <p>These classes overlap:</p>
              <ul>
                {clashes.map(([a, b]) => (
                  <li key={a.id + b.id}>
                    {DAY_SHORT[a.day]}: {a.courseCode} ({formatTime(a.start)} to {formatTime(a.end)}) and {b.courseCode} (
                    {formatTime(b.start)} to {formatTime(b.end)})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.sessions.length > 0 && (
            <div className="table-scroll">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th scope="col">Day</th>
                    <th scope="col">Time</th>
                    <th scope="col">Course</th>
                    <th scope="col">Type</th>
                    <th scope="col">Venue</th>
                  </tr>
                </thead>
                <tbody>
                  {result.sessions.map((s) => (
                    <tr key={s.id}>
                      <td>{DAY_SHORT[s.day]}</td>
                      <td>
                        {formatTime(s.start)} to {formatTime(s.end)}
                      </td>
                      <td>
                        {s.courseCode}
                        {s.courseTitle && <span className="muted"> {s.courseTitle}</span>}
                      </td>
                      <td>{s.type}</td>
                      <td>{s.venue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="form-actions">
            {onCancel && (
              <button type="button" className="button secondary" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button
              type="button"
              className="button"
              disabled={result.sessions.length === 0}
              onClick={() => onConfirm(result.sessions)}
            >
              Use this timetable
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
