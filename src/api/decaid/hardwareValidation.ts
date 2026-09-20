import type { Calibration, CupWarmer, Lighting, MachineInfo, Preheat, Sensor } from './hardwareTypes.ts'

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid hardware response')
  return value as Record<string, unknown>
}

export const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
export function inRange(value: unknown, min: number, max: number, integer = false): value is number {
  return finite(value) && value >= min && value <= max && (!integer || Number.isInteger(value))
}

export function machineInfo(value: unknown): MachineInfo {
  const data = object(value)
  const extra = data.extra && typeof data.extra === 'object' ? object(data.extra) : {}
  return {
    model: typeof data.model === 'string' ? data.model : undefined,
    version: typeof data.version === 'string' ? data.version : undefined,
    serialNumber: typeof data.serialNumber === 'string' ? data.serialNumber : undefined,
    extra: { refillKit: typeof extra.refillKit === 'boolean' ? extra.refillKit : undefined },
  }
}

export function capabilities(value: unknown): readonly string[] {
  const list = object(value).capabilities
  if (!Array.isArray(list) || !list.every(item => typeof item === 'string')) throw new Error('Invalid capabilities')
  return [...list]
}

export function cupWarmer(value: unknown): CupWarmer {
  const data = object(value)
  if (!inRange(data.temperature, 0, 80, true) || typeof data.enabled !== 'boolean' || (data.currentTemperature !== null && !finite(data.currentTemperature))) throw new Error('Invalid cup warmer state')
  return { temperature: data.temperature, enabled: data.enabled, currentTemperature: data.currentTemperature }
}

export function preheat(value: unknown): Preheat {
  const data = object(value)
  if (!inRange(data.leadMinutes, 0, 120, true) || typeof data.enabled !== 'boolean' || typeof data.active !== 'boolean') throw new Error('Invalid preheat state')
  return { leadMinutes: data.leadMinutes, enabled: data.enabled, active: data.active }
}

export function lighting(value: unknown): Lighting {
  const data = object(value)
  const zone = (value: unknown) => {
    const item = object(value)
    if (typeof item.awake !== 'string' || typeof item.sleeping !== 'string' || ![item.awake, item.sleeping].every(color => /^[a-f\d]{12}$/i.test(color))) throw new Error('Invalid lighting palette')
    return { awake: item.awake.toUpperCase(), sleeping: item.sleeping.toUpperCase() }
  }
  return { frontStrip: zone(data.frontStrip), backStrip: zone(data.backStrip), ...(data.frontSwitch ? { frontSwitch: zone(data.frontSwitch) } : {}) }
}

export function calibration(value: unknown): Calibration {
  const data = object(value)
  if (!['idle', 'zeroing', 'calLatch', 'taring', 'complete', 'error'].includes(String(data.step)) || !['none', 'a', 'b'].includes(String(data.detectedCell)) || !['settling', 'averaging', 'done', 'error'].includes(String(data.subState)) || !inRange(data.secondsRemaining, 0, 3600, true) || typeof data.status !== 'string') throw new Error('Invalid calibration state')
  return data as unknown as Calibration
}

export function sensors(value: unknown): Sensor[] {
  if (!Array.isArray(value)) throw new Error('Invalid sensor list')
  return value.flatMap(entry => {
    const data = object(entry)
    const info = object(data.info ?? data)
    if (typeof info.id !== 'string' || !Array.isArray(info.dataChannels)) return []
    const channels = info.dataChannels.flatMap(channel => {
      const item = object(channel)
      return typeof item.key === 'string' && typeof item.type === 'string' ? [{ key: item.key, type: item.type }] : []
    })
    return [{ id: info.id, name: typeof data.name === 'string' ? data.name : undefined, dataChannels: channels }]
  })
}
