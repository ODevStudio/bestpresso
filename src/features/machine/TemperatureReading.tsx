import { useState } from 'react'

/** Crossfade real readings, without inventing intermediate temperatures or
 * rerendering the dashboard on every animation frame. Only one outgoing value
 * is kept; a fresh reading replaces it immediately during rapid updates. */
export function TemperatureReading({ value }: { value: string }) {
  const [reading, setReading] = useState<{ current: string; previous: string | null }>({ current: value, previous: null })
  if (reading.current !== value) setReading({ current: value, previous: reading.current })

  return <span className="temperature-digits">
    {reading.previous !== null && <span key={`out-${reading.current}`} className="temperature-digits__out" aria-hidden="true">{reading.previous}</span>}
    <span key={`in-${reading.current}`} className={reading.previous === null ? undefined : 'temperature-digits__in'}>{reading.current}</span>
  </span>
}
