import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type TouchEvent as ReactTouchEvent } from 'react'
import logo from '../../assets/figma/decent-logo.png'
import { formatDeviceTime } from './deviceTime'
import { useBestpressoPreferences } from '../settings/bestpressoPreferences'
import { WAKE_HOLD_DURATION_MS, WakeHoldGesture, type WakeHoldUpdate } from './wakeHoldGesture'

interface SleepWakeScreenProps {
  onWake: () => void
}

interface PulsePoint {
  pointerId: number
  x: number
  y: number
}

export function SleepWakeScreen({ onWake }: SleepWakeScreenProps) {
  const { preferences } = useBestpressoPreferences()
  const gesture = useRef(new WakeHoldGesture())
  const holdTimer = useRef<number | null>(null)
  const [pulse, setPulse] = useState<PulsePoint | null>(null)
  const [now, setNow] = useState(() => new Date())

  const cancelHold = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current)
    holdTimer.current = null
    setPulse(null)
  }

  const applyUpdate = (update: WakeHoldUpdate) => {
    if (update.kind === 'cancel') {
      cancelHold()
      return
    }
    if (update.kind !== 'start') return

    cancelHold()
    setPulse({ pointerId: update.pointerId, x: update.x, y: update.y })
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null
      if (!gesture.current.complete(update.pointerId)) {
        setPulse(null)
        return
      }
      onWake()
    }, WAKE_HOLD_DURATION_MS)
  }

  useEffect(() => {
    const clockTimer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => {
      window.clearInterval(clockTimer)
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current)
    }
  }, [])

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    applyUpdate(gesture.current.pointerDown(event.pointerId, event.clientX, event.clientY))
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse') return
    applyUpdate(gesture.current.pointerMove(event.pointerId, event.clientX, event.clientY))
  }

  const handlePointerEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse') return
    applyUpdate(gesture.current.pointerEnd(event.pointerId))
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  // React registers touch listeners as passive, so preventDefault() inside the React
  // handlers is ignored ("Unable to preventDefault inside passive event listener").
  // A native non-passive pair keeps the browser's own long-press and scroll gestures,
  // and the touchcancel they send, away from the hold.
  const screenRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const element = screenRef.current
    if (!element) return
    const block = (event: TouchEvent) => { if (event.cancelable) event.preventDefault() }
    element.addEventListener('touchstart', block, { passive: false })
    element.addEventListener('touchmove', block, { passive: false })
    return () => {
      element.removeEventListener('touchstart', block)
      element.removeEventListener('touchmove', block)
    }
  }, [])

  const fingersStillDown = (event: ReactTouchEvent<HTMLButtonElement>, except: ReactTouchEvent<HTMLButtonElement>['changedTouches']) => {
    const ending = new Set(Array.from(except, (touch) => touch.identifier))
    return Array.from(event.touches, (touch) => touch.identifier).filter((id) => !ending.has(id))
  }

  const handleTouchStart = (event: ReactTouchEvent<HTMLButtonElement>) => {
    gesture.current.syncActivePointers(fingersStillDown(event, event.changedTouches))
    Array.from(event.changedTouches).forEach((touch) => {
      applyUpdate(gesture.current.pointerDown(touch.identifier, touch.clientX, touch.clientY))
    })
  }

  const handleTouchMove = (event: ReactTouchEvent<HTMLButtonElement>) => {
    Array.from(event.touches).forEach((touch) => {
      applyUpdate(gesture.current.pointerMove(touch.identifier, touch.clientX, touch.clientY))
    })
  }

  const handleTouchEnd = (event: ReactTouchEvent<HTMLButtonElement>) => {
    Array.from(event.changedTouches).forEach((touch) => {
      applyUpdate(gesture.current.pointerEnd(touch.identifier))
    })
    gesture.current.syncActivePointers(Array.from(event.touches, (touch) => touch.identifier))
  }

  return <button
    ref={screenRef}
    className="sleep-screen"
    type="button"
    aria-label="Hold with one finger for 1 second to wake machine"
    onContextMenu={(event) => event.preventDefault()}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerEnd}
    onPointerCancel={handlePointerEnd}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
    onTouchCancel={handleTouchEnd}
  >
    <span className="sleep-screen__identity" aria-hidden="true">
      <img src={logo} alt="" />
      <span className="sleep-screen__time">{formatDeviceTime(now, undefined, preferences.clockFormat)}</span>
    </span>
    <span className="sleep-screen__hint">Touch and hold to wake</span>
    {pulse && <span className="sleep-screen__pulse" style={{ left: pulse.x, top: pulse.y }} aria-hidden="true" />}
  </button>
}
