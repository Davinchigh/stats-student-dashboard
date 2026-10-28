import { parseDay, parseTime } from './time'
import { SESSION_TYPES, type ClassSession, type SessionType } from './types'
import { newId } from './id'

/**
 * Turns spreadsheet rows (from a CSV or Excel file) into timetable classes.
 *
 * The first row must be headers. Column names are matched loosely, so
 * "Course code", "Code" and "course_code" all work, and columns can be in any order.
 * Only Day, Start, End and a course code or title are required.
 */

type Field = 'day' | 'start' | 'end' | 'courseCode' | 'courseTitle' | 'type' | 'venue' | 'lecturer' | 'time'

const HEADER_ALIASES: Record<Field, string[]> = {
  day: ['day', 'weekday', 'days'],
  start: ['start', 'starttime', 'from', 'begins', 'timefrom'],
  end: ['end', 'endtime', 'to', 'finish', 'ends', 'timeto'],
  time: ['time', 'period', 'times'],
  courseCode: ['coursecode', 'code', 'course', 'module', 'modulecode', 'unit'],
  courseTitle: ['coursetitle', 'title', 'coursename', 'name', 'modulename', 'subject', 'description'],
  type: ['type', 'sessiontype', 'kind', 'classtype', 'activity'],
  venue: ['venue', 'room', 'location', 'place', 'hall', 'lecturehall'],
  lecturer: ['lecturer', 'teacher', 'tutor', 'instructor', 'staff', 'lecturers'],
}

export interface ImportProblem {
  /** Row number as the student sees it in their spreadsheet (header is row 1). */
  row: number
  message: string
}

export interface ImportResult {
  sessions: ClassSession[]
  problems: ImportProblem[]
  /** Set when the file can't be used at all, e.g. missing required columns. */
  fatal?: string
}

const normalise = (h: unknown) => String(h ?? '').toLowerCase().replace(/[^a-z]/g, '')

function mapHeaders(headerRow: unknown[]): Partial<Record<Field, number>> {
  const map: Partial<Record<Field, number>> = {}
  headerRow.forEach((cell, index) => {
    const key = normalise(cell)
    for (const field of Object.keys(HEADER_ALIASES) as Field[]) {
      if (map[field] === undefined && HEADER_ALIASES[field].includes(key)) {
        map[field] = index
        return
      }
    }
  })
  return map
}

function text(row: unknown[], index: number | undefined): string {
  if (index === undefined) return ''
  const v = row[index]
  return v === null || v === undefined ? '' : String(v).trim()
}

function parseType(value: string): SessionType {
  const v = value.toLowerCase()
  if (!v) return 'Lecture'
  if (v.startsWith('lec')) return 'Lecture'
  if (v.startsWith('tut') || v.includes('seminar') || v.includes('discussion')) return 'Tutorial'
  if (v.startsWith('prac') || v.startsWith('lab')) return 'Practical'
  return SESSION_TYPES.find((t) => t.toLowerCase() === v) ?? 'Other'
}

/** "8:30 - 10:30", "8:30am to 10am", "0830-1030" → [start, end] */
function parseRange(value: string): [number, number] | null {
  const parts = value.split(/\s*(?:-|–|—|to)\s*/i).filter(Boolean)
  if (parts.length !== 2) return null
  const start = parseTime(parts[0])
  const end = parseTime(parts[1])
  return start === null || end === null ? null : [start, end]
}

export function importTimetable(rows: unknown[][]): ImportResult {
  const nonEmpty = rows.filter((r) => r.some((c) => String(c ?? '').trim() !== ''))
  if (nonEmpty.length < 2) {
    return { sessions: [], problems: [], fatal: 'The file is empty or only has a header row.' }
  }

  const headerIndex = rows.indexOf(nonEmpty[0])
  const cols = mapHeaders(nonEmpty[0])
  const hasTimes = (cols.start !== undefined && cols.end !== undefined) || cols.time !== undefined
  const missing: string[] = []
  if (cols.day === undefined) missing.push('Day')
  if (!hasTimes) missing.push('Start and End (or a single Time column like "8:30-10:30")')
  if (cols.courseCode === undefined && cols.courseTitle === undefined) missing.push('Course code or Course title')
  if (missing.length) {
    return {
      sessions: [],
      problems: [],
      fatal: `Couldn't find these columns: ${missing.join(', ')}. Check the header row matches the template.`,
    }
  }

  const sessions: ClassSession[] = []
  const problems: ImportProblem[] = []

  rows.forEach((row, i) => {
    if (i <= headerIndex) return
    if (!row.some((c) => String(c ?? '').trim() !== '')) return
    const rowNumber = i + 1

    const day = parseDay(row[cols.day!])
    if (day === null) {
      problems.push({ row: rowNumber, message: `"${text(row, cols.day)}" isn't a day of the week.` })
      return
    }

    let start: number | null
    let end: number | null
    if (cols.start !== undefined && cols.end !== undefined) {
      start = parseTime(row[cols.start])
      end = parseTime(row[cols.end])
    } else {
      const range = parseRange(text(row, cols.time))
      start = range?.[0] ?? null
      end = range?.[1] ?? null
    }
    if (start === null || end === null) {
      problems.push({ row: rowNumber, message: 'Start or end time is missing or not a time like 8:30 or 2:00 PM.' })
      return
    }
    if (end <= start) {
      problems.push({ row: rowNumber, message: 'The class ends before it starts.' })
      return
    }

    const courseCode = text(row, cols.courseCode)
    const courseTitle = text(row, cols.courseTitle)
    if (!courseCode && !courseTitle) {
      problems.push({ row: rowNumber, message: 'No course code or title.' })
      return
    }

    sessions.push({
      id: newId(),
      day,
      start,
      end,
      courseCode: courseCode || courseTitle,
      courseTitle: courseCode ? courseTitle : '',
      type: parseType(text(row, cols.type)),
      venue: text(row, cols.venue),
      lecturer: text(row, cols.lecturer),
    })
  })

  sessions.sort((a, b) => a.day - b.day || a.start - b.start)
  return { sessions, problems }
}

/** Finds classes on the same day whose times overlap, so students can spot clashes. */
export function findClashes(sessions: ClassSession[]): [ClassSession, ClassSession][] {
  const clashes: [ClassSession, ClassSession][] = []
  const sorted = [...sessions].sort((a, b) => a.day - b.day || a.start - b.start)
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length && sorted[j].day === sorted[i].day; j++) {
      if (sorted[j].start < sorted[i].end) clashes.push([sorted[i], sorted[j]])
    }
  }
  return clashes
}
