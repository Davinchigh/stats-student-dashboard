import { dayOf, isoDate, minutesOf, parseLocal } from './time'
import type { ClassSession, Programme, Task } from './types'

export interface NextUp {
  session: ClassSession
  /** True when the class is happening right now. */
  ongoing: boolean
  /** Minutes until it starts (or until it ends, if ongoing). */
  minutes: number
  /** 0 = today, 1 = tomorrow, ... */
  daysAway: number
}

/** The class happening now, or the next one coming up this week. */
export function nextUp(sessions: ClassSession[], now: Date): NextUp | null {
  if (sessions.length === 0) return null
  const today = dayOf(now)
  const minute = minutesOf(now)

  const current = sessions.find((s) => s.day === today && s.start <= minute && minute < s.end)
  if (current) return { session: current, ongoing: true, minutes: current.end - minute, daysAway: 0 }

  for (let offset = 0; offset < 8; offset++) {
    const day = (today + offset) % 7
    const candidates = sessions
      .filter((s) => s.day === day && (offset > 0 || s.start > minute))
      .sort((a, b) => a.start - b.start)
    if (candidates.length) {
      const s = candidates[0]
      return { session: s, ongoing: false, minutes: offset * 1440 + s.start - minute, daysAway: offset }
    }
  }
  return null
}

export function classesOn(sessions: ClassSession[], day: number): ClassSession[] {
  return sessions.filter((s) => s.day === day).sort((a, b) => a.start - b.start)
}

/** Programmes from today onwards, soonest first. */
export function upcomingProgrammes(programmes: Programme[], now: Date, withinDays = 14): Programme[] {
  const today = isoDate(now)
  const limit = isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + withinDays))
  const minute = minutesOf(now)
  return programmes
    .filter((p) => p.date >= today && p.date <= limit && !(p.date === today && p.end <= minute))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)
}

export type TaskGroup = 'Overdue' | 'Due this week' | 'Later' | 'Done'

export function groupTasks(tasks: Task[], now: Date): Record<TaskGroup, Task[]> {
  const weekAhead = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59)
  const groups: Record<TaskGroup, Task[]> = { Overdue: [], 'Due this week': [], Later: [], Done: [] }
  const byDue = [...tasks].sort((a, b) => a.due.localeCompare(b.due))
  for (const t of byDue) {
    const due = parseLocal(t.due)
    if (t.done) groups.Done.push(t)
    else if (due < now) groups.Overdue.push(t)
    else if (due <= weekAhead) groups['Due this week'].push(t)
    else groups.Later.push(t)
  }
  groups.Done.reverse()
  return groups
}

/** Unique course codes from the timetable, for the assignment form. */
export function courseList(sessions: ClassSession[]): { code: string; title: string }[] {
  const seen = new Map<string, string>()
  for (const s of sessions) if (!seen.has(s.courseCode)) seen.set(s.courseCode, s.courseTitle)
  return [...seen.entries()].map(([code, title]) => ({ code, title })).sort((a, b) => a.code.localeCompare(b.code))
}
