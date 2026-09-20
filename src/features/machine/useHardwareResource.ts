import { useEffect, useRef, useState } from 'react'
import type { MachineCapability } from '../../api/decaid/hardwareTypes.ts'
import { machineSession } from './machineSession.ts'
import { useMachineSession } from './useMachineSession.ts'
import { runHardwareAction } from './hardwareActions.ts'
import { useStableEvent } from '../../utils/useStableEvent.ts'

export function useHardwareResource<T>(capability: MachineCapability, read: () => Promise<T>, interval = 3000) {
  const session = useMachineSession()
  const [value, setValue] = useState<T>()
  const [busy, setBusy] = useState(false)
  const [requestError, setRequestError] = useState<string>()
  const [status, setStatus] = useState<'loading' | 'unavailable' | 'failed' | 'saved' | null>('loading')
  const active = useRef(false)
  const pending = useRef(false)
  const current = () => active.current && session.generation === machineSession.get().generation
  const reload = useStableEvent(async () => {
    if (pending.current || !current()) return
    pending.current = true
    setBusy(true)
    try {
      const result = await read()
      if (current()) { setValue(result); setStatus(previous => previous === 'failed' || previous === 'saved' ? previous : null) }
    } catch {
      if (current()) { setValue(undefined); setStatus('unavailable') }
    } finally { pending.current = false; if (current()) setBusy(false) }
  })
  useEffect(() => {
    active.current = true
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const tick = async () => {
      if (document.visibilityState !== 'hidden') await reload()
      if (!cancelled) timer = setTimeout(tick, interval)
    }
    void tick()
    return () => { cancelled = true; active.current = false; clearTimeout(timer) }
  }, [reload, interval, session.generation])

  const save = async (write: () => Promise<unknown>, verify: (result: T) => boolean, idleOnly = false) => {
    if (pending.current || !value || !current()) return false
    pending.current = true
    setBusy(true)
    setStatus(null)
    setRequestError(undefined)
    try {
      const result = await runHardwareAction(capability, session.generation, write, read, verify, idleOnly)
      if (current()) { setValue(result); setStatus('saved') }
      return current()
    } catch (error) {
      if (current()) { setValue(undefined); setStatus('failed'); setRequestError(error instanceof Error ? error.message : undefined) }
      return false
    } finally {
      pending.current = false
      if (current()) setBusy(false)
    }
  }
  return { value, busy, status, requestError, reload, save, disabled: busy || !value || !session.state }
}
