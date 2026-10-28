import { useCallback, useEffect, useState } from 'react'
import { EMPTY_DATA, type AppData } from './types'

const KEY = 'stats-dashboard:v1'

/** Everything lives in this browser's storage. Nothing is sent anywhere. */
function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY_DATA
    return validate(JSON.parse(raw)) ?? EMPTY_DATA
  } catch {
    return EMPTY_DATA
  }
}

/** Accepts saved data or an imported backup only if it has the expected shape. */
export function validate(value: unknown): AppData | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Partial<AppData>
  if (v.version !== 1 || !Array.isArray(v.sessions) || !Array.isArray(v.tasks)) return null
  return { version: 1, sessions: v.sessions, tasks: v.tasks, programmes: Array.isArray(v.programmes) ? v.programmes : [] }
}

export function useAppData() {
  const [data, setData] = useState<AppData>(load)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }, [data])

  const update = useCallback((change: (current: AppData) => AppData) => setData((d) => change(d)), [])
  return { data, update, replace: setData, saveError }
}

/** Ticks once a minute (on the minute) so "now" and countdowns stay current. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let interval: number | undefined
    const timeout = window.setTimeout(() => {
      setNow(new Date())
      interval = window.setInterval(() => setNow(new Date()), 60_000)
    }, 60_000 - (Date.now() % 60_000))
    return () => {
      window.clearTimeout(timeout)
      window.clearInterval(interval)
    }
  }, [])
  return now
}
