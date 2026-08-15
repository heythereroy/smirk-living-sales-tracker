import { useEffect, useRef } from 'react'

// Supabase realtime (postgres_changes) proved unreliable for this event —
// swapped for plain polling everywhere, which is simpler and works
// consistently across tabs/devices.
export function usePolling(callback: () => void, intervalMs: number) {
  const savedCallback = useRef(callback)
  savedCallback.current = callback

  useEffect(() => {
    savedCallback.current()
    const id = setInterval(() => savedCallback.current(), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}
