import { nextUp } from '../lib/schedule'
import { DAY_NAMES, DAY_SHORT, type ClassSession } from '../lib/types'

const formatDayShort = (d: number) => DAY_SHORT[d]
import { formatDuration, formatTime } from '../lib/time'

export function NextUp({ sessions, now }: { sessions: ClassSession[]; now: Date }) {
  const next = nextUp(sessions, now)

  if (!next) {
    return (
      <section className="next-up next-up-empty" aria-label="Next class">
        <p className="next-label">No classes this week</p>
      </section>
    )
  }

  const { session: s, ongoing, minutes, daysAway } = next
  const when = ongoing
    ? `Ends in ${formatDuration(minutes)}`
    : daysAway === 0
      ? `Starts in ${formatDuration(minutes)}`
      : daysAway === 1
        ? `Tomorrow at ${formatTime(s.start)}`
        : `${DAY_NAMES[s.day]} at ${formatTime(s.start)}`

  // The ring shows how far through the class we are, or how close it is (over the last 3 hours before it starts).
  const length = s.end - s.start
  const fill = ongoing ? 1 - minutes / length : daysAway === 0 ? Math.max(0.04, 1 - minutes / 180) : 0.04
  const C = 2 * Math.PI * 34

  return (
    <section className={`next-up type-${s.type.toLowerCase()}`} aria-label={ongoing ? 'Class happening now' : 'Next class'}>
      <svg className="next-ring" viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="34" className="next-ring-track" />
        <circle cx="40" cy="40" r="34" className="next-ring-fill" strokeDasharray={C} strokeDashoffset={C * (1 - fill)} />
        <text x="40" y="45" textAnchor="middle">{ongoing ? `${Math.round(fill * 100)}%` : daysAway === 0 ? formatDuration(minutes) : daysAway === 1 ? 'tmrw' : formatDayShort(s.day)}</text>
      </svg>
      <p className="next-label">{ongoing ? 'Now' : 'Next class'}</p>
      <h2 className="next-code">{s.courseCode}</h2>
      {s.courseTitle && <p className="next-title">{s.courseTitle}</p>}
      <p className="next-when">{when}</p>
      <dl className="next-facts">
        <div>
          <dt>Time</dt>
          <dd>
            {formatTime(s.start)} to {formatTime(s.end)}
          </dd>
        </div>
        <div>
          <dt>Where</dt>
          <dd>{s.venue || 'Not set'}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{s.type}</dd>
        </div>
        {s.lecturer && (
          <div>
            <dt>Lecturer</dt>
            <dd>{s.lecturer}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}
