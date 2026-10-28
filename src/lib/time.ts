import type { Day } from './types'

const DAY_ALIASES: Record<string, Day> = {
  mon: 0, monday: 0,
  tue: 1, tues: 1, tuesday: 1,
  wed: 2, weds: 2, wednesday: 2,
  thu: 3, thur: 3, thurs: 3, thursday: 3,
  fri: 4, friday: 4,
  sat: 5, saturday: 5,
  sun: 6, sunday: 6,
}

/** "Mon", "monday", "WED." → day number, or null if it isn't a day. */
export function parseDay(value: unknown): Day | null {
  if (typeof value !== 'string') return null
  const key = value.trim().toLowerCase().replace(/\.$/, '')
  return key in DAY_ALIASES ? DAY_ALIASES[key] : null
}

/**
 * Reads a time in the forms people actually type or export:
 * "8:30", "08:30", "8.30", "830", "8:30am", "1:30 PM", "13:00",
 * an Excel time fraction (0.5 = 12:00) or a Date from a spreadsheet cell.
 * Returns minutes after midnight, or null.
 */
export function parseTime(value: unknown): number | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    // Spreadsheet times are stored as UTC on 30 Dec 1899
    return value.getUTCHours() * 60 + value.getUTCMinutes()
  }
  if (typeof value === 'number') {
    if (value >= 0 && value < 1) return Math.round(value * 24 * 60)
    if (Number.isInteger(value) && value >= 0 && value <= 2359) return fromHHMM(Math.floor(value / 100), value % 100)
    return null
  }
  if (typeof value !== 'string') return null

  const text = value.trim().toLowerCase().replace(/\s+/g, '')
  const match = text.match(/^(\d{1,2})(?:[:.h]?(\d{2}))?(am|pm|a|p)?$/)
  if (!match) return null

  let hours = Number(match[1])
  const minutes = match[2] ? Number(match[2]) : 0
  const meridiem = match[3]

  if (meridiem) {
    if (hours < 1 || hours > 12) return null
    if (meridiem.startsWith('p') && hours !== 12) hours += 12
    if (meridiem.startsWith('a') && hours === 12) hours = 0
  } else if (!match[2] && text.length > 2) {
    return null
  }
  return fromHHMM(hours, minutes)
}

function fromHHMM(hours: number, minutes: number): number | null {
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/** 510 → "8:30", 810 → "13:30" */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

/** 510 → "08:30" for <input type="time"> */
export function toInputTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** JavaScript's getDay() is Sunday = 0; this returns Monday = 0. */
export function dayOf(date: Date): Day {
  return ((date.getDay() + 6) % 7) as Day
}

export function minutesOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

/** "1h 20m", "45m", "2 days" */
export function formatDuration(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes))
  if (m < 60) return `${m}m`
  if (m < 24 * 60) {
    const h = Math.floor(m / 60)
    const rest = m % 60
    return rest ? `${h}h ${rest}m` : `${h}h`
  }
  const days = Math.round(m / (24 * 60))
  return `${days} day${days === 1 ? '' : 's'}`
}

/** Local date as YYYY-MM-DD */
export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Parses YYYY-MM-DDTHH:mm (or YYYY-MM-DD) as local time. */
export function parseLocal(value: string): Date {
  const [datePart, timePart = '23:59'] = value.split('T')
  const [y, mo, d] = datePart.split('-').map(Number)
  const [h, mi] = timePart.split(':').map(Number)
  return new Date(y, mo - 1, d, h, mi)
}

/** Friendly due label relative to now: "Today, 23:59", "Tomorrow, 9:00", "Fri 14 Nov, 9:00". */
export function formatDue(due: Date, now: Date): string {
  const time = formatTime(minutesOf(due))
  const days = Math.round((startOfDay(due).getTime() - startOfDay(now).getTime()) / 86_400_000)
  if (days === 0) return `Today, ${time}`
  if (days === 1) return `Tomorrow, ${time}`
  if (days === -1) return `Yesterday, ${time}`
  const label = due.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  return `${label}, ${time}`
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
