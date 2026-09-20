import { subscribe as transport, type SocketSubscription } from './socket.ts'
import { machineSession } from '../../features/machine/machineSession.ts'

export function subscribe<T>(path: string, onData: (data: T) => void, onConnection: (connected: boolean) => void): SocketSubscription {
  if (!path.startsWith('/machine/') && path !== '/scale/snapshot') return transport(path, onData, onConnection)
  let generation = -1
  let socket: SocketSubscription | undefined
  const rebind = () => {
    const session = machineSession.get()
    if (session.generation === generation) return
    generation = session.generation
    const boundGeneration = generation
    socket?.close()
    socket = undefined
    onConnection(false)
    let opened = false
    if (session.deviceId) socket = transport<T>(path,
      data => { if (machineSession.get().generation === boundGeneration) onData(data) },
      connected => {
        if (machineSession.get().generation !== boundGeneration) return
        onConnection(connected)
        if (!connected && opened && path === '/machine/snapshot') machineSession.connect(session.deviceId, true)
        opened = connected
      })
  }
  const unsubscribe = machineSession.subscribe(rebind)
  rebind()
  return { close() { unsubscribe(); socket?.close() } }
}
