import { describe, expect, it } from 'vitest'
import { findClashes, importTimetable } from './importTimetable'
import { formatDuration, parseDay, parseTime } from './time'

describe('parseTime', () => {
  it.each([
    ['8:30', 510],
    ['08:30', 510],
    ['8.30', 510],
    ['830', 510],
    ['13:00', 780],
    ['1:30 PM', 810],
    ['1:30pm', 810],
    ['12:00 pm', 720],
    ['12am', 0],
    ['9am', 540],
    [0.5, 720],
    [1030, 630],
  ])('reads %s', (input, expected) => {
    expect(parseTime(input)).toBe(expected)
  })

  it('reads Excel time cells', () => {
    expect(parseTime(new Date(Date.UTC(1899, 11, 30, 14, 15)))).toBe(855)
  })

  it.each(['', 'noon', '25:00', '8:75', '13pm'])('rejects %s', (input) => {
    expect(parseTime(input)).toBeNull()
  })
})

describe('parseDay', () => {
  it('accepts short and long names in any case', () => {
    expect(parseDay('Mon')).toBe(0)
    expect(parseDay('WEDNESDAY')).toBe(2)
    expect(parseDay('thurs.')).toBe(3)
    expect(parseDay('Funday')).toBeNull()
  })
})

describe('importTimetable', () => {
  it('reads the template layout', () => {
    const result = importTimetable([
      ['Day', 'Start', 'End', 'Course code', 'Course title', 'Type', 'Venue', 'Lecturer'],
      ['Monday', '8:30', '10:30', 'STAT 301', 'Probability Distributions', 'Lecture', 'JQB 19', 'Dr. Mensah'],
      ['Tue', '2:00 PM', '3:00 PM', 'STAT 303', 'Regression Analysis', 'tutorial', 'N Block', ''],
    ])
    expect(result.fatal).toBeUndefined()
    expect(result.problems).toEqual([])
    expect(result.sessions).toHaveLength(2)
    expect(result.sessions[0]).toMatchObject({ day: 0, start: 510, end: 630, courseCode: 'STAT 301', venue: 'JQB 19' })
    expect(result.sessions[1]).toMatchObject({ day: 1, start: 840, end: 900, type: 'Tutorial' })
  })

  it('accepts columns in any order with different names and a single time column', () => {
    const result = importTimetable([
      ['Room', 'Course', 'Weekday', 'Time'],
      ['LT 2', 'STAT 341', 'Friday', '10:30 - 12:30'],
    ])
    expect(result.sessions[0]).toMatchObject({ day: 4, start: 630, end: 750, courseCode: 'STAT 341', venue: 'LT 2' })
  })

  it('reports bad rows with the spreadsheet row number and keeps the good ones', () => {
    const result = importTimetable([
      ['Day', 'Start', 'End', 'Code'],
      ['Monday', '8:00', '9:00', 'STAT 301'],
      ['Someday', '8:00', '9:00', 'STAT 302'],
      ['Monday', '10:00', '9:00', 'STAT 303'],
      [],
      ['Tuesday', 'soon', '9:00', 'STAT 304'],
    ])
    expect(result.sessions).toHaveLength(1)
    expect(result.problems.map((p) => p.row)).toEqual([3, 4, 6])
  })

  it('fails clearly when required columns are missing', () => {
    const result = importTimetable([
      ['Course', 'Venue'],
      ['STAT 301', 'JQB'],
    ])
    expect(result.fatal).toMatch(/Day/)
    expect(result.fatal).toMatch(/Start and End/)
  })

  it('skips blank rows above the header', () => {
    const result = importTimetable([[], ['Day', 'Start', 'End', 'Title'], ['Mon', '9', '10', 'Data Mining']])
    expect(result.sessions[0]).toMatchObject({ courseCode: 'Data Mining', start: 540 })
  })
})

describe('findClashes', () => {
  it('finds overlapping classes on the same day only', () => {
    const { sessions } = importTimetable([
      ['Day', 'Start', 'End', 'Code'],
      ['Mon', '8:00', '10:00', 'A'],
      ['Mon', '9:30', '11:00', 'B'],
      ['Mon', '11:00', '12:00', 'C'],
      ['Tue', '9:30', '11:00', 'D'],
    ])
    const clashes = findClashes(sessions).map(([a, b]) => a.courseCode + b.courseCode)
    expect(clashes).toEqual(['AB'])
  })
})

describe('formatDuration', () => {
  it('reads naturally', () => {
    expect(formatDuration(45)).toBe('45m')
    expect(formatDuration(80)).toBe('1h 20m')
    expect(formatDuration(120)).toBe('2h')
    expect(formatDuration(60 * 24 * 2)).toBe('2 days')
  })
})
