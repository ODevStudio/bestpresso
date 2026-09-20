import type { MachineCapability } from '../../api/decaid/hardwareTypes.ts'
import { hasCapability, machineSession, type MachineSession } from './machineSession.ts'

export function createHardwareActions(readSession: () => MachineSession) {
  let pending = false
  return async <T>(capability: MachineCapability, generation: number, write: () => Promise<unknown>, read: () => Promise<T>, verify: (value: T) => boolean, idleOnly = false) => {
    const session = readSession()
    if (pending || session.generation !== generation || !hasCapability(capability, session) || !session.state || (idleOnly && session.state !== 'idle')) throw new Error('Hardware action unavailable')
    pending = true
    try {
      await write()
      if (readSession().generation !== generation) throw new Error('Machine changed')
      const result = await read()
      if (readSession().generation !== generation || !verify(result)) throw new Error('Hardware readback mismatch')
      return result
    } finally { pending = false }
  }
}

export const runHardwareAction = createHardwareActions(machineSession.get)

export function sameFields<T extends object>(expected: Partial<T>, actual: T): boolean {
  return Object.entries(expected).every(([key, value]) => JSON.stringify(value) === JSON.stringify(actual[key as keyof T]))
}
