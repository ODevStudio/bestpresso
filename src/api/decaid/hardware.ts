import { getDecaidEndpoints } from './config.ts'
import type { CalibrationCommand, CupWarmer, Lighting, Preheat } from './hardwareTypes.ts'
import * as validate from './hardwareValidation.ts'

export async function hardwareRequest(path: string, method = 'GET', body?: unknown): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(`${getDecaidEndpoints().apiBase}${path}`, {
      method, signal: controller.signal,
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    })
    if (!response.ok) {
      const detail = await response.json().catch(() => null)
      const reason = detail?.reason ?? detail?.message
      throw new Error(`${path}: ${response.status}${typeof reason === 'string' ? ` - ${reason.slice(0, 200)}` : ''}`)
    }
    const text = await response.text()
    return text.trim() ? JSON.parse(text) : undefined
  } finally { clearTimeout(timeout) }
}

export const getMachineInfo = async () => validate.machineInfo(await hardwareRequest('/machine/info'))
export const getCapabilities = async () => validate.capabilities(await hardwareRequest('/machine/capabilities'))
export const getCupWarmer = async () => validate.cupWarmer(await hardwareRequest('/machine/cupWarmer'))
export const getPreheat = async () => validate.preheat(await hardwareRequest('/machine/cupWarmer/preheat'))
export const getLighting = async () => validate.lighting(await hardwareRequest('/machine/ledStrip'))
export const getCalibration = async () => validate.calibration(await hardwareRequest('/machine/scaleCalibration'))
export const getSensors = async () => validate.sensors(await hardwareRequest('/sensors'))

export async function setCupWarmer(value: Pick<CupWarmer, 'temperature' | 'enabled'>) {
  validate.cupWarmer({ ...value, currentTemperature: null })
  await hardwareRequest('/machine/cupWarmer', 'PUT', { temperature: value.temperature, enabled: value.enabled })
}

export async function setPreheat(value: Pick<Preheat, 'enabled' | 'leadMinutes'>) {
  validate.preheat({ ...value, active: false })
  await hardwareRequest('/machine/cupWarmer/preheat', 'PUT', { enabled: value.enabled, leadMinutes: value.leadMinutes })
}

export async function setLighting(value: Lighting) {
  const { frontStrip, backStrip } = validate.lighting(value)
  await hardwareRequest('/machine/ledStrip', 'PUT', { frontStrip, backStrip })
}

export async function calibrate(command: CalibrationCommand, weightGrams?: number) {
  if (!['zero', 'latch', 'abort'].includes(command) || (command === 'latch' && !validate.inRange(weightGrams, 1, 10000))) throw new Error('Invalid calibration command')
  const reply = validate.object(await hardwareRequest('/machine/scaleCalibration', 'PUT', { command, ...(command === 'latch' ? { weightGrams } : {}) }))
  if (reply.status !== 'accepted') throw new Error('Calibration rejected')
  return validate.calibration(reply.state)
}
