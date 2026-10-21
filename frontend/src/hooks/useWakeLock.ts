import { useEffect, useState } from 'react'

/**
 * Не даёт экрану погаснуть, пока enabled. Браузер снимает блокировку, когда вкладка уходит
 * в фон, поэтому при возврате берём её заново. Работает только в secure context (HTTPS, localhost).
 */
export function useWakeLock(enabled: boolean): { supported: boolean; active: boolean } {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator && window.isSecureContext
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!enabled || !supported) return
    let sentinel: WakeLockSentinel | null = null
    let disposed = false

    async function acquire() {
      if (document.visibilityState !== 'visible' || (sentinel && !sentinel.released)) return
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (disposed) {
          await lock.release()
          return
        }
        sentinel = lock
        setActive(true)
        lock.addEventListener('release', () => setActive(false))
      } catch {
        setActive(false)
      }
    }

    void acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', acquire)
      void sentinel?.release()
      setActive(false)
    }
  }, [enabled, supported])

  return { supported, active }
}
