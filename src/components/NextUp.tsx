import { nextUp } from '../lib/schedule'
import { DAY_NAMES, type ClassSession } from '../lib/types'
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

  return (
    <section className={`next-up type-${s.type.toLowerCase()}`} aria-label={ongoing ? 'Class happening now' : 'Next class'}>
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
