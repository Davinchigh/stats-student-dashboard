import { useState } from 'react'
import { classesOn } from '../lib/schedule'
import { dayOf, formatTime, minutesOf } from '../lib/time'
import { DAY_NAMES, DAY_SHORT, type ClassSession, type Day } from '../lib/types'

const HOUR_PX = 56

export function WeekView({
  sessions,
  now,
  onEdit,
}: {
  sessions: ClassSession[]
  now: Date
  onEdit: (session: ClassSession) => void
}) {
  const today = dayOf(now)
  const weekendUsed = sessions.some((s) => s.day >= 5)
  const days: Day[] = weekendUsed ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4]
  const [mobileDay, setMobileDay] = useState<Day>(today <= days[days.length - 1] ? today : 0)

  const firstHour = Math.min(8, ...sessions.map((s) => Math.floor(s.start / 60)))
  const lastHour = Math.max(17, ...sessions.map((s) => Math.ceil(s.end / 60)))
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i)
  const minute = minutesOf(now)
  const showNowLine = minute >= firstHour * 60 && minute <= lastHour * 60

  const top = (m: number) => ((m - firstHour * 60) / 60) * HOUR_PX

  return (
    <section aria-labelledby="week-heading" className="week">
      <h2 id="week-heading" className="section-title">
        This week
      </h2>

      {/* Desktop: full week grid */}
      <div className="week-grid" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
        <div />
        {days.map((d) => (
          <div key={d} className={`week-day-head ${d === today ? 'is-today' : ''}`}>
            {DAY_SHORT[d]}
            {d === today && <span className="sr-only"> (today)</span>}
          </div>
        ))}

        <div className="week-hours" style={{ height: hours.length * HOUR_PX }}>
          {hours.map((h) => (
            <span key={h} style={{ top: top(h * 60) }}>
              {h}:00
            </span>
          ))}
        </div>

        {days.map((d) => (
          <div
            key={d}
            className={`week-col ${d === today ? 'is-today' : ''}`}
            style={{ height: hours.length * HOUR_PX, backgroundSize: `100% ${HOUR_PX}px` }}
          >
            {classesOn(sessions, d).map((s) => (
              <button
                type="button"
                key={s.id}
                className={`block type-${s.type.toLowerCase()} ${s.end - s.start <= 60 ? 'is-short' : ''}`}
                style={{ top: top(s.start), height: Math.max(top(s.end) - top(s.start) - 3, 22) }}
                onClick={() => onEdit(s)}
                aria-label={`${s.courseCode} ${s.type}, ${DAY_NAMES[s.day]} ${formatTime(s.start)} to ${formatTime(s.end)}${s.venue ? `, ${s.venue}` : ''}. Edit`}
              >
                <strong>{s.courseCode}</strong>
                <span>
                  {formatTime(s.start)} to {formatTime(s.end)}
                </span>
                {s.venue && <span className="block-venue">{s.venue}</span>}
              </button>
            ))}
            {d === today && showNowLine && <div className="now-line" style={{ top: top(minute) }} aria-hidden="true" />}
          </div>
        ))}
      </div>

      {/* Phones: one day at a time */}
      <div className="week-mobile">
        <div className="day-tabs" role="tablist" aria-label="Day">
          {days.map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={mobileDay === d}
              className={`day-tab ${d === today ? 'is-today' : ''}`}
              onClick={() => setMobileDay(d)}
            >
              {DAY_SHORT[d]}
            </button>
          ))}
        </div>
        <div role="tabpanel" aria-label={DAY_NAMES[mobileDay]}>
          {classesOn(sessions, mobileDay).length === 0 ? (
            <p className="muted">No classes on {DAY_NAMES[mobileDay]}.</p>
          ) : (
            <ol className="day-list">
              {classesOn(sessions, mobileDay).map((s) => (
                <li key={s.id} className={`day-item type-${s.type.toLowerCase()}`}>
                  <span className="day-time">{formatTime(s.start)}</span>
                  <button type="button" className="day-main as-button" onClick={() => onEdit(s)}>
                    <strong>{s.courseCode}</strong> {s.type}
                    <span className="day-sub">
                      Until {formatTime(s.end)}
                      {s.venue ? `, ${s.venue}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  )
}
