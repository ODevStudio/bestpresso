export type MachineCapability = 'cupWarmer' | 'integratedScale' | 'stopAtWeight' | 'ledStrip' | 'scaleCalibration' | 'preheat' | 'wakeSchedule'
export interface MachineInfo { model?: string; version?: string; serialNumber?: string; extra?: { refillKit?: boolean } }
export interface CupWarmer { temperature: number; enabled: boolean; currentTemperature: number | null }
export interface Preheat { enabled: boolean; leadMinutes: number; active: boolean }
export interface LedZone { awake: string; sleeping: string }
export interface Lighting { frontStrip: LedZone; backStrip: LedZone; frontSwitch?: LedZone }
export interface Calibration {
  step: 'idle' | 'zeroing' | 'calLatch' | 'taring' | 'complete' | 'error'
  detectedCell: 'none' | 'a' | 'b'
  subState: 'settling' | 'averaging' | 'done' | 'error'
  secondsRemaining: number
  status: string
}
export type CalibrationCommand = 'zero' | 'latch' | 'abort'
export interface Sensor { id: string; name?: string; dataChannels: { key: string; type: string }[] }
