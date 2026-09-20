import { getSensors } from '../../api/decaid/hardware'
import { subscribe, type SocketSubscription } from '../../api/decaid/socket'
import { machineSession } from './machineSession'
import { probeTemperature, temperatureSensor } from './sensorTelemetry'

let value: number | undefined
let listeners: readonly (() => void)[] = []
export const getProbeTemperature = () => value
export const subscribeProbe = (listener: () => void) => {
  listeners = [...listeners, listener]
  return () => { listeners = listeners.filter(candidate => candidate !== listener) }
}
const publish = (next: number | undefined) => {
  if (value === next) return
  value = next
  listeners.forEach(listener => listener())
}

export function startProbeDiscovery() {
  let stopped = false
  let generation = -1
  let sensorId: string | undefined
  let socket: SocketSubscription | undefined
  let receivedAt = 0
  let timer: ReturnType<typeof setTimeout>
  const clear = () => { socket?.close(); socket = undefined; sensorId = undefined; publish(undefined) }
  const unsubscribe = machineSession.subscribe(() => {
    if (generation !== machineSession.get().generation) { generation = machineSession.get().generation; clear() }
  })
  const tick = async () => {
    const session = machineSession.get()
    generation = session.generation
    if (Date.now() - receivedAt > 5000) publish(undefined)
    if (session.deviceId && document.visibilityState !== 'hidden') {
      try {
        const sensor = temperatureSensor(await getSensors(), session.deviceId)
        if (!stopped && session.generation === machineSession.get().generation && sensor?.id !== sensorId) {
          clear()
          sensorId = sensor?.id
          if (sensor) socket = subscribe(`/sensors/${encodeURIComponent(sensor.id)}/snapshot`, frame => {
            if (stopped || session.generation !== machineSession.get().generation || sensorId !== sensor.id) return
            receivedAt = Date.now()
            publish(probeTemperature(frame, receivedAt))
          }, connected => { if (!connected) publish(undefined) })
        }
      } catch { if (session.generation === machineSession.get().generation) clear() }
    } else clear()
    if (!stopped) timer = setTimeout(tick, 2000)
  }
  void tick()
  const expiry = setInterval(() => { if (Date.now() - receivedAt > 5000) publish(undefined) }, 1000)
  return () => { stopped = true; clearTimeout(timer); clearInterval(expiry); unsubscribe(); clear() }
}
