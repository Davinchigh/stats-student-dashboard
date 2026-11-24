import { weekStats } from '../lib/schedule'
import type { ClassSession, Task } from '../lib/types'

/** Four numbers that say how full the week is. */
export function WeekStats({ sessions, tasks, now }: { sessions: ClassSession[]; tasks: Task[]; now: Date }) {
  const s = weekStats(sessions, tasks, now)
  const items = [
    { value: s.classes, label: s.classes === 1 ? 'class a week' : 'classes a week' },
    { value: s.classHours, label: 'hours in class' },
    { value: s.dueThisWeek, label: 'due in the next 7 days', tone: s.dueThisWeek ? 'warn' : '' },
    { value: s.overdue, label: 'overdue', tone: s.overdue ? 'alert' : '' },
  ]
  return (
    <section className="stats" aria-label="This week in numbers">
      {items.map((i) => (
        <div key={i.label} className={`stat ${i.tone ? `is-${i.tone}` : ''}`}>
          <span className="stat-value">{i.value}</span>
          <span className="stat-label">{i.label}</span>
        </div>
      ))}
    </section>
  )
}
