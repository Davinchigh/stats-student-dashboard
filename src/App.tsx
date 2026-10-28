import { useRef, useState } from 'react'
import { Dialog } from './components/Dialog'
import { ClassForm, ProgrammeForm } from './components/Forms'
import { ImportTimetable } from './components/ImportTimetable'
import { NextUp } from './components/NextUp'
import { Tasks } from './components/Tasks'
import { Today } from './components/Today'
import { WeekView } from './components/WeekView'
import { sampleTimetable } from './lib/sample'
import { courseList } from './lib/schedule'
import { useAppData, useNow, validate } from './lib/store'
import { EMPTY_DATA, type ClassSession } from './lib/types'

type Modal = { kind: 'import' } | { kind: 'class'; session?: ClassSession } | { kind: 'programme' } | { kind: 'data' } | null

export default function App() {
  const { data, update, replace, saveError } = useAppData()
  const now = useNow()
  const [modal, setModal] = useState<Modal>(null)
  const [message, setMessage] = useState('')
  const restoreInput = useRef<HTMLInputElement>(null)
  const close = () => setModal(null)

  const flash = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 4000)
  }

  const setSessions = (sessions: ClassSession[]) => update((d) => ({ ...d, sessions }))

  const saveClass = (session: ClassSession) => {
    update((d) => {
      const exists = d.sessions.some((s) => s.id === session.id)
      return { ...d, sessions: exists ? d.sessions.map((s) => (s.id === session.id ? session : s)) : [...d.sessions, session] }
    })
    close()
    flash(`Saved ${session.courseCode}.`)
  }

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `class-planner-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const restoreBackup = async (file: File | undefined) => {
    if (!file) return
    try {
      const restored = validate(JSON.parse(await file.text()))
      if (!restored) throw new Error()
      replace(restored)
      close()
      flash('Backup restored.')
    } catch {
      flash('That file isn\'t a backup from this app.')
    }
  }

  const hasTimetable = data.sessions.length > 0

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Class Planner
          <span className="brand-sub">for Statistics students</span>
        </div>
        {hasTimetable && (
          <nav className="topbar-actions" aria-label="Timetable">
            <button type="button" className="text-button" onClick={() => setModal({ kind: 'class' })}>
              Add class
            </button>
            <button type="button" className="text-button" onClick={() => setModal({ kind: 'import' })}>
              Upload new timetable
            </button>
            <button type="button" className="text-button" onClick={() => setModal({ kind: 'data' })}>
              Your data
            </button>
          </nav>
        )}
      </header>

      {saveError && (
        <p className="alert banner" role="alert">
          Your changes can't be saved in this browser (storage is full or blocked). Export a backup to keep them.
        </p>
      )}

      {!hasTimetable ? (
        <main className="welcome">
          <h1>See your week at a glance.</h1>
          <p className="lead">
            Upload your timetable to see what class is next, where it is, and keep track of assignments and homework in one
            place.
          </p>
          <ImportTimetable hasExisting={false} onConfirm={(s) => setSessions(s)} />
          <p className="welcome-alt">
            No file handy?{' '}
            <button type="button" className="text-button" onClick={() => setSessions(sampleTimetable())}>
              Try a sample timetable
            </button>{' '}
            or{' '}
            <button type="button" className="text-button" onClick={() => setModal({ kind: 'class' })}>
              add classes by hand
            </button>
            .
          </p>
        </main>
      ) : (
        <main className="dashboard">
          <div className="col-left">
            <NextUp sessions={data.sessions} now={now} />
            <Today
              sessions={data.sessions}
              programmes={data.programmes}
              now={now}
              onAddProgramme={() => setModal({ kind: 'programme' })}
              onDeleteProgramme={(id) => update((d) => ({ ...d, programmes: d.programmes.filter((p) => p.id !== id) }))}
            />
          </div>
          <div className="col-right">
            <Tasks
              tasks={data.tasks}
              courses={courseList(data.sessions)}
              now={now}
              onAdd={(t) => {
                update((d) => ({ ...d, tasks: [...d.tasks, t] }))
                flash(`Added ${t.title}.`)
              }}
              onToggle={(id) => update((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }))}
              onDelete={(id) => update((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }))}
            />
          </div>
          <div className="col-full">
            <WeekView sessions={data.sessions} now={now} onEdit={(session) => setModal({ kind: 'class', session })} />
          </div>
        </main>
      )}

      <p className="toast" role="status" aria-live="polite">
        {message}
      </p>

      <Dialog open={modal?.kind === 'import'} title="Upload new timetable" onClose={close} wide>
        <ImportTimetable
          hasExisting={hasTimetable}
          onCancel={close}
          onConfirm={(s) => {
            setSessions(s)
            close()
            flash(`Timetable updated with ${s.length} classes.`)
          }}
        />
      </Dialog>

      <Dialog open={modal?.kind === 'class'} title={modal?.kind === 'class' && modal.session ? 'Edit class' : 'Add a class'} onClose={close}>
        <ClassForm
          session={modal?.kind === 'class' ? modal.session : undefined}
          onSave={saveClass}
          onCancel={close}
          onDelete={(id) => {
            update((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }))
            close()
            flash('Class deleted.')
          }}
        />
      </Dialog>

      <Dialog open={modal?.kind === 'programme'} title="Add a programme" onClose={close}>
        <ProgrammeForm
          onCancel={close}
          onSave={(p) => {
            update((d) => ({ ...d, programmes: [...d.programmes, p] }))
            close()
            flash(`Added ${p.title}.`)
          }}
        />
      </Dialog>

      <Dialog open={modal?.kind === 'data'} title="Your data" onClose={close}>
        <p>
          Everything is stored in this browser only. Export a backup to move it to another phone or laptop, or to keep it safe
          if you clear your browser.
        </p>
        <div className="data-actions">
          <button type="button" className="button" onClick={exportBackup}>
            Export backup
          </button>
          <button type="button" className="button secondary" onClick={() => restoreInput.current?.click()}>
            Restore a backup
          </button>
          <input
            ref={restoreInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Backup file"
            onChange={(e) => restoreBackup(e.target.files?.[0])}
          />
        </div>
        <hr />
        <button
          type="button"
          className="button danger"
          onClick={() => {
            if (window.confirm('Delete your timetable, assignments and programmes from this browser? This can\'t be undone.')) {
              replace(EMPTY_DATA)
              close()
            }
          }}
        >
          Delete everything
        </button>
      </Dialog>
    </div>
  )
}
