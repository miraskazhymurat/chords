import { useCallback, useState } from 'react'

/** Число в localStorage. Если хранилище недоступно (приватный режим) — просто живёт в памяти. */
export function useStoredNumber(key: string, initial: number): [number, (value: number) => void] {
  const [value, setValue] = useState(() => {
    try {
      const stored = Number(localStorage.getItem(key))
      return localStorage.getItem(key) !== null && Number.isFinite(stored) ? stored : initial
    } catch {
      return initial
    }
  })

  const update = useCallback(
    (next: number) => {
      setValue(next)
      try {
        localStorage.setItem(key, String(next))
      } catch {
        // не сохранилось — не страшно
      }
    },
    [key],
  )

  return [value, update]
}
