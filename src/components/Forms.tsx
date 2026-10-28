import { useState, type FormEvent } from 'react'
import { newId } from '../lib/id'
import { isoDate, parseTime, toInputTime } from '../lib/time'
import { DAY_NAMES, SESSION_TYPES, type ClassSession, type Day, type Programme, type SessionType } from '../lib/types'

/** Add one class by hand, or edit or delete an existing one. */
export function ClassForm({
  session,
  onSave,
  onDelete,
  onCancel,
}: {
  session?: ClassSession
  onSave: (session: ClassSession) => void
  onDelete?: (id: string) => void
  onCancel: () => void
}) {
  const [day, setDay] = useState<Day>(session?.day ?? 0)
  const [start, setStart] = useState(session ? toInputTime(session.start) : '08:30')
  const [end, setEnd] = useState(session ? toInputTime(session.end) : '10:30')
  const [courseCode, setCourseCode] = useState(session?.courseCode ?? '')
  const [courseTitle, setCourseTitle] = useState(session?.courseTitle ?? '')
  const [type, setType] = useState<SessionType>(session?.type ?? 'Lecture')
  const [venue, setVenue] = useState(session?.venue ?? '')
  const [lecturer, setLecturer] = useState(session?.lecturer ?? '')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const s = parseTime(start)
    const en = parseTime(end)
    if (s === null || en === null || en <= s) {
      setError('The end time needs to be after the start time.')
      return
    }
    onSave({
      id: session?.id ?? newId(),
      day,
      start: s,
      end: en,
      courseCode: courseCode.trim(),
      courseTitle: courseTitle.trim(),
      type,
      venue: venue.trim(),
      lecturer: lecturer.trim(),
    })
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <label className="field">
        Course code
        <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="STAT 221" required autoFocus />
      </label>
      <label className="field">
        Course title <span className="optional">optional</span>
        <input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="Introductory Probability II" />
      </label>
      <label className="field">
        Day
        <select value={day} onChange={(e) => setDay(Number(e.target.value) as Day)}>
          {DAY_NAMES.map((name, i) => (
            <option key={name} value={i}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Type
        <select value={type} onChange={(e) => setType(e.target.value as SessionType)}>
          {SESSION_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Starts
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
      </label>
      <label className="field">
        Ends
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
      </label>
      <label className="field">
        Venue <span className="optional">optional</span>
        <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="JQB 19" />
      </label>
      <label className="field">
        Lecturer <span className="optional">optional</span>
        <input value={lecturer} onChange={(e) => setLecturer(e.target.value)} />
      </label>
      {error && (
        <p className="alert field-wide" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions field-wide">
        {session && onDelete && (
          <button type="button" className="button danger push-left" onClick={() => onDelete(session.id)}>
            Delete class
          </button>
        )}
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button">
          {session ? 'Save changes' : 'Add class'}
        </button>
      </div>
    </form>
  )
}

/** A one-off programme or event on a specific date. */
export function ProgrammeForm({ onSave, onCancel }: { onSave: (p: Programme) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(isoDate(new Date()))
  const [start, setStart] = useState('10:00')
  const [end, setEnd] = useState('12:00')
  const [venue, setVenue] = useState('')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const s = parseTime(start)
    const en = parseTime(end)
    if (s === null || en === null || en <= s) {
      setError('The end time needs to be after the start time.')
      return
    }
    onSave({ id: newId(), title: title.trim(), date, start: s, end: en, venue: venue.trim() })
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <label className="field field-wide">
        What is it?
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Department of Statistics seminar" required autoFocus />
      </label>
      <label className="field">
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <label className="field">
        Venue <span className="optional">optional</span>
        <input value={venue} onChange={(e) => setVenue(e.target.value)} />
      </label>
      <label className="field">
        Starts
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
      </label>
      <label className="field">
        Ends
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
      </label>
      {error && (
        <p className="alert field-wide" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions field-wide">
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button">
          Add programme
        </button>
      </div>
    </form>
  )
}
