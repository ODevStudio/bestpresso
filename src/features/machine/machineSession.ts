import type { MachineCapability, MachineInfo } from '../../api/decaid/hardwareTypes.ts'

export interface MachineSession {
  generation: number
  deviceId?: string
  info?: MachineInfo
  capabilities?: readonly string[]
  metadataStatus: 'disconnected' | 'loading' | 'ready' | 'unavailable'
  state?: string
}

export function createMachineSession() {
  let current: MachineSession = { generation: 0, metadataStatus: 'disconnected' }
  let listeners: readonly (() => void)[] = []
  const publish = (next: MachineSession) => { current = next; listeners.forEach(listener => listener()) }
  return {
    get: () => current,
    subscribe: (listener: () => void) => {
      listeners = [...listeners, listener]
      return () => { listeners = listeners.filter(candidate => candidate !== listener) }
    },
    connect: (deviceId?: string, force = false) => {
      if (current.deviceId === deviceId && !force) return false
      publish({ generation: current.generation + 1, deviceId, metadataStatus: deviceId ? 'loading' : 'disconnected' })
      return true
    },
    metadata: (generation: number, info: MachineInfo | undefined, capabilities: readonly string[] | undefined) => {
      if (current.generation !== generation || !current.deviceId) return
      publish({ ...current, info, capabilities, metadataStatus: info && capabilities ? 'ready' : 'unavailable' })
    },
    observeState: (state?: string) => {
      if (current.state !== state) publish({ ...current, state })
    },
  }
}

export const machineSession = createMachineSession()
export const hasCapability = (capability: MachineCapability, session = machineSession.get()) => Boolean(session.deviceId && session.capabilities?.includes(capability))
