import type { Sensor } from '../../api/decaid/hardwareTypes.ts'
import { inRange } from '../../api/decaid/hardwareValidation.ts'

export function temperatureSensor(sensors: readonly Sensor[], machineDeviceId?: string) {
  const probeId = machineDeviceId ? `${machineDeviceId}-milkprobe` : undefined
  const temperatures = sensors.filter(sensor => sensor.dataChannels.some(channel => channel.key === 'temperature' && ['number', 'integer'].includes(channel.type))
    && (!machineDeviceId || !sensor.id.endsWith('-milkprobe') || sensor.id === probeId))
  return temperatures.find(sensor => sensor.id === probeId)
    ?? temperatures.find(sensor => sensor.name === 'Bengle Milk Probe' || sensor.id.endsWith('-milkprobe'))
    ?? temperatures[0]
}

export function probeTemperature(frame: unknown, now: number): number | undefined {
  if (!frame || typeof frame !== 'object') return undefined
  const data = frame as Record<string, unknown>
  const values = data.values && typeof data.values === 'object' ? data.values as Record<string, unknown> : data
  const timestamp = typeof data.timestamp === 'string' ? Date.parse(data.timestamp) : Number.NaN
  if (!Number.isFinite(timestamp) || now - timestamp > 5000 || timestamp - now > 5000) return undefined
  return inRange(values.temperature, 1, 100) ? values.temperature : undefined
}
