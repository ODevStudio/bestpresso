import type { WaterLevels } from '../../api/decaid/types.ts'
import { tankMillilitres, tankSensorLevelForMillilitres } from '../../api/decaid/adapters.ts'
import { finite } from '../../api/decaid/hardwareValidation.ts'
import type { BrewingScreenModel } from '../../domain/brewing.ts'
import { waterTankLevelState, type WaterWarningThresholds } from '../../domain/brewing.ts'

export const BENGLE_WATER_WARNING_MM = 15
export const isBengle = (model?: string) => /^bengle\b/i.test(model ?? '')

export function waterWarningLevelMm(model: string | undefined, warningLevelMl: number) {
  return isBengle(model) ? BENGLE_WATER_WARNING_MM : tankSensorLevelForMillilitres(warningLevelMl)
}

export function waterWarningState(levels: WaterLevels, needsWater: boolean, thresholds: WaterWarningThresholds & { model?: string }, wasWarning = false) {
  if (!isBengle(thresholds.model)) return waterTankLevelState(tankMillilitres(levels.currentLevel ?? NaN) ?? NaN, needsWater, thresholds)
  if (needsWater) return 'needsWater'
  if (thresholds.refillKit || !finite(levels.currentLevel) || levels.currentLevel < 0) return 'normal'
  return (wasWarning ? levels.currentLevel < BENGLE_WATER_WARNING_MM + 2 : levels.currentLevel <= BENGLE_WATER_WARNING_MM) ? 'warning' : 'normal'
}

export function waterGauge(level: number | undefined, warningLevel = BENGLE_WATER_WARNING_MM) {
  const height = finite(level) && level >= 0 ? level : undefined
  const maximumMm = Math.max(70, Math.ceil(Math.max(height ?? 0, warningLevel) / 10) * 10)
  return { maximumMm, heightPercent: height === undefined ? undefined : height / maximumMm * 100, warningPercent: warningLevel / maximumMm * 100 }
}

export function mergeWaterLevels(previous: WaterLevels, frame: WaterLevels): WaterLevels {
  const level = (value: unknown) => finite(value) && value >= 0 ? value : undefined
  return {
    currentLevel: 'currentLevel' in frame ? level(frame.currentLevel) : previous.currentLevel,
    refillLevel: 'refillLevel' in frame ? level(frame.refillLevel) : previous.refillLevel,
  }
}

export function displayWater(model: BrewingScreenModel, levels: WaterLevels, state: string, warningLevelMm = BENGLE_WATER_WARNING_MM): BrewingScreenModel {
  const volume = levels.currentLevel === undefined ? undefined : tankMillilitres(levels.currentLevel)
  const previous = model.utilities.find(utility => utility.id === 'tank')
  const value = volume === undefined ? '-' : String(volume)
  if (previous && previous.levelPercent === undefined && previous.waterLevelMm === levels.currentLevel && previous.refillLevelMm === levels.refillLevel && previous.warningLevelMm === warningLevelMm && previous.alert === (state === 'needsWater') && previous.warning === (state === 'warning') && previous.metrics[0]?.value === value) return model
  return { ...model, utilities: model.utilities.map(utility => utility.id !== 'tank' ? utility : {
    ...utility, levelPercent: undefined, waterLevelMm: levels.currentLevel, refillLevelMm: levels.refillLevel, warningLevelMm,
    alert: state === 'needsWater', warning: state === 'warning',
    metrics: [{ id: 'volume', value, unit: 'ml' }],
  }) }
}
