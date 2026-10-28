import { newId } from './id'
import type { ClassSession, Day, SessionType } from './types'

/** An example second-year statistics timetable, so people can try the app before uploading their own. */
const ROWS: [Day, string, string, string, string, SessionType, string][] = [
  [0, '07:30', '09:30', 'STAT 221', 'Introductory Probability II', 'Lecture', 'JQB 19'],
  [0, '13:30', '15:30', 'STAT 223', 'Data Analysis with R', 'Practical', 'Computer Lab 2'],
  [1, '09:30', '11:30', 'STAT 225', 'Applied Regression', 'Lecture', 'N Block 3'],
  [1, '15:30', '16:30', 'STAT 221', 'Introductory Probability II', 'Tutorial', 'JQB 23'],
  [2, '07:30', '09:30', 'MATH 223', 'Calculus II', 'Lecture', 'LT 1'],
  [2, '11:30', '13:30', 'STAT 227', 'Sampling Techniques', 'Lecture', 'JQB 19'],
  [3, '09:30', '10:30', 'STAT 225', 'Applied Regression', 'Tutorial', 'N Block 3'],
  [3, '13:30', '15:30', 'DCIT 203', 'Database Systems', 'Lecture', 'CS Block'],
  [4, '07:30', '09:30', 'STAT 227', 'Sampling Techniques', 'Tutorial', 'JQB 23'],
  [4, '11:30', '13:30', 'DCIT 203', 'Database Systems', 'Practical', 'Computer Lab 1'],
]

const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))

export function sampleTimetable(): ClassSession[] {
  return ROWS.map(([day, start, end, courseCode, courseTitle, type, venue]) => ({
    id: newId(),
    day,
    start: toMinutes(start),
    end: toMinutes(end),
    courseCode,
    courseTitle,
    type,
    venue,
    lecturer: '',
  }))
}
