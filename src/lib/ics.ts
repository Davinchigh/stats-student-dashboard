import { dayOf } from './time'
import type { ClassSession } from './types'

/** Escapes text for an iCalendar value (RFC 5545, section 3.3.11). */
function esc(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Local "floating" date-time, so a 9:30 class stays 9:30 wherever the calendar app is. */
function stamp(date: Date, minutes: number): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(Math.floor(minutes / 60))}${pad(minutes % 60)}00`
}

/** The date of this week's (or next week's, if already past) occurrence of a weekday. */
export function nextDateFor(day: number, now: Date): Date {
  const offset = (day - dayOf(now) + 7) % 7
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
}

/**
 * The timetable as an .ics calendar: one weekly repeating event per class, for `weeks` weeks.
 * Google Calendar, Outlook and Apple Calendar all import it.
 */
export function buildIcs(sessions: ClassSession[], now: Date, weeks = 14): string {
  const created = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Class Planner//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Class timetable']
  for (const s of sessions) {
    const date = nextDateFor(s.day, now)
    const title = [s.courseCode, s.type].filter(Boolean).join(' ')
    const description = [s.courseTitle, s.lecturer && `Lecturer: ${s.lecturer}`].filter(Boolean).join('\n')
    lines.push(
      'BEGIN:VEVENT',
      `UID:${s.id}@class-planner`,
      `DTSTAMP:${created}`,
      `DTSTART:${stamp(date, s.start)}`,
      `DTEND:${stamp(date, s.end)}`,
      `RRULE:FREQ=WEEKLY;COUNT=${weeks}`,
      `SUMMARY:${esc(title)}`,
      ...(s.venue ? [`LOCATION:${esc(s.venue)}`] : []),
      ...(description ? [`DESCRIPTION:${esc(description)}`] : []),
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
