import { useState, type FormEvent } from 'react'
import { groupTasks, type TaskGroup } from '../lib/schedule'
import { formatDue, isoDate, parseLocal } from '../lib/time'
import { TASK_KINDS, type Task, type TaskKind } from '../lib/types'
import { newId } from '../lib/id'

const GROUP_ORDER: TaskGroup[] = ['Overdue', 'Due this week', 'Later']

export function Tasks({
  tasks,
  courses,
  now,
  onAdd,
  onToggle,
  onDelete,
}: {
  tasks: Task[]
  courses: { code: string; title: string }[]
  now: Date
  onAdd: (task: Task) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const groups = groupTasks(tasks, now)
  const open = tasks.length - groups.Done.length

  return (
    <section aria-labelledby="tasks-heading" className="tasks">
      <div className="section-head">
        <h2 id="tasks-heading" className="section-title">
          Assignments and homework
          {open > 0 && <span className="count">{open} to do</span>}
        </h2>
        {!adding && (
          <button type="button" className="button" onClick={() => setAdding(true)}>
            Add work
          </button>
        )}
      </div>

      {adding && (
        <TaskForm
          courses={courses}
          now={now}
          onCancel={() => setAdding(false)}
          onSave={(t) => {
            onAdd(t)
            setAdding(false)
          }}
        />
      )}

      {tasks.length === 0 && !adding && (
        <p className="muted">Nothing tracked yet. Add an assignment, homework or upcoming quiz to see what's due.</p>
      )}

      {GROUP_ORDER.map((group) =>
        groups[group].length === 0 ? null : (
          <div key={group} className={`task-group group-${group === 'Overdue' ? 'overdue' : 'normal'}`}>
            <h3>{group}</h3>
            <ul>
              {groups[group].map((t) => (
                <TaskItem key={t.id} task={t} now={now} onToggle={onToggle} onDelete={onDelete} />
              ))}
            </ul>
          </div>
        ),
      )}

      {groups.Done.length > 0 && (
        <div className="task-group group-done">
          <button type="button" className="text-button" aria-expanded={showDone} onClick={() => setShowDone((v) => !v)}>
            {showDone ? 'Hide' : 'Show'} {groups.Done.length} finished
          </button>
          {showDone && (
            <ul>
              {groups.Done.map((t) => (
                <TaskItem key={t.id} task={t} now={now} onToggle={onToggle} onDelete={onDelete} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

function TaskItem({
  task,
  now,
  onToggle,
  onDelete,
}: {
  task: Task
  now: Date
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const due = parseLocal(task.due)
  const checkboxId = `task-${task.id}`
  return (
    <li className={`task ${task.done ? 'is-done' : ''}`}>
      <input id={checkboxId} type="checkbox" checked={task.done} onChange={() => onToggle(task.id)} />
      <label htmlFor={checkboxId} className="task-main">
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          {[task.course, task.kind].filter(Boolean).join(', ')}
          {task.notes && <span className="task-notes">{task.notes}</span>}
        </span>
      </label>
      <span className="task-due">{formatDue(due, now)}</span>
      <button type="button" className="icon-button subtle" onClick={() => onDelete(task.id)} aria-label={`Delete ${task.title}`}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </li>
  )
}

function TaskForm({
  courses,
  now,
  onSave,
  onCancel,
}: {
  courses: { code: string; title: string }[]
  now: Date
  onSave: (task: Task) => void
  onCancel: () => void
}) {
  const nextWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)
  const [title, setTitle] = useState('')
  const [course, setCourse] = useState(courses[0]?.code ?? '')
  const [kind, setKind] = useState<TaskKind>('Assignment')
  const [date, setDate] = useState(isoDate(nextWeek))
  const [time, setTime] = useState('23:59')
  const [notes, setNotes] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      id: newId(),
      title: title.trim(),
      course: course.trim(),
      kind,
      due: `${date}T${time || '23:59'}`,
      notes: notes.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <form className="task-form" onSubmit={submit}>
      <label className="field field-wide">
        What is it?
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Problem set 3, questions 1 to 10" required autoFocus />
      </label>
      <label className="field">
        Course
        <input value={course} onChange={(e) => setCourse(e.target.value)} list="course-options" placeholder="STAT 221" />
        <datalist id="course-options">
          {courses.map((c) => (
            <option key={c.code} value={c.code}>
              {c.title}
            </option>
          ))}
        </datalist>
      </label>
      <label className="field">
        Type
        <select value={kind} onChange={(e) => setKind(e.target.value as TaskKind)}>
          {TASK_KINDS.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Due date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <label className="field">
        Time
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </label>
      <label className="field field-wide">
        Notes <span className="optional">optional</span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Submit on Sakai, group of 4" />
      </label>
      <div className="form-actions field-wide">
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button">
          Save
        </button>
      </div>
    </form>
  )
}
