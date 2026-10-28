import { classesOn, upcomingProgrammes } from '../lib/schedule'
import { dayOf, formatTime, isoDate, minutesOf, parseLocal } from '../lib/time'
import type { ClassSession, Programme } from '../lib/types'

export function Today({
  sessions,
  programmes,
  now,
  onAddProgramme,
  onDeleteProgramme,
}: {
  sessions: ClassSession[]
  programmes: Programme[]
  now: Date
  onAddProgramme: () => void
  onDeleteProgramme: (id: string) => void
}) {
  const classes = classesOn(sessions, dayOf(now))
  const minute = minutesOf(now)
  const upcoming = upcomingProgrammes(programmes, now)
  const todayIso = isoDate(now)

  return (
    <div className="today">
      <section aria-labelledby="today-heading">
        <h2 id="today-heading" className="section-title">
          Today, {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>
        {classes.length === 0 ? (
          <p className="muted">No classes today.</p>
        ) : (
          <ol className="day-list">
            {classes.map((c) => {
              const state = minute >= c.end ? 'past' : minute >= c.start ? 'now' : 'later'
              return (
                <li key={c.id} className={`day-item type-${c.type.toLowerCase()} is-${state}`}>
                  <span className="day-time">
                    {formatTime(c.start)}
                    <span className="sr-only"> to {formatTime(c.end)}</span>
                  </span>
                  <span className="day-main">
                    <strong>{c.courseCode}</strong> {c.type}
                    <span className="day-sub">{c.venue}</span>
                  </span>
                  {state === 'now' && <span className="pill">Now</span>}
                  {state === 'past' && <span className="sr-only">(finished)</span>}
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <section aria-labelledby="programmes-heading" className="programmes">
        <div className="section-head">
          <h2 id="programmes-heading" className="section-title">
            Programmes
          </h2>
          <button type="button" className="text-button" onClick={onAddProgramme}>
            Add programme
          </button>
        </div>
        {upcoming.length === 0 ? (
          <p className="muted">Seminars, departmental programmes and other one-off events in the next two weeks show here.</p>
        ) : (
          <ul className="programme-list">
            {upcoming.map((p) => (
              <li key={p.id} className="programme">
                <div>
                  <strong>{p.title}</strong>
                  <span className="day-sub">
                    {p.date === todayIso
                      ? 'Today'
                      : parseLocal(p.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                    , {formatTime(p.start)} to {formatTime(p.end)}
                    {p.venue ? `, ${p.venue}` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  className="icon-button subtle"
                  onClick={() => onDeleteProgramme(p.id)}
                  aria-label={`Delete ${p.title}`}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
