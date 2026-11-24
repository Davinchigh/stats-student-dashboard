import { describe, expect, it } from 'vitest'
import { buildIcs, nextDateFor } from './ics'
import { freeGaps, weekStats } from './schedule'
import type { ClassSession, Task } from './types'

const cls = (day: number, start: number, end: number, code = 'STAT 221'): ClassSession => ({
  id: `${code}-${day}-${start}`, day: day as ClassSession['day'], start, end, courseCode: code, courseTitle: 'Probability, part II', type: 'Lecture', venue: 'JQB 19', lecturer: '',
})

describe('freeGaps', () => {
  it('finds free time between classes and ignores short breaks', () => {
    const day = [cls(0, 450, 570), cls(0, 600, 660), cls(0, 810, 930)]
    expect(freeGaps(day)).toEqual([{ start: 660, end: 810 }])
  })
  it('handles overlapping classes and empty days', () => {
    expect(freeGaps([cls(0, 480, 600), cls(0, 540, 720), cls(0, 840, 900)])).toEqual([{ start: 720, end: 840 }])
    expect(freeGaps([])).toEqual([])
  })
})

describe('weekStats', () => {
  it('counts classes, hours and work due', () => {
    const now = new Date(2026, 10, 24, 10, 0) // Tuesday
    const t = (due: string, done = false): Task => ({ id: due, title: 'x', course: 'STAT 221', kind: 'Homework', due, notes: '', done, createdAt: '' })
    const stats = weekStats([cls(0, 450, 570), cls(2, 600, 690)], [t('2026-11-23T23:59'), t('2026-11-26T12:00'), t('2026-12-20T12:00'), t('2026-11-25T09:00', true)], now)
    expect(stats).toEqual({ classes: 2, classHours: 3.5, dueThisWeek: 1, overdue: 1 })
  })
})

describe('buildIcs', () => {
  const now = new Date(2026, 10, 24, 10, 0) // Tuesday 24 Nov 2026
  it('dates each class on its next weekday', () => {
    expect(nextDateFor(1, now).getDate()).toBe(24) // today
    expect(nextDateFor(0, now).getDate()).toBe(30) // next Monday
  })
  it('writes a weekly repeating event per class with escaped text', () => {
    const ics = buildIcs([cls(3, 570, 690)], now)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('DTSTART:20261126T093000')
    expect(ics).toContain('DTEND:20261126T113000')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;COUNT=14')
    expect(ics).toContain('SUMMARY:STAT 221 Lecture')
    expect(ics).toContain('DESCRIPTION:Probability\\, part II')
    expect(ics.split('\r\n').filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(1)
  })
})
