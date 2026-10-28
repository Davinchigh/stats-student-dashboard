/** Days are numbered Monday = 0 through Sunday = 6. */
export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export type SessionType = 'Lecture' | 'Tutorial' | 'Practical' | 'Other'
export const SESSION_TYPES: SessionType[] = ['Lecture', 'Tutorial', 'Practical', 'Other']

/** One weekly class from the timetable. Times are minutes after midnight. */
export interface ClassSession {
  id: string
  day: Day
  start: number
  end: number
  courseCode: string
  courseTitle: string
  type: SessionType
  venue: string
  lecturer: string
}

export type TaskKind = 'Assignment' | 'Homework' | 'Project' | 'Quiz or exam' | 'Reading'
export const TASK_KINDS: TaskKind[] = ['Assignment', 'Homework', 'Project', 'Quiz or exam', 'Reading']

export interface Task {
  id: string
  title: string
  course: string
  kind: TaskKind
  /** Local date and time, YYYY-MM-DDTHH:mm */
  due: string
  notes: string
  done: boolean
  createdAt: string
}

/** A one-off programme, seminar or event on a specific date. */
export interface Programme {
  id: string
  title: string
  /** YYYY-MM-DD */
  date: string
  start: number
  end: number
  venue: string
}

export interface AppData {
  version: 1
  sessions: ClassSession[]
  tasks: Task[]
  programmes: Programme[]
}

export const EMPTY_DATA: AppData = { version: 1, sessions: [], tasks: [], programmes: [] }
