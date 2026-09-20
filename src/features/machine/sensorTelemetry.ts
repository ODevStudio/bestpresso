import type { Sensor } from '../../api/decaid/hardwareTypes.ts'
import { inRange } from '../../api/decaid/hardwareValidation.ts'

export function temperatureSensor(sensors: readonly Sensor[]) {
  return sensors.find(sensor => sensor.dataChannels.some(channel => channel.key === 'temperature' && ['number', 'integer'].includes(channel.type)))
}

export function probeTemperature(frame: unknown, now: number): number | undefined {
  if (!frame || typeof frame !== 'object') return undefined
  const data = frame as Record<string, unknown>
  const values = data.values && typeof data.values === 'object' ? data.values as Record<string, unknown> : data
  const timestamp = typeof data.timestamp === 'string' ? Date.parse(data.timestamp) : Number.NaN
  if (!Number.isFinite(timestamp) || now - timestamp > 5000 || timestamp - now > 5000) return undefined
  return inRange(values.temperature, 1, 100) ? values.temperature : undefined
}
