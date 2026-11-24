import { newId } from './id'
import { isoDate } from './time'
import type { ClassSession, Day, Programme, SessionType, Task } from './types'

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

/** Example coursework and a seminar, dated around today so the sample week looks lived in. */
export function sampleWork(now: Date): { tasks: Task[]; programmes: Programme[] } {
  const on = (days: number, time: string) => `${isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + days))}T${time}`
  const created = now.toISOString()
  const task = (title: string, course: string, kind: Task['kind'], due: string, done = false): Task => ({
    id: newId(), title, course, kind, due, notes: '', done, createdAt: created,
  })
  return {
    tasks: [
      task('Problem set 4: conditional probability', 'STAT 221', 'Homework', on(-1, '23:59')),
      task('Regression project: data cleaning', 'STAT 225', 'Project', on(2, '17:00')),
      task('Quiz on stratified sampling', 'STAT 227', 'Quiz or exam', on(4, '11:30')),
      task('Read chapter 6, multiple regression', 'STAT 225', 'Reading', on(5, '09:00')),
      task('ER diagram for the library database', 'DCIT 203', 'Assignment', on(9, '23:59')),
      task('R lab 3: data frames', 'STAT 223', 'Homework', on(-3, '15:30'), true),
    ],
    programmes: [
      { id: newId(), title: 'Department seminar: careers in data science', date: on(3, '00:00').slice(0, 10), start: 16 * 60, end: 17 * 60 + 30, venue: 'JQB 19' },
    ],
  }
}
