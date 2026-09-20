import { useSyncExternalStore } from 'react'
import { machineSession } from './machineSession.ts'

export const useMachineSession = () => useSyncExternalStore(machineSession.subscribe, machineSession.get)
